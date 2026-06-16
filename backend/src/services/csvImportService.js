const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Application = require('../models/Application');
const RecruitmentStage = require('../models/RecruitmentStage');
const { promoteCandidate, rejectCandidate } = require('./candidateProgressionService');

/**
 * Process CSV results for a specific recruitment stage.
 * CSV Format:
 * email,result
 * student1@crms.com,PASS
 * student2@crms.com,FAIL
 *
 * @param {string} csvText - Raw CSV content as string
 * @param {string} stageId - ID of the recruitment stage
 * @param {string} updaterUserId - ID of the recruiter/user executing the action
 * @returns {Promise<{success: boolean, processed: number, promoted: number, rejected: number, skipped: number, errors: string[]}>}
 */
async function processCsvResults(csvText, stageId, updaterUserId) {
  const resultStats = {
    success: true,
    processed: 0,
    promoted: 0,
    rejected: 0,
    skipped: 0,
    errors: [],
  };

  // Find recruitment stage
  const stage = await RecruitmentStage.findById(stageId);
  if (!stage) {
    throw new Error('Recruitment stage not found');
  }

  // Split lines
  const lines = csvText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Check headers (case insensitive check, skip if it starts with email)
  let startIndex = 0;
  const firstLine = lines[0].toLowerCase();
  if (firstLine.includes('email') || firstLine.includes('result')) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const row = lines[i];
    const columns = row.split(',').map(col => col.trim());
    if (columns.length < 2) {
      resultStats.skipped++;
      resultStats.errors.push(`Row ${i + 1}: Invalid row format (must have email and result)`);
      continue;
    }

    const email = columns[0];
    const resultVal = columns[1].toUpperCase();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      resultStats.skipped++;
      resultStats.errors.push(`Row ${i + 1}: Invalid email format "${email}"`);
      continue;
    }

    if (resultVal !== 'PASS' && resultVal !== 'FAIL') {
      resultStats.skipped++;
      resultStats.errors.push(`Row ${i + 1}: Invalid result value "${resultVal}" (must be PASS or FAIL)`);
      continue;
    }

    try {
      // Find Student user
      const studentUser = await User.findOne({ email: email.toLowerCase(), role: 'student' });
      if (!studentUser) {
        resultStats.skipped++;
        resultStats.errors.push(`Row ${i + 1}: Student with email ${email} not found in system`);
        continue;
      }

      // Find Student profile
      const studentProfile = await StudentProfile.findOne({ userId: studentUser._id });
      if (!studentProfile) {
        resultStats.skipped++;
        resultStats.errors.push(`Row ${i + 1}: Student profile for ${email} has not been created yet`);
        continue;
      }

      // Find Application for this student and this drive
      const application = await Application.findOne({
        studentProfileId: studentProfile._id,
        driveId: stage.driveId,
      });

      if (!application) {
        resultStats.skipped++;
        resultStats.errors.push(`Row ${i + 1}: Student ${email} has not applied for this drive`);
        continue;
      }

      // Verify the candidate is currently in the stage being processed
      if (!application.currentStageId || application.currentStageId.toString() !== stageId.toString()) {
        resultStats.skipped++;
        resultStats.errors.push(
          `Row ${i + 1}: Student ${email} is not in the current stage (Status: ${application.pipelineStatus})`
        );
        continue;
      }

      // Verify progression rules (not rejected or selected already)
      if (application.pipelineStatus === 'Rejected' || application.pipelineStatus === 'Selected') {
        resultStats.skipped++;
        resultStats.errors.push(
          `Row ${i + 1}: Cannot progress student ${email} (already ${application.pipelineStatus.toLowerCase()})`
        );
        continue;
      }

      resultStats.processed++;

      // Process PASS or FAIL
      if (resultVal === 'PASS') {
        await promoteCandidate(application._id, updaterUserId);
        resultStats.promoted++;
      } else {
        // FAIL -> Reject candidate
        const failureReason = `Failed ${stage.stageName}`;
        await rejectCandidate(application._id, failureReason, updaterUserId);
        resultStats.rejected++;
      }
    } catch (err) {
      resultStats.skipped++;
      resultStats.errors.push(`Row ${i + 1}: Error processing candidate progression - ${err.message}`);
    }
  }

  return resultStats;
}

module.exports = {
  processCsvResults,
};
