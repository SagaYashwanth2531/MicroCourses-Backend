const mongoose = require('mongoose');
const lessonSchema = require('./Lesson');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'published', 'rejected'],
    default: 'draft'
  },
  lessons: [lessonSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

courseSchema.index({ status: 1, createdAt: -1 });
courseSchema.index({ creator: 1 });

module.exports = mongoose.model('Course', courseSchema);