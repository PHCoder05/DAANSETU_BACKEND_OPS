const { getDB } = require('../config/db');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { hashPassword, generateRandomString, successResponse, errorResponse } = require('../utils/helpers');
const crypto = require('crypto');

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const db = getDB();

    // Find user
    const user = await User.findByEmail(db, email);
    
    // Don't reveal if user exists or not (security)
    if (!user) {
      return successResponse(res, 200, 'If the email exists, a password reset link will be sent');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store reset token (expires in 1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await PasswordReset.create(db, {
      userId: user._id,
      token: hashedToken,
      expiresAt
    });

    // In production, send email with reset link
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    // await sendEmail(user.email, 'Password Reset', resetUrl);

    // For development, return token (remove in production!)
    if (process.env.NODE_ENV === 'development') {
      return successResponse(res, 200, 'Password reset token generated', {
        resetToken, // Only in development!
        message: 'In production, this will be sent via email'
      });
    }

    return successResponse(res, 200, 'If the email exists, a password reset link will be sent');
  } catch (error) {
    console.error('Request password reset error:', error);
    return errorResponse(res, 500, 'Error requesting password reset', error.message);
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return errorResponse(res, 400, 'Token and new password are required');
    }

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const db = getDB();

    // Find valid reset token
    const resetRecord = await PasswordReset.findByToken(db, hashedToken);
    
    if (!resetRecord) {
      return errorResponse(res, 400, 'Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    await User.update(db, resetRecord.userId.toString(), {
      password: hashedPassword
    });

    // Mark token as used
    await PasswordReset.markAsUsed(db, hashedToken);

    return successResponse(res, 200, 'Password reset successfully');
  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(res, 500, 'Error resetting password', error.message);
  }
};

// Verify reset token
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return errorResponse(res, 400, 'Token is required');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const db = getDB();

    const resetRecord = await PasswordReset.findByToken(db, hashedToken);
    
    if (!resetRecord) {
      return errorResponse(res, 400, 'Invalid or expired reset token');
    }

    return successResponse(res, 200, 'Token is valid');
  } catch (error) {
    console.error('Verify reset token error:', error);
    return errorResponse(res, 500, 'Error verifying token', error.message);
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
  verifyResetToken
};

