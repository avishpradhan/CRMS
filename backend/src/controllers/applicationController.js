const Application = require('../models/Application');
const StudentProfile = require('../models/StudentProfile');
const RecruiterProfile = require('../models/RecruiterProfile');
const RecruitmentStage = require('../models/RecruitmentStage');
const CampusDrive = require('../models/CampusDrive');
const Notification = require('../models/Notification');
const { checkEligibility } = require('../services/eligibilityService');
const { initializeApplication } = require('../services/candidateProgressionService');
const { sendResponse, sendError } = require('../utils/response');
const { enrichDrivesWithStatus } = require('../utils/driveStatusHelper');

/**
 * @desc    Apply to a campus drive
 * @route   POST /api/applications/apply/:driveId
 * @route   POST /api/applications (Legacy)
 * @access  Private (Student Only)
 */
const applyToDrive = async (req, res) => {
  try {
    const driveId = req.params.driveId || req.body.driveId;
    if (!driveId) {
      return sendError(res, 400, 'Please provide a driveId');
    }

    // 1. Fetch student profile
    const studentProfile = await StudentProfile.findOne({ userId: req.user._id });
    if (!studentProfile) {
      return sendError(res, 404, 'Please complete your student profile before applying');
    }

    // 2. Fetch drive
    const drive = await CampusDrive.findById(driveId);
    if (!drive) {
      return sendError(res, 404, 'Campus drive not found');
    }

    // Business Rule: Drive status must be Open
    const enrichedDrive = await enrichDrivesWithStatus(drive);
    if (enrichedDrive.status !== 'Open') {
      return sendError(res, 400, `This drive is currently in '${enrichedDrive.status}' status and is not accepting applications.`);
    }

    // 3. Check for existing application (Student cannot apply twice)
    const existing = await Application.findOne({
      studentProfileId: studentProfile._id,
      driveId,
    });
    if (existing) {
      return sendError(res, 400, 'You have already applied to this drive');
    }

    // 4. Run eligibility check (Only eligible students can apply)
    const { eligible, reasons } = checkEligibility(studentProfile, drive);
    if (!eligible) {
      return sendError(res, 400, `You do not satisfy the eligibility criteria: ${reasons.join(', ')}`);
    }

    // 5. Create application and initialize recruitment stage
    const application = new Application({
      studentProfileId: studentProfile._id,
      driveId,
      applicationStatus: 'Applied',
    });

    await initializeApplication(application);
    await application.save();

    // 6. Create notification for recruiter (if recruiter profile has user ID)
    try {
      const driveOwner = await RecruiterProfile.findById(drive.recruiterProfileId);
      if (driveOwner && driveOwner.userId) {
        await Notification.create({
          userId: driveOwner.userId,
          title: `New Application Received`,
          message: `${req.user.fullName} applied for ${drive.role} position.`,
          type: 'info',
          forRole: 'recruiter',
        });
      }
    } catch (notifErr) {
      console.warn('Could not create notification for recruiter:', notifErr.message);
    }

    sendResponse(res, 201, 'Application submitted successfully', application);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 400, 'You have already applied to this drive');
    }
    if (error.message === 'Drive pipeline configuration is invalid. Resume Screening stage missing.') {
      return sendError(res, 400, error.message);
    }
    console.error('Apply to Drive Error:', error);
    return sendError(res, 500, 'Server error during application submission');
  }
};

/**
 * @desc    Get student's own applications
 * @route   GET /api/applications/my-applications
 * @route   GET /api/applications/my (Legacy)
 * @access  Private (Student Only)
 */
const getMyApplications = async (req, res) => {
  try {
    const studentProfile = await StudentProfile.findOne({ userId: req.user._id });
    if (!studentProfile) {
      return sendResponse(res, 200, 'No student profile found', { applications: [] });
    }

    const applications = await Application.find({ studentProfileId: studentProfile._id })
      .populate({
        path: 'driveId',
        select: 'role companyName packageOffered location deadline status description skillsRequired allowedBranches minimumCGPA maxBacklogs',
      })
      .populate('currentStageId')
      .sort({ createdAt: -1 });

    // Populate stages list for each application's drive
    const applicationsWithStages = await Promise.all(
      applications.map(async (app) => {
        const appObj = app.toObject();
        if (app.driveId) {
          const stages = await RecruitmentStage.find({ driveId: app.driveId._id }).sort({ stageOrder: 1 });
          appObj.stages = stages;
        } else {
          appObj.stages = [];
        }
        return appObj;
      })
    );

    sendResponse(res, 200, 'Applications retrieved successfully', {
      total: applications.length,
      applications: applicationsWithStages,
    });
  } catch (error) {
    console.error('Get My Applications Error:', error);
    return sendError(res, 500, 'Server error during applications retrieval');
  }
};

