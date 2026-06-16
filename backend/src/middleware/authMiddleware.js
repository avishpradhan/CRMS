const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/response');

/**
 * Protect middleware — verifies JWT and attaches req.user.
 *
 * Usage: router.get('/route', protect, handler)
 *
 * Reads token from: Authorization: Bearer <token>
 * Future: Can also read from cookies by adding cookie-parser.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 401, 'Not authorized, no token provided');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB (exclude password)
    const user = await User.findById(decoded.userId);

    if (!user) {
      return sendError(res, 401, 'Not authorized, user not found');
    }

    if (!user.isActive) {
      return sendError(res, 401, 'Account has been deactivated');
    }

    // Attach user to request object for downstream handlers
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 401, 'Not authorized, invalid token');
    }
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Not authorized, token expired');
    }
    return sendError(res, 500, 'Authentication error');
  }
};

module.exports = { protect };
