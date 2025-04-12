const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  content: {
    type: String
  },
  url: {
    type: String,
    required: true
  },
  source: {
    name: String,
    url: String
  },
  publishedAt: {
    type: Date
  },
  sentiment: {
    score: Number, 
    magnitude: Number,
    label: {
      type: String,
      enum: ['positive', 'neutral', 'negative']
    }
  },
  keywords: [{
    type: String
  }],
  scrapedAt: {
    type: Date,
    default: Date.now
  }
});

NewsSchema.index({ topic: 1, url: 1 }, { unique: true });
NewsSchema.index({ topic: 1, publishedAt: -1 });
NewsSchema.index({ topic: 1, 'sentiment.label': 1, publishedAt: -1 });

module.exports = mongoose.model('News', NewsSchema);