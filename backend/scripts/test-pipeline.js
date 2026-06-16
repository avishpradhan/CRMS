const dotenv = require('dotenv');
const dns = require('dns');
const path = require('path');
const mongoose = require('mongoose');

// Force Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const StudentProfile = require('../src/models/StudentProfile');
const RecruiterProfile = require('../src/models/RecruiterProfile');
const CampusDrive = require('../src/models/CampusDrive');
const Application = require('../src/models/Application');
const RecruitmentStage = require('../src/models/RecruitmentStage');
const { processCsvResults } = require('../src/services/csvImportService');
const { promoteCandidate, rejectCandidate } = require('../src/services/candidateProgressionService');

const runTest = async () => {
  try {
    await connectDB();
    console.log('Connected to DB.');

    // 1. Setup clean test records
    console.log('Cleaning old test pipeline records...');
    await User.deleteMany({ email: { $in: ['test_recruiter@pipeline.com', 'test_student@pipeline.com'] } });
    await RecruitmentStage.deleteMany({});
    
    // Create Recruiter
    const recruiterUser = await User.create({
      fullName: 'Pipeline Recruiter',
      email: 'test_recruiter@pipeline.com',
      password: 'password123',
      role: 'recruiter',
    });
    const recruiterProfile = await RecruiterProfile.create({
      userId: recruiterUser._id,
      companyName: 'Pipeline Corp',
      companyWebsite: 'https://www.pipeline.com',
      companyEmail: 'test_recruiter@pipeline.com',
      industry: 'Software',
      companySize: '51-200',
      companyDescription: 'Testing recruitment pipelines description.',
      headquarters: 'Bangalore',
      contactPerson: 'John Recruiter',
      contactPhone: '+919999999999',
    });

    // Create Student
    const studentUser = await User.create({
      fullName: 'Pipeline Student',
      email: 'test_student@pipeline.com',
      password: 'password123',
      role: 'student',
    });
    const studentProfile = await StudentProfile.create({
      userId: studentUser._id,
      phone: '+919876543210',
      universityRollNo: 'ROLL-PIPELINE-001',
      classRollNo: 'CL-001',
      branch: 'CSE',
      semester: 8,
      section: 'A',
      cgpa: 9.0,
      skills: ['React', 'NodeJS'],
      projects: [{
        title: 'Project 1',
        description: 'Test project description',
        tech: 'MERN',
      }],
      resumeUrl: 'https://example.com/resume.pdf',
      linkedinUrl: 'https://linkedin.com/in/test-pipeline',
      githubUrl: 'https://github.com/test-pipeline',
      backlogs: 0,
      placementStatus: 'Not Placed',
      campus: 'GEU Dehradun',
      batch: '2026',
    });

    // Create Drive
    const drive = await CampusDrive.create({
      recruiterProfileId: recruiterProfile._id,
      companyName: 'Pipeline Corp',
      role: 'Software Engineer',
      packageOffered: '12 LPA',
      location: 'Bangalore',
      description: 'Role description',
      allowedBranches: ['CSE'],
      minimumCGPA: 8.0,
      maxBacklogs: 0,
      eligibleBatch: '2026',
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
      status: 'Published',
    });
    console.log(`Created test campus drive ID: ${drive._id}`);

    // Create Stage 0 (Resume Screening)
    const stage0 = await RecruitmentStage.create({
      driveId: drive._id,
      stageOrder: 0,
      stageName: 'Resume Screening',
      stageType: 'Resume Screening',
      description: 'Initial screening',
      isSystemStage: true,
      isFinalStage: false,
    });
    console.log(`Created Resume Screening stage.`);

    // 2. Create recruitment stages
    const stage1 = await RecruitmentStage.create({
      driveId: drive._id,
      stageOrder: 1,
      stageName: 'Online Assessment',
      stageType: 'OA',
      description: 'HackerRank OA',
      isFinalStage: false,
    });
    const stage2 = await RecruitmentStage.create({
      driveId: drive._id,
      stageOrder: 2,
      stageName: 'Technical Interview',
      stageType: 'Technical',
      description: 'Coding Round',
      isFinalStage: false,
    });
    const stage3 = await RecruitmentStage.create({
      driveId: drive._id,
      stageOrder: 3,
      stageName: 'HR Round',
      stageType: 'HR',
      description: 'HR Fit',
      isFinalStage: true,
    });
    console.log('Created recruitment stages (OA, Technical, HR).');

    // 3. Apply to Drive & Verify Initialization
    console.log('Creating application (Applying)...');
    const application = new Application({
      studentProfileId: studentProfile._id,
      driveId: drive._id,
      applicationStatus: 'Applied',
    });

    // Run progression initializer (mimicking applyController)
    const { initializeApplication } = require('../src/services/candidateProgressionService');
    await initializeApplication(application);
    await application.save();

    console.log('Asserting initialization state...');
    if (application.currentStageId.toString() !== stage0._id.toString()) {
      throw new Error(`Expected currentStageId to be ${stage0._id}, got ${application.currentStageId}`);
    }
    if (application.pipelineStatus !== 'In Progress') {
      throw new Error(`Expected pipelineStatus to be "In Progress", got ${application.pipelineStatus}`);
    }
    console.log('✓ Stage initialization test passed!');

    // Promote student from Resume Screening (Stage 0) to Online Assessment (Stage 1)
    console.log('Promoting candidate from Stage 0 to Stage 1 (OA)...');
    await promoteCandidate(application._id, recruiterUser._id);
    const promotedApp = await Application.findById(application._id);
    if (promotedApp.currentStageId.toString() !== stage1._id.toString()) {
      throw new Error(`Expected currentStageId to be ${stage1._id} after promotion, got ${promotedApp.currentStageId}`);
    }
    console.log('✓ Stage 0 to Stage 1 promotion passed!');

    // 4. Test CSV import PASS (OA -> Technical)
    console.log('Testing CSV PASS result upload for Stage 1 (OA)...');
    const passCsv = `email,result\ntest_student@pipeline.com,PASS\n`;
    const csvStatsPass = await processCsvResults(passCsv, stage1._id, recruiterUser._id);
    
    console.log('CSV Stats:', csvStatsPass);
    if (csvStatsPass.promoted !== 1 || csvStatsPass.rejected !== 0) {
      throw new Error('CSV Stats mismatch for PASS import');
    }

    const updatedApp = await Application.findById(application._id);
    if (updatedApp.currentStageId.toString() !== stage2._id.toString()) {
      throw new Error(`Expected candidate to move to Stage 2, but currentStageId is ${updatedApp.currentStageId}`);
    }
    if (updatedApp.pipelineStatus !== 'In Progress') {
      throw new Error(`Expected pipelineStatus to be "In Progress", got ${updatedApp.pipelineStatus}`);
    }
    console.log('✓ CSV PASS result upload and promotion test passed!');

    // 5. Test CSV import FAIL (Technical -> Rejected)
    console.log('Testing CSV FAIL result upload for Stage 2 (Technical)...');
    const failCsv = `email,result\ntest_student@pipeline.com,FAIL\n`;
    const csvStatsFail = await processCsvResults(failCsv, stage2._id, recruiterUser._id);

    console.log('CSV Stats:', csvStatsFail);
    if (csvStatsFail.promoted !== 0 || csvStatsFail.rejected !== 1) {
      throw new Error('CSV Stats mismatch for FAIL import');
    }

    const rejectedApp = await Application.findById(application._id);
    if (rejectedApp.pipelineStatus !== 'Rejected') {
      throw new Error(`Expected pipelineStatus to be "Rejected", got ${rejectedApp.pipelineStatus}`);
    }
    if (rejectedApp.statusReason !== 'Failed Technical Interview') {
      throw new Error(`Expected statusReason to be "Failed Technical Interview", got "${rejectedApp.statusReason}"`);
    }
    console.log('✓ CSV FAIL result upload and rejection test passed!');

    // 6. Test progression validation rules
    console.log('Testing invalid transition rules on rejected application...');
    try {
      await promoteCandidate(rejectedApp._id, recruiterUser._id);
      throw new Error('Should have failed promoting a rejected candidate');
    } catch (err) {
      console.log(`✓ Promote rejected candidate correctly blocked: "${err.message}"`);
    }

    // Clean up
    console.log('Cleaning up test database records...');
    await User.deleteMany({ email: { $in: ['test_recruiter@pipeline.com', 'test_student@pipeline.com'] } });
    await RecruitmentStage.deleteMany({ driveId: drive._id });
    await CampusDrive.findByIdAndDelete(drive._id);
    await StudentProfile.findByIdAndDelete(studentProfile._id);
    await RecruiterProfile.findByIdAndDelete(recruiterProfile._id);
    await Application.findByIdAndDelete(application._id);

    console.log('\n=======================================');
    console.log('ALL PIPELINE TEST SUITES PASSED SUCCESSFULLY!');
    console.log('=======================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Test Suite Failed:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runTest();
