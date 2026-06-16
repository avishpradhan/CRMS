const dotenv = require('dotenv');
const dns = require('dns');
// Trigger server restart after port 5000 is released

// Force Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load environment variables BEFORE anything else
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Run database migration to ensure all student profiles have campus field
  try {
    const StudentProfile = require('./models/StudentProfile');
    const migrated = await StudentProfile.updateMany(
      { campus: { $exists: false } },
      { $set: { campus: 'GEU Dehradun' } }
    );
    if (migrated.modifiedCount > 0) {
      console.log(`Database migration complete: Added campus to ${migrated.modifiedCount} student profiles.`);
    }
  } catch (error) {
    console.error(`Database migration failed: ${error.message}`);
  }

  // Start Express server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API Health: http://localhost:${PORT}/api/health`);
  });
};

startServer();
