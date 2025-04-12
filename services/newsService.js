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
    
    let searchTerms = [topic.name];
    
    if (topic.keywords && topic.keywords.length > 0) {
      searchTerms = searchTerms.concat(topic.keywords);
    }
    
    const searchQuery = `(${searchTerms.join(' OR ')})`;
    
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const fromDate = from.toISOString().split('T')[0];
    
    const params = {
      q: encodeURIComponent(searchQuery), 
      from: fromDate,
      sortBy: 'popularity',
      apiKey: NEWS_API_KEY,
      pageSize: 20,

    };
    
    const response = await axios.get(NEWS_API_URL, { params });
    
    if (!response.data || !response.data.articles || response.data.articles.length === 0) {
      return {
        success: false,
        message: 'No articles found'
      };
    }
    
    const articles = response.data.articles;
    
    let newArticlesCount = 0;
    let processedArticlesCount = 0;
    
    for (const article of articles) {
      if (!article.title || !article.url) {
        processedArticlesCount++;
        continue;
      }
      
      const existingArticle = await News.findOne({
        topic: topicId,
        url: article.url
      });
      
      if (existingArticle) {
        processedArticlesCount++;
        continue;
      }
      
      try {
        const contentForAnalysis = `Title: ${article.title } Description: ${article.description} Content: ${article.content}`;
        const truncatedContent = contentForAnalysis.substring(0, 8000); 
        const sentimentResult = await claudeService.analyzeSentiment(truncatedContent);
        
        const newsArticle = new News({
          topic: topicId,
          title: article.title,
          description: article.description || '',
          content: article.content || '',
          url: article.url,
          source: {
            name: article.source?.name || 'Unknown',
            url: article.source?.url || null
          },
          publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
          sentiment: {
            score: sentimentResult.score || 0,
            magnitude: sentimentResult.magnitude || 0,
            label: sentimentResult.label || 'neutral'
          },
          keywords: sentimentResult.keywords || []
        });
        
        await newsArticle.save();
        newArticlesCount++;
      } catch (error) {
        console.error(`Error processing article "${article.title}":`, error.message);
      }
      
      processedArticlesCount++;
    }
    
    if (newArticlesCount >= 3) {
      try {
        const summaryService = require('./summaryService');
        summaryService.generateTopicSummary(topicId)
          .catch(err => console.error('Error updating topic summary after scraping:', err));
        
      } catch (error) {
        console.error('Error initializing summary service:', error.message);
      }
    }
    
    await Topic.findByIdAndUpdate(topicId, { updatedAt: new Date() });
    
    return {
      success: true,
      newArticles: newArticlesCount,
      processedArticles: processedArticlesCount,
      totalArticles: articles.length
    };
  } catch (error) {
    console.error('Error in fetchNewsForTopic:', error);
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