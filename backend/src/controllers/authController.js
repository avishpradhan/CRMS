const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendResponse, sendError } = require('../utils/response');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { fullName, email, password, role, inviteCode } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !role) {
      return sendError(res, 400, 'Please provide all required fields: fullName, email, password, role');
    }

    // Block admin registration from public endpoint
    if (role === 'admin') {
      return sendError(res, 403, 'Admin registration is not allowed');
    }

    // Validate role
    if (!['student', 'recruiter'].includes(role)) {
      return sendError(res, 400, 'Role must be either student or recruiter');
    }

    // Validate invite code if student
    if (role === 'student') {
      if (!inviteCode) {
        return sendError(res, 400, 'Invitation code is required for student registration');
      }
      const Batch = require('../models/Batch');
      const batch = await Batch.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
      if (!batch) {
        return sendError(res, 400, 'Invalid invitation code');
      }
      if (!batch.isActive) {
        return sendError(res, 400, 'The batch associated with this invitation code is currently deactivated');
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, 'Email already registered');
    }

    // Create user (password hashed in pre-save hook)
    const user = await User.create({
      fullName,
      email,
      password,
      role,
      inviteCode: role === 'student' ? inviteCode.trim().toUpperCase() : '',
    });

    // Generate JWT
    const token = generateToken(user._id, user.role);

    sendResponse(res, 201, 'Registration successful', {
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        hasProfile: false,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return sendError(res, 400, messages.join(', '));
    }
    // Handle duplicate key error (race condition on unique email)
    if (error.code === 11000) {
      return sendError(res, 409, 'Email already registered');
    }
    console.error('Register Error:', error);
    return sendError(res, 500, 'Server error during registration');
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return sendError(res, 400, 'Please provide email and password');
    }

    // Find user and explicitly select password (excluded by default)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, 401, 'Invalid email or password');
    }

    // Check if account is active
    if (!user.isActive) {
      return sendError(res, 401, 'Account has been deactivated');
    }

    // Compare passwords
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password');
    }

    // Generate JWT
    const token = generateToken(user._id, user.role);

    let hasProfile = true;
    if (user.role === 'student') {
      const StudentProfile = require('../models/StudentProfile');
      const profile = await StudentProfile.findOne({ userId: user._id });
      hasProfile = !!profile;
    } else if (user.role === 'recruiter') {
      const RecruiterProfile = require('../models/RecruiterProfile');
      const profile = await RecruiterProfile.findOne({ userId: user._id });
      hasProfile = !!profile;
    }

    sendResponse(res, 200, 'Login successful', {
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        inviteCode: user.inviteCode || '',
        hasProfile,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return sendError(res, 500, 'Server error during login');
  }
};

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private (requires protect middleware)
 */
const getMe = async (req, res) => {
  try {
    let hasProfile = true;
    if (req.user.role === 'student') {
      const StudentProfile = require('../models/StudentProfile');
      const profile = await StudentProfile.findOne({ userId: req.user._id });
      hasProfile = !!profile;
    } else if (req.user.role === 'recruiter') {
      const RecruiterProfile = require('../models/RecruiterProfile');
      const profile = await RecruiterProfile.findOne({ userId: req.user._id });
      hasProfile = !!profile;
    }

    // req.user is set by protect middleware
    sendResponse(res, 200, 'User retrieved successfully', {
      user: {
        _id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        isActive: req.user.isActive,
        inviteCode: req.user.inviteCode || '',
        hasProfile,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    });
  } catch (error) {
    console.error('GetMe Error:', error);
    return sendError(res, 500, 'Server error');
  }
};

module.exports = { register, login, getMe };
