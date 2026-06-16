const CampusDrive = require('../models/CampusDrive');
const RecruitmentStage = require('../models/RecruitmentStage');
const RecruiterProfile = require('../models/RecruiterProfile');
const Application = require('../models/Application');
const { processCsvResults } = require('../services/csvImportService');
const { sendResponse, sendError } = require('../utils/response');

/**
 * @desc    Create recruitment stage for a drive
 * @route   POST /api/drives/:driveId/stages
 * @access  Private (Recruiter Only)
 */
const createStage = async (req, res) => {
  try {
    const { driveId } = req.params;
    const { stageOrder, stageName, stageType, description, isFinalStage } = req.body;

    if (!stageOrder || !stageName || !stageType) {
      return sendError(res, 400, 'Stage order, name, and type are required');
    }

    // Find recruiter profile
    const recruiterProfile = await RecruiterProfile.findOne({ userId: req.user._id });
    if (!recruiterProfile) {
      return sendError(res, 404, 'Recruiter profile not found');
    }

    // Find drive
    const drive = await CampusDrive.findById(driveId);
    if (!drive) {
      return sendError(res, 404, 'Campus drive not found');
    }

    // Verify ownership
    if (drive.recruiterProfileId.toString() !== recruiterProfile._id.toString()) {
      return sendError(res, 403, 'Unauthorized to manage stages for this drive');
    }

    const parsedStageOrder = parseInt(stageOrder, 10);
    if (parsedStageOrder === 0) {
      return sendError(res, 400, 'Stage order 0 is reserved for system stages');
    }

    // Check duplicate stageOrder
    const existingStage = await RecruitmentStage.findOne({ driveId, stageOrder: parsedStageOrder });
    if (existingStage) {
      return sendError(res, 400, `A stage with order number ${stageOrder} already exists for this drive`);
    }

    const files = req.files || [];
    const attachments = files.map(file => ({
      fileName: file.originalname,
      fileUrl: `/uploads/drives/${file.filename}`
    }));

    const attachmentUrl = attachments.length > 0 ? attachments[0].fileUrl : '';

    // Create stage
    const stage = await RecruitmentStage.create({
      driveId,
      stageOrder,
      stageName,
      stageType,
      description: description || '',
      isFinalStage: isFinalStage === 'true' || isFinalStage === true,
      attachmentUrl,
      attachments,
    });

    // Check if we need to initialize existing applications
    const allStages = await RecruitmentStage.find({ driveId }).sort({ stageOrder: 1 });
    if (allStages.length > 0 && allStages[0]._id.toString() === stage._id.toString()) {
      // This is the first stage. Initialize any application that is currently at 'Applied' status
      const applications = await Application.find({ driveId, pipelineStatus: 'Applied' });
      for (const app of applications) {
        app.currentStageId = stage._id;
        app.pipelineStatus = 'In Progress';
        app.applicationStatus = 'Shortlisted'; // fallback compatibility
        await app.save();
      }
    }

    sendResponse(res, 201, 'Recruitment stage created successfully', stage);
  } catch (error) {
    console.error('Create Stage Error:', error);
    sendError(res, 500, 'Server error during stage creation');
  }
};

/**
 * @desc    Get all recruitment stages for a drive
 * @route   GET /api/drives/:driveId/stages
 * @access  Private (All Roles: Student/Recruiter/Admin)
 */
const getStages = async (req, res) => {
  try {
    const { driveId } = req.params;

    const stages = await RecruitmentStage.find({ driveId }).sort({ stageOrder: 1 });

    sendResponse(res, 200, 'Stages retrieved successfully', stages);
  } catch (error) {
    console.error('Get Stages Error:', error);
    sendError(res, 500, 'Server error during stages retrieval');
  }
};

/**
 * @desc    Update a recruitment stage
 * @route   PUT /api/stages/:stageId
 * @access  Private (Recruiter Only)
 */
