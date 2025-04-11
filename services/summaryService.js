const News = require('../models/News');
const Topic = require('../models/Topic');
const TopicSummary = require('../models/TopicSummary');
const claudeService = require('./claudeService');

/**
 * Generate or update a summary for a topic
 * @param {string} topicId - The topic ID to summarize
 * @returns {Object} The generated or updated summary
 */
const generateTopicSummary = async (topicId) => {
  try {
    const topic = await Topic.findById(topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }
    
    const recentNews = await News.find({ topic: topicId })
      .sort({ publishedAt: -1 })
      .limit(15)
      .select('title summary content publishedAt sentiment');
    
    if (recentNews.length === 0) {
      throw new Error('No news articles found for this topic');
    }
    
    const sentimentCounts = {
      positive: 0,
      neutral: 0,
      negative: 0
    };
    
    recentNews.forEach(news => {
      if (news.sentiment && news.sentiment.label) {
        sentimentCounts[news.sentiment.label]++;
      }
    });
    
    const totalArticles = recentNews.length;
    const sentimentDistribution = {
      positive: Math.round((sentimentCounts.positive / totalArticles) * 100),
      neutral: Math.round((sentimentCounts.neutral / totalArticles) * 100),
      negative: Math.round((sentimentCounts.negative / totalArticles) * 100)
    };
    
    const summaryData = await claudeService.generateTopicSummary(
      topic.name,
      recentNews,
      sentimentDistribution
    );
    
    let topicSummary = await TopicSummary.findOne({ topic: topicId });
    
    if (topicSummary) {
      topicSummary.summary = summaryData.summary;
      topicSummary.keyInsights = summaryData.keyInsights;
      topicSummary.trendingThemes = summaryData.trendingThemes;
      topicSummary.sentimentOverview = summaryData.sentimentOverview;
      topicSummary.updatedAt = new Date();
    } else {
      topicSummary = new TopicSummary({
        topic: topicId,
        summary: summaryData.summary,
        keyInsights: summaryData.keyInsights,
        trendingThemes: summaryData.trendingThemes,
        sentimentOverview: summaryData.sentimentOverview
      });
    }
    
    await topicSummary.save();
    
    return {
      success: true,
      topicSummary,
      newsCount: recentNews.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get the latest summary for a topic
 * @param {string} topicId - The topic ID
 * @returns {Object} The topic summary or error
 */
const getTopicSummary = async (topicId) => {
  try {
    const topic = await Topic.findById(topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }
    
    const topicSummary = await TopicSummary.findOne({ topic: topicId });
    
    if (!topicSummary) {
      return await generateTopicSummary(topicId);
    }
    
    const sixHoursAgo = new Date();
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);
    
    if (topicSummary.updatedAt < sixHoursAgo) {
      generateTopicSummary(topicId).catch(err => 
        console.error('Error updating summary in background:', err)
      );
      
      return {
        success: true,
        topicSummary,
        message: 'Summary is being updated in the background',
        isUpdating: true
      };
    }
    
    return {
      success: true,
      topicSummary
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  generateTopicSummary,
  getTopicSummary
};