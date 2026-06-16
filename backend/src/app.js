const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const studentProfileRoutes = require('./routes/studentProfileRoutes');
const recruiterProfileRoutes = require('./routes/recruiterProfileRoutes');
const adminRecruiterRoutes = require('./routes/adminRecruiterRoutes');
const adminStudentRoutes = require('./routes/adminStudentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const campusDriveRoutes = require('./routes/campusDriveRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const adminApplicationRoutes = require('./routes/adminApplicationRoutes');
const { studentRouter: eligibilityStudentRoutes, adminRouter: eligibilityAdminRoutes } = require('./routes/eligibilityRoutes');
const adminBatchRoutes = require('./routes/adminBatchRoutes');
const { sendError } = require('./utils/response');

const app = express();

// --------------- Middleware ---------------

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// Serve static uploaded files (resumes)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --------------- Routes ---------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'CRMS API is running' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Student Profile routes
app.use('/api/student/profile', studentProfileRoutes);

// Recruiter Profile routes
app.use('/api/recruiter/profile', recruiterProfileRoutes);

// Admin – Recruiter management routes
app.use('/api/admin/recruiters', adminRecruiterRoutes);

// Admin – Student management routes
app.use('/api/admin/students', adminStudentRoutes);

// Admin – Batch management routes
app.use('/api/admin/batches', adminBatchRoutes);

// Eligibility Engine – Admin stats routes
app.use('/api/admin/drives', eligibilityAdminRoutes);

// Admin Application routes
app.use('/api/admin', adminApplicationRoutes);

// Notification routes
app.use('/api/notifications', notificationRoutes);

// Campus Drive routes (recruiter CRUD + admin list)
app.use('/api/drives', campusDriveRoutes);

// Application routes
app.use('/api/applications', applicationRoutes);

// Recruiter Application routes
app.use('/api/recruiter', recruiterRoutes);

// Eligibility Engine – Student routes
app.use('/api/student', eligibilityStudentRoutes);

// Recruitment Pipeline routes
const recruitmentStageRoutes = require('./routes/recruitmentStageRoutes');
app.use('/api', recruitmentStageRoutes);

// Future routes will be mounted here:
// app.use('/api/applications', applicationRoutes);
// app.use('/api/interviews', interviewRoutes);
// app.use('/api/notifications', notificationRoutes);

// --------------- Error Handling ---------------

// 404 handler
app.use((req, res) => {
  sendError(res, 404, `Route ${req.originalUrl} not found`);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  sendError(res, 500, 'Internal server error');
});

module.exports = app;
