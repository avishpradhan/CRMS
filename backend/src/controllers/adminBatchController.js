const Batch = require('../models/Batch');
const { sendResponse, sendError } = require('../utils/response');

/**
 * @desc    Create a new batch
 * @route   POST /api/admin/batches
 * @access  Private (Admin Only)
 */
const createBatch = async (req, res) => {
  try {
    const { batchName, inviteCode, description, startYear, endYear } = req.body;

    if (!batchName || !inviteCode) {
      return sendError(res, 400, 'Batch name and invite code are required');
    }

    if (startYear === undefined || endYear === undefined) {
      return sendError(res, 400, 'Start year and end year are required');
    }

    const start = parseInt(startYear, 10);
    const end = parseInt(endYear, 10);

    if (isNaN(start) || isNaN(end)) {
      return sendError(res, 400, 'Start year and end year must be valid numbers');
    }

    if (start >= end) {
      return sendError(res, 400, 'Start year must be less than end year');
    }

    // Check unique constraints manually to send user-friendly errors
    const existingName = await Batch.findOne({ batchName: batchName.trim() });
    if (existingName) {
      return sendError(res, 400, 'A batch with this name already exists');
    }

    const existingCode = await Batch.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (existingCode) {
      return sendError(res, 400, 'A batch with this invite code already exists');
    }

    const canonical = `${start}-${end}`;
    const existingCanonical = await Batch.findOne({ canonicalBatch: canonical });
    if (existingCanonical) {
      return sendError(res, 400, `A batch with the year range ${canonical} already exists`);
    }

    const newBatch = await Batch.create({
      batchName: batchName.trim(),
      inviteCode: inviteCode.trim().toUpperCase(),
      description: description || '',
      startYear: start,
      endYear: end,
      createdBy: req.user._id, // Set from authMiddleware
    });

    sendResponse(res, 201, 'Batch created successfully', newBatch);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return sendError(res, 400, messages.join(', '));
    }
    console.error('Create Batch Error:', error);
    return sendError(res, 500, 'Server error during batch creation');
  }
};

/**
 * @desc    Get all batches
 * @route   GET /api/admin/batches
 * @access  Private (Admin Only)
 */
const getAllBatches = async (req, res) => {
  try {
    const batches = await Batch.find().sort({ createdAt: -1 });
    sendResponse(res, 200, 'All batches retrieved successfully', batches);
  } catch (error) {
    console.error('Get All Batches Error:', error);
    return sendError(res, 500, 'Server error during batches retrieval');
  }
};

/**
 * @desc    Get a single batch by ID
 * @route   GET /api/admin/batches/:id
 * @access  Private (Admin Only)
 */
const getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return sendError(res, 404, 'Batch not found');
    }
    sendResponse(res, 200, 'Batch retrieved successfully', batch);
  } catch (error) {
    console.error('Get Batch Error:', error);
    return sendError(res, 500, 'Server error during batch retrieval');
  }
};

/**
 * @desc    Update batch details
 * @route   PUT /api/admin/batches/:id
 * @access  Private (Admin Only)
 */
const updateBatch = async (req, res) => {
  try {
    const { batchName, inviteCode, description, isActive, startYear, endYear } = req.body;

    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return sendError(res, 404, 'Batch not found');
    }

    // Validation for startYear and endYear if updated
    let start = startYear !== undefined ? parseInt(startYear, 10) : batch.startYear;
    let end = endYear !== undefined ? parseInt(endYear, 10) : batch.endYear;

    if (startYear !== undefined || endYear !== undefined) {
      if (isNaN(start) || isNaN(end)) {
        return sendError(res, 400, 'Start year and end year must be valid numbers');
      }
      if (start >= end) {
        return sendError(res, 400, 'Start year must be less than end year');
      }

      const canonical = `${start}-${end}`;
      if (canonical !== batch.canonicalBatch) {
        const existingCanonical = await Batch.findOne({ canonicalBatch: canonical });
        if (existingCanonical) {
          return sendError(res, 400, `A batch with the year range ${canonical} already exists`);
        }
        batch.startYear = start;
        batch.endYear = end;
      }
    }

    // Uniqueness validation if changed
    if (batchName && batchName.trim() !== batch.batchName) {
      const existingName = await Batch.findOne({ batchName: batchName.trim() });
      if (existingName) {
        return sendError(res, 400, 'A batch with this name already exists');
      }
      batch.batchName = batchName.trim();
    }

    if (inviteCode && inviteCode.trim().toUpperCase() !== batch.inviteCode) {
      const existingCode = await Batch.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
      if (existingCode) {
        return sendError(res, 400, 'A batch with this invite code already exists');
      }
      batch.inviteCode = inviteCode.trim().toUpperCase();
    }

    if (description !== undefined) {
      batch.description = description;
    }

    if (isActive !== undefined) {
      batch.isActive = isActive;
    }

    const updatedBatch = await batch.save();
    sendResponse(res, 200, 'Batch updated successfully', updatedBatch);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return sendError(res, 400, messages.join(', '));
    }
    console.error('Update Batch Error:', error);
    return sendError(res, 500, 'Server error during batch update');
  }
};

/**
 * @desc    Deactivate a batch
 * @route   PATCH /api/admin/batches/:id/deactivate
 * @access  Private (Admin Only)
 */
const deactivateBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return sendError(res, 404, 'Batch not found');
    }

    batch.isActive = false;
    await batch.save();

    sendResponse(res, 200, 'Batch deactivated successfully', batch);
  } catch (error) {
    console.error('Deactivate Batch Error:', error);
    return sendError(res, 500, 'Server error during batch deactivation');
  }
};

/**
 * @desc    Delete a batch and its registered students
 * @route   DELETE /api/admin/batches/:id
 * @access  Private (Admin Only)
 */
const deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return sendError(res, 404, 'Batch not found');
    }

    const User = require('../models/User');
    const StudentProfile = require('../models/StudentProfile');
    const Application = require('../models/Application');

    // Find all student profiles matching this batch
    const profiles = await StudentProfile.find({
      $or: [{ batchId: batch._id }, { batch: batch.canonicalBatch }]
    });

    const studentProfileIds = profiles.map(p => p._id);
    const userIds = profiles.map(p => p.userId);

    // Also look for student users using this inviteCode directly (even if they have no profile yet)
    const studentUsers = await User.find({ role: 'student', inviteCode: batch.inviteCode });
    const additionalUserIds = studentUsers.map(u => u._id);
    const combinedUserIds = [...new Set([...userIds.map(id => id.toString()), ...additionalUserIds.map(id => id.toString())])];

    // Delete student applications
    await Application.deleteMany({ studentProfileId: { $in: studentProfileIds } });

    // Delete student profiles
    await StudentProfile.deleteMany({ _id: { $in: studentProfileIds } });

    // Delete student users
    await User.deleteMany({ _id: { $in: combinedUserIds } });

    // Delete the batch
    await Batch.findByIdAndDelete(batch._id);

    sendResponse(res, 200, 'Batch and all associated student records deleted successfully', null);
  } catch (error) {
    console.error('Delete Batch Error:', error);
    return sendError(res, 500, 'Server error during batch deletion');
  }
};

module.exports = {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatch,
  deactivateBatch,
  deleteBatch,
};
