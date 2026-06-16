/**
 * Admin Seed Script
 *
 * Run once to create the default admin account:
 *   cd backend && node seed.js
 *
 * Default admin credentials:
 *   Email:    admin@crms.com
 *   Password: password123
 */

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const dns = require('dns');

// Force Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const User = require('./src/models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...');

    const existingAdmin = await User.findOne({ email: 'admin@crms.com' });

    if (existingAdmin) {
      console.log('Admin account already exists. Skipping seed.');
    } else {
      await User.create({
        fullName: 'Dr. Rajesh Kumar',
        email: 'admin@crms.com',
        password: 'password123',
        role: 'admin',
        isActive: true,
      });
      console.log('Admin account created successfully!');
      console.log('  Email:    admin@crms.com');
      console.log('  Password: password123');
    }

    await mongoose.disconnect();
    console.log('Seed complete. MongoDB disconnected.');
    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
