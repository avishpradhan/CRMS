const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\+?[0-9]{10,15}$/, 'Please enter a valid phone number (10 to 15 digits)'],
    },
    universityRollNo: {
      type: String,
      required: [true, 'University Roll Number is required'],
      unique: true,
      trim: true,
    },
    classRollNo: {
      type: String,
      required: [true, 'Class Roll Number is required'],
      trim: true,
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      enum: {
        values: ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'Other'],
        message: '{VALUE} is not a valid branch',
      },
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester cannot be less than 1'],
      max: [10, 'Semester cannot be greater than 10'],
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      trim: true,
    },
    cgpa: {
      type: Number,
      required: [true, 'CGPA is required'],
      min: [0, 'CGPA cannot be less than 0'],
      max: [10, 'CGPA cannot be greater than 10'],
    },
    skills: {
      type: [String],
      required: [true, 'Skills array is required'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one skill is required',
      },
    },
    projects: {
      type: [
        {
          title: {
            type: String,
            required: [true, 'Project title is required'],
          },
          description: {
            type: String,
            required: [true, 'Project description is required'],
          },
          tech: {
            type: String,
            required: [true, 'Project tech stack is required'],
          },
          projectUrl: {
            type: String,
            default: '',
            trim: true,
            validate: {
              validator: function (v) {
                if (!v) return true;
                return /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/.test(v);
              },
              message: 'Please enter a valid project URL',
            },
          },
        },
      ],
      required: [true, 'Projects array is required'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one project is required',
      },
    },
    resumeUrl: {
      type: String,
      required: [true, 'Resume URL is required'],
      trim: true,
    },
    linkedinUrl: {
      type: String,
      required: [true, 'LinkedIn URL is required'],
      trim: true,
      match: [
        /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
        'Please enter a valid LinkedIn URL',
      ],
    },
    githubUrl: {
      type: String,
      required: [true, 'GitHub URL is required'],
      trim: true,
      match: [
        /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
        'Please enter a valid GitHub URL',
      ],
    },
    backlogs: {
      type: Number,
      required: [true, 'Backlogs count is required'],
      default: 0,
      min: [0, 'Backlogs cannot be less than 0'],
    },
    placementStatus: {
      type: String,
      required: [true, 'Placement status is required'],
      enum: {
        values: ['Not Placed', 'Placed'],
        message: '{VALUE} is not a valid placement status',
      },
      default: 'Not Placed',
    },
    campus: {
      type: String,
      required: [true, 'Campus is required'],
      enum: {
        values: ['GEU Dehradun', 'GEHU Dehradun', 'GEHU Bhimtal', 'GEHU Haldwani'],
        message: '{VALUE} is not a valid campus',
      },
      default: 'GEU Dehradun',
    },
    batch: {
      type: String,
      trim: true,
      default: '',
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for fields used by Eligibility Engine, filtering, and stats
studentProfileSchema.index({ branch: 1 });
studentProfileSchema.index({ cgpa: 1 });
studentProfileSchema.index({ backlogs: 1 });
studentProfileSchema.index({ skills: 1 });
studentProfileSchema.index({ placementStatus: 1 });
studentProfileSchema.index({ batch: 1 });
studentProfileSchema.index({ batchId: 1 });
studentProfileSchema.index({ campus: 1 });


module.exports = mongoose.model('StudentProfile', studentProfileSchema);
