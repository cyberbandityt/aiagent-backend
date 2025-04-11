const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const Topic = require('../models/Topic');
const ChatMessage = require('../models/ChatMessage');
const langchainService = require('../services/langchainService');

// @route   GET /api/chat/topic/:topicId/history
// @desc    Get chat history for a topic
// @access  Private
router.get('/topic/:topicId/history', authenticateJWT, async (req, res) => {
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
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const chatHistory = await ChatMessage.find({
      topic: topicId,
      user: req.user.id
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await ChatMessage.countDocuments({
      topic: topicId,
      user: req.user.id
    });
    
    res.json({
      success: true,
      topic: {
        id: topic._id,
        name: topic.name
      },
      chatHistory: chatHistory.reverse(), 
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

// @route   POST /api/chat/topic/:topicId
// @desc    Send a message to chat about a topic
// @access  Private
router.post('/topic/:topicId', authenticateJWT, async (req, res) => {
  try {
    const { message } = req.body;
    const { topicId } = req.params;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
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
    
    const userChatMessage = new ChatMessage({
      topic: topicId,
      user: req.user.id,
      role: 'user',
      content: message
    });
    
    await userChatMessage.save();
    
    const chatHistory = await ChatMessage.find({
      topic: topicId,
      user: req.user.id
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .sort({ timestamp: 1 });
    
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    const response = await langchainService.sendMessageToTopicChat(topicId, message, formattedHistory);
    
    if (!response.success) {
      return res.status(400).json({
        success: false,
        message: response.error
      });
    }
    
    // Save assistant response to database
    const assistantChatMessage = new ChatMessage({
      topic: topicId,
      user: req.user.id,
      role: 'assistant',
      content: response.message
    });
    
    await assistantChatMessage.save();
    
    res.json({
      success: true,
      topic: {
        id: topic._id,
        name: topic.name
      },
      message: userChatMessage,
      response: assistantChatMessage,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/chat/topic/:topicId/history
// @desc    Clear chat history for a topic
// @access  Private
router.delete('/topic/:topicId/history', authenticateJWT, async (req, res) => {
  try {
    const { topicId } = req.params;
    
    // Check if topic exists and belongs to user
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
    
    // Delete all chat messages for this topic and user
    const deleteResult = await ChatMessage.deleteMany({
      topic: topicId,
      user: req.user.id
    });
    
    res.json({
      success: true,
      message: 'Chat history cleared successfully',
      deleted: deleteResult.deletedCount
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