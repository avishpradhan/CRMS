const dotenv = require('dotenv');
const dns = require('dns');
const path = require('path');
const mongoose = require('mongoose');
const readline = require('readline');

// Force Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load environment configuration
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const StudentProfile = require('../src/models/StudentProfile');
const RecruiterProfile = require('../src/models/RecruiterProfile');
const CampusDrive = require('../src/models/CampusDrive');
const RecruitmentStage = require('../src/models/RecruitmentStage');
const Application = require('../src/models/Application');
const Notification = require('../src/models/Notification');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => {
  return new Promise((resolve) => rl.question(query, resolve));
};

const runReset = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Connected.');

    // Fetch counts of records to delete
    const studentCount = await User.countDocuments({ role: 'student' });
    const recruiterCount = await User.countDocuments({ role: 'recruiter' });
    const studentProfileCount = await StudentProfile.countDocuments({});
    const recruiterProfileCount = await RecruiterProfile.countDocuments({});
    const applicationCount = await Application.countDocuments({});
    const driveCount = await CampusDrive.countDocuments({});
    const stageCount = await RecruitmentStage.countDocuments({});
    const notificationCount = await Notification.countDocuments({});

    // Display preview of counts
    console.log('\n==================================================');
    console.log('      DATABASE RESET PREVIEW (TEST DATA ONLY)');
    console.log('==================================================');
    console.log(`- Seeded Students (Users):      ${studentCount} records`);
    console.log(`- Seeded Recruiters (Users):    ${recruiterCount} records`);
    console.log(`- Student Profiles:             ${studentProfileCount} records`);
    console.log(`- Recruiter Profiles:           ${recruiterProfileCount} records`);
    console.log(`- Applications:                 ${applicationCount} records`);
    console.log(`- Campus Drives:                ${driveCount} records`);
    console.log(`- Recruitment Stages:           ${stageCount} records`);
    console.log(`- Notifications:                ${notificationCount} records`);
    console.log('--------------------------------------------------');
    console.log('PRESERVED:');
    const adminCount = await User.countDocuments({ role: 'admin' });
    const Batch = require('../src/models/Batch');
    const batchCount = await Batch.countDocuments({});
    console.log(`- Administrator Accounts:       ${adminCount} accounts`);
    console.log(`- Batch Management Data:        ${batchCount} batches`);
    console.log('==================================================\n');

    const totalToDelete = studentCount + recruiterCount + studentProfileCount + recruiterProfileCount +
                         applicationCount + driveCount + stageCount + notificationCount;

    if (totalToDelete === 0) {
      console.log('Database is already clean. No test data to reset.');
      rl.close();
      await mongoose.disconnect();
      return;
    }

    // Explicit confirmation prompt
    const answer = await askQuestion('WARNING: This action is irreversible. Type "RESET" to confirm deletion: ');

    if (answer.trim() === 'RESET') {
      console.log('\nStarting database reset...');

      // 1. Delete applications first (depends on student profiles & drives)
      const deletedApps = await Application.deleteMany({});
      console.log(`- Deleted ${deletedApps.deletedCount} applications.`);

      // 2. Delete recruitment stages (depends on drives)
      const deletedStages = await RecruitmentStage.deleteMany({});
      console.log(`- Deleted ${deletedStages.deletedCount} recruitment stages.`);

      // 3. Delete campus drives (depends on recruiter profiles)
      const deletedDrives = await CampusDrive.deleteMany({});
      console.log(`- Deleted ${deletedDrives.deletedCount} campus drives.`);

      // 4. Delete profiles
      const deletedStudentProfiles = await StudentProfile.deleteMany({});
      console.log(`- Deleted ${deletedStudentProfiles.deletedCount} student profiles.`);

      const deletedRecruiterProfiles = await RecruiterProfile.deleteMany({});
      console.log(`- Deleted ${deletedRecruiterProfiles.deletedCount} recruiter profiles.`);

      // 5. Delete notifications
      const deletedNotifications = await Notification.deleteMany({});
      console.log(`- Deleted ${deletedNotifications.deletedCount} notifications.`);

      // 6. Delete test users (students and recruiters)
      const deletedUsers = await User.deleteMany({ role: { $in: ['student', 'recruiter'] } });
      console.log(`- Deleted ${deletedUsers.deletedCount} test user accounts (students and recruiters).`);

      console.log('\n==================================================');
      console.log('      DATABASE RESET COMPLETED SUCCESSFULLY');
      console.log('==================================================\n');
    } else {
      console.log('\nReset cancelled. No data was deleted.');
    }

    rl.close();
    await mongoose.disconnect();
  } catch (err) {
    console.error('An error occurred during the database reset:', err);
    rl.close();
    try {
      await mongoose.disconnect();
    } catch (_) {}
  }
};

runReset();
