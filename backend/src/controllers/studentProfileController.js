const StudentProfile = require('../models/StudentProfile');
const { sendResponse, sendError } = require('../utils/response');

/**
 * @desc    Create student profile
 * @route   POST /api/student/profile
 * @access  Private (Student Only)
 */
const createProfile = async (req, res) => {
  try {
    // Double check user role is student
    if (req.user.role !== 'student') {
      return sendError(res, 403, 'Only students are authorized to create profiles');
    }

    // Check if profile already exists for this user
    const existingProfile = await StudentProfile.findOne({ userId: req.user._id });
    if (existingProfile) {
      return sendError(res, 400, 'Student profile already exists for this user');
    }

    let inviteCode = req.body.inviteCode;
    // Fallback to inviteCode from User document if not explicitly passed
    if (!inviteCode && req.user && req.user.inviteCode) {
      inviteCode = req.user.inviteCode;
    }

    if (!inviteCode) {
      return sendError(res, 400, 'Invitation code is required');
    }

    // Look up batch
    const Batch = require('../models/Batch');
    const batch = await Batch.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!batch) {
      return sendError(res, 400, 'Invalid invitation code');
    }
    if (!batch.isActive) {
      return sendError(res, 400, 'The batch associated with this invitation code is currently deactivated');
    }

    // Prepare profile data
    const profileData = {
      ...req.body,
      userId: req.user._id,
      batchId: batch._id,
      batch: batch.canonicalBatch, // Synchronize with canonicalBatch for eligibility engine compatibility
    };

    // Clean inviteCode from Mongoose creation payload
    delete profileData.inviteCode;

    // Create profile in database
    let profile = await StudentProfile.create(profileData);
    profile = await StudentProfile.findById(profile._id)
      .populate('userId', 'fullName email role')
      .populate('batchId');

    sendResponse(res, 201, 'Student profile created successfully', profile);
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return sendError(res, 400, messages.join(', '));
    }
    // Handle duplicate key error (such as universityRollNo or userId)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'universityRollNo') {
        return sendError(res, 400, 'University Roll Number is already registered');
      }
      return sendError(res, 400, 'Student profile already exists for this user');
    }
    console.error('Create Profile Error:', error);
    return sendError(res, 500, 'Server error during profile creation');
  }
};

/**
 * @desc    Get student profile
 * @route   GET /api/student/profile
 * @access  Private (Student Only)
 */
const getProfile = async (req, res) => {
  try {
    // Find profile for the current user and populate user details
    const profile = await StudentProfile.findOne({ userId: req.user._id })
      .populate('userId', 'fullName email role')
      .populate('batchId');

    if (!profile) {
      return sendError(res, 404, 'Student profile not found');
    }

    sendResponse(res, 200, 'Student profile retrieved successfully', profile);
  } catch (error) {
    console.error('Get Profile Error:', error);
    return sendError(res, 500, 'Server error during profile retrieval');
  }
};

/**
 * @desc    Update student profile
 * @route   PUT /api/student/profile
 * @access  Private (Student Only)
 */
const updateProfile = async (req, res) => {
  try {
    // Prevent overriding userId and batch identifiers
    if (req.body.userId) {
      delete req.body.userId;
    }
    if (req.body.batchId) {
      delete req.body.batchId;
    }
    if (req.body.batch) {
      delete req.body.batch;
    }
    if (req.body.inviteCode) {
      delete req.body.inviteCode;
    }

    // Find and update profile, running validators and returning the new document
    const profile = await StudentProfile.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('userId', 'fullName email role').populate('batchId');

    if (!profile) {
      return sendError(res, 404, 'Student profile not found');
    }

    sendResponse(res, 200, 'Student profile updated successfully', profile);
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return sendError(res, 400, messages.join(', '));
    }
    // Handle duplicate key error (universityRollNo)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'universityRollNo') {
        return sendError(res, 400, 'University Roll Number is already registered');
      }
    }
    console.error('Update Profile Error:', error);
    return sendError(res, 500, 'Server error during profile update');
  }
};

/**
 * @desc    Delete student profile
 * @route   DELETE /api/student/profile
 * @access  Private (Student Only)
 */
const deleteProfile = async (req, res) => {
  try {
    // Find and remove profile
    const profile = await StudentProfile.findOneAndDelete({ userId: req.user._id });

    if (!profile) {
      return sendError(res, 404, 'Student profile not found');
    }

    sendResponse(res, 200, 'Student profile deleted successfully', null);
  } catch (error) {
    console.error('Delete Profile Error:', error);
    return sendError(res, 500, 'Server error during profile deletion');
  }
};

/**
 * @desc    Upload resume PDF
 * @route   POST /api/student/profile/upload-resume
 * @access  Private (Student Only)
 */
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'Please upload a PDF file');
    }

    const resumeUrl = `/uploads/resumes/${req.file.filename}`;

    // If student profile already exists, update the resumeUrl in DB
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (profile) {
      profile.resumeUrl = resumeUrl;
      await profile.save();
    }

    sendResponse(res, 200, 'Resume uploaded successfully', { resumeUrl });
  } catch (error) {
    console.error('Upload Resume Error:', error);
    return sendError(res, 500, 'Server error during resume upload');
  }
};

module.exports = {
  createProfile,
  getProfile,
  updateProfile,
  deleteProfile,
  uploadResume,
};
