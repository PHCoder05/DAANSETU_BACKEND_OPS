const { getDB } = require('../config/db');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { hashPassword, comparePassword, sanitizeUser, successResponse, errorResponse } = require('../utils/helpers');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');

// Register new user
const register = async (req, res) => {
  try {
    const { email, password, name, role, phone, address, location, ngoDetails } = req.body;
    
    const db = getDB();
    
    // Check if user already exists
    const existingUser = await User.findByEmail(db, email);
    if (existingUser) {
      return errorResponse(res, 400, 'User with this email already exists');
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Prepare user data
    const userData = {
      email,
      password: hashedPassword,
      name,
      role,
      phone,
      address,
      location,
      verified: false,
      active: true
    };
    
    // Add NGO details if role is NGO
    if (role === 'ngo' && ngoDetails) {
      userData.ngoDetails = {
        registrationNumber: ngoDetails.registrationNumber || null,
        description: ngoDetails.description || null,
        website: ngoDetails.website || null,
        documents: ngoDetails.documents || [],
        verificationStatus: 'pending',
        categories: ngoDetails.categories || [],
        establishedYear: ngoDetails.establishedYear || null
      };
    }
    
    // Create user
    const user = await User.create(db, userData);
    
    // Generate tokens
    const accessToken = generateToken(user._id.toString(), user.email, user.role);
    const refreshToken = generateRefreshToken(user._id.toString(), user.email, user.role);
    
    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    
    await RefreshToken.create(db, {
      userId: user._id,
      token: refreshToken,
      expiresAt
    });
    
    return successResponse(res, 201, 'User registered successfully', {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
      expiresIn: '15m'
    });
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse(res, 500, 'Error registering user', error.message);
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const db = getDB();
    
    // Find user by email
    const user = await User.findByEmail(db, email);
    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password');
    }
    
    // Check if account is active
    if (!user.active) {
      return errorResponse(res, 401, 'Your account has been deactivated');
    }
    
    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return errorResponse(res, 401, 'Invalid email or password');
    }
    
    // Generate tokens
    const accessToken = generateToken(user._id.toString(), user.email, user.role);
    const refreshToken = generateRefreshToken(user._id.toString(), user.email, user.role);
    
    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    
    await RefreshToken.create(db, {
      userId: user._id,
      token: refreshToken,
      expiresAt
    });
    
    return successResponse(res, 200, 'Login successful', {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
      expiresIn: '15m'
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 500, 'Error logging in', error.message);
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const db = getDB();
    const user = await User.findById(db, req.user.userId);
    
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    
    return successResponse(res, 200, 'Profile retrieved successfully', {
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse(res, 500, 'Error fetching profile', error.message);
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, location, profileImage } = req.body;
    
    const db = getDB();
    
    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (location) updateData.location = location;
    if (profileImage) updateData.profileImage = profileImage;
    
    // Update user
    const updated = await User.update(db, req.user.userId, updateData);
    
    if (!updated) {
      return errorResponse(res, 404, 'User not found or no changes made');
    }
    
    // Get updated user
    const user = await User.findById(db, req.user.userId);
    
    return successResponse(res, 200, 'Profile updated successfully', {
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse(res, 500, 'Error updating profile', error.message);
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const db = getDB();
    const user = await User.findById(db, req.user.userId);
    
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    
    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      return errorResponse(res, 401, 'Current password is incorrect');
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update password
    await User.update(db, req.user.userId, { password: hashedPassword });
    
    return successResponse(res, 200, 'Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse(res, 500, 'Error changing password', error.message);
  }
};

// Update NGO details
const updateNGODetails = async (req, res) => {
  try {
    if (req.user.role !== 'ngo') {
      return errorResponse(res, 403, 'Only NGOs can update NGO details');
    }
    
    const { ngoDetails } = req.body;
    
    const db = getDB();
    const user = await User.findById(db, req.user.userId);
    
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    
    // Merge with existing NGO details
    const updatedNGODetails = {
      ...user.ngoDetails,
      ...ngoDetails,
      // Reset verification status if critical details change
      verificationStatus: ngoDetails.registrationNumber !== user.ngoDetails?.registrationNumber 
        ? 'pending' 
        : user.ngoDetails?.verificationStatus
    };
    
    // Update user
    await User.update(db, req.user.userId, { ngoDetails: updatedNGODetails });
    
    // Get updated user
    const updatedUser = await User.findById(db, req.user.userId);
    
    return successResponse(res, 200, 'NGO details updated successfully', {
      user: sanitizeUser(updatedUser)
    });
  } catch (error) {
    console.error('Update NGO details error:', error);
    return errorResponse(res, 500, 'Error updating NGO details', error.message);
  }
};

// Refresh access token
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return errorResponse(res, 400, 'Refresh token is required');
    }

    const db = getDB();
    
    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return errorResponse(res, 401, 'Invalid or expired refresh token');
    }

    // Check if refresh token exists and is not revoked
    const storedToken = await RefreshToken.findByToken(db, refreshToken);
    if (!storedToken) {
      return errorResponse(res, 401, 'Refresh token not found or has been revoked');
    }

    // Verify user still exists and is active
    const user = await User.findById(db, decoded.userId);
    if (!user || !user.active) {
      return errorResponse(res, 401, 'User not found or account deactivated');
    }

    // Generate new access token
    const accessToken = generateToken(user._id.toString(), user.email, user.role);
    
    // Optionally generate new refresh token (token rotation)
    const newRefreshToken = generateRefreshToken(user._id.toString(), user.email, user.role);
    
    // Revoke old refresh token and store new one
    await RefreshToken.revokeToken(db, refreshToken, newRefreshToken);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await RefreshToken.create(db, {
      userId: user._id,
      token: newRefreshToken,
      expiresAt
    });

    return successResponse(res, 200, 'Token refreshed successfully', {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: '15m'
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return errorResponse(res, 500, 'Error refreshing token', error.message);
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return successResponse(res, 200, 'Logged out successfully');
    }

    const db = getDB();
    
    // Revoke the refresh token
    await RefreshToken.revokeToken(db, refreshToken);
    
    return successResponse(res, 200, 'Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse(res, 500, 'Error logging out', error.message);
  }
};

// Logout from all devices
const logoutAll = async (req, res) => {
  try {
    const db = getDB();
    
    // Revoke all refresh tokens for the user
    const count = await RefreshToken.revokeAllUserTokens(db, req.user.userId);
    
    return successResponse(res, 200, `Logged out from ${count} device(s)`);
  } catch (error) {
    console.error('Logout all error:', error);
    return errorResponse(res, 500, 'Error logging out from all devices', error.message);
  }
};

// Generate JWT token for a user (Admin only or for testing)
const generateUserToken = async (req, res) => {
  try {
    const { userId, email } = req.body;
    
    if (!userId && !email) {
      return errorResponse(res, 400, 'Either userId or email is required');
    }
    
    const db = getDB();
    let user;
    
    // Find user by ID or email
    if (userId) {
      user = await User.findById(db, userId);
    } else {
      user = await User.findByEmail(db, email);
    }
    
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    
    // Check if account is active
    if (!user.active) {
      return errorResponse(res, 400, 'User account is deactivated');
    }
    
    // Generate tokens
    const accessToken = generateToken(user._id.toString(), user.email, user.role);
    const refreshToken = generateRefreshToken(user._id.toString(), user.email, user.role);
    
    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    
    await RefreshToken.create(db, {
      userId: user._id,
      token: refreshToken,
      expiresAt
    });
    
    return successResponse(res, 200, 'JWT token generated successfully', {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
      expiresIn: '15m',
      tokenType: 'Bearer'
    });
  } catch (error) {
    console.error('Generate token error:', error);
    return errorResponse(res, 500, 'Error generating token', error.message);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  updateNGODetails,
  refreshAccessToken,
  logout,
  logoutAll,
  generateUserToken
};

