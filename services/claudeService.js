const { Anthropic } = require('@anthropic-ai/sdk');
const axios = require('axios');
require('dotenv').config();

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_KEY
});

/**
 * Analyze sentiment using Claude
 * @param {string} text - Text to analyze
 * @returns {Object} Sentiment analysis results
 */
const analyzeSentiment = async (text) => {
  try {
    const prompt = `
    I want you to analyze the sentiment of the following text and provide:
    1. A sentiment score from -1.0 (very negative) to 1.0 (very positive)
    2. A magnitude/intensity score from 0.0 to 1.0
    3. A label of "positive", "neutral", or "negative"
    4. Up to 5 key themes or keywords from the text
    
    Format your response as JSON like this:
    {
      "score": (number),
      "magnitude": (number),
      "label": "(string)",
      "keywords": [(array of strings)]
    }
    
    Only return the JSON, nothing else.
    
    Text to analyze:
    ${text}
    `;
    
    const response = await claude.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      temperature: 0.0,
      messages: [
          { role: "user", content: prompt }
      ]
  });
    
    const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in Claude response');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    return {
      score: 0,
      magnitude: 0,
      label: 'neutral',
      keywords: []
    };
  }
};

/**
 * Summarize text using Claude
 * @param {string} text - Text to summarize
 * @returns {Object} Summary results
 */
const summarizeText = async (text) => {
  try {
    const prompt = `
    Provide a concise summary (2-3 sentences) of the following text:
    
    ${text}
    
    Format your response as JSON like this:
    {
      "summary": "(string)"
    }
    
    Only return the JSON, nothing else.
    `;
    
    const response = await claude.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 500,
      temperature: 0.0,
      messages: [
          { role: "user", content: prompt }
      ]
  });
    
    
    // Parse JSON from Claude's response
    const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in Claude response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    return {
      summary: 'No summary available.'
    };
  }
};

/**
 * Generate a topic summary using Claude
 * @param {string} topicName - Name of the topic
 * @param {Array} recentNews - Array of recent news articles
 * @param {Object} sentimentData - Sentiment analysis data
 * @returns {Object} Topic summary results
 */
const generateTopicSummary = async (topicName, recentNews, sentimentData) => {
    try {
      const newsContent = recentNews.map(news => 
        `Title: ${news.title}\nSummary: ${news.summary}\nSentiment: ${news.sentiment.label} (${news.sentiment.score})\nDate: ${new Date(news.publishedAt).toISOString().split('T')[0]}\n`
      ).join('\n---\n');
      
      const sentimentContext = `
      Overall Sentiment Distribution:
      Positive: ${sentimentData.positive || 0}%
      Neutral: ${sentimentData.neutral || 0}%
      Negative: ${sentimentData.negative || 0}%
      `;
      
      const prompt = `
      I want you to analyze the following recent news articles about "${topicName}" and generate a comprehensive topic summary.
      
      Here are the articles:
      ${newsContent}
      
      ${sentimentContext}
      
      Please provide:
      1. A comprehensive summary (3-5 paragraphs) of the current state of this topic based on the news articles
      2. 5-7 key insights or takeaways
      3. 3-5 trending themes with relevance scores (1-10)
      4. A brief sentiment overview
      
      Format your response as JSON like this:
      {
        "summary": "...",
        "keyInsights": ["insight 1", "insight 2", ...],
        "trendingThemes": [
          {"theme": "theme 1", "relevance": 8},
          {"theme": "theme 2", "relevance": 6},
          ...
        ],
        "sentimentOverview": {
          "positive": 30,
          "neutral": 50,
          "negative": 20,
          "overall": "mostly neutral with some positive indicators"
        }
      }
      
      Only return the JSON, nothing else.
      `;
      
      const response = await claude.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        temperature: 0.1,
        messages: [
            { role: "user", content: prompt }
        ]
    });
      
      const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON in Claude response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      return {
        summary: `Unable to generate summary for ${topicName} at this time.`,
        keyInsights: ['No insights available due to processing error.'],
        trendingThemes: [],
        sentimentOverview: {
          positive: 0,
          neutral: 0,
          negative: 0,
          overall: 'unavailable'
        }
      };
    }
  };
  
  // Add to module.exports
  module.exports = {
    analyzeSentiment,
    summarizeText,
    generateTopicSummary
  };