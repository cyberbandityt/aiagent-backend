const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');
const newsService = require('../services/newsService');

/**
 * This route is designed to be triggered by the AWS Lambda function 
 * for scheduled news scraping. It's secured by an API key instead of JWT.
 */

// @route   POST /api/internal/scrape
// @desc    Scrape news for a topic (triggered by AWS Lambda)
// @access  Internal (secured by API key)
router.post('/scrape', async (req, res) => {
  const { topicId, apiKey } = req.body;
  
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
  
  if (!topicId) {
    return res.status(400).json({
      success: false,
      message: 'Topic ID is required'
    });
  }
  
  try {
    const topic = await Topic.findById(topicId);
    
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
    
    const scrapingResult = await newsService.fetchNewsForTopic(topicId);
    
    topic.updatedAt = new Date();
    await topic.save();
    
    return res.status(200).json({
      success: true,
      message: `News scraping completed for topic: ${topic.name}`,
      topic: {
        id: topic._id,
        name: topic.name
      },
      result: scrapingResult
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;