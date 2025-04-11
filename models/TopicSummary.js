const mongoose = require('mongoose');

const TopicSummarySchema = new mongoose.Schema({
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true,
    unique: true
  },
  summary: {
    type: String,
    required: true
  },
  keyInsights: [{
    type: String
  }],
  trendingThemes: [{
    theme: String,
    relevance: Number
  }],
  sentimentOverview: {
    positive: Number,
    neutral: Number,
    negative: Number,
    overall: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TopicSummary', TopicSummarySchema);