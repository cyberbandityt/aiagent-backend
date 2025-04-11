const { ChatAnthropic } = require('@langchain/anthropic');
const { ConversationChain } = require('langchain/chains');
const { BufferMemory,ChatMessageHistory } = require("langchain/memory");
const { SystemMessage, HumanMessage, AIMessage } = require('@langchain/core/messages');
const News = require('../models/News');
const Topic = require('../models/Topic');
const ChatMessage = require('../models/ChatMessage');

/**
 * Create a chat model for a specific topic
 * @param {string} topicId - The topic ID to create a chat for
 * @param {Array} chatHistory - Optional array of previous chat messages
 * @returns {ConversationChain} The conversation chain
 */
const createTopicChatModel = async (topicId, chatHistory = []) => {
  try {
    const topic = await Topic.findById(topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }
    
    const recentNews = await News.find({ topic: topicId })
      .sort({ publishedAt: -1 })
      .select('title summary publishedAt sentiment.label content description');
    
    const newsContext = recentNews.map(news => 
      `- [${news.publishedAt.toISOString().split('T')[0]}] ${news.title}: ${news.summary} (Sentiment: ${news.sentiment.label}) (Content: ${news.content} (Description: ${news.description}) `
    ).join('\n');
    
    const systemPrompt = `
    You are an AI assistant specialized in discussing news about "${topic.name}".
    
    Here's some recent news about this topic:
    ${newsContext}
    
    Respond to user queries about "${topic.name}" based on the news context provided. You can go beyond that if asked for some fact
    If you don't have specific information about something, acknowledge that instead of making up details.
    Keep your responses clear, concise, and informative. If you have some idea though/news, you can share it with user.
    `;
    
    const model = new ChatAnthropic({
      anthropicApiKey: process.env.ANTHROPIC_KEY,
      modelName: "claude-3-sonnet-20240229",
      temperature: 0.7
    });
    
    const messageHistory = [];
    
    messageHistory.push(new SystemMessage(systemPrompt));
    
    if (chatHistory && chatHistory.length > 0) {
      for (const msg of chatHistory) {
        if (msg.role === 'user') {
          messageHistory.push(new HumanMessage(msg.content));
        } else if (msg.role === 'assistant') {
          messageHistory.push(new AIMessage(msg.content));
        } else if (msg.role === 'system' && msg.content !== systemPrompt) {
          messageHistory.push(new SystemMessage(msg.content));
        }
      }
    }
    
    const memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "history",
      inputKey: "input",
      chatHistory: new ChatMessageHistory(messageHistory)
    });
    
    const chain = new ConversationChain({
      llm: model,
      memory: memory,
     
    });
    
    return chain;
  } catch (error) {
    throw error;
  }
};

/**
 * Send a message to the topic chat
 * @param {string} topicId - The topic ID to chat about
 * @param {string} message - The user message
 * @param {Array} chatHistory - Optional chat history
 * @returns {Object} The AI response
 */
const sendMessageToTopicChat = async (topicId, message, chatHistory = []) => {
  try {
    const topic = await Topic.findById(topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }
    
    const latestNews = await News.find({ topic: topicId })
      .sort({ publishedAt: -1 })
      .select('title summary url publishedAt content description');
    
    const chain = await createTopicChatModel(topicId, chatHistory);
    
    const newsContext = latestNews.map(news => 
      `[News from ${news.publishedAt.toISOString().split('T')[0]}]: ${news.title} - ${news.summary} -(Content: ${news.content}) (Description: ${news.description}) `
    ).join('\n');
    
    const enhancedMessage = `
    User Query: ${message}
    
    Latest News Context (only use if relevant to the query):
    ${newsContext}
    `;
    
    const response = await chain.call({ input: enhancedMessage });
    
    return {
      success: true,
      message: response.response,
      topicId,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  createTopicChatModel,
  sendMessageToTopicChat
};