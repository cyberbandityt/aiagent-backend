const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const Topic = require('../models/Topic');
const User = require('../models/User')
const News = require('../models/News');
const { createNewsScrapingSchedule, stopNewsScrapingSchedule } = require('../config/scheduler');
const newsService = require('../services/newsService');

// @route   POST /api/topics
// @desc    Create a new topic
// @access  Private
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { name, keywords, description } = req.body;
    const user = await User.findById(req.user.id)

    if (user.totalTopic >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Topic limit reached. Please delete an existing topic to create a new one.'
      });
    }
    const existingTopic = await Topic.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      user: req.user.id 
    });
    
    if (existingTopic) {
      return res.status(400).json({
        success: false,
        message: 'Topic already exists'
      });
    }
    
    const topic = new Topic({
      name,
      keywords: keywords || [],
      description,
      user: req.user.id
    });
    
    await topic.save();
    
    const initialScrapeResult = await newsService.fetchNewsForTopic(topic._id.toString());
    if (initialScrapeResult.success && initialScrapeResult.newArticles > 0) {
        try {
          const summaryService = require('../services/summaryService');
          summaryService.generateTopicSummary(topic._id.toString())
            .catch(err => console.error('Error generating initial summary:', err));
          
        } catch (error) {
        }
      }
    const scheduleResult = await createNewsScrapingSchedule(topic._id.toString(), topic.name);
    user.totalTopic += 1
    await user.save()
    if (scheduleResult.success) {
      topic.scheduleId = scheduleResult.scheduleId;
      await topic.save();
      
      return res.status(201).json({
        success: true,
        topic,
        schedule: scheduleResult,
        initialScrape: initialScrapeResult
      });
    } else {
      topic.isActive = false;
      await topic.save();
      
      return res.status(201).json({
        success: true,
        topic,
        warning: 'Topic created but scheduler setup failed. Topic is inactive.',
        error: scheduleResult.error,
        initialScrape: initialScrapeResult
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/topics
// @desc    Get all topics for user
// @access  Private
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const topics = await Topic.find({ user: req.user.id })
      .sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      count: topics.length,
      topics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/topics/:id
// @desc    Get a topic by ID
// @access  Private
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const topic = await Topic.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }
    
    const newsCount = await News.countDocuments({ topic: topic._id });
    
    const latestNews = await News.findOne({ topic: topic._id })
      .sort({ scrapedAt: -1 })
      .select('scrapedAt');
    
    res.json({
      success: true,
      topic,
      stats: {
        newsCount,
        lastUpdated: latestNews ? latestNews.scrapedAt : topic.updatedAt
      }
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/topics/:id
// @desc    Update a topic
// @access  Private
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const { name, keywords, description, isActive } = req.body;
    
    let topic = await Topic.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }
    
    if (name) topic.name = name;
    if (keywords) topic.keywords = keywords;
    if (description !== undefined) topic.description = description;
    
    if (isActive !== undefined && topic.isActive !== isActive) {
      if (isActive && !topic.isActive) {
        const scheduleResult = await createNewsScrapingSchedule(topic._id.toString(), topic.name);
        
        if (scheduleResult.success) {
          topic.isActive = true;
          topic.scheduleId = scheduleResult.scheduleId;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Failed to activate topic',
            error: scheduleResult.error
          });
        }
      } 
      else if (!isActive && topic.isActive) {
        if (topic.scheduleId) {
          const stopResult = await stopNewsScrapingSchedule(topic.scheduleId);
          
          if (stopResult.success) {
            topic.isActive = false;
          } else {
            return res.status(400).json({
              success: false,
              message: 'Failed to deactivate topic',
              error: stopResult.error
            });
          }
        } else {
          topic.isActive = false;
        }
      }
    }
    
    topic.updatedAt = new Date();
    await topic.save();
    
    res.json({
      success: true,
      topic
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/topics/:id
// @desc    Delete a topic
// @access  Private
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const topic = await Topic.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }
    
    if (topic.isActive && topic.scheduleId) {
      await stopNewsScrapingSchedule(topic.scheduleId);
    }
    
    await News.deleteMany({ topic: topic._id });
    const user = await User.findById(req.user.id)
    user.totalTopic -= 1
    await user.save()
    await Topic.findByIdAndDelete(topic._id);
    
    res.json({
      success: true,
      message: 'Topic deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/topics/:id/scrape
// @desc    Manually trigger scraping for a topic
// @access  Private
router.post('/:id/scrape', authenticateJWT, async (req, res) => {
  try {
    const topic = await Topic.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }
    
    if (!topic.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Topic is inactive'
      });
    }
    
    const scrapeResult = await newsService.fetchNewsForTopic(topic._id.toString());
    
    res.json({
      success: true,
      topic,
      scrapeResult
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