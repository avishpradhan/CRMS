const { sendError } = require('../utils/response');

/**
 * Role-based authorization middleware.
 *
 * Usage: router.get('/route', protect, authorize('admin'), handler)
 *        router.get('/route', protect, authorize('student', 'admin'), handler)
 *
 * Must be used AFTER protect middleware (requires req.user).
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Not authorized');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Role '${req.user.role}' is not authorized to access this resource`
      );
    }

    next();
  };
};

module.exports = { authorize };
