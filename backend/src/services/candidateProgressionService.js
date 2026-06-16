const Application = require('../models/Application');
const RecruitmentStage = require('../models/RecruitmentStage');
const Notification = require('../models/Notification');
const StudentProfile = require('../models/StudentProfile');

/**
 * Initialize application progression state.
 * If stages exist, sets to first stage and In Progress.
 *
 * @param {Object} application - Mongoose application document
 */
async function initializeApplication(application) {
  const resumeScreeningStage = await RecruitmentStage.findOne({
    driveId: application.driveId,
    stageOrder: 0,
  });

  if (!resumeScreeningStage) {
    throw new Error('Drive pipeline configuration is invalid. Resume Screening stage missing.');
  }

  application.currentStageId = resumeScreeningStage._id;
  application.pipelineStatus = 'In Progress';
  application.applicationStatus = 'Shortlisted'; // fallback compatibility
}

/**
 * Promote candidate to next stage or select them if they passed the final stage.
 */
async function promoteCandidate(applicationId, updaterUserId) {
  const application = await Application.findById(applicationId).populate('driveId');
  if (!application) {
    throw new Error('Application not found');
  }

  if (application.pipelineStatus === 'Rejected') {
    throw new Error('Cannot promote a rejected candidate');
  }

  if (application.pipelineStatus === 'Selected') {
    throw new Error('Candidate is already selected');
  }

  const stages = await RecruitmentStage.find({ driveId: application.driveId })
    .sort({ stageOrder: 1 });

  if (stages.length === 0) {
    throw new Error('No recruitment stages configured for this drive');
  }

  // Find current stage
  let nextStage = null;
  if (!application.currentStageId) {
    // If not in a stage yet, promote to first stage
    nextStage = stages[0];
  } else {
    const currentIndex = stages.findIndex(s => s._id.toString() === application.currentStageId.toString());
    if (currentIndex === -1) {
      // Stage configuration might have changed, fallback to first stage
      nextStage = stages[0];
    } else if (currentIndex < stages.length - 1) {
      const currentStage = stages[currentIndex];
      if (currentStage.isFinalStage) {
        // Already passed final stage
        nextStage = null;
      } else {
        nextStage = stages[currentIndex + 1];
      }
    }
  }

  if (nextStage) {
    // Move to next stage
    application.currentStageId = nextStage._id;
    application.pipelineStatus = 'In Progress';
    // Sync legacy applicationStatus
    application.applicationStatus = nextStage.stageType === 'HR Interview' ? 'Interview Scheduled' : 'Shortlisted';
    application.lastUpdatedBy = updaterUserId;
    application.statusReason = '';
    await application.save();

    // Notify Student
    try {
      const student = await StudentProfile.findById(application.studentProfileId);
      if (student && student.userId) {
        await Notification.create({
          userId: student.userId,
          title: 'Application Promoted',
          message: `Congratulations! You have been promoted to the "${nextStage.stageName}" stage for ${application.driveId.companyName}.`,
          type: 'success',
          forRole: 'student',
        });
      }
    } catch (err) {
      console.error('Notification error:', err.message);
    }
  } else {
    // No next stage -> candidate is Selected!
    application.pipelineStatus = 'Selected';
    application.applicationStatus = 'Selected';
    application.lastUpdatedBy = updaterUserId;
    application.statusReason = 'Passed final round';
    await application.save();

    // Notify Student
    try {
      const student = await StudentProfile.findById(application.studentProfileId);
      if (student && student.userId) {
        await Notification.create({
          userId: student.userId,
          title: 'Offer Selected',
          message: `Congratulations! You have been Selected for the ${application.driveId.role} role at ${application.driveId.companyName}!`,
          type: 'success',
          forRole: 'student',
        });
      }
    } catch (err) {
      console.error('Notification error:', err.message);
    }
  }

  return application;
}

/**
 * Reject candidate.
 */
async function rejectCandidate(applicationId, reason, updaterUserId) {
  const application = await Application.findById(applicationId).populate('driveId');
  if (!application) {
    throw new Error('Application not found');
  }

  application.pipelineStatus = 'Rejected';
  application.applicationStatus = 'Rejected';
  application.statusReason = reason || 'Rejected during recruitment process';
  application.lastUpdatedBy = updaterUserId;
  await application.save();

  // Notify Student
  try {
    const student = await StudentProfile.findById(application.studentProfileId);
    if (student && student.userId) {
      await Notification.create({
        userId: student.userId,
        title: 'Application Status Update',
        message: `Your application for ${application.driveId.role} at ${application.driveId.companyName} was not shortlisted. Reason: ${application.statusReason}`,
        type: 'danger',
        forRole: 'student',
      });
    }
  } catch (err) {
    console.error('Notification error:', err.message);
  }

  return application;
}

/**
 * Select candidate directly.
 */
async function selectCandidate(applicationId, updaterUserId) {
  const application = await Application.findById(applicationId).populate('driveId');
  if (!application) {
    throw new Error('Application not found');
  }

  application.pipelineStatus = 'Selected';
  application.applicationStatus = 'Selected';
  application.lastUpdatedBy = updaterUserId;
  application.statusReason = 'Directly selected by recruiter';
  await application.save();

  // Notify Student
  try {
    const student = await StudentProfile.findById(application.studentProfileId);
    if (student && student.userId) {
      await Notification.create({
        userId: student.userId,
        title: 'Application Selected',
        message: `Congratulations! You have been Selected for ${application.driveId.role} at ${application.driveId.companyName}!`,
        type: 'success',
        forRole: 'student',
      });
    }
  } catch (err) {
    console.error('Notification error:', err.message);
  }

  return application;
}

module.exports = {
  initializeApplication,
  promoteCandidate,
  rejectCandidate,
  selectCandidate,
};
