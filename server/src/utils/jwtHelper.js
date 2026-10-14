const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const AppError = require('./AppError');

/**
 * Sign an access token for the given payload.
 * @param {object} payload
 * @returns {string} signed JWT
 */
const signAccessToken = (payload) =>
  jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

/**
 * Sign a refresh token for the given payload.
 * @param {object} payload
 * @returns {string} signed JWT
 */
const signRefreshToken = (payload) =>
  jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });

/**
 * Verify an access token. Throws AppError on failure.
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Access token expired', 401);
    }
    throw new AppError('Invalid access token', 401);
  }
};

/**
 * Verify a refresh token. Throws AppError on failure.
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Refresh token expired — please log in again', 401);
    }
    throw new AppError('Invalid refresh token', 401);
  }
};

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
