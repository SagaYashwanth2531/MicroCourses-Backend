// ============================================
// backend/routes/meta.js
// ============================================
const express = require('express');
const router = express.Router();

// @route   GET /api/health
// @desc    Health check
// @access  Public
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// @route   GET /api/_meta
// @desc    API metadata
// @access  Public
router.get('/_meta', (req, res) => {
  res.json({
    name: 'MicroCourses LMS API',
    version: '1.0.0',
    description: 'Learning Management System for micro courses',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me'
      },
      courses: {
        list: 'GET /api/courses',
        get: 'GET /api/courses/:id',
        create: 'POST /api/courses',
        update: 'PUT /api/courses/:id',
        myList: 'GET /api/creator/courses',
        addLesson: 'POST /api/courses/:id/lessons'
      },
      enrollment: {
        enroll: 'POST /api/enroll/:courseId',
        updateProgress: 'PUT /api/progress/:lessonId',
        getProgress: 'GET /api/progress'
      },
      admin: {
        courses: 'GET /api/admin/courses',
        updateStatus: 'PUT /api/admin/courses/:id/status',
        applications: 'GET /api/admin/creator-applications',
        approveCreator: 'PUT /api/admin/creator-applications/:id'
      },
      certificates: {
        generate: 'POST /api/certificate/:courseId',
        list: 'GET /api/certificates'
      }
    },
    features: [
      'JWT Authentication',
      'Role-based access control',
      'Rate limiting (60 req/min)',
      'Pagination on list endpoints',
      'Idempotency keys for POST requests',
      'Course creation workflow',
      'Progress tracking',
      'Certificate generation'
    ],
    rateLimit: '60 requests per minute',
    timestamp: new Date().toISOString()
  });
});

// @route   GET /.well-known/hackathon.json
// @desc    Well-known endpoint
// @access  Public
router.get('/.well-known/hackathon.json', (req, res) => {
  res.json({
    hackathon: 'MicroCourses LMS',
    team: 'Your Team Name',
    project: {
      name: 'MicroCourses LMS',
      description: 'A comprehensive Learning Management System for micro courses with role-based access control',
      version: '1.0.0',
      repository: 'https://github.com/yourusername/microcourses-lms'
    },
    features: [
      'User authentication with JWT',
      'Three user roles: learner, creator, admin',
      'Creator approval workflow',
      'Course creation and management',
      'Course approval workflow',
      'Enrollment system',
      'Progress tracking',
      'Certificate generation',
      'Rate limiting',
      'Pagination',
      'Idempotency'
    ],
    tech_stack: {
      backend: ['Node.js', 'Express', 'MongoDB', 'Mongoose', 'JWT', 'bcrypt'],
      frontend: ['React', 'React Router', 'Tailwind CSS', 'Axios', 'Context API'],
      deployment: ['Vercel', 'MongoDB Atlas']
    },
    endpoints: {
      api: '/api',
      health: '/api/health',
      metadata: '/api/_meta',
      wellKnown: '/.well-known/hackathon.json'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;