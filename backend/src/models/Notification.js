const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient User ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['info', 'success', 'warning', 'danger'],
        message: '{VALUE} is not a valid notification type',
      },
      default: 'info',
    },
    read: {
      type: Boolean,
      default: false,
    },
    forRole: {
      type: String,
      enum: {
        values: ['student', 'recruiter', 'admin'],
        message: '{VALUE} is not a valid role for notification',
      },
      required: [true, 'Target role is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast query of unread notifications for a specific user
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
