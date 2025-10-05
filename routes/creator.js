// ============================================
// backend/routes/creator.js
// ============================================
const express = require('express');
const router = express.Router();
const Course = require('../model/Course');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/creator/courses
// @desc    Get courses of the creator
// @access  Private/Creator
router.get('/courses', protect, authorize('creator', 'admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Course.countDocuments({ creator: req.user._id });
    const courses = await Course.find({ creator: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


