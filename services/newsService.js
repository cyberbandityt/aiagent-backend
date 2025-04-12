const axios = require('axios');
const News = require('../models/News');
const Topic = require('../models/Topic');
const claudeService = require('./claudeService');
const mongoose = require('mongoose')
require('dotenv').config();

const NEWS_API_URL = 'https://newsapi.org/v2/everything';
const NEWS_API_KEY = process.env.NEWS_API_KEY;

const fetchNewsForTopic = async (topicId) => {
  try {
    const topic = await Topic.findById(topicId);
    
    if (!topic || !topic.isActive) {
      return {
        success: false,
        message: 'Topic not found or inactive'
      };
    }
    
    let searchQuery = topic.name;
    if (topic.keywords && topic.keywords.length > 0) {
      searchQuery += ` OR ${topic.keywords.join(' OR ')}`;
    }
    
    const from = new Date();
    from.setHours(from.getHours() - 24);
    const fromDate = from.toISOString().split('T')[0];
    
    const params = {
      q: searchQuery,
      from: fromDate,
      sortBy: 'publishedAt',
      language: 'en',
      apiKey: NEWS_API_KEY,
      pageSize: 20
    };
    
    const response = await axios.get(NEWS_API_URL, { params });
    
    if (!response.data || !response.data.articles) {
      return {
        success: false,
        message: 'No articles found'
      };
    }
    
    const articles = response.data.articles;
    
    let newArticlesCount = 0;
    let processedArticlesCount = 0;
    
    for (const article of articles) {
      const existingArticle = await News.findOne({
        topic: topicId,
        url: article.url
      });
      
      if (existingArticle) {
        continue;
      }
      
      try {
        const contentForAnalysis = article.description || article.title || article.content;
        const truncatedContent = contentForAnalysis.substring(0, 8000); // Claude has token limits
        
        const [sentimentResult] = await Promise.all([
          claudeService.analyzeSentiment(truncatedContent),
        ]);
        
        const newsArticle = new News({
          topic: topicId,
          title: article.title,
          description: article.description,
          content: article.content,
          url: article.url,
          source: {
            name: article.source.name,
            url: article.source.url || null
          },
          publishedAt: new Date(article.publishedAt),
          sentiment: {
            score: sentimentResult.score,
            magnitude: sentimentResult.magnitude,
            label: sentimentResult.label
          },
          keywords: sentimentResult.keywords || []
        });
        
        await newsArticle.save();
        newArticlesCount++;
      } catch (error) {

    }
      if (newArticlesCount >= 3) {
        try {
          const summaryService = require('./summaryService');
          
          summaryService.generateTopicSummary(topicId)
            .catch(err => console.error('Error updating topic summary after scraping:', err));
          
        } catch (error) {
        }
      }
      processedArticlesCount++;
    }
    
    await Topic.findByIdAndUpdate(topicId, { updatedAt: new Date() });
    
    return {
      success: true,
      newArticles: newArticlesCount,
      processedArticles: processedArticlesCount
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

const getTopicNews = async (topicId, filters = {}) => {
  try {
    const query = { topic: topicId };
    
    if (filters.sentiment) {
      query['sentiment.label'] = filters.sentiment;
    }
    
    if (filters.from) {
      query.publishedAt = { $gte: new Date(filters.from) };
    }
    
    if (filters.to) {
      if (!query.publishedAt) query.publishedAt = {};
      query.publishedAt.$lte = new Date(filters.to);
    }
    
    if (filters.source) {
      query['source.name'] = { $regex: filters.source, $options: 'i' };
    }
    
    const sortOption = filters.sortBy === 'sentiment' 
      ? { 'sentiment.score': -1 } 
      : { publishedAt: -1 };
    
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;
    
    const news = await News.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);
    
    const total = await News.countDocuments(query);
    
    return {
      success: true,
      news,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

const getTopicSentimentAnalysis = async (topicId, timeframe = '7d') => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7); // Default to 7 days
    }
    
    // Aggregate sentiment by day
    const dailySentiment = await News.aggregate([
      {
        $match: {
          topic: new mongoose.Types.ObjectId(topicId),
          publishedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$publishedAt' } },
            sentiment: '$sentiment.label'
          },
          count: { $sum: 1 },
          avgScore: { $avg: '$sentiment.score' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          sentiments: {
            $push: {
              label: '$_id.sentiment',
              count: '$count',
              avgScore: '$avgScore'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Aggregate overall sentiment
    const overallSentiment = await News.aggregate([
      {
        $match: {
          topic: new mongoose.Types.ObjectId(topicId),
          publishedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$sentiment.label',
          count: { $sum: 1 },
          avgScore: { $avg: '$sentiment.score' }
        }
      }
    ]);
    
    // Get top keywords
    const topKeywords = await News.aggregate([
      {
        $match: {
          topic: new mongoose.Types.ObjectId(topicId),
          publishedAt: { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: '$keywords' },
      {
        $group: {
          _id: '$keywords',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    return {
      success: true,
      timeframe,
      dailySentiment,
      overallSentiment,
      topKeywords
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  fetchNewsForTopic,
  getTopicNews,
  getTopicSentimentAnalysis
};