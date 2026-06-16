const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    studentProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: [true, 'Student profile ID is required'],
    },
    driveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CampusDrive',
      required: [true, 'Campus drive ID is required'],
    },
    applicationStatus: {
      type: String,
      enum: {
        values: ['Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'],
        message: '{VALUE} is not a valid application status',
      },
      default: 'Applied',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    currentStageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruitmentStage',
      default: null,
    },
    pipelineStatus: {
      type: String,
      enum: {
        values: ['Applied', 'In Progress', 'Rejected', 'Selected'],
        message: '{VALUE} is not a valid pipeline status',
      },
      default: 'Applied',
    },
    statusReason: {
      type: String,
      default: '',
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals for backwards compatibility with existing frontend referencing 'status' and 'appliedDate'
applicationSchema.virtual('status')
  .get(function () {
    return this.applicationStatus;
  })
  .set(function (val) {
    this.applicationStatus = val;
  });

applicationSchema.virtual('appliedDate')
  .get(function () {
    return this.appliedAt;
  })
  .set(function (val) {
    this.appliedAt = val;
  });

// Prevent duplicate applications by same student to the same drive
applicationSchema.index({ studentProfileId: 1, driveId: 1 }, { unique: true });
applicationSchema.index({ driveId: 1 });

// Automatically update student placement status to 'Placed' when application status is 'Selected'
applicationSchema.post('save', async function (doc) {
  if (doc.applicationStatus === 'Selected' || doc.pipelineStatus === 'Selected') {
    try {
      const StudentProfile = mongoose.model('StudentProfile');
      await StudentProfile.findByIdAndUpdate(doc.studentProfileId, {
        placementStatus: 'Placed',
      });
    } catch (err) {
      console.error('Error updating StudentProfile placementStatus to Placed:', err);
    }
  }
});

module.exports = mongoose.model('Application', applicationSchema);