/**
 * @desc    Get specific student application by ID
 * @route   GET /api/applications/:applicationId
 * @access  Private (Student Only)
 */
const getApplicationById = async (req, res) => {
  try {
    const studentProfile = await StudentProfile.findOne({ userId: req.user._id });
    if (!studentProfile) {
      return sendError(res, 404, 'Student profile not found');
    }

    const application = await Application.findById(req.params.applicationId)
      .populate({
        path: 'driveId',
        select: 'role companyName packageOffered location deadline status description skillsRequired allowedBranches minimumCGPA maxBacklogs',
      })
      .populate('currentStageId');

    if (!application) {
      return sendError(res, 404, 'Application not found');
    }

    // Verify application belongs to this student
    if (application.studentProfileId.toString() !== studentProfile._id.toString()) {
      return sendError(res, 403, 'Unauthorized to view this application');
    }

    sendResponse(res, 200, 'Application details retrieved successfully', application);
  } catch (error) {
    console.error('Get Application By ID Error:', error);
    return sendError(res, 500, 'Server error during application retrieval');
  }
};

/**
 * @desc    Get all applications for recruiter's posted drives (Legacy)
 * @route   GET /api/applications/recruiter
 * @access  Private (Recruiter Only)
 */
const getRecruiterApplications = async (req, res) => {
  try {
    const recruiterProfile = await RecruiterProfile.findOne({ userId: req.user._id });
    if (!recruiterProfile) {
      return sendError(res, 404, 'Recruiter profile not found');
    }

    // 1. Fetch drives owned by this recruiter
    const drives = await CampusDrive.find({ recruiterProfileId: recruiterProfile._id });
    const driveIds = drives.map(d => d._id);

    // 2. Fetch applications for these drives
    const applications = await Application.find({ driveId: { $in: driveIds } })
      .populate({
        path: 'driveId',
        select: 'role companyName packageOffered',
      })
      .populate('currentStageId')
      .populate({
        path: 'studentProfileId',
        populate: {
          path: 'userId',
          select: 'fullName email isActive',
        },
      })
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'Recruiter applications retrieved successfully', applications);
  } catch (error) {
    console.error('Get Recruiter Applications Error:', error);
    return sendError(res, 500, 'Server error during recruiter applications retrieval');
  }
};

/**
 * @desc    Get all applications for a specific drive posted by the recruiter
 * @route   GET /api/recruiter/drives/:driveId/applications
 * @access  Private (Recruiter Only)
 */
const getRecruiterDriveApplications = async (req, res) => {
  try {
    const recruiterProfile = await RecruiterProfile.findOne({ userId: req.user._id });
    if (!recruiterProfile) {
      return sendError(res, 404, 'Recruiter profile not found');
    }

    const drive = await CampusDrive.findById(req.params.driveId);
    if (!drive) {
      return sendError(res, 404, 'Campus drive not found');
    }

    // Validate that the drive belongs to this recruiter
    if (drive.recruiterProfileId.toString() !== recruiterProfile._id.toString()) {
      return sendError(res, 403, 'Unauthorized to view applications for this drive');
    }

    const applications = await Application.find({ driveId: req.params.driveId })
      .populate('currentStageId')
      .populate({
        path: 'studentProfileId',
        populate: {
          path: 'userId',
          select: 'fullName email isActive',
        },
      })
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'Applications for drive retrieved successfully', applications);
  } catch (error) {
    console.error('Get Recruiter Drive Applications Error:', error);
    return sendError(res, 500, 'Server error during drive applications retrieval');
  }
};

/**
 * @desc    Shortlist an application
 * @route   PATCH /api/applications/:id/shortlist
 * @access  Private (Recruiter Only)
 */
const shortlistApplication = async (req, res) => {
  try {
    const recruiterProfile = await RecruiterProfile.findOne({ userId: req.user._id });
    if (!recruiterProfile) {
      return sendError(res, 404, 'Recruiter profile not found');
    }

    const application = await Application.findById(req.params.id).populate('driveId');
    if (!application) {
      return sendError(res, 404, 'Application not found');
    }

    // Validate ownership
    if (application.driveId.recruiterProfileId.toString() !== recruiterProfile._id.toString()) {
      return sendError(res, 403, 'Unauthorized to update this application status');
    }

    application.applicationStatus = 'Shortlisted';
    await application.save();

    // Create notification alert for student
    try {
      if (application.studentProfileId) {
        const studentProfile = await StudentProfile.findById(application.studentProfileId);
        if (studentProfile && studentProfile.userId) {
          await Notification.create({
            userId: studentProfile.userId,
            title: `Application Update: Shortlisted`,
            message: `Your application for ${application.driveId.role} at ${application.driveId.companyName} has been shortlisted.`,
            type: 'success',
            forRole: 'student',
          });
        }
      }
    } catch (notifErr) {
      console.warn('Could not create notification for student:', notifErr.message);
    }

    sendResponse(res, 200, 'Application shortlisted successfully', application);
  } catch (error) {
    console.error('Shortlist Application Error:', error);
    return sendError(res, 500, 'Server error during application status update');
  }
};

