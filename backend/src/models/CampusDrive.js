const mongoose = require('mongoose');

const campusDriveSchema = new mongoose.Schema(
  {
    recruiterProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruiterProfile',
      required: [true, 'Recruiter profile ID is required'],
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
    },
    role: {
      type: String,
      required: [true, 'Role/position is required'],
      trim: true,
      maxlength: [200, 'Role cannot exceed 200 characters'],
    },
    packageOffered: {
      type: String,
      required: [true, 'Package is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
      default: '',
    },
    skillsRequired: {
      type: [String],
      default: [],
    },
    allowedBranches: {
      type: [String],
      required: [true, 'At least one branch is required'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one eligible branch must be specified',
      },
    },
    minimumCGPA: {
      type: Number,
      required: [true, 'Minimum CGPA is required'],
      min: [0, 'Minimum CGPA cannot be less than 0'],
      max: [10, 'Minimum CGPA cannot be greater than 10'],
      default: 0,
    },
    maxBacklogs: {
      type: Number,
      min: [0, 'Max backlogs cannot be negative'],
      default: 0,
    },
    eligibleBatch: {
      type: String,
      trim: true,
      default: '',
    },
    deadline: {
      type: Date,
      required: [true, 'Application deadline is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['Draft', 'Published', 'Closed'],
        message: '{VALUE} is not a valid drive status',
      },
      default: 'Published',
    },
    postedDate: {
      type: Date,
      default: Date.now,
    },
    attachments: [
      {
        filename: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileType: { type: String, required: true },
      }
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for eligibility engine queries, filtering, and recruiter lookups
campusDriveSchema.index({ status: 1 });
campusDriveSchema.index({ allowedBranches: 1 });
campusDriveSchema.index({ minimumCGPA: 1 });
campusDriveSchema.index({ eligibleBatch: 1 });
campusDriveSchema.index({ recruiterProfileId: 1 });
campusDriveSchema.index({ deadline: 1 });

module.exports = mongoose.model('CampusDrive', campusDriveSchema);
