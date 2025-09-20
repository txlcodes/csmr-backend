const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

// @desc    Check if user has admin privileges
// @route   Middleware
// @access  Private
const requireAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized, no user found');
  }

  if (!req.user.isAdmin && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }

  next();
});

// @desc    Check if user has editor privileges
// @route   Middleware
// @access  Private
const requireEditor = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized, no user found');
  }

  const allowedRoles = ['admin', 'editor'];
  if (!allowedRoles.includes(req.user.role)) {
    res.status(403);
    throw new Error('Not authorized as an editor');
  }

  next();
});

// @desc    Check if user has reviewer privileges
// @route   Middleware
// @access  Private
const requireReviewer = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized, no user found');
  }

  const allowedRoles = ['admin', 'editor', 'reviewer'];
  if (!allowedRoles.includes(req.user.role)) {
    res.status(403);
    throw new Error('Not authorized as a reviewer');
  }

  next();
});

// @desc    Check if user can manage specific resource
// @route   Middleware
// @access  Private
const canManageResource = (resourceType) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, no user found');
    }

    // Admin can manage everything
    if (req.user.isAdmin || req.user.role === 'admin') {
      return next();
    }

    // Check specific permissions based on resource type
    switch (resourceType) {
      case 'articles':
        if (['admin', 'editor'].includes(req.user.role)) {
          return next();
        }
        break;
      case 'reviews':
        if (['admin', 'editor', 'reviewer'].includes(req.user.role)) {
          return next();
        }
        break;
      case 'users':
        if (['admin'].includes(req.user.role)) {
          return next();
        }
        break;
      case 'journals':
        if (['admin', 'editor'].includes(req.user.role)) {
          return next();
        }
        break;
      default:
        res.status(403);
        throw new Error('Not authorized to manage this resource');
    }

    res.status(403);
    throw new Error('Not authorized to manage this resource');
  });
};

// @desc    Check if user can access specific article
// @route   Middleware
// @access  Private
const canAccessArticle = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized, no user found');
  }

  const articleId = req.params.id;
  const Article = require('../models/articleModel');
  
  const article = await Article.findById(articleId);
  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  // Admin and editors can access all articles
  if (req.user.isAdmin || req.user.role === 'admin' || req.user.role === 'editor') {
    req.article = article;
    return next();
  }

  // Authors can access their own articles
  const isAuthor = article.authors.some(author => 
    author.email === req.user.email
  );

  // Reviewers can access articles they're assigned to
  const isAssignedReviewer = article.reviewers.some(reviewer => 
    reviewer.toString() === req.user._id.toString()
  );

  if (isAuthor || isAssignedReviewer) {
    req.article = article;
    return next();
  }

  res.status(403);
  throw new Error('Not authorized to access this article');
});

// @desc    Audit log middleware
// @route   Middleware
// @access  Private
const auditLog = (action) => {
  return asyncHandler(async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`[AUDIT] User ${req.user._id} performed ${action} on ${req.originalUrl} at ${new Date().toISOString()}`);
      }
      
      originalSend.call(this, data);
    };
    
    next();
  });
};

// @desc    Rate limiting for admin actions
// @route   Middleware
// @access  Private
const adminRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const rateLimit = require('express-rate-limit');
  
  return rateLimit({
    windowMs,
    max,
    message: 'Too many admin requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.user ? req.user._id.toString() : req.ip;
    }
  });
};

module.exports = {
  requireAdmin,
  requireEditor,
  requireReviewer,
  canManageResource,
  canAccessArticle,
  auditLog,
  adminRateLimit
};