/**
 * @desc    Reject an application
 * @route   PATCH /api/applications/:id/reject
 * @access  Private (Recruiter Only)
 */
const rejectApplication = async (req, res) => {
  try {
    const recruiterProfile = await RecruiterProfile.findOne({ userId: req.user._id });
    if (!recruiterProfile) {
      return sendError(res, 404, 'Recruiter profile not found');
    }

    const application = await Application.findById(req.params.id).populate('driveId');
    if (!application) {
      return sendError(res, 404, 'Application not found');
    }

    // Validate ownership
    if (application.driveId.recruiterProfileId.toString() !== recruiterProfile._id.toString()) {
      return sendError(res, 403, 'Unauthorized to update this application status');
    }

    application.applicationStatus = 'Rejected';
    await application.save();

    // Create notification alert for student
    try {
      if (application.studentProfileId) {
        const studentProfile = await StudentProfile.findById(application.studentProfileId);
        if (studentProfile && studentProfile.userId) {
          await Notification.create({
            userId: studentProfile.userId,
            title: `Application Update: Rejected`,
            message: `Your application for ${application.driveId.role} at ${application.driveId.companyName} has been marked as Rejected.`,
            type: 'danger',
            forRole: 'student',
          });
        }
      }
    } catch (notifErr) {
      console.warn('Could not create notification for student:', notifErr.message);
    }

    sendResponse(res, 200, 'Application rejected successfully', application);
  } catch (error) {
    console.error('Reject Application Error:', error);
    return sendError(res, 500, 'Server error during application status update');
  }
};

/**
 * @desc    Update application status (Legacy Generic Handler)
 * @route   PATCH /api/applications/:id/status
 * @access  Private (Recruiter Only)
 */
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return sendError(res, 400, 'Please provide status');
    }

    const validStatuses = ['Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 400, 'Invalid status update value');
    }

    const recruiterProfile = await RecruiterProfile.findOne({ userId: req.user._id });
    if (!recruiterProfile) {
      return sendError(res, 404, 'Recruiter profile not found');
    }

    const application = await Application.findById(req.params.id).populate('driveId');
    if (!application) {
      return sendError(res, 404, 'Application not found');
    }

    if (application.driveId.recruiterProfileId.toString() !== recruiterProfile._id.toString()) {
      return sendError(res, 403, 'Unauthorized to update this application status');
    }

    application.applicationStatus = status;
    await application.save();

    // Create notification alert for student
    try {
      if (application.studentProfileId) {
        const studentProfile = await StudentProfile.findById(application.studentProfileId);
        if (studentProfile && studentProfile.userId) {
          const typeMap = {
            'Shortlisted': 'success',
            'Interview Scheduled': 'warning',
            'Selected': 'success',
            'Rejected': 'danger',
            'Applied': 'info',
          };

          await Notification.create({
            userId: studentProfile.userId,
            title: `Application Update: ${status}`,
            message: `Your application for ${application.driveId.role} at ${application.driveId.companyName} has been marked as: ${status}.`,
            type: typeMap[status] || 'info',
            forRole: 'student',
          });
        }
      }
    } catch (notifErr) {
      console.warn('Could not create notification for student:', notifErr.message);
    }

    sendResponse(res, 200, 'Application status updated successfully', application);
  } catch (error) {
    console.error('Update Application Status Error:', error);
    return sendError(res, 500, 'Server error during application status update');
  }
};

/**
 * @desc    Get all applications (Admin Only)
 * @route   GET /api/admin/applications
 * @access  Private (Admin Only)
 */
const getAdminApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate({
        path: 'driveId',
        select: 'role companyName packageOffered location deadline status',
      })
      .populate('currentStageId')
      .populate({
        path: 'studentProfileId',
        populate: {
          path: 'userId',
          select: 'fullName email isActive',
        },
      })
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'All applications retrieved successfully', applications);
  } catch (error) {
    console.error('Get Admin Applications Error:', error);
    return sendError(res, 500, 'Server error during admin applications retrieval');
  }
};

/**
 * @desc    Get all applications for a specific drive (Admin Only)
 * @route   GET /api/admin/drives/:driveId/applications
 * @access  Private (Admin Only)
 */
const getAdminDriveApplications = async (req, res) => {
  try {
    const drive = await CampusDrive.findById(req.params.driveId);
    if (!drive) {
      return sendError(res, 404, 'Campus drive not found');
    }

    const applications = await Application.find({ driveId: req.params.driveId })
      .populate('currentStageId')
      .populate({
        path: 'studentProfileId',
        populate: {
          path: 'userId',
          select: 'fullName email isActive',
        },
      })
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'Applications for campus drive retrieved successfully', applications);
  } catch (error) {
    console.error('Get Admin Drive Applications Error:', error);
    return sendError(res, 500, 'Server error during admin drive applications retrieval');
  }
};

