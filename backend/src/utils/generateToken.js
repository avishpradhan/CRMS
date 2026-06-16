const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token with userId and role.
 * Future: When migrating to refresh tokens, update only this file.
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = generateToken;
