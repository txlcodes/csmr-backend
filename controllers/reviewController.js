const asyncHandler = require('express-async-handler');
const Article = require('../models/articleModel');
const User = require('../models/userModel');

// @desc    Get all reviews for admin
// @route   GET /api/admin/reviews
// @access  Private/Admin
const getAllReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;
  const reviewerId = req.query.reviewerId;
  const articleId = req.query.articleId;

  // Build filter for articles with reviews
  const articleFilter = {};
  if (articleId) articleFilter._id = articleId;

  const articles = await Article.find(articleFilter)
    .populate('journal', 'title issn')
    .populate('editorAssigned', 'name email')
    .populate('reviewers', 'name email')
    .select('title status manuscriptId journal editorAssigned reviewers reviews submissionDate');

  // Filter and paginate reviews
  let allReviews = [];
  articles.forEach(article => {
    if (article.reviews && article.reviews.length > 0) {
      article.reviews.forEach(review => {
        allReviews.push({
          _id: review._id,
          article: {
            _id: article._id,
            title: article.title,
            manuscriptId: article.manuscriptId,
            status: article.status,
            journal: article.journal,
            submissionDate: article.submissionDate
          },
          reviewer: review.reviewer,
          status: review.status,
          submittedAt: review.submittedAt,
          dueDate: review.dueDate,
          rating: review.rating,
          comments: review.comments,
          recommendation: review.recommendation
        });
      });
    }
  });

  // Apply filters
  if (status) {
    allReviews = allReviews.filter(review => review.status === status);
  }
  if (reviewerId) {
    allReviews = allReviews.filter(review => 
      review.reviewer && review.reviewer._id.toString() === reviewerId
    );
  }

  // Pagination
  const total = allReviews.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedReviews = allReviews.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      reviews: paginatedReviews,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Get review statistics
