const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    batchName: {
      type: String,
      required: [true, 'Batch display name is required'],
      unique: true,
      trim: true,
    },
    startYear: {
      type: Number,
      required: [true, 'Start year is required'],
    },
    endYear: {
      type: Number,
      required: [true, 'End year is required'],
      validate: {
        validator: function (val) {
          return !this.startYear || this.startYear < val;
        },
        message: 'Start year must be less than end year',
      },
    },
    canonicalBatch: {
      type: String,
      unique: true,
      trim: true,
    },
    inviteCode: {
      type: String,
      required: [true, 'Invite code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator reference (Admin) is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate canonicalBatch and enforce startYear < endYear
batchSchema.pre('save', function (next) {
  if (this.startYear && this.endYear) {
    if (this.startYear >= this.endYear) {
      return next(new Error('Start year must be less than end year'));
    }
    this.canonicalBatch = `${this.startYear}-${this.endYear}`;
  }
  next();
});


module.exports = mongoose.model('Batch', batchSchema);
