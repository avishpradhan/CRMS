const dotenv = require('dotenv');
const dns = require('dns');
const path = require('path');
const mongoose = require('mongoose');

// Force Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const Application = require('../src/models/Application');
const RecruitmentStage = require('../src/models/RecruitmentStage');

const migrateApplications = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB.');

    console.log('Starting Applications migration...');
    const applications = await Application.find({});
    console.log(`Found ${applications.length} applications to process.`);

    let migratedCount = 0;

    for (const app of applications) {
      let changed = false;

      // 1. Backfill pipelineStatus based on applicationStatus if it's default/Applied or empty
      if (!app.pipelineStatus || app.pipelineStatus === 'Applied') {
        const oldStatus = app.applicationStatus;
        let newPipelineStatus = 'Applied';

        if (oldStatus === 'Selected') {
          newPipelineStatus = 'Selected';
        } else if (oldStatus === 'Rejected') {
          newPipelineStatus = 'Rejected';
        } else if (oldStatus === 'Shortlisted' || oldStatus === 'Interview Scheduled') {
          newPipelineStatus = 'In Progress';
        }

        app.pipelineStatus = newPipelineStatus;
        changed = true;
      }

      // 2. Fetch the first stage for the drive
      const firstStage = await RecruitmentStage.findOne({ driveId: app.driveId }).sort({ stageOrder: 1 });
      if (firstStage) {
        if (!app.currentStageId || app.currentStageId.toString() !== firstStage._id.toString()) {
          app.currentStageId = firstStage._id;
          // If a stage is configured, candidates should be In Progress rather than Applied
          if (app.pipelineStatus === 'Applied') {
            app.pipelineStatus = 'In Progress';
            app.applicationStatus = 'Shortlisted'; // sync old status
          }
          changed = true;
        }
      }

      if (changed) {
        await app.save();
        migratedCount++;
      }
    }

    console.log(`Successfully migrated ${migratedCount} applications.`);
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

migrateApplications();
