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
      .limit(10)
      .select('title publishedAt sentiment.label content description');
    
    const newsContext = recentNews.map(news => 
      `- [${news.publishedAt.toISOString().split('T')[0]}] ${news.title}: (Sentiment: ${news.sentiment.label}) (Content: ${news.content} (Description: ${news.description}) `
    ).join('\n');
    
    const systemPrompt = `
    You are an AI assistant specialized in discussing "${topic.name}".

    Here's some recent news about this topic:
    ${newsContext}

    Guidelines for responding:
    1. For questions ABOUT "${topic.name}": Use both your general knowledge AND the news context provided. You can discuss background information, history, general facts, and recent news about ${topic.name}.
    2. For questions about UNRELATED topics (e.g., asking about a completely different person, event, or subject): Politely redirect the conversation back to "${topic.name}". For example: "I'm here to discuss ${topic.name}. Could you ask me something about ${topic.name} instead?"
    3. Prioritize recent news when discussing current events, but don't limit yourself only to the news context for background questions.
    4. If asked about ${topic.name}'s background, history, or general information, use your knowledge freely.
    5. Keep responses clear, concise, and informative.

    You have full access to your general knowledge about "${topic.name}" - use it to provide helpful, accurate responses.
    `;
    
    const model = new ChatAnthropic({
      anthropicApiKey: process.env.ANTHROPIC_KEY,
      modelName: "claude-3-haiku-20240307",
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
      .limit(10)
      .select('title url publishedAt content description');
    
    const chain = await createTopicChatModel(topicId, chatHistory);
    
    let enhancedMessage = message;

    // Only add news context if we have recent news
    if (latestNews && latestNews.length > 0) {
      const newsContext = latestNews.map(news =>
        `[${news.publishedAt.toISOString().split('T')[0]}]: ${news.title} - ${news.description || news.content}`
      ).join('\n');

      enhancedMessage = `
User Question: ${message}

Recent News (use if relevant to answer the question):
${newsContext}
      `;
    }
    
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