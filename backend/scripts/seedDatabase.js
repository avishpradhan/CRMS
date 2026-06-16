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
const { checkEligibility } = require('../src/services/eligibilityService');

// Indian Names Generators
const firstNames = [
  'Avish', 'Rahul', 'Priya', 'Aman', 'Sneha', 'Abhishek', 'Aditi', 'Amit', 'Anjali', 'Arjun',
  'Deepak', 'Divya', 'Gaurav', 'Isha', 'Karan', 'Kavita', 'Manish', 'Neha', 'Pankaj', 'Payal',
  'Rajesh', 'Ritu', 'Sanjay', 'Shalini', 'Vikram', 'Pooja', 'Rohan', 'Swati', 'Vijay', 'Kiran',
  'Aditya', 'Aishwarya', 'Alok', 'Aniket', 'Anusha', 'Bhupendra', 'Devika', 'Gaurav', 'Harish', 'Jyoti'
];
const lastNames = [
  'Pradhan', 'Sharma', 'Singh', 'Verma', 'Gupta', 'Kumar', 'Joshi', 'Mehta', 'Patel', 'Reddy',
  'Chawla', 'Deshmukh', 'Rao', 'Nair', 'Sen', 'Dutta', 'Mishra', 'Trivedi', 'Bose', 'Ray',
  'Yadav', 'Choudhury', 'Pandey', 'Saxena', 'Kapoor', 'Malhotra', 'Sinha', 'Aggarwal', 'Soni', 'Bhat',
  'Rastogi', 'Dwivedi', 'Kulkarni', 'Naidu', 'Chakraborty', 'Mukherjee', 'Menon', 'Jha', 'Pathak', 'Dubey'
];

const generatedNames = new Set();
function getUniqueName() {
  let name = '';
  do {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    name = `${fn} ${ln}`;
  } while (generatedNames.has(name) && generatedNames.size < 500);
  generatedNames.add(name);
  return name;
}

const skillsList = [
  'React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'TypeScript', 'Python', 'Java', 'C++',
  'SQL', 'Git', 'Docker', 'AWS', 'HTML', 'CSS', 'Redux', 'Spring Boot', 'Django', 'Flask'
];

const projectTemplates = [
  { title: 'E-Commerce App', description: 'A full-stack e-commerce website with payment gateway integration and dynamic cart.', tech: 'React, Node.js, Express, MongoDB' },
  { title: 'Real-Time Chat', description: 'A real-time messaging application with private rooms and message history.', tech: 'HTML, CSS, Node.js, Socket.io' },
  { title: 'Task Manager API', description: 'RESTful API for managing tasks and lists with user JWT authentication.', tech: 'Node.js, Express, MongoDB, JWT' },
  { title: 'Personal Portfolio', description: 'Responsive personal website displaying projects, resume and contact forms.', tech: 'React, Tailwind CSS, EmailJS' },
  { title: 'Weather Forecast Hub', description: 'Weather forecasting dashboard with geographical search and history caching.', tech: 'React, OpenWeather API, LocalStorage' },
  { title: 'Online Quiz Platform', description: 'Interactive portal with timed quizzes, leaderboards, and instant grade evaluation.', tech: 'Angular, Spring Boot, PostgreSQL' },
  { title: 'Library Management System', description: 'Database application to issue, return and track availability of textbooks.', tech: 'Python, Flask, SQLite' }
];

