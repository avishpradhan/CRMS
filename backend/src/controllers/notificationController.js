const Notification = require('../models/Notification');
const { sendResponse, sendError } = require('../utils/response');

/**
 * @desc    Get current user's notifications
 * @route   GET /api/notifications
 * @access  Private
 */
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id,
      forRole: req.user.role,
    }).sort({ createdAt: -1 });

    sendResponse(res, 200, 'Notifications retrieved successfully', notifications);
  } catch (error) {
    console.error('Get Notifications Error:', error);
    return sendError(res, 500, 'Server error during notifications retrieval');
  }
};

/**
 * @desc    Mark a notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
const markRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return sendError(res, 404, 'Notification not found or unauthorized');
    }

    sendResponse(res, 200, 'Notification marked as read', notification);
  } catch (error) {
    console.error('Mark Notification Read Error:', error);
    return sendError(res, 500, 'Server error during marking notification read');
  }
};

/**
 * @desc    Mark all notifications for the user's role as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, forRole: req.user.role, read: false },
      { read: true }
    );

    sendResponse(res, 200, 'All notifications marked as read', null);
  } catch (error) {
    console.error('Mark All Notifications Read Error:', error);
    return sendError(res, 500, 'Server error during marking all notifications read');
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return sendError(res, 404, 'Notification not found or unauthorized');
    }

    sendResponse(res, 200, 'Notification deleted successfully', null);
  } catch (error) {
    console.error('Delete Notification Error:', error);
    return sendError(res, 500, 'Server error during notification deletion');
  }
};

/**
 * @desc    Delete all notifications for the user's role
 * @route   DELETE /api/notifications/clear-all
 * @access  Private
 */
const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({
      userId: req.user._id,
      forRole: req.user.role,
    });

    sendResponse(res, 200, 'All notifications cleared successfully', null);
  } catch (error) {
    console.error('Clear All Notifications Error:', error);
    return sendError(res, 500, 'Server error during clearing notifications');
  }
};

module.exports = {
  getMyNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
};
