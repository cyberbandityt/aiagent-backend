const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const Topic = require('../models/Topic');
const summaryService = require('../services/summaryService');

// @route   GET /api/summary/topic/:topicId
// @desc    Get summary for a topic
// @access  Private
router.get('/topic/:topicId', authenticateJWT, async (req, res) => {
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
    
    const result = await summaryService.getTopicSummary(topicId);
    
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
      summary: result.topicSummary,
      isUpdating: result.isUpdating || false,
      lastUpdated: result.topicSummary.updatedAt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/summary/topic/:topicId/generate
// @desc    Generate a new summary for a topic
// @access  Private
router.post('/topic/:topicId/generate', authenticateJWT, async (req, res) => {
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
    
    const result = await summaryService.generateTopicSummary(topicId);
    
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
      summary: result.topicSummary,
      message: 'Summary generated successfully',
      newsAnalyzed: result.newsCount
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