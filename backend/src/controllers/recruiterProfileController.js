const RecruiterProfile = require('../models/RecruiterProfile');
const User = require('../models/User');
const { sendResponse, sendError } = require('../utils/response');

// ─────────────────────────────────────────────────────────────
//  RECRUITER SELF-SERVICE APIs
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Create recruiter company profile
 * @route   POST /api/recruiter/profile
 * @access  Private (Recruiter Only)
 */
const createProfile = async (req, res) => {
  try {
    // Double-check role (route-level guard already covers this)
    if (req.user.role !== 'recruiter') {
      return sendError(res, 403, 'Only recruiters can create company profiles');
    }

    // Prevent duplicate profiles
    const existingProfile = await RecruiterProfile.findOne({ userId: req.user._id });
    if (existingProfile) {
      return sendError(res, 400, 'Recruiter profile already exists for this user');
    }

    // Build profile data — always override userId from token
    const profileData = {
      ...req.body,
      userId: req.user._id,
      verificationStatus: 'Pending', // always default on create
    };

    const profile = await RecruiterProfile.create(profileData);

    // Notify all admins
    try {
      const admins = await User.find({ role: 'admin' });
      const Notification = require('../models/Notification');
      const notifications = admins.map(admin => ({
        userId: admin._id,
        title: 'New Recruiter Profile Submitted',
        message: `Recruiter "${profile.companyName}" has submitted their profile for verification.`,
        type: 'info',
        forRole: 'admin',
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.warn('Could not create notification for admins:', notifErr.message);
    }

    sendResponse(res, 201, 'Recruiter profile created successfully', profile);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return sendError(res, 400, messages.join(', '));
    }
    if (error.code === 11000) {
      return sendError(res, 400, 'Recruiter profile already exists for this user');
    }
    console.error('Create Recruiter Profile Error:', error);
    return sendError(res, 500, 'Server error during profile creation');
  }
};

/**
 * @desc    Get own recruiter profile
 * @route   GET /api/recruiter/profile
 * @access  Private (Recruiter Only)
 */
const getProfile = async (req, res) => {
  try {
    const profile = await RecruiterProfile.findOne({ userId: req.user._id }).populate(
      'userId',
      'fullName email role'
    );

    if (!profile) {
      return sendError(res, 404, 'Recruiter profile not found');
    }

    sendResponse(res, 200, 'Recruiter profile retrieved successfully', profile);
  } catch (error) {
    console.error('Get Recruiter Profile Error:', error);
    return sendError(res, 500, 'Server error during profile retrieval');
  }
};

/**
 * @desc    Update own recruiter profile
 * @route   PUT /api/recruiter/profile
 * @access  Private (Recruiter Only)
 */
const updateProfile = async (req, res) => {
  try {
    // Prevent overriding protected fields
    delete req.body.userId;
    delete req.body.verificationStatus; // only admin can change this

    const profile = await RecruiterProfile.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('userId', 'fullName email role');

    if (!profile) {
      return sendError(res, 404, 'Recruiter profile not found');
    }

    sendResponse(res, 200, 'Recruiter profile updated successfully', profile);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return sendError(res, 400, messages.join(', '));
    }
    console.error('Update Recruiter Profile Error:', error);
    return sendError(res, 500, 'Server error during profile update');
  }
};

/**
 * @desc    Delete own recruiter profile
 * @route   DELETE /api/recruiter/profile
 * @access  Private (Recruiter Only)
 */
const deleteProfile = async (req, res) => {
  try {
    const profile = await RecruiterProfile.findOneAndDelete({ userId: req.user._id });

    if (!profile) {
      return sendError(res, 404, 'Recruiter profile not found');
    }

    sendResponse(res, 200, 'Recruiter profile deleted successfully', null);
  } catch (error) {
    console.error('Delete Recruiter Profile Error:', error);
    return sendError(res, 500, 'Server error during profile deletion');
  }
};

// ─────────────────────────────────────────────────────────────
//  ADMIN MANAGEMENT APIs
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Get all recruiter profiles (with user info, merged in-memory)
 * @route   GET /api/admin/recruiters
 * @access  Private (Admin Only)
 */
const getAllRecruiters = async (req, res) => {
  try {
    const users = await User.find({ role: 'recruiter' }).select('-password').sort({ createdAt: -1 });
    const profiles = await RecruiterProfile.find();

    const profileMap = {};
    profiles.forEach(p => {
      profileMap[p.userId.toString()] = p;
    });

    const recruiters = users.map(user => {
      const profile = profileMap[user._id.toString()];
      return {
        _id: profile ? profile._id : null,
        userId: user,
        companyName: profile ? profile.companyName : `${user.fullName} (Pending Profile)`,
        companyWebsite: profile ? profile.companyWebsite : '',
        companyEmail: profile ? profile.companyEmail : user.email,
        industry: profile ? profile.industry : 'N/A',
        companySize: profile ? profile.companySize : '',
        companyDescription: profile ? profile.companyDescription : '',
        headquarters: profile ? profile.headquarters : '',
        contactPerson: profile ? profile.contactPerson : user.fullName,
        contactPhone: profile ? profile.contactPhone : '',
        logoUrl: profile ? profile.logoUrl : '',
        verificationStatus: profile ? profile.verificationStatus : 'Pending',
        createdAt: profile ? profile.createdAt : user.createdAt,
      };
    });

    sendResponse(res, 200, 'All recruiters retrieved successfully', recruiters);
  } catch (error) {
    console.error('Get All Recruiters Error:', error);
    return sendError(res, 500, 'Server error during recruiter retrieval');
  }
};

/**
 * Helper to find or create a recruiter profile by profile ID or user ID
 */
const findOrCreateProfile = async (idOrUserId) => {
  let profile = await RecruiterProfile.findById(idOrUserId);
  if (!profile) {
    profile = await RecruiterProfile.findOne({ userId: idOrUserId });
  }
  if (!profile) {
    const user = await User.findById(idOrUserId);
    if (user && user.role === 'recruiter') {
      profile = new RecruiterProfile({
        userId: user._id,
        companyName: `${user.fullName} (Pending Profile)`,
        companyWebsite: 'https://example.com',
        companyEmail: user.email,
        industry: 'Technology',
        companySize: '1-10',
        companyDescription: 'Initial skeleton profile created by admin',
        headquarters: 'N/A',
        contactPerson: user.fullName,
        contactPhone: '+10000000000',
        verificationStatus: 'Pending',
      });
      await profile.save();
    }
  }
  return profile;
};

/**
 * @desc    Approve a recruiter profile
 * @route   PATCH /api/admin/recruiters/:id/approve
 * @access  Private (Admin Only)
 */
const approveRecruiter = async (req, res) => {
  try {
    const profile = await findOrCreateProfile(req.params.id);
    if (!profile) {
      return sendError(res, 404, 'Recruiter profile or user not found');
    }

    profile.verificationStatus = 'Approved';
    await profile.save();

    if (profile.userId) {
      await User.findByIdAndUpdate(profile.userId, { isActive: true });
    }

    // Notify recruiter
    try {
      if (profile.userId) {
        const Notification = require('../models/Notification');
        await Notification.create({
          userId: profile.userId,
          title: 'Profile Approved',
          message: `Your recruiter profile for "${profile.companyName}" has been approved. You can now post campus drives.`,
          type: 'success',
          forRole: 'recruiter',
        });
      }
    } catch (notifErr) {
      console.warn('Could not create notification for recruiter:', notifErr.message);
    }

    await profile.populate('userId', 'fullName email role isActive');

    sendResponse(res, 200, 'Recruiter profile approved successfully', profile);
  } catch (error) {
    console.error('Approve Recruiter Error:', error);
    return sendError(res, 500, 'Server error during recruiter approval');
  }
};

/**
 * @desc    Reject a recruiter profile
 * @route   PATCH /api/admin/recruiters/:id/reject
 * @access  Private (Admin Only)
 */
const rejectRecruiter = async (req, res) => {
  try {
    const profile = await findOrCreateProfile(req.params.id);
    if (!profile) {
      return sendError(res, 404, 'Recruiter profile or user not found');
    }

    profile.verificationStatus = 'Rejected';
    await profile.save();

    if (profile.userId) {
      await User.findByIdAndUpdate(profile.userId, { isActive: false });
    }

    // Notify recruiter
    try {
      if (profile.userId) {
        const Notification = require('../models/Notification');
        await Notification.create({
          userId: profile.userId,
          title: 'Profile Rejected',
          message: `Your recruiter profile for "${profile.companyName}" has been rejected. Please update your details or contact the administrator.`,
          type: 'danger',
          forRole: 'recruiter',
        });
      }
    } catch (notifErr) {
      console.warn('Could not create notification for recruiter:', notifErr.message);
    }

    await profile.populate('userId', 'fullName email role isActive');

    sendResponse(res, 200, 'Recruiter profile rejected successfully', profile);
  } catch (error) {
    console.error('Reject Recruiter Error:', error);
    return sendError(res, 500, 'Server error during recruiter rejection');
  }
};

/**
 * @desc    Suspend a recruiter
 * @route   PATCH /api/admin/recruiters/:id/suspend
 * @access  Private (Admin Only)
 */
const suspendRecruiter = async (req, res) => {
  try {
    const profile = await findOrCreateProfile(req.params.id);
    if (!profile) {
      return sendError(res, 404, 'Recruiter profile or user not found');
    }

    profile.verificationStatus = 'Suspended';
    await profile.save();

    if (profile.userId) {
      await User.findByIdAndUpdate(profile.userId, { isActive: false });
    }

    // Notify recruiter
    try {
      if (profile.userId) {
        const Notification = require('../models/Notification');
        await Notification.create({
          userId: profile.userId,
          title: 'Profile Suspended',
          message: `Your recruiter profile/account for "${profile.companyName}" has been suspended. Please contact the administrator.`,
          type: 'danger',
          forRole: 'recruiter',
        });
      }
    } catch (notifErr) {
      console.warn('Could not create notification for recruiter:', notifErr.message);
    }

    await profile.populate('userId', 'fullName email role isActive');

    sendResponse(res, 200, 'Recruiter suspended successfully', profile);
  } catch (error) {
    console.error('Suspend Recruiter Error:', error);
    return sendError(res, 500, 'Server error during recruiter suspension');
  }
};

/**
 * @desc    Reactivate a recruiter
 * @route   PATCH /api/admin/recruiters/:id/reactivate
 * @access  Private (Admin Only)
 */
const reactivateRecruiter = async (req, res) => {
  try {
    const profile = await findOrCreateProfile(req.params.id);
    if (!profile) {
      return sendError(res, 404, 'Recruiter profile or user not found');
    }

    profile.verificationStatus = 'Approved';
    await profile.save();

    if (profile.userId) {
      await User.findByIdAndUpdate(profile.userId, { isActive: true });
    }

    // Notify recruiter
    try {
      if (profile.userId) {
        const Notification = require('../models/Notification');
        await Notification.create({
          userId: profile.userId,
          title: 'Profile Approved',
          message: `Your recruiter profile for "${profile.companyName}" has been reactivated. You can now post campus drives.`,
          type: 'success',
          forRole: 'recruiter',
        });
      }
    } catch (notifErr) {
      console.warn('Could not create notification for recruiter:', notifErr.message);
    }

    await profile.populate('userId', 'fullName email role isActive');

    sendResponse(res, 200, 'Recruiter reactivated successfully', profile);
  } catch (error) {
    console.error('Reactivate Recruiter Error:', error);
    return sendError(res, 500, 'Server error during recruiter reactivation');
  }
};

module.exports = {
  createProfile,
  getProfile,
  updateProfile,
  deleteProfile,
  getAllRecruiters,
  approveRecruiter,
  rejectRecruiter,
  suspendRecruiter,
  reactivateRecruiter,
};
