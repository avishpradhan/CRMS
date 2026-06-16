const dotenv = require('dotenv');
const dns = require('dns');
const path = require('path');
const mongoose = require('mongoose');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const User = require('../src/models/User');

const testLogin = async () => {
  try {
    await connectDB();
    const admin = await User.findOne({ email: 'admin@crms.com' }).select('+password');
    if (!admin) {
      console.log('Admin user not found.');
      await mongoose.disconnect();
      return;
    }

    const test1 = await admin.matchPassword('password123');
    console.log(`Password "password123" matches: ${test1}`);

    const test2 = await admin.matchPassword('Password123');
    console.log(`Password "Password123" matches: ${test2}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error testing login:', err.message);
  }
};

testLogin();
