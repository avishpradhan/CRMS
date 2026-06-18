const StudentProfile = require('../models/StudentProfile');
const CampusDrive = require('../models/CampusDrive');
const { sendResponse, sendError } = require('../utils/response');

// Extract placement status values dynamically from the schema instead of hardcoding
const placementStatusValues = StudentProfile.schema.path('placementStatus').enumValues;
const PLACED_STATUS = placementStatusValues.find(v => v === 'Placed') || 'Placed';

/**
 * Get placement and recruitment analytics
 * GET /api/admin/stats
 */
const getPlacementStats = async (req, res) => {
  try {
    const { batch, campus, timeframe } = req.query;

    // Structure query match filters to allow future filters (e.g. timeframe, batch, campus)
    const studentMatch = {};
    const driveMatch = {};

    if (batch) {
      studentMatch.batch = batch;
    }
    if (campus) {
      studentMatch.campus = campus;
    }
    // Timeframe filters can be extended here in the future
    if (timeframe) {
      // e.g. timeframe-based date matches on studentMatch.createdAt or driveMatch.postedDate
    }

    // 1. Branch-wise Placement Percentage
    const branchWisePercent = await StudentProfile.aggregate([
      { $match: studentMatch },
      {
        $group: {
          _id: '$branch',
          totalCount: { $sum: 1 },
          placedCount: {
            $sum: { $cond: [{ $eq: ['$placementStatus', PLACED_STATUS] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          branch: '$_id',
          totalCount: 1,
          placedCount: 1,
          percentage: {
            $cond: [
              { $gt: ['$totalCount', 0] },
              { $round: [{ $multiply: [{ $divide: ['$placedCount', '$totalCount'] }, 100] }, 1] },
              0
            ]
          }
        }
      },
      { $sort: { branch: 1 } }
    ]);

    // 2. Campus-wise Placement Percentage
    const campusWisePercent = await StudentProfile.aggregate([
      { $match: studentMatch },
      {
        $group: {
          _id: '$campus',
          totalCount: { $sum: 1 },
          placedCount: {
            $sum: { $cond: [{ $eq: ['$placementStatus', PLACED_STATUS] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          campus: '$_id',
          totalCount: 1,
          placedCount: 1,
          percentage: {
            $cond: [
              { $gt: ['$totalCount', 0] },
              { $round: [{ $multiply: [{ $divide: ['$placedCount', '$totalCount'] }, 100] }, 1] },
              0
            ]
          }
        }
      },
      { $sort: { campus: 1 } }
    ]);

    // 3. Batch-wise Placement Percentage (Using batchId/canonicalBatch join)
    const batchWisePercent = await StudentProfile.aggregate([
      { 
        $match: { 
          ...studentMatch, 
          batchId: { $ne: null } 
        } 
      },
      {
        $group: {
          _id: '$batchId',
          totalCount: { $sum: 1 },
          placedCount: {
            $sum: { $cond: [{ $eq: ['$placementStatus', PLACED_STATUS] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'batches',
          localField: '_id',
          foreignField: '_id',
          as: 'batchInfo'
        }
      },
      { $unwind: '$batchInfo' },
      {
        $project: {
          batch: '$batchInfo.canonicalBatch',
          batchName: '$batchInfo.batchName',
          totalCount: 1,
          placedCount: 1,
          percentage: {
            $cond: [
              { $gt: ['$totalCount', 0] },
              { $round: [{ $multiply: [{ $divide: ['$placedCount', '$totalCount'] }, 100] }, 1] },
              0
            ]
          }
        }
      },
      { $sort: { batch: 1 } }
    ]);

    // 4. Branch-wise Placements Count (selected students distribution)
    const branchPlacements = await StudentProfile.aggregate([
      { 
        $match: { 
          ...studentMatch, 
          placementStatus: PLACED_STATUS 
        } 
      },
      {
        $group: {
          _id: '$branch',
          placements: { $sum: 1 }
        }
      },
      {
        $project: {
          branch: '$_id',
          placements: 1
        }
      },
      { $sort: { placements: -1 } }
    ]);

    // 5. Recruiter Engagement Analytics (Drives posted per recruiter profile ID)
    const recruiterEngagement = await CampusDrive.aggregate([
      { $match: driveMatch },
      {
        $group: {
          _id: '$recruiterProfileId',
          drivesCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'recruiterprofiles',
          localField: '_id',
          foreignField: '_id',
          as: 'profile'
        }
      },
      { $unwind: '$profile' },
      {
        $project: {
          _id: 1,
          companyName: '$profile.companyName',
          drivesCount: 1
        }
      },
      { $sort: { drivesCount: -1, companyName: 1 } }
    ]);

    sendResponse(res, 200, 'Placement statistics fetched successfully', {
      branchWisePercent,
      campusWisePercent,
      batchWisePercent,
      branchPlacements,
      recruiterEngagement
    });
  } catch (error) {
    console.error('Error fetching placement stats:', error);
    sendError(res, 500, 'Failed to fetch placement statistics');
  }
};

module.exports = {
  getPlacementStats,
};