// @route   GET /api/admin/reviews/statistics
// @access  Private/Admin
const getReviewStatistics = asyncHandler(async (req, res) => {
  const period = req.query.period || '30'; // days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  // Total reviews in period
  const totalReviews = await Article.aggregate([
    {
      $match: {
        'reviews.submittedAt': { $gte: startDate }
      }
    },
    {
      $unwind: '$reviews'
    },
    {
      $match: {
        'reviews.submittedAt': { $gte: startDate }
      }
    },
    {
      $count: 'total'
    }
  ]);

  // Reviews by status
  const reviewsByStatus = await Article.aggregate([
    {
      $unwind: '$reviews'
    },
    {
      $group: {
        _id: '$reviews.status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Average review time
  const avgReviewTime = await Article.aggregate([
    {
      $unwind: '$reviews'
    },
    {
      $match: {
        'reviews.submittedAt': { $exists: true },
        'reviews.assignedAt': { $exists: true }
      }
    },
    {
      $project: {
        reviewTime: {
          $divide: [
            { $subtract: ['$reviews.submittedAt', '$reviews.assignedAt'] },
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

  // Overdue reviews
  const overdueReviews = await Article.aggregate([
    {
      $unwind: '$reviews'
    },
    {
      $match: {
        'reviews.status': { $in: ['assigned', 'in-progress'] },
        'reviews.dueDate': { $lt: new Date() }
      }
    },
    {
      $count: 'total'
    }
  ]);

  // Top reviewers by count
  const topReviewers = await Article.aggregate([
    {
      $unwind: '$reviews'
    },
    {
      $group: {
        _id: '$reviews.reviewer',
        reviewCount: { $sum: 1 },
        avgRating: { $avg: '$reviews.rating' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'reviewerInfo'
      }
    },
    {
      $unwind: '$reviewerInfo'
    },
    {
      $project: {
        reviewer: {
          _id: '$reviewerInfo._id',
          name: '$reviewerInfo.name',
          email: '$reviewerInfo.email'
        },
        reviewCount: 1,
        avgRating: 1
      }
    },
    {
      $sort: { reviewCount: -1 }
    },
    {
      $limit: 10
    }
  ]);

  res.json({
    success: true,
    data: {
      totalReviews: totalReviews[0]?.total || 0,
      reviewsByStatus,
      avgReviewTime: avgReviewTime[0]?.avgReviewTime || 0,
      overdueReviews: overdueReviews[0]?.total || 0,
      topReviewers
    }
  });
});

// @desc    Assign reviewers to multiple articles
// @route   POST /api/admin/reviews/bulk-assign
// @access  Private/Admin
const bulkAssignReviewers = asyncHandler(async (req, res) => {
  const { assignments } = req.body; // Array of { articleId, reviewerIds, dueDate }

  const results = [];

  for (const assignment of assignments) {
    const { articleId, reviewerIds, dueDate } = assignment;

    const article = await Article.findById(articleId);
    if (!article) {
      results.push({
        articleId,
        success: false,
        error: 'Article not found'
      });
      continue;
    }

    // Validate reviewers
    const reviewers = await User.find({
      _id: { $in: reviewerIds },
      role: { $in: ['reviewer', 'editor', 'admin'] }
    });

    if (reviewers.length !== reviewerIds.length) {
      results.push({
        articleId,
        success: false,
        error: 'One or more reviewers not found or invalid role'
      });
      continue;
    }

    // Assign reviewers
    article.reviewers = reviewerIds;
    article.reviewDueDate = dueDate ? new Date(dueDate) : null;

    // Initialize review records
    article.reviews = article.reviews || [];
    reviewerIds.forEach(reviewerId => {
      const existingReview = article.reviews.find(
        review => review.reviewer.toString() === reviewerId.toString()
      );
      
      if (!existingReview) {
        article.reviews.push({
          reviewer: reviewerId,
          status: 'assigned',
          assignedAt: new Date(),
          dueDate: dueDate ? new Date(dueDate) : null
        });
      }
    });

    await article.save();

    results.push({
      articleId,
      success: true,
      assignedReviewers: reviewers.length
    });
  }

  res.json({
    success: true,
    data: results
  });
});

// @desc    Update review status
// @route   PUT /api/admin/reviews/:reviewId/status
// @access  Private/Admin
const updateReviewStatus = asyncHandler(async (req, res) => {
  const { status, comments } = req.body;
  const reviewId = req.params.reviewId;

  const article = await Article.findOne({
    'reviews._id': reviewId
  });

  if (!article) {
    res.status(404);
    throw new Error('Review not found');
  }

  const review = article.reviews.id(reviewId);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  review.status = status;
  if (comments) review.comments = comments;
  review.updatedAt = new Date();

  await article.save();

  res.json({
    success: true,
    data: review
  });
});

// @desc    Get reviewer performance
// @route   GET /api/admin/reviews/reviewer-performance
// @access  Private/Admin
const getReviewerPerformance = asyncHandler(async (req, res) => {
  const reviewerId = req.query.reviewerId;
  const period = req.query.period || '90'; // days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const matchStage = {
    'reviews.submittedAt': { $gte: startDate }
  };

  if (reviewerId) {
    matchStage['reviews.reviewer'] = reviewerId;
  }

  const performance = await Article.aggregate([
    {
      $unwind: '$reviews'
    },
    {
      $match: matchStage
    },
    {
      $group: {
        _id: '$reviews.reviewer',
        totalReviews: { $sum: 1 },
        completedReviews: {
          $sum: { $cond: [{ $eq: ['$reviews.status', 'completed'] }, 1, 0] }
        },
        avgRating: { $avg: '$reviews.rating' },
        avgReviewTime: {
          $avg: {
            $divide: [
              { $subtract: ['$reviews.submittedAt', '$reviews.assignedAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        },
        onTimeReviews: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$reviews.status', 'completed'] },
                  { $lte: ['$reviews.submittedAt', '$reviews.dueDate'] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'reviewerInfo'
      }
    },
    {
      $unwind: '$reviewerInfo'
    },
    {
      $project: {
        reviewer: {
          _id: '$reviewerInfo._id',
          name: '$reviewerInfo.name',
          email: '$reviewerInfo.email'
        },
        totalReviews: 1,
        completedReviews: 1,
        completionRate: {
          $multiply: [{ $divide: ['$completedReviews', '$totalReviews'] }, 100]
        },
        avgRating: 1,
        avgReviewTime: 1,
        onTimeReviews: 1,
        onTimeRate: {
          $multiply: [{ $divide: ['$onTimeReviews', '$completedReviews'] }, 100]
        }
      }
    },
    {
      $sort: { totalReviews: -1 }
    }
  ]);

  res.json({
    success: true,
    data: performance
  });
});

module.exports = {
  getAllReviews,
  getReviewStatistics,
  bulkAssignReviewers,
  updateReviewStatus,
  getReviewerPerformance
};
