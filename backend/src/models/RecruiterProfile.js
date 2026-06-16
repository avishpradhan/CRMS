const mongoose = require('mongoose');

const recruiterProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
    },
    companyWebsite: {
      type: String,
      required: [true, 'Company website is required'],
      trim: true,
      match: [
        /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
        'Please enter a valid website URL',
      ],
    },
    companyEmail: {
      type: String,
      required: [true, 'Company email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid company email address'],
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      trim: true,
      maxlength: [100, 'Industry cannot exceed 100 characters'],
    },
    companySize: {
      type: String,
      required: [true, 'Company size is required'],
      trim: true,
      enum: {
        values: [
          '1-10',
          '11-50',
          '51-200',
          '201-500',
          '501-1000',
          '1001-5000',
          '5001-10000',
          '10000+',
        ],
        message: '{VALUE} is not a valid company size',
      },
    },
    companyDescription: {
      type: String,
      required: [true, 'Company description is required'],
      trim: true,
      maxlength: [2000, 'Company description cannot exceed 2000 characters'],
    },
    headquarters: {
      type: String,
      required: [true, 'Headquarters location is required'],
      trim: true,
      maxlength: [200, 'Headquarters cannot exceed 200 characters'],
    },
    contactPerson: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
      maxlength: [100, 'Contact person name cannot exceed 100 characters'],
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
      match: [
        /^\+?[0-9]{10,15}$/,
        'Please enter a valid phone number (10 to 15 digits)',
      ],
    },
    logoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ['Pending', 'Approved', 'Rejected', 'Suspended'],
        message: '{VALUE} is not a valid verification status',
      },
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for admin queries, filtering, and future CampusDrive lookups
recruiterProfileSchema.index({ verificationStatus: 1 });
recruiterProfileSchema.index({ companyName: 1 });
recruiterProfileSchema.index({ industry: 1 });

module.exports = mongoose.model('RecruiterProfile', recruiterProfileSchema);
