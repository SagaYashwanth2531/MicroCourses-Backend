// ============================================
// backend/routes/enrollment.js
// ============================================
const express = require('express');
const router = express.Router();
const Enrollment = require('../model/Enrollment');
const Course = require('../model/Course');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/enroll/:courseId
// @desc    Enroll in a course (learner)
// @access  Private/Learner
router.post('/:courseId', protect, authorize('learner'), async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found'
        }
      });
    }

    if (course.status !== 'published') {
      return res.status(400).json({
        error: {
          code: 'COURSE_NOT_PUBLISHED',
          message: 'Course is not published yet'
        }
      });
    }

    const existingEnrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        error: {
          code: 'ALREADY_ENROLLED',
          message: 'Already enrolled in this course'
        }
      });
    }

    const enrollment = await Enrollment.create({
      user: req.user._id,
      course: req.params.courseId,
      progress: 0,
      completedLessons: [],
      completed: false
    });

    res.status(201).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/progress/:lessonId
// @desc    Update lesson progress (learner)
// @access  Private/Learner
router.put('/:lessonId', protect, authorize('learner'), async (req, res, next) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Please provide courseId'
        }
      });
    }

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId
    });

    if (!enrollment) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Enrollment not found'
        }
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found'
        }
      });
    }

    const lesson = course.lessons.id(req.params.lessonId);

    if (!lesson) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Lesson not found'
        }
      });
    }

    if (!enrollment.completedLessons.includes(req.params.lessonId)) {
      enrollment.completedLessons.push(req.params.lessonId);
    }

    const totalLessons = course.lessons.length;
    const completedCount = enrollment.completedLessons.length;
    enrollment.progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    if (enrollment.progress === 100) {
      enrollment.completed = true;
    }

    await enrollment.save();

    res.json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/progress
// @desc    Get user's progress
// @access  Private/Learner
router.get('/', protect, authorize('learner'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Enrollment.countDocuments({ user: req.user._id });
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate('course', 'title description')
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: enrollments,
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