/**
 * @desc    Bulk advance candidates from Resume Screening (Stage 0) to Stage 1 (first custom stage)
 * @route   POST /api/applications/bulk-advance
 * @access  Private (Recruiter Only)
 */
const bulkAdvanceApplications = async (req, res) => {
  try {
    const { applicationIds } = req.body;
    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return sendError(res, 400, 'Please provide an array of application IDs');
    }

    const recruiterProfile = await RecruiterProfile.findOne({ userId: req.user._id });
    if (!recruiterProfile) {
      return sendError(res, 404, 'Recruiter profile not found');
    }

    const applications = await Application.find({ _id: { $in: applicationIds } }).populate('driveId');
    if (applications.length === 0) {
      return sendError(res, 400, 'No valid applications found');
    }

    // 1. Verify recruiter ownership for all applications
    for (const app of applications) {
      if (!app.driveId) {
        return sendError(res, 400, `Campus drive not found for application ${app._id}`);
      }
      if (app.driveId.recruiterProfileId.toString() !== recruiterProfile._id.toString()) {
        return sendError(res, 403, 'Unauthorized to manage applications for this drive');
      }
    }

    // 2. Verify that each drive involved has at least one custom (non-system) stage configured
    const uniqueDriveIds = [...new Set(applications.map(app => app.driveId._id.toString()))];
    for (const dId of uniqueDriveIds) {
      const nonSystemStages = await RecruitmentStage.find({ driveId: dId, isSystemStage: { $ne: true } });
      if (nonSystemStages.length === 0) {
        return sendError(res, 400, 'Please configure recruitment stages before advancing candidates.');
      }
    }

    // 3. Perform bulk advancement using promoteCandidate
    const { promoteCandidate } = require('../services/candidateProgressionService');
    const results = {
      success: [],
      errors: []
    };

    for (const app of applications) {
      try {
        await promoteCandidate(app._id, req.user._id);
        results.success.push(app._id);
      } catch (err) {
        results.errors.push({ id: app._id, error: err.message });
      }
    }

    return sendResponse(res, 200, `Bulk progression completed. Successfully advanced: ${results.success.length}, failed: ${results.errors.length}`, results);
  } catch (error) {
    console.error('Bulk Advance Error:', error);
    return sendError(res, 500, 'Server error during bulk candidate advancement');
  }
};

/**
 * @desc    Bulk reject candidates during Resume Screening (Stage 0)
 * @route   POST /api/applications/bulk-reject
 * @access  Private (Recruiter Only)
 */
const bulkRejectApplications = async (req, res) => {
  try {
    const { applicationIds } = req.body;
    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return sendError(res, 400, 'Please provide an array of application IDs');
    }

    const recruiterProfile = await RecruiterProfile.findOne({ userId: req.user._id });
    if (!recruiterProfile) {
      return sendError(res, 404, 'Recruiter profile not found');
    }

    const applications = await Application.find({ _id: { $in: applicationIds } }).populate('driveId');
    if (applications.length === 0) {
      return sendError(res, 400, 'No valid applications found');
    }

    // 1. Verify recruiter ownership for all applications
    for (const app of applications) {
      if (!app.driveId) {
        return sendError(res, 400, `Campus drive not found for application ${app._id}`);
      }
      if (app.driveId.recruiterProfileId.toString() !== recruiterProfile._id.toString()) {
        return sendError(res, 403, 'Unauthorized to manage applications for this drive');
      }
    }

    // 2. Perform bulk rejection
    const { rejectCandidate } = require('../services/candidateProgressionService');
    const results = {
      success: [],
      errors: []
    };

    for (const app of applications) {
      try {
        await rejectCandidate(app._id, 'Not shortlisted after resume screening', req.user._id);
        results.success.push(app._id);
      } catch (err) {
        results.errors.push({ id: app._id, error: err.message });
      }
    }

    return sendResponse(res, 200, `Bulk rejection completed. Successfully rejected: ${results.success.length}, failed: ${results.errors.length}`, results);
  } catch (error) {
    console.error('Bulk Reject Error:', error);
    return sendError(res, 500, 'Server error during bulk candidate rejection');
  }
};

module.exports = {
  applyToDrive,
  getMyApplications,
  getApplicationById,
  getRecruiterApplications,
  getRecruiterDriveApplications,
  shortlistApplication,
  rejectApplication,
  updateApplicationStatus,
  getAdminApplications,
  getAdminDriveApplications,
  bulkAdvanceApplications,
  bulkRejectApplications,
};
