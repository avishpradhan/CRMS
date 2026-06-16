const CampusDrive = require('../models/CampusDrive');
const RecruiterProfile = require('../models/RecruiterProfile');
const { sendResponse, sendError } = require('../utils/response');
const { enrichDrivesWithStatus } = require('../utils/driveStatusHelper');

// ─────────────────────────────────────────────────────────────
//  RECRUITER DRIVE APIS
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Create a new campus drive
 * @route   POST /api/drives
 * @access  Private (Recruiter Only)
 */
const createDrive = async (req, res) => {
  try {
    // Get recruiter profile
    const recruiterProfile = await RecruiterProfile.findOne({ userId: req.user._id });
    if (!recruiterProfile) {
      return sendError(res, 400, 'Please create your company profile before posting drives');
    }

    const driveData = {
      ...req.body,
      recruiterProfileId: recruiterProfile._id,
      companyName: recruiterProfile.companyName,
    };

    const drive = await CampusDrive.create(driveData);

    // Automatically create default Stage 0 Resume Screening stage
    const RecruitmentStage = require('../models/RecruitmentStage');
    await RecruitmentStage.create({
      driveId: drive._id,
      stageOrder: 0,
      stageName: 'Resume Screening',
      stageType: 'Resume Screening',
      description: 'Initial screening of resumes to determine eligibility for recruitment rounds.',
      isSystemStage: true,
      isFinalStage: false,
    });

    // Notify all admins about the new campus drive
    try {
      const User = require('../models/User');
      const admins = await User.find({ role: 'admin' });
      const Notification = require('../models/Notification');
      const notifications = admins.map(admin => ({
        userId: admin._id,
        title: 'New Campus Drive Created',
        message: `Recruiter "${recruiterProfile.companyName}" has created a new drive for the "${drive.role}" position.`,
        type: 'info',
        forRole: 'admin',
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.warn('Could not create notification for admins:', notifErr.message);
    }

    const enriched = await enrichDrivesWithStatus(drive);
    sendResponse(res, 201, 'Campus drive created successfully', enriched);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return sendError(res, 400, messages.join(', '));
    }
    console.error('Create Drive Error:', error);
    return sendError(res, 500, 'Server error during drive creation');
  }
};

/**
 * @desc    Get all drives for the logged-in recruiter
 * @route   GET /api/drives/my
 * @access  Private (Recruiter Only)
 */
const getMyDrives = async (req, res) => {
  try {
    const recruiterProfile = await RecruiterProfile.findOne({ userId: req.user._id });
    if (!recruiterProfile) {
      return sendError(res, 404, 'Recruiter profile not found');
    }

    const drives = await CampusDrive.find({ recruiterProfileId: recruiterProfile._id })
      .sort({ createdAt: -1 });

    const enriched = await enrichDrivesWithStatus(drives);
    sendResponse(res, 200, 'Drives retrieved successfully', enriched);
  } catch (error) {
    console.error('Get My Drives Error:', error);
    return sendError(res, 500, 'Server error during drive retrieval');
  }
};

/**
 * @desc    Get a single drive by ID
 * @route   GET /api/drives/:id
 * @access  Private (Recruiter or Admin)
 */
const getDriveById = async (req, res) => {
  try {
    const drive = await CampusDrive.findById(req.params.id)
      .populate('recruiterProfileId', 'companyName companyEmail contactPerson');

    if (!drive) {
      return sendError(res, 404, 'Drive not found');
    }

    const enriched = await enrichDrivesWithStatus(drive);
    sendResponse(res, 200, 'Drive retrieved successfully', enriched);
  } catch (error) {
    console.error('Get Drive Error:', error);
    return sendError(res, 500, 'Server error during drive retrieval');
  }
};

/**
 * @desc    Update drive (recruiter owns, or admin)
 * @route   PUT /api/drives/:id
 * @access  Private (Recruiter or Admin)
 */
const updateDrive = async (req, res) => {
  try {
    const query = { _id: req.params.id };

    if (req.user.role === 'recruiter') {
      const recruiterProfile = await RecruiterProfile.findOne({ userId: req.user._id });
      if (!recruiterProfile) {
        return sendError(res, 404, 'Recruiter profile not found');
      }
      query.recruiterProfileId = recruiterProfile._id;
    }

    // Prevent overriding protected fields
    delete req.body.recruiterProfileId;
    delete req.body.companyName;

    const drive = await CampusDrive.findOneAndUpdate(
      query,
      req.body,
      { new: true, runValidators: true }
    );

    if (!drive) {
      return sendError(res, 404, 'Drive not found or unauthorized');
    }

    // Notify all students who have applied to this drive
    try {
      const Application = require('../models/Application');
      const applications = await Application.find({ driveId: drive._id }).populate({
        path: 'studentProfileId',
        populate: { path: 'userId' },
      });

      const notifications = [];
      for (const app of applications) {
        if (app.studentProfileId && app.studentProfileId.userId) {
          notifications.push({
            userId: app.studentProfileId.userId._id || app.studentProfileId.userId,
            title: 'Campus Drive Updated',
            message: `The details for the campus drive "${drive.role}" at "${drive.companyName}" have been updated.`,
            type: 'info',
            forRole: 'student',
          });
        }
      }

      if (notifications.length > 0) {
        const Notification = require('../models/Notification');
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.warn('Could not notify students of drive update:', notifErr.message);
    }

    const enriched = await enrichDrivesWithStatus(drive);
    sendResponse(res, 200, 'Drive updated successfully', enriched);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return sendError(res, 400, messages.join(', '));
    }
    console.error('Update Drive Error:', error);
    return sendError(res, 500, 'Server error during drive update');
  }
};

const deleteDrive = async (req, res) => {
  try {
    const query = { _id: req.params.id };

    if (req.user.role === 'recruiter') {
      const recruiterProfile = await RecruiterProfile.findOne({ userId: req.user._id });
      if (!recruiterProfile) {
        return sendError(res, 404, 'Recruiter profile not found');
      }
      query.recruiterProfileId = recruiterProfile._id;
    }

    const drive = await CampusDrive.findOneAndDelete(query);

    if (!drive) {
      return sendError(res, 404, 'Drive not found or unauthorized');
    }

    // Cascade delete associated stages and applications
    const RecruitmentStage = require('../models/RecruitmentStage');
    const Application = require('../models/Application');

    try {
      // Notify applied students before deleting application records
      try {
        const applications = await Application.find({ driveId: drive._id }).populate({
          path: 'studentProfileId',
          populate: { path: 'userId' },
        });

        const notifications = [];
        for (const app of applications) {
          if (app.studentProfileId && app.studentProfileId.userId) {
            notifications.push({
              userId: app.studentProfileId.userId._id || app.studentProfileId.userId,
              title: 'Campus Drive Cancelled',
              message: `The campus drive for "${drive.role}" at "${drive.companyName}" has been cancelled.`,
              type: 'danger',
              forRole: 'student',
            });
          }
        }

        if (notifications.length > 0) {
          const Notification = require('../models/Notification');
          await Notification.insertMany(notifications);
        }
      } catch (notifErr) {
        console.warn('Could not notify students of drive cancellation:', notifErr.message);
      }

      await RecruitmentStage.deleteMany({ driveId: drive._id });
      await Application.deleteMany({ driveId: drive._id });
    } catch (cascadeError) {
      console.error('Error during cascade delete:', cascadeError);
      // We still return 200 since the drive itself is successfully deleted
    }

    sendResponse(res, 200, 'Drive deleted successfully', null);
  } catch (error) {
    console.error('Delete Drive Error:', error);
    return sendError(res, 500, 'Server error during drive deletion');
  }
};

// ─────────────────────────────────────────────────────────────
//  ADMIN DRIVE APIS
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Get all drives (admin overview)
 * @route   GET /api/drives
 * @access  Private (Admin Only)
 */
const getAllDrives = async (req, res) => {
  try {
    const drives = await CampusDrive.find()
      .populate('recruiterProfileId', 'companyName companyEmail contactPerson')
      .sort({ createdAt: -1 });

    const enriched = await enrichDrivesWithStatus(drives);
    sendResponse(res, 200, 'All drives retrieved successfully', enriched);
  } catch (error) {
    console.error('Get All Drives Error:', error);
    return sendError(res, 500, 'Server error during drive retrieval');
  }
};

/**
 * @desc    Upload drive attachment
 * @route   POST /api/drives/upload-attachment
 * @access  Private (Recruiter Only)
 */
const uploadDriveAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'Please upload a file');
    }

    sendResponse(res, 200, 'Attachment uploaded successfully', {
      filename: req.file.originalname,
      fileUrl: `/uploads/drives/${req.file.filename}`,
      fileType: req.file.mimetype,
    });
  } catch (error) {
    console.error('Upload Drive Attachment Error:', error);
    return sendError(res, 500, 'Server error during attachment upload');
  }
};

module.exports = {
  createDrive,
  getMyDrives,
  getDriveById,
  updateDrive,
  deleteDrive,
  getAllDrives,
  uploadDriveAttachment,
};
