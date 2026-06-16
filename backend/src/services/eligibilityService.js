/**
 * Eligibility Service — Phase 5
 *
 * Pure business logic. No Express, no Mongoose, no HTTP.
 * Takes plain objects and returns eligibility results.
 *
 * Reusable by:
 *  - eligibilityController (HTTP layer)
 *  - Future Phase 6 Applications module (before allowing apply)
 *
 * Rules (all must pass):
 *  1. Student CGPA >= Drive minimumCGPA
 *  2. Student branch ∈ Drive allowedBranches
 *  3. Student backlogs <= Drive maxBacklogs
 *  4. Student batch == Drive eligibleBatch (skipped if drive has no batch restriction)
 */

/**
 * Check whether a single student is eligible for a single drive.
 *
 * @param {Object} studentProfile - Plain student profile object (must have cgpa, branch, backlogs, batch)
 * @param {Object} drive - Plain drive object (must have minimumCGPA, allowedBranches, maxBacklogs, eligibleBatch)
 * @returns {{ eligible: boolean, reasons: string[] }}
 */
function checkEligibility(studentProfile, drive) {
  const reasons = [];

  // Rule 1: CGPA check
  if (
    drive.minimumCGPA != null &&
    studentProfile.cgpa < drive.minimumCGPA
  ) {
    reasons.push(
      `CGPA below minimum requirement (${drive.minimumCGPA} required, you have ${studentProfile.cgpa})`
    );
  }

  // Rule 2: Branch check
  if (
    Array.isArray(drive.allowedBranches) &&
    drive.allowedBranches.length > 0 &&
    !drive.allowedBranches.includes(studentProfile.branch)
  ) {
    reasons.push(
      `Branch not eligible for this drive (allowed: ${drive.allowedBranches.join(', ')})`
    );
  }

  // Rule 3: Backlogs check
  const maxBacklogs = drive.maxBacklogs != null ? drive.maxBacklogs : 0;
  if (studentProfile.backlogs > maxBacklogs) {
    reasons.push(
      `Too many backlogs (max ${maxBacklogs} allowed, you have ${studentProfile.backlogs})`
    );
  }

  // Rule 4: Batch check (skipped if drive doesn't restrict batch)
  if (
    drive.eligibleBatch &&
    drive.eligibleBatch.trim() !== '' &&
    studentProfile.batch &&
    studentProfile.batch.trim() !== ''
  ) {
    const eligibleList = drive.eligibleBatch.split(',').map(b => b.trim()).filter(Boolean);
    if (eligibleList.length > 0 && !eligibleList.includes(studentProfile.batch.trim())) {
      reasons.push(
        `Batch not eligible (${drive.eligibleBatch} required, you are ${studentProfile.batch})`
      );
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

/**
 * Filter an array of drives and return only those the student is eligible for.
 *
 * @param {Object} studentProfile - Student profile object
 * @param {Object[]} drives - Array of drive objects
 * @returns {Object[]} Array of drives where student is eligible, each augmented with `eligibility` field
 */
function filterEligibleDrives(studentProfile, drives) {
  return drives
    .map((drive) => {
      const result = checkEligibility(studentProfile, drive);
      return result.eligible ? drive : null;
    })
    .filter(Boolean);
}

/**
 * Calculate eligibility statistics for a single drive across all students.
 *
 * @param {Object[]} studentProfiles - Array of all student profile objects
 * @param {Object} drive - Single drive object
 * @returns {{ totalStudents: number, eligibleStudents: number, ineligibleStudents: number }}
 */
function calculateEligibilityStats(studentProfiles, drive) {
  let eligibleCount = 0;

  for (const profile of studentProfiles) {
    const { eligible } = checkEligibility(profile, drive);
    if (eligible) eligibleCount++;
  }

  return {
    totalStudents: studentProfiles.length,
    eligibleStudents: eligibleCount,
    ineligibleStudents: studentProfiles.length - eligibleCount,
  };
}

module.exports = {
  checkEligibility,
  filterEligibleDrives,
  calculateEligibilityStats,
};
