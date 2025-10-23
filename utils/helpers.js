const bcrypt = require('bcryptjs');

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance; // Returns distance in kilometers
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Pagination helper
const getPagination = (page = 1, limit = 10) => {
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  const skip = (pageNum - 1) * limitNum;
  
  return {
    skip,
    limit: limitNum,
    page: pageNum
  };
};

// Build pagination response
const buildPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

// Sanitize user object (remove sensitive fields)
const sanitizeUser = (user) => {
  if (!user) return null;
  
  const { password, ...sanitized } = user;
  return sanitized;
};

// Generate random string
const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Check if date is expired
const isExpired = (date) => {
  if (!date) return false;
  return new Date(date) < new Date();
};

// Build filter query for donations
const buildDonationFilter = (queryParams, userId = null, role = null) => {
  const filter = { active: true };
  
  // Category filter
  if (queryParams.category) {
    filter.category = queryParams.category;
  }
  
  // Status filter
  if (queryParams.status) {
    filter.status = queryParams.status;
  } else {
    // Default to available for general search
    if (role === 'ngo') {
      filter.status = 'available';
    }
  }
  
  // Priority filter
  if (queryParams.priority) {
    filter.priority = queryParams.priority;
  }
  
  // Donor filter (for viewing own donations)
  if (role === 'donor' && userId) {
    filter.donorId = userId;
  }
  
  // NGO claimed filter
  if (role === 'ngo' && queryParams.claimed === 'true' && userId) {
    filter.claimedBy = userId;
  }
  
  // Search by title/description
  if (queryParams.search) {
    filter.$or = [
      { title: { $regex: queryParams.search, $options: 'i' } },
      { description: { $regex: queryParams.search, $options: 'i' } }
    ];
  }
  
  return filter;
};

// Success response helper
const successResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return res.status(statusCode).json(response);
};

// Error response helper
const errorResponse = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

module.exports = {
  hashPassword,
  comparePassword,
  calculateDistance,
  getPagination,
  buildPaginationResponse,
  sanitizeUser,
  generateRandomString,
  formatDate,
  isExpired,
  buildDonationFilter,
  successResponse,
  errorResponse
};

