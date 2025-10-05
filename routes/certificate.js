// ============================================
// backend/routes/certificate.js
// ============================================
const express = require('express');
const router = express.Router();
const Certificate = require('../model/certificate');
const Enrollment = require('../model/Enrollment');
const Course = require('../model/Course');
const { protect, authorize } = require('../middleware/auth');
const { generateCertificateHash } = require('../utils/generateHash');

// @route   POST /api/certificate/:courseId
// @desc    Generate certificate (when 100% progress)
// @access  Private/Learner
router.post('/:courseId', protect, authorize('learner'), async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId
    });

    if (!enrollment) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Enrollment not found'
        }
      });
    }

    if (!enrollment.completed || enrollment.progress < 100) {
      return res.status(400).json({
        error: {
          code: 'INCOMPLETE_COURSE',
          message: 'Course must be completed to generate certificate'
        }
      });
    }

    const existingCertificate = await Certificate.findOne({
      user: req.user._id,
      course: req.params.courseId
    });

    if (existingCertificate) {
      return res.status(400).json({
        error: {
          code: 'CERTIFICATE_EXISTS',
          message: 'Certificate already generated for this course'
        }
      });
    }

    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found'
        }
      });
    }

    const certificateHash = generateCertificateHash(req.user._id, req.params.courseId);

    const certificate = await Certificate.create({
      user: req.user._id,
      course: req.params.courseId,
      certificateHash
    });

    const populatedCertificate = await Certificate.findById(certificate._id)
      .populate('user', 'email')
      .populate('course', 'title description');

    res.status(201).json({
      success: true,
      data: populatedCertificate
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/certificates
// @desc    Get user's certificates
// @access  Private/Learner
router.get('/', protect, authorize('learner'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Certificate.countDocuments({ user: req.user._id });
    const certificates = await Certificate.find({ user: req.user._id })
      .populate('course', 'title description')
      .sort({ issuedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: certificates,
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