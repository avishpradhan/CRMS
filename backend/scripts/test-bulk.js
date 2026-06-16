const dotenv = require('dotenv');
const dns = require('dns');
const mongoose = require('mongoose');
const path = require('path');

dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const RecruiterProfile = require('../src/models/RecruiterProfile');
const Application = require('../src/models/Application');
const { bulkAdvanceApplications } = require('../src/controllers/applicationController');

async function runTest() {
  await connectDB();
  console.log('Connected to DB');

  const recruiterUser = await User.findOne({ email: 'tcs@crms.com' });
  const recruiterProfile = await RecruiterProfile.findOne({ userId: recruiterUser._id });

  const CampusDrive = require('../src/models/CampusDrive');
  const drives = await CampusDrive.find({ recruiterProfileId: recruiterProfile._id });
  const driveIds = drives.map(d => d._id);

  // Find an application in Resume Screening belonging to TCS
  const app = await Application.findOne({ driveId: { $in: driveIds } }).populate('currentStageId').populate('driveId');
  if (!app) {
    console.log('No In Progress application found for TCS drives');
    await mongoose.disconnect();
    return;
  }

  console.log('Found Application:', app._id, 'currentStage:', app.currentStageId ? app.currentStageId.stageName : 'null');

  // Mock req, res
  const req = {
    user: recruiterUser,
    body: {
      applicationIds: [app._id.toString()]
    }
  };

  const res = {
    statusCode: 200,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log('Response Status:', this.statusCode);
      console.log('Response Data:', JSON.stringify(data, null, 2));
    }
  };

  try {
    await bulkAdvanceApplications(req, res);
  } catch (err) {
    console.error('Controller failed:', err);
  }

  await mongoose.disconnect();
}

runTest();
