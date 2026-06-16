const mongoose = require('mongoose');

const recruitmentStageSchema = new mongoose.Schema(
  {
    driveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CampusDrive',
      required: [true, 'Campus drive ID is required'],
    },
    stageOrder: {
      type: Number,
      required: [true, 'Stage order is required'],
    },
    stageName: {
      type: String,
      required: [true, 'Stage name is required'],
      trim: true,
    },
    stageType: {
      type: String,
      enum: {
        values: [
          'Resume Screening',
          'Online Assessment',
          'Technical Interview',
          'HR Interview',
          'Group Discussion',
          'Assignment',
          'Document Verification',
          'Custom'
        ],
        message: '{VALUE} is not a valid stage type',
      },
      required: [true, 'Stage type is required'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isSystemStage: {
      type: Boolean,
      default: false,
    },
    isFinalStage: {
      type: Boolean,
      default: false,
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
    attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
      }
    ],
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate stage orders within the same campus drive
recruitmentStageSchema.index({ driveId: 1, stageOrder: 1 }, { unique: true });
recruitmentStageSchema.index({ driveId: 1 });

module.exports = mongoose.model('RecruitmentStage', recruitmentStageSchema);
