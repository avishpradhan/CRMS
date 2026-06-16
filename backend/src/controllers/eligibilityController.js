const StudentProfile = require('../models/StudentProfile');
const CampusDrive = require('../models/CampusDrive');
const Notification = require('../models/Notification');
const { checkEligibility, filterEligibleDrives, calculateEligibilityStats } = require('../services/eligibilityService');
const { sendResponse, sendError } = require('../utils/response');
const { enrichDrivesWithStatus } = require('../utils/driveStatusHelper');

/**
 * @desc    Get all drives the logged-in student is eligible for
 * @route   GET /api/student/eligible-drives
 * @access  Private (Student Only)
 */
const getEligibleDrives = async (req, res) => {
  try {
    // 1. Get student profile
    const studentProfile = await StudentProfile.findOne({ userId: req.user._id });
    if (!studentProfile) {
      return sendError(res, 404, 'Student profile not found. Please complete your profile first.');
    }

    // 2. Fetch all published drives (only active ones students should see)
    const publishedDrives = await CampusDrive.find({ status: 'Published' })
      .populate('recruiterProfileId', 'companyName companyEmail contactPerson logoUrl')
      .sort({ postedDate: -1 });

    // Enrich with dynamic status
    const enrichedDrives = await enrichDrivesWithStatus(publishedDrives);
    // Only 'Open' drives are visible to students
    const openDrives = enrichedDrives.filter(d => d.status === 'Open');

    // 3. Run eligibility engine — filter to only eligible drives
    const eligibleDrives = filterEligibleDrives(studentProfile, openDrives);

    sendResponse(res, 200, 'Eligible drives retrieved successfully', {
      total: eligibleDrives.length,
      drives: eligibleDrives,
    });
  } catch (error) {
    console.error('Get Eligible Drives Error:', error);
    return sendError(res, 500, 'Server error during eligible drives retrieval');
  }
};

/**
 * @desc    Check eligibility for a specific drive
 * @route   GET /api/student/drive/:id/eligibility
 * @access  Private (Student Only)
 */
const checkDriveEligibility = async (req, res) => {
  try {
    // 1. Get student profile
    const studentProfile = await StudentProfile.findOne({ userId: req.user._id });
    if (!studentProfile) {
      return sendError(res, 404, 'Student profile not found. Please complete your profile first.');
    }

    // 2. Get the specific drive
    const drive = await CampusDrive.findById(req.params.id);
    if (!drive) {
      return sendError(res, 404, 'Drive not found');
    }

    // 3. Run eligibility check
    const enrichedDrive = await enrichDrivesWithStatus(drive);
    const result = checkEligibility(studentProfile, enrichedDrive);

    sendResponse(res, 200, 'Eligibility check completed', {
      driveId: enrichedDrive._id,
      role: enrichedDrive.role,
      companyName: enrichedDrive.companyName,
      status: enrichedDrive.status,
      ...result,
    });
  } catch (error) {
    console.error('Check Drive Eligibility Error:', error);
    return sendError(res, 500, 'Server error during eligibility check');
  }
};

/**
 * @desc    Get eligibility statistics for a specific drive (admin dashboard)
 * @route   GET /api/admin/drives/:id/eligibility-stats
 * @access  Private (Admin Only)
 */
const getDriveEligibilityStats = async (req, res) => {
  try {
    // 1. Get the drive
    const drive = await CampusDrive.findById(req.params.id);
    if (!drive) {
      return sendError(res, 404, 'Drive not found');
    }

    // 2. Get all student profiles
    const studentProfiles = await StudentProfile.find();

    // 3. Calculate stats using eligibility service
    const stats = calculateEligibilityStats(studentProfiles, drive);

    sendResponse(res, 200, 'Eligibility statistics retrieved successfully', {
      driveId: drive._id,
      role: drive.role,
      companyName: drive.companyName,
      ...stats,
    });
  } catch (error) {
    console.error('Get Drive Eligibility Stats Error:', error);
    return sendError(res, 500, 'Server error during eligibility stats retrieval');
  }
};

/**
 * @desc    Flood a drive to all eligible students (create database notifications)
 * @route   POST /api/admin/drives/:id/flood
 * @access  Private (Admin Only)
 */
const floodDrive = async (req, res) => {
  try {
    // 1. Get the drive
    const drive = await CampusDrive.findById(req.params.id);
    if (!drive) {
      return sendError(res, 404, 'Drive not found');
    }

    // Publish drive so that it becomes visible to eligible students
    drive.status = 'Published';
    await drive.save();

    // 2. Get all student profiles and populate their userId
    const studentProfiles = await StudentProfile.find().populate('userId');

    let eligibleCount = 0;
    const notificationsToCreate = [];

    // 3. Filter students and prepare notifications
    for (const profile of studentProfiles) {
      const { eligible } = checkEligibility(profile, drive);
      if (eligible && profile.userId) {
        eligibleCount++;
        notificationsToCreate.push({
          userId: profile.userId._id,
          title: `New Eligible Drive: ${drive.companyName}`,
          message: `You qualify for the ${drive.role} position at ${drive.companyName}. Package: ${drive.packageOffered || 'N/A'}. Apply before ${new Date(drive.deadline).toLocaleDateString()}.`,
          type: 'success',
          forRole: 'student',
        });
      }
    }

    // 4. Create notifications in bulk if any students are eligible
    if (notificationsToCreate.length > 0) {
      await Notification.insertMany(notificationsToCreate);
    }

    sendResponse(res, 200, `Drive successfully flooded to ${eligibleCount} eligible students`, {
      eligibleCount,
    });
  } catch (error) {
    console.error('Flood Drive Error:', error);
    return sendError(res, 500, 'Server error during drive flooding');
  }
};

module.exports = {
  getEligibleDrives,
  checkDriveEligibility,
  getDriveEligibilityStats,
  floodDrive,
};