const recruiterCompanies = [
  { name: 'TCS', email: 'tcs@crms.com', industry: 'IT Services', size: '10000+', website: 'https://tcs.com', headquarters: 'Mumbai', contactPerson: 'Rohan Sharma' },
  { name: 'Infosys', email: 'infosys@crms.com', industry: 'IT Services', size: '10000+', website: 'https://infosys.com', headquarters: 'Bangalore', contactPerson: 'Aditi Verma' },
  { name: 'Wipro', email: 'wipro@crms.com', industry: 'IT Services', size: '10000+', website: 'https://wipro.com', headquarters: 'Bangalore', contactPerson: 'Amit Singh' },
  { name: 'Accenture', email: 'accenture@crms.com', industry: 'Management Consulting', size: '10000+', website: 'https://accenture.com', headquarters: 'Dublin', contactPerson: 'Sanjay Kumar' },
  { name: 'Cognizant', email: 'cognizant@crms.com', industry: 'IT Services', size: '10000+', website: 'https://cognizant.com', headquarters: 'Teaneck, NJ', contactPerson: 'Priya Patel' },
  { name: 'Capgemini', email: 'capgemini@crms.com', industry: 'IT Services', size: '10000+', website: 'https://capgemini.com', headquarters: 'Paris', contactPerson: 'Nikhil Sen' },
  { name: 'HCL', email: 'hcl@crms.com', industry: 'IT Services', size: '10000+', website: 'https://hcltech.com', headquarters: 'Noida', contactPerson: 'Karan Malhotra' },
  { name: 'Tech Mahindra', email: 'techmahindra@crms.com', industry: 'IT Services', size: '10000+', website: 'https://techmahindra.com', headquarters: 'Pune', contactPerson: 'Ritu Gupta' },
  { name: 'LTIMindtree', email: 'ltimindtree@crms.com', industry: 'IT Services', size: '10000+', website: 'https://ltimindtree.com', headquarters: 'Mumbai', contactPerson: 'Vijay Deshmukh' },
  { name: 'Persistent', email: 'persistent@crms.com', industry: 'Software Products', size: '5001-10000', website: 'https://persistent.com', headquarters: 'Pune', contactPerson: 'Sneha Rao' }
];

const driveRoles = [
  'Associate Software Engineer', 'Software Developer', 'Graduate Engineer Trainee', 'System Engineer',
  'Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'Cloud Engineer', 'QA Automation Engineer'
];
const packages = ['4.5 LPA', '6.0 LPA', '8.5 LPA', '12.0 LPA', '15.0 LPA', '18.0 LPA', '5.2 LPA', '7.0 LPA', '10.0 LPA'];
const locations = ['Bangalore', 'Pune', 'Hyderabad', 'Noida', 'Gurugram', 'Remote', 'Mumbai', 'Chennai'];

