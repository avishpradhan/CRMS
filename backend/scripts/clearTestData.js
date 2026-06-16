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
const Batch = require('../src/models/Batch');
const CampusDrive = require('../src/models/CampusDrive');
const Application = require('../src/models/Application');
const Notification = require('../src/models/Notification');

const clearData = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB.');

    console.log('Clearing old test data...');
    
    const appDel = await Application.deleteMany({});
    console.log(`Deleted ${appDel.deletedCount} applications.`);

    const driveDel = await CampusDrive.deleteMany({});
    console.log(`Deleted ${driveDel.deletedCount} campus drives.`);

    const studentDel = await StudentProfile.deleteMany({});
    console.log(`Deleted ${studentDel.deletedCount} student profiles.`);

    const recruiterDel = await RecruiterProfile.deleteMany({});
    console.log(`Deleted ${recruiterDel.deletedCount} recruiter profiles.`);

    const batchDel = await Batch.deleteMany({});
    console.log(`Deleted ${batchDel.deletedCount} batches.`);

    const notifDel = await Notification.deleteMany({});
    console.log(`Deleted ${notifDel.deletedCount} notifications.`);

    // Preserve only admins
    const userDel = await User.deleteMany({ role: { $ne: 'admin' } });
    console.log(`Deleted ${userDel.deletedCount} non-admin users.`);

    const remainingAdmins = await User.find({ role: 'admin' });
    console.log(`Preserved ${remainingAdmins.length} admin user(s).`);

    console.log('Database cleanup completed successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

clearData();
