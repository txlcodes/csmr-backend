const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Article = require('../models/articleModel');
const Journal = require('../models/journalModel');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalArticles = await Article.countDocuments();
  const totalJournals = await Journal.countDocuments();
  
  // Articles by status
  const articlesByStatus = await Article.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Recent submissions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentSubmissions = await Article.countDocuments({
    submissionDate: { $gte: thirtyDaysAgo }
  });

  // Published articles this year
  const currentYear = new Date().getFullYear();
  const publishedThisYear = await Article.countDocuments({
    status: 'published',
    publicationDate: {
      $gte: new Date(currentYear, 0, 1),
      $lt: new Date(currentYear + 1, 0, 1)
    }
  });

  // User registrations by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const userRegistrations = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  // Top journals by article count
  const topJournals = await Article.aggregate([
    {
      $group: {
        _id: '$journal',
        articleCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'journals',
        localField: '_id',
        foreignField: '_id',
        as: 'journalInfo'
      }
    },
    {
      $unwind: '$journalInfo'
    },
    {
      $project: {
        journalTitle: '$journalInfo.title',
        articleCount: 1
      }
    },
    {
      $sort: { articleCount: -1 }
    },
    {
      $limit: 5
    }
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalArticles,
        totalJournals,
        recentSubmissions,
        publishedThisYear
      },
      articlesByStatus,
      userRegistrations,
      topJournals
    }
  });
});

// @desc    Get all users with pagination and filtering
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const role = req.query.role;
  const search = req.query.search;
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  // Build filter object
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { institution: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(filter)
    .select('-password')
    .sort({ [sortBy]: sortOrder })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await User.countDocuments(filter);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Update user role and permissions
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res) => {
  const { role, isAdmin } = req.body;
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.role = role;
  user.isAdmin = isAdmin;
  await user.save();

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      institution: user.institution
    }
  });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  // Check if user has any articles
  const userArticles = await Article.find({
    'authors.email': { $in: [await User.findById(userId).select('email')] }
  });

  if (userArticles.length > 0) {
    res.status(400);
    throw new Error('Cannot delete user with existing articles. Please reassign articles first.');
  }

  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Get all articles with advanced filtering
// @route   GET /api/admin/articles
// @access  Private/Admin
const getAllArticles = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;
  const journal = req.query.journal;
  const search = req.query.search;
  const sortBy = req.query.sortBy || 'submissionDate';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  // Build filter object
  const filter = {};
  if (status) filter.status = status;
  if (journal) filter.journal = journal;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { abstract: { $regex: search, $options: 'i' } },
      { 'authors.name': { $regex: search, $options: 'i' } }
    ];
  }

  const articles = await Article.find(filter)
    .populate('journal', 'title issn')
    .populate('editorAssigned', 'name email')
    .populate('associateEditor', 'name email')
    .populate('reviewers', 'name email')
    .sort({ [sortBy]: sortOrder })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Article.countDocuments(filter);

  res.json({
    success: true,
    data: {
      articles,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Update article status and assign editors
// @route   PUT /api/admin/articles/:id/status
// @access  Private/Admin
const updateArticleStatus = asyncHandler(async (req, res) => {
  const { status, editorAssigned, associateEditor, comments } = req.body;
  const articleId = req.params.id;

  const article = await Article.findById(articleId);
  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  // Update article status and assignments
  article.status = status;
  if (editorAssigned) article.editorAssigned = editorAssigned;
  if (associateEditor) article.associateEditor = associateEditor;
  
  // Add status change to history
  article.statusHistory = article.statusHistory || [];
  article.statusHistory.push({
    status,
    changedBy: req.user._id,
    changedAt: new Date(),
    comments
  });

  await article.save();

  res.json({
    success: true,
    data: article
  });
});

// @desc    Assign reviewers to article
// @route   PUT /api/admin/articles/:id/assign-reviewers
// @access  Private/Admin
const assignReviewers = asyncHandler(async (req, res) => {
  const { reviewerIds, dueDate } = req.body;
  const articleId = req.params.id;

  const article = await Article.findById(articleId);
  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  // Validate reviewers exist and have reviewer role
  const reviewers = await User.find({
    _id: { $in: reviewerIds },
    role: { $in: ['reviewer', 'editor', 'admin'] }
  });

  if (reviewers.length !== reviewerIds.length) {
    res.status(400);
    throw new Error('One or more reviewers not found or invalid role');
  }

  article.reviewers = reviewerIds;
  article.reviewDueDate = dueDate ? new Date(dueDate) : null;
  await article.save();

  res.json({
    success: true,
    data: article
  });
});

// @desc    Get review statistics
// @route   GET /api/admin/reviews/stats
// @access  Private/Admin
const getReviewStats = asyncHandler(async (req, res) => {
  const totalReviews = await Article.aggregate([
    { $unwind: '$reviews' },
    { $count: 'total' }
  ]);

  const reviewsByStatus = await Article.aggregate([
    { $unwind: '$reviews' },
    {
      $group: {
        _id: '$reviews.status',
        count: { $sum: 1 }
      }
    }
  ]);

  const overdueReviews = await Article.countDocuments({
    reviewDueDate: { $lt: new Date() },
    status: { $in: ['under-review', 'revision-required'] }
  });

  res.json({
    success: true,
    data: {
      totalReviews: totalReviews[0]?.total || 0,
      reviewsByStatus,
      overdueReviews
    }
  });
});

// @desc    Get system analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getSystemAnalytics = asyncHandler(async (req, res) => {
  const period = req.query.period || '30'; // days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  // Article submission trends
  const submissionTrends = await Article.aggregate([
    {
      $match: {
        submissionDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$submissionDate' },
          month: { $month: '$submissionDate' },
          day: { $dayOfMonth: '$submissionDate' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  // Publication trends
  const publicationTrends = await Article.aggregate([
    {
      $match: {
        publicationDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$publicationDate' },
          month: { $month: '$publicationDate' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  // Average review time
  const avgReviewTime = await Article.aggregate([
    {
      $match: {
        status: 'published',
        publicationDate: { $exists: true }
      }
    },
    {
      $project: {
        reviewTime: {
          $divide: [
            { $subtract: ['$publicationDate', '$submissionDate'] },
            1000 * 60 * 60 * 24 // Convert to days
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgReviewTime: { $avg: '$reviewTime' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      submissionTrends,
      publicationTrends,
      avgReviewTime: avgReviewTime[0]?.avgReviewTime || 0
    }
  });
});

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllArticles,
  updateArticleStatus,
  assignReviewers,
  getReviewStats,
  getSystemAnalytics
};
