const dotenv = require('dotenv');
const dns = require('dns');
const path = require('path');
const mongoose = require('mongoose');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const User = require('../src/models/User');

const checkAdmin = async () => {
  try {
    await connectDB();
    console.log('Connected to DB.');
    const admins = await User.find({ role: 'admin' }).select('+password');
    console.log(`Found ${admins.length} admins:`);
    admins.forEach(admin => {
      console.log(`- ID: ${admin._id}, Email: ${admin.email}, Active: ${admin.isActive}`);
    });
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error checking admin:', err.message);
  }
};

checkAdmin();
