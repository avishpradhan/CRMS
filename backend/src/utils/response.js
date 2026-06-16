/**
 * Consistent API response helpers.
 * All controllers use these to ensure uniform response format.
 *
 * Success: { success: true, message: "...", data: {...} }
 * Error:   { success: false, message: "..." }
 */

const sendResponse = (res, statusCode, message, data = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({ success: false, message });
};

module.exports = { sendResponse, sendError };