const updateStage = async (req, res) => {
  try {
    const { stageId } = req.params;
    const { stageOrder, stageName, stageType, description, isFinalStage } = req.body;

    const stage = await RecruitmentStage.findById(stageId);
    if (!stage) {
      return sendError(res, 404, 'Recruitment stage not found');
    }

    if (stage.isSystemStage) {
      return sendError(res, 400, 'System stages cannot be modified or deleted');
    }

    // Find recruiter profile
    const recruiterProfile = await RecruiterProfile.findOne({ userId: req.user._id });
    if (!recruiterProfile) {
      return sendError(res, 404, 'Recruiter profile not found');
    }

    // Find drive to verify ownership
    const drive = await CampusDrive.findById(stage.driveId);
    if (!drive || drive.recruiterProfileId.toString() !== recruiterProfile._id.toString()) {
      return sendError(res, 403, 'Unauthorized to update stages for this drive');
    }

    // Check duplicate stageOrder if order is being changed
    const parsedStageOrder = stageOrder ? parseInt(stageOrder, 10) : undefined;
    if (parsedStageOrder === 0) {
      return sendError(res, 400, 'Stage order 0 is reserved for system stages');
    }
    if (parsedStageOrder && parsedStageOrder !== stage.stageOrder) {
      const existingStage = await RecruitmentStage.findOne({ driveId: stage.driveId, stageOrder: parsedStageOrder });
      if (existingStage) {
        return sendError(res, 400, `A stage with order number ${parsedStageOrder} already exists for this drive`);
      }
      stage.stageOrder = parsedStageOrder;
    }

    if (stageName) stage.stageName = stageName;
    if (stageType) stage.stageType = stageType;
    if (description !== undefined) stage.description = description;
    if (isFinalStage !== undefined) {
      stage.isFinalStage = isFinalStage === 'true' || isFinalStage === true;
    }

    // Process attachments updates
    const { existingAttachments } = req.body;
    let keepAttachments = [];
    if (existingAttachments) {
      try {
        keepAttachments = JSON.parse(existingAttachments);
      } catch (err) {
        console.warn('Failed parsing existingAttachments:', err);
      }
    }

    const files = req.files || [];
    const newAttachments = files.map(file => ({
      fileName: file.originalname,
      fileUrl: `/uploads/drives/${file.filename}`
    }));

    stage.attachments = [...keepAttachments, ...newAttachments];

    if (stage.attachments.length > 0) {
      stage.attachmentUrl = stage.attachments[0].fileUrl;
    } else {
      stage.attachmentUrl = '';
    }

    await stage.save();

    sendResponse(res, 200, 'Recruitment stage updated successfully', stage);
  } catch (error) {
    console.error('Update Stage Error:', error);
    sendError(res, 500, 'Server error during stage update');
  }
};

/**
 * @desc    Delete a recruitment stage
 * @route   DELETE /api/stages/:stageId
 * @access  Private (Recruiter Only)
 */
const deleteStage = async (req, res) => {
  try {
    const { stageId } = req.params;

    const stage = await RecruitmentStage.findById(stageId);
    if (!stage) {
      return sendError(res, 404, 'Recruitment stage not found');
    }

    if (stage.isSystemStage) {
      return sendError(res, 400, 'System stages cannot be modified or deleted');
    }

    // Find recruiter profile
    const recruiterProfile = await RecruiterProfile.findOne({ userId: req.user._id });
    if (!recruiterProfile) {
      return sendError(res, 404, 'Recruiter profile not found');
    }

    // Find drive to verify ownership
    const drive = await CampusDrive.findById(stage.driveId);
    if (!drive || drive.recruiterProfileId.toString() !== recruiterProfile._id.toString()) {
      return sendError(res, 403, 'Unauthorized to delete stages for this drive');
    }

    // Delete stage
    await RecruitmentStage.findByIdAndDelete(stageId);

    sendResponse(res, 200, 'Recruitment stage deleted successfully');
  } catch (error) {
    console.error('Delete Stage Error:', error);
    sendError(res, 500, 'Server error during stage deletion');
  }
};

/**
 * @desc    Import external results via CSV
 * @route   POST /api/stages/:stageId/import-results
 * @access  Private (Recruiter Only)
 */
const importResults = async (req, res) => {
  try {
    const { stageId } = req.params;

    if (!req.file) {
      return sendError(res, 400, 'Please upload a CSV file');
    }

    const stage = await RecruitmentStage.findById(stageId);
    if (!stage) {
      return sendError(res, 404, 'Recruitment stage not found');
    }

    if (stage.isSystemStage) {
      return sendError(res, 400, 'CSV results import is not allowed for the Resume Screening stage.');
    }

    // Find recruiter profile
    const recruiterProfile = await RecruiterProfile.findOne({ userId: req.user._id });
    if (!recruiterProfile) {
      return sendError(res, 404, 'Recruiter profile not found');
    }

    // Find drive to verify ownership
    const drive = await CampusDrive.findById(stage.driveId);
    if (!drive || drive.recruiterProfileId.toString() !== recruiterProfile._id.toString()) {
      return sendError(res, 403, 'Unauthorized to upload results for this drive');
    }

    const csvText = req.file.buffer.toString('utf-8');
    const stats = await processCsvResults(csvText, stageId, req.user._id);

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Import CSV Results Error:', error);
    sendError(res, 500, error.message || 'Server error during CSV processing');
  }
};

module.exports = {
  createStage,
  getStages,
  updateStage,
  deleteStage,
  importResults,
};


