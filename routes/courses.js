// ============================================
// backend/routes/courses.js
// ============================================
const express = require('express');
const router = express.Router();
const Course = require('../model/Course');
const { protect, authorize, requireApprovedCreator } = require('../middleware/auth');

// @route   GET /api/courses
// @desc    Get published courses (public with pagination)
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = { status: 'published' };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
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

// @route   GET /api/courses/:id
// @desc    Get course details
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate('creator', 'email');

    if (!course) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found'
        }
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/courses
// @desc    Create course (approved creators only)
// @access  Private/Creator
router.post('/', protect, authorize('creator', 'admin'), requireApprovedCreator, async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Please provide title and description'
        }
      });
    }

    const course = await Course.create({
      title,
      description,
      creator: req.user._id,
      status: 'draft',
      lessons: []
    });

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/creator/courses
// @desc    Get courses of the creator
// @access  Private/Creator
router.get('/creator/my-courses', protect, authorize('creator', 'admin'), async (req, res, next) => {
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

// @route   PUT /api/courses/:id
// @desc    Update course (creator only)
// @access  Private/Creator
router.put('/:id', protect, authorize('creator', 'admin'), async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found'
        }
      });
    }

    if (course.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to update this course'
        }
      });
    }

    const { title, description, status } = req.body;

    if (title) course.title = title;
    if (description) course.description = description;
    if (status && ['draft', 'pending'].includes(status)) {
      course.status = status;
    }

    await course.save();

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/courses/:id/lessons
// @desc    Add lesson to course (creator only)
// @access  Private/Creator
router.post('/:id/lessons', protect, authorize('creator', 'admin'), async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found'
        }
      });
    }

    if (course.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to update this course'
        }
      });
    }

    const { title, content, videoUrl, duration, transcript } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Please provide title and content'
        }
      });
    }

    const orderIndex = course.lessons.length;

    // Auto-generate a simple transcript if none provided
    const autoTranscript = transcript && transcript.trim().length > 0
      ? transcript
      : (content ? `${content.substring(0, 800)}${content.length > 800 ? '...' : ''}\n\n[Auto-generated transcript]` : '');

    course.lessons.push({
      title,
      content,
      videoUrl: videoUrl || '',
      orderIndex,
      duration: duration || 0,
      transcript: autoTranscript
    });

    await course.save();

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;