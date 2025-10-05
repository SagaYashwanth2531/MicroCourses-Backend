// ============================================
// backend/api/index.js
// ============================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const connectDB = require('../config/db');
const { apiLimiter } = require('../middleware/rateLimitter');
const { idempotency } = require('../middleware/idempotency');
const { errorHandler } = require('../middleware/errorHandler');
const { initializeAdmin } = require('../utils/initAdmin');
const { seedDemoData } = require('../utils/seedDemo');

const app = express();

// Connect to database
connectDB().then(async () => {
  await initializeAdmin();
  if (process.env.SEED_DEMO === 'true') {
    const { seedDemoData } = require('../utils/seedDemo');
    await seedDemoData();
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', apiLimiter);

// Idempotency for POST requests
app.use(idempotency);

// Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/courses', require('../routes/courses'));
// Dedicated creator courses route mounted to match /api/creator/courses
app.use('/api/creator', require('../routes/creator'));
app.use('/api/enroll', require('../routes/enrollment'));
app.use('/api/progress', require('../routes/enrollment'));
app.use('/api/admin', require('../routes/admin'));
app.use('/api/certificate', require('../routes/certificate'));
app.use('/api/certificates', require('../routes/certificate'));
app.use('/api', require('../routes/meta'));
// Well-known is served from meta route at explicit path
app.use('/', require('../routes/meta'));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'MicroCourses LMS API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      metadata: '/api/_meta',
      wellKnown: '/.well-known/hackathon.json',
      docs: '/api/_meta'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Error handler
app.use(errorHandler);

// Export for Vercel serverless
module.exports = app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}