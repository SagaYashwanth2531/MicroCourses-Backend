// ============================================
// backend/routes/admin.js
// ============================================
const express = require('express');
const router = express.Router();
const Course = require('../model/Course');
const User = require('../model/User');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/admin/courses
// @desc    Get all courses for review (admin)
// @access  Private/Admin
router.get('/courses', protect, authorize('admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || 'pending';

    const query = {};
    if (status !== 'all') {
      query.status = status;
    }

    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .populate('creator', 'email')
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

// @route   PUT /api/admin/courses/:id/status
// @desc    Approve/reject course (admin)
// @access  Private/Admin
router.put('/courses/:id/status', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['published', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be either published or rejected',
          field: 'status'
        }
      });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found'
        }
      });
    }

    course.status = status;
    await course.save();

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/creator-applications
// @desc    Get creator applications (admin)
// @access  Private/Admin
router.get('/creator-applications', protect, authorize('admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments({
      role: 'creator',
      approvedCreator: false
    });

    const applications = await User.find({
      role: 'creator',
      approvedCreator: false
    })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: applications,
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

// @route   PUT /api/admin/creator-applications/:id
// @desc    Approve creator (admin)
// @access  Private/Admin
router.put('/creator-applications/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    if (user.role !== 'creator') {
      return res.status(400).json({
        error: {
          code: 'INVALID_ROLE',
          message: 'User is not a creator'
        }
      });
    }

    user.approvedCreator = true;
    await user.save();

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        approvedCreator: user.approvedCreator
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;