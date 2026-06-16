const Application = require('../models/Application');

/**
 * Computes the dynamic recruitment lifecycle status of a drive.
 * Valid return values: 'Draft', 'Open', 'Application Closed', 'In Process', 'Completed', 'Cancelled'.
 *
 * @param {Object} drive - The plain drive object (from db)
 * @param {number} activeCandidatesCount - Count of applications with pipelineStatus = 'In Progress'
 * @param {number} totalApplicationsCount - Count of all applications for this drive
 * @param {number} resolvedCandidatesCount - Count of applications with pipelineStatus in ['Selected', 'Rejected']
 * @returns {string} One of the lifecycle statuses
 */
function computeDriveStatus(drive, activeCandidatesCount, totalApplicationsCount, resolvedCandidatesCount) {
  if (drive.status === 'Closed' || drive.status === 'Cancelled') {
    return 'Cancelled';
  }
  if (drive.status === 'Draft') {
    return 'Draft';
  }

  const currentDate = new Date();
  const deadlineDate = new Date(drive.deadline);
  deadlineDate.setUTCHours(23, 59, 59, 999);

  if (currentDate <= deadlineDate) {
    return 'Open';
  }

  // Past deadline
  if (totalApplicationsCount === 0) {
    return 'Application Closed';
  }

  if (activeCandidatesCount > 0) {
    return 'In Process';
  }

  if (resolvedCandidatesCount > 0) {
    return 'Completed';
  }

  return 'Application Closed';
}

/**
 * Enriches drive documents with dynamic lifecycle status and original dbStatus.
 * Accepts either a single drive document/object or an array of drives.
 *
 * @param {Object|Object[]} drives - CampusDrive document(s) or object(s)
 * @returns {Promise<Object|Object[]>} Enriched plain object(s)
 */
async function enrichDrivesWithStatus(drives) {
  if (!drives) return null;

  const isArray = Array.isArray(drives);
  const drivesArray = isArray ? drives : [drives];

  if (drivesArray.length === 0) {
    return isArray ? [] : null;
  }

  const driveIds = drivesArray.map(d => d._id);

  // Aggregation query to find total, active, and resolved counts for all drives in one query
  const counts = await Application.aggregate([
    { $match: { driveId: { $in: driveIds } } },
    {
      $group: {
        _id: '$driveId',
        total: { $sum: 1 },
        active: {
          $sum: {
            $cond: [{ $eq: ['$pipelineStatus', 'In Progress'] }, 1, 0]
          }
        },
        resolved: {
          $sum: {
            $cond: [{ $in: ['$pipelineStatus', ['Selected', 'Rejected']] }, 1, 0]
          }
        }
      }
    }
  ]);

  const countMap = {};
  counts.forEach(c => {
    countMap[c._id.toString()] = {
      total: c.total,
      active: c.active,
      resolved: c.resolved
    };
  });

  const enriched = drivesArray.map(d => {
    const driveObj = d.toObject ? d.toObject({ virtuals: true }) : { ...d };
    const stats = countMap[driveObj._id.toString()] || { total: 0, active: 0, resolved: 0 };
    driveObj.dbStatus = driveObj.status; // original status from db (Published, Draft, Closed)
    driveObj.status = computeDriveStatus(driveObj, stats.active, stats.total, stats.resolved);
    return driveObj;
  });

  return isArray ? enriched : enriched[0];
}

module.exports = {
  computeDriveStatus,
  enrichDrivesWithStatus
};
