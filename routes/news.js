const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const News = require('../models/News');
const Topic = require('../models/Topic');
const newsService = require('../services/newsService');
const mongoose = require('mongoose')
// @route   GET /api/news/topic/:topicId
// @desc    Get news for a topic with optional filters
// @access  Private
router.get('/topic/:topicId', authenticateJWT, async (req, res) => {
  try {
    // Check if topic exists and belongs to user
    const topic = await Topic.findOne({
      _id: req.params.topicId,
      user: req.user.id
    });
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }
    
    // Extract filter parameters from query
    const filters = {
      sentiment: req.query.sentiment,
      from: req.query.from,
      to: req.query.to,
      source: req.query.source,
      sortBy: req.query.sortBy,
      page: req.query.page,
      limit: req.query.limit
    };
    
    // Get news with filters
    const result = await newsService.getTopicNews(topic._id, filters);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }
    
    res.json({
      success: true,
      topic: {
        id: topic._id,
        name: topic.name
      },
      news: result.news,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/news/sentiment/:topicId
// @desc    Get sentiment analysis for a topic
// @access  Private
router.get('/sentiment/:topicId', authenticateJWT, async (req, res) => {
  try {
    const topic = await Topic.findOne({
      _id: req.params.topicId,
      user: req.user.id
    });
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }
    
    const timeframe = req.query.timeframe || '7d';
    
    const result = await newsService.getTopicSentimentAnalysis(topic._id, timeframe);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }
    
    res.json({
      success: true,
      topic: {
        id: topic._id,
        name: topic.name
      },
      sentiment: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/news/:id
// @desc    Get a single news article
// @access  Private
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    const topic = await Topic.findOne({
      _id: news.topic,
      user: req.user.id
    });
    
    if (!topic) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    res.json({
      success: true,
      news
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/news/search/:topicId
// @desc    Search news for a topic by keyword
// @access  Private
router.get('/search/:topicId', authenticateJWT, async (req, res) => {
  try {
    const { topicId } = req.params;
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const topic = await Topic.findOne({
      _id: topicId,
      user: req.user.id
    });
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
   
    const searchResults = await News.find(
      {
        topic: topicId,
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { summary: { $regex: query, $options: 'i' } },
          { keywords: { $regex: query, $options: 'i' } }
        ]
      }
    )
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await News.countDocuments({
      topic: topicId,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { summary: { $regex: query, $options: 'i' } },
        { keywords: { $regex: query, $options: 'i' } }
      ]
    });
    
    res.json({
      success: true,
      topic: {
        id: topic._id,
        name: topic.name
      },
      query,
      results: searchResults,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/news/stats/:topicId
// @desc    Get news statistics for a topic
// @access  Private
router.get('/stats/:topicId', authenticateJWT, async (req, res) => {
  try {
    const { topicId } = req.params;
    
    const topic = await Topic.findOne({
      _id: topicId,
      user: req.user.id
    });
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }
    
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const totalCount = await News.countDocuments({ topic: topicId });
    
    const timeframeCount = await News.countDocuments({
      topic: topicId,
      publishedAt: { $gte: startDate }
    });
    
    const sentimentDistribution = await News.aggregate([
      {
        $match: {
          topic: new mongoose.Types.ObjectId(topicId),
          publishedAt: { $gte: startDate }
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
    
    const sourceDistribution = await News.aggregate([
      {
        $match: {
          topic: new mongoose.Types.ObjectId(topicId),
          publishedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$source.name',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    const articlesPerDay = await News.aggregate([
      {
        $match: {
          topic: new mongoose.Types.ObjectId(topicId),
          publishedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$publishedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      topic: {
        id: topic._id,
        name: topic.name
      },
      timeframe: `${days} days`,
      stats: {
        totalArticles: totalCount,
        timeframeArticles: timeframeCount,
        sentimentDistribution,
        sourceDistribution,
        articlesPerDay
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;