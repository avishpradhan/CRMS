const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const { sendResponse, sendError } = require('../utils/response');

/**
 * @desc    Get all students (merged User and Profile)
 * @route   GET /api/admin/students
 * @access  Private (Admin Only)
 */
const getAllStudents = async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
    const profiles = await StudentProfile.find().populate('batchId');

    // Fetch all batches to resolve invite codes
    const Batch = require('../models/Batch');
    const batches = await Batch.find();
    const batchMapByCode = {};
    batches.forEach(b => {
      if (b.inviteCode) {
        batchMapByCode[b.inviteCode.toUpperCase()] = b.canonicalBatch;
      }
    });

    const profileMap = {};
    profiles.forEach(p => {
      profileMap[p.userId.toString()] = p;
    });

    const students = users.map(user => {
      const profile = profileMap[user._id.toString()];
      
      let batchName = '';
      if (profile && profile.batch) {
        batchName = profile.batch; // Already canonicalBatch
      } else if (profile && profile.batchId) {
        batchName = profile.batchId.canonicalBatch;
      } else if (user.inviteCode) {
        batchName = batchMapByCode[user.inviteCode.toUpperCase()] || '';
      }

      return {
        _id: profile ? profile._id : null,
        userId: user,
        phone: profile ? profile.phone : '',
        universityRollNo: profile ? profile.universityRollNo : '',
        classRollNo: profile ? profile.classRollNo : '',
        branch: profile ? profile.branch : 'Not Profiled',
        semester: profile ? profile.semester : null,
        section: profile ? profile.section : '',
        cgpa: profile ? profile.cgpa : null,
        skills: profile ? profile.skills : [],
        projects: profile ? profile.projects : [],
        resumeUrl: profile ? profile.resumeUrl : '',
        linkedinUrl: profile ? profile.linkedinUrl : '',
        githubUrl: profile ? profile.githubUrl : '',
        backlogs: profile ? profile.backlogs : 0,
        placementStatus: profile ? profile.placementStatus : 'Not Placed',
        batch: batchName,
        campus: profile ? profile.campus : 'GEU Dehradun',
        createdAt: profile ? profile.createdAt : user.createdAt,
      };
    });

    sendResponse(res, 200, 'All students retrieved successfully', students);
  } catch (error) {
    console.error('Get All Students Error:', error);
    return sendError(res, 500, 'Server error during student retrieval');
  }
};

/**
 * @desc    Update a student (User and/or Profile)
 * @route   PUT /api/admin/students/:userId
 * @access  Private (Admin Only)
 */
const updateStudent = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      fullName,
      email,
      branch,
      cgpa,
      placementStatus,
      backlogs,
      batch,
      campus,
      phone,
      universityRollNo,
      classRollNo,
      section,
      semester,
      skills,
      projects,
      resumeUrl,
      linkedinUrl,
      githubUrl
    } = req.body;

    // 1. Update User model fields if provided
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    await user.save();

    // Find if batch exists for this canonical batch string
    let resolvedBatchId = null;
    if (batch) {
      const Batch = require('../models/Batch');
      const foundBatch = await Batch.findOne({ canonicalBatch: batch.trim() });
      if (foundBatch) {
        resolvedBatchId = foundBatch._id;
      }
    }

    // 2. Update or Upsert StudentProfile model fields
    let profile = await StudentProfile.findOne({ userId });
    if (!profile) {
      // Create a partial profile if it doesn't exist yet to support unprofiled students
      profile = new StudentProfile({
        userId,
        phone: phone || '0000000000',
        universityRollNo: universityRollNo || `ROLL-${Date.now()}`,
        classRollNo: classRollNo || `CLASS-${Date.now()}`,
        branch: branch || 'CSE',
        semester: semester || 1,
        section: section || 'A',
        cgpa: cgpa != null ? cgpa : 0.0,
        skills: skills || ['Default Skill'],
        projects: projects || [{ title: 'Initial Project', description: 'Created by Admin', tech: 'MERN' }],
        resumeUrl: resumeUrl || '/uploads/resumes/default.pdf',
        linkedinUrl: linkedinUrl || 'https://linkedin.com',
        githubUrl: githubUrl || 'https://github.com',
        backlogs: backlogs != null ? backlogs : 0,
        placementStatus: placementStatus || 'Not Placed',
        batch: batch || '',
        batchId: resolvedBatchId,
        campus: campus || 'GEU Dehradun',
      });
    } else {
      // Update fields
      if (branch) profile.branch = branch;
      if (cgpa != null) profile.cgpa = cgpa;
      if (placementStatus) profile.placementStatus = placementStatus;
      if (backlogs != null) profile.backlogs = backlogs;
      if (batch != null) {
        profile.batch = batch;
        profile.batchId = resolvedBatchId;
      }
      if (campus) profile.campus = campus;
      if (phone !== undefined) profile.phone = phone;
      if (universityRollNo !== undefined) profile.universityRollNo = universityRollNo;
      if (classRollNo !== undefined) profile.classRollNo = classRollNo;
      if (section !== undefined) profile.section = section;
      if (semester !== undefined) profile.semester = semester;
      if (resumeUrl !== undefined) profile.resumeUrl = resumeUrl;
      if (linkedinUrl !== undefined) profile.linkedinUrl = linkedinUrl;
      if (githubUrl !== undefined) profile.githubUrl = githubUrl;

      // Handle skills array/string parsing
      if (skills !== undefined) {
        if (typeof skills === 'string') {
          profile.skills = skills
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        } else if (Array.isArray(skills)) {
          profile.skills = skills.map((s) => s.trim()).filter((s) => s.length > 0);
        }
      }

      // Handle projects update
      if (projects !== undefined) {
        profile.projects = projects;
      }
    }

    await profile.save();

    const updatedStudent = {
      _id: profile._id,
      userId: user,
      phone: profile.phone,
      universityRollNo: profile.universityRollNo,
      classRollNo: profile.classRollNo,
      branch: profile.branch,
      semester: profile.semester,
      section: profile.section,
      cgpa: profile.cgpa,
      skills: profile.skills,
      projects: profile.projects,
      resumeUrl: profile.resumeUrl,
      linkedinUrl: profile.linkedinUrl,
      githubUrl: profile.githubUrl,
      backlogs: profile.backlogs,
      placementStatus: profile.placementStatus,
      batch: profile.batch,
      campus: profile.campus,
      createdAt: profile.createdAt,
    };

    sendResponse(res, 200, 'Student updated successfully', updatedStudent);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return sendError(res, 400, messages.join(', '));
    }
    console.error('Update Student Error:', error);
    return sendError(res, 500, 'Server error during student update');
  }
};

/**
 * @desc    Delete a student (User and Profile)
 * @route   DELETE /api/admin/students/:userId
 * @access  Private (Admin Only)
 */
const deleteStudent = async (req, res) => {
  try {
    const { userId } = req.params;

    // Delete profile
    await StudentProfile.findOneAndDelete({ userId });

    // Delete user
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    sendResponse(res, 200, 'Student deleted successfully', null);
  } catch (error) {
    console.error('Delete Student Error:', error);
    return sendError(res, 500, 'Server error during student deletion');
  }
};

module.exports = {
  getAllStudents,
  updateStudent,
  deleteStudent,
};
