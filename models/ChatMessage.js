const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

ChatMessageSchema.index({ topic: 1, timestamp: 1 });
ChatMessageSchema.index({ user: 1, topic: 1, timestamp: 1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);