const seedData = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB.');

    // 1. CLEANUP PREVIOUS DATA
    console.log('\nStarting database cleanup (Full Reset Mode)...');
    await Application.deleteMany({});
    await CampusDrive.deleteMany({});
    await StudentProfile.deleteMany({});
    await RecruiterProfile.deleteMany({});
    await Batch.deleteMany({});
    await Notification.deleteMany({});
    
    // Delete non-admin users
    const deleteUsersRes = await User.deleteMany({ role: { $ne: 'admin' } });
    console.log(`Deleted ${deleteUsersRes.deletedCount} non-admin user accounts.`);

    // Check admin existence
    const adminUsers = await User.find({ role: 'admin' });
    let adminId;
    if (adminUsers.length === 0) {
      console.log('No existing administrator account found. Seeding default Admin user...');
      const defaultAdmin = await User.create({
        fullName: 'System Administrator',
        email: 'admin@crms.com',
        password: 'password123',
        role: 'admin',
        isActive: true
      });
      adminId = defaultAdmin._id;
      adminUsers.push(defaultAdmin);
    } else {
      adminId = adminUsers[0]._id;
    }

    // 2. SEED BATCHES
    console.log('\nSeeding Batches...');
    const batchData = [
      { batchName: 'Batch 2023-2027', startYear: 2023, endYear: 2027, inviteCode: 'CRMS-7XK29P', description: 'CSE/IT/ECE 2023-2027 Batch', createdBy: adminId },
      { batchName: 'Batch 2024-2028', startYear: 2024, endYear: 2028, inviteCode: 'CRMS-5GH82A', description: 'CSE/IT/ECE 2024-2028 Batch', createdBy: adminId },
      { batchName: 'Batch 2025-2029', startYear: 2025, endYear: 2029, inviteCode: 'CRMS-9XT41B', description: 'CSE/IT/ECE 2025-2029 Batch', createdBy: adminId }
    ];

    const seededBatches = await Batch.create(batchData);
    console.log(`Seeded ${seededBatches.length} batches.`);

    // 3. SEED RECRUITERS
    console.log('\nSeeding Recruiters...');
    const recruitersList = [];
    for (const comp of recruiterCompanies) {
      const user = await User.create({
        fullName: `${comp.name} Recruiter`,
        email: comp.email,
        password: 'Password123',
        role: 'recruiter',
        isActive: true
      });

      const profile = await RecruiterProfile.create({
        userId: user._id,
        companyName: comp.name,
        companyWebsite: comp.website,
        companyEmail: comp.email,
        industry: comp.industry,
        companySize: comp.size,
        companyDescription: `Leading multinational provider of ${comp.industry} services and enterprise software solutions globally.`,
        headquarters: comp.headquarters,
        contactPerson: comp.contactPerson,
        contactPhone: `91${Math.floor(7000000000 + Math.random() * 2999999999)}`,
        verificationStatus: 'Approved'
      });

      recruitersList.push(profile);
    }
    console.log(`Seeded ${recruitersList.length} approved recruiter profiles.`);

    // 4. SEED STUDENTS
    console.log('\nSeeding 100 Students...');
    const studentProfiles = [];
    const branches = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE'];
    const campuses = ['GEU Dehradun', 'GEHU Dehradun', 'GEHU Bhimtal', 'GEHU Haldwani'];

    for (let i = 1; i <= 100; i++) {
      // Determine batch assignment
      let batchDoc;
      if (i <= 40) {
        batchDoc = seededBatches[0]; // 2023-2027
      } else if (i <= 75) {
        batchDoc = seededBatches[1]; // 2024-2028
      } else {
        batchDoc = seededBatches[2]; // 2025-2029
      }

      const name = getUniqueName();
      const email = `student${i}@crms.com`;
      
      const user = await User.create({
        fullName: name,
        email: email,
        password: 'Password123',
        role: 'student',
        isActive: true,
        inviteCode: batchDoc.inviteCode
      });

      // Randomized fields
      const branch = branches[Math.floor(Math.random() * branches.length)];
      const campus = campuses[Math.floor(Math.random() * campuses.length)];
      const cgpa = parseFloat((6.0 + Math.random() * 3.8).toFixed(2));
      
      // Backlogs distribution (mostly 0, some 1, few 2)
      let backlogs = 0;
      const backlogRand = Math.random();
      if (backlogRand > 0.95) {
        backlogs = 2;
      } else if (backlogRand > 0.85) {
        backlogs = 1;
      }

      // Skills selection
      const numSkills = 3 + Math.floor(Math.random() * 4);
      const shuffledSkills = [...skillsList].sort(() => 0.5 - Math.random());
      const skills = shuffledSkills.slice(0, numSkills);

      // Projects selection
      const numProjs = 1 + Math.floor(Math.random() * 2);
      const shuffledProjs = [...projectTemplates].sort(() => 0.5 - Math.random());
      const studentProjects = shuffledProjs.slice(0, numProjs).map(p => ({
        title: p.title,
        description: p.description,
        tech: p.tech
      }));

      const nameSlug = name.toLowerCase().replace(/\s+/g, '');
      const profile = await StudentProfile.create({
        userId: user._id,
        phone: `91${Math.floor(7000000000 + Math.random() * 2999999999)}`,
        universityRollNo: `2022GEU${i.toString().padStart(4, '0')}`,
        classRollNo: `${branch}-${Math.floor(10 + Math.random() * 90)}`,
        branch: branch,
        semester: 2 * (batchDoc.endYear - 2026) + (Math.random() > 0.5 ? 1 : 0) || 1, // dynamically map sem
        section: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
        cgpa: cgpa,
        skills: skills,
        projects: studentProjects,
        resumeUrl: `/uploads/resumes/resume_student${i}.pdf`,
        linkedinUrl: `https://linkedin.com/in/${nameSlug}`,
        githubUrl: `https://github.com/${nameSlug}`,
        backlogs: backlogs,
        placementStatus: 'Not Placed',
        campus: campus,
        batch: batchDoc.canonicalBatch,
        batchId: batchDoc._id
      });

      studentProfiles.push(profile);
    }
    console.log(`Seeded ${studentProfiles.length} student profiles and mapped batches.`);

    // 5. SEED PLACEMENT DRIVES
    console.log('\nSeeding 25 Placement Drives...');
    const drivesList = [];
    for (let i = 1; i <= 25; i++) {
      const recruiter = recruitersList[Math.floor(Math.random() * recruitersList.length)];
      const role = driveRoles[Math.floor(Math.random() * driveRoles.length)];
      const packageOffered = packages[Math.floor(Math.random() * packages.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      // CGPA requirements
      const minimumCGPA = [6.0, 6.5, 7.0, 7.5, 8.0][Math.floor(Math.random() * 5)];
      const maxBacklogs = [0, 1, 2][Math.floor(Math.random() * 3)];
      
      // Allowed branches
      const numBranches = 2 + Math.floor(Math.random() * 4);
      const shuffledBranches = [...branches].sort(() => 0.5 - Math.random());
      const allowedBranches = shuffledBranches.slice(0, numBranches);
      if (!allowedBranches.includes('CSE')) allowedBranches.push('CSE'); // Ensure CSE is mostly present

      // Eligible batches (combinations)
      let eligibleBatchStr = '';
      const batchRand = Math.random();
      if (batchRand > 0.7) {
        eligibleBatchStr = '2023-2027, 2024-2028';
      } else if (batchRand > 0.5) {
        eligibleBatchStr = '2023-2027';
      } else if (batchRand > 0.3) {
        eligibleBatchStr = '2024-2028';
      } else {
        eligibleBatchStr = '2025-2029';
      }

      const numDrivesSkills = 2 + Math.floor(Math.random() * 3);
      const shuffledDriveSkills = [...skillsList].sort(() => 0.5 - Math.random());

      const drive = await CampusDrive.create({
        recruiterProfileId: recruiter._id,
        companyName: recruiter.companyName,
        role: role,
        packageOffered: packageOffered,
        location: location,
        description: `Exciting career opportunity at ${recruiter.companyName} for a motivated ${role}. Join our high performing software development teams to work on innovative products.`,
        skillsRequired: shuffledDriveSkills.slice(0, numDrivesSkills),
        allowedBranches: allowedBranches,
        minimumCGPA: minimumCGPA,
        maxBacklogs: maxBacklogs,
        eligibleBatch: eligibleBatchStr,
        deadline: new Date(Date.now() + (15 + Math.random() * 30) * 24 * 60 * 60 * 1000), // 15-45 days in future
        status: 'Published'
      });

      drivesList.push(drive);
    }
    console.log(`Seeded ${drivesList.length} published placement drives.`);

    // 6. SEED APPLICATIONS
    console.log('\nEvaluating eligibility and seeding applications (300-500)...');
    const eligiblePairings = [];
    
    for (const drive of drivesList) {
      for (const student of studentProfiles) {
        const check = checkEligibility(student, drive);
        if (check.eligible) {
          eligiblePairings.push({ student, drive });
        }
      }
    }

    console.log(`Found ${eligiblePairings.length} eligible student-drive combinations.`);

    // Shuffle pairings
    const shuffledPairings = eligiblePairings.sort(() => 0.5 - Math.random());
    
    // Choose around 400 applications
    const targetApplicationsCount = Math.min(400, shuffledPairings.length);
    const selectedPairings = shuffledPairings.slice(0, targetApplicationsCount);
    
    let createdAppsCount = 0;
    for (const pair of selectedPairings) {
      // Random status
      const statusRand = Math.random();
      let applicationStatus = 'Applied';
      if (statusRand > 0.9) {
        applicationStatus = 'Rejected';
      } else if (statusRand > 0.7) {
        applicationStatus = 'Interview Scheduled';
      } else if (statusRand > 0.4) {
        applicationStatus = 'Shortlisted';
      }

      await Application.create({
        studentProfileId: pair.student._id,
        driveId: pair.drive._id,
        applicationStatus: applicationStatus,
        appliedAt: new Date(Date.now() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000)) // 1-5 days ago
      });

      createdAppsCount++;
    }
    console.log(`Seeded ${createdAppsCount} valid student applications successfully.`);

    // 7. PRINT OUTPUT FOR MANUAL TESTING
    console.log('\n==================================================');
    console.log('=== BATCHES ===');
    seededBatches.forEach(b => {
      console.log(`${b.canonicalBatch} -> ${b.inviteCode}`);
    });
    console.log('==================================================');
    
    console.log('\n=== STUDENT TEST ACCOUNTS ===');
    console.log('student1@crms.com / Password123');
    console.log('student2@crms.com / Password123');
    console.log('student3@crms.com / Password123');
    console.log('... up to student100@crms.com');
    console.log('==================================================');

    console.log('\n=== RECRUITER TEST ACCOUNTS ===');
    recruiterCompanies.slice(0, 3).forEach(c => {
      console.log(`${c.email} / Password123`);
    });
    console.log('... up to remaining recruiters');
    console.log('==================================================');

    console.log('\n=== ADMIN ACCOUNTS PRESERVED ===');
    adminUsers.forEach(admin => {
      console.log(`${admin.email}`);
    });
    console.log('==================================================\n');

    await mongoose.disconnect();
    console.log('Seeder disconnected successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed with error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedData();
