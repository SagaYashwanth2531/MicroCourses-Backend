const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    default: ''
  },
  orderIndex: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    default: 0
  },
  transcript: {
    type: String,
    default: ''
  }
});

module.exports = lessonSchema;