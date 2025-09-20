const asyncHandler = require('express-async-handler');
const Article = require('../models/articleModel');
const User = require('../models/userModel');

// @desc    Get admin notifications
// @route   GET /api/admin/notifications
// @access  Private/Admin
const getAdminNotifications = asyncHandler(async (req, res) => {
  const notifications = [];

  // Pending submissions
  const pendingSubmissions = await Article.countDocuments({ status: 'submitted' });
  if (pendingSubmissions > 0) {
    notifications.push({
      type: 'pending_submissions',
      title: 'Pending Submissions',
      message: `${pendingSubmissions} articles awaiting initial review`,
      count: pendingSubmissions,
      priority: 'high',
      action: '/admin/articles?status=submitted'
    });
  }

  // Overdue reviews
  const overdueReviews = await Article.countDocuments({
    reviewDueDate: { $lt: new Date() },
    status: { $in: ['under-review', 'revision-required'] }
  });
  if (overdueReviews > 0) {
    notifications.push({
      type: 'overdue_reviews',
      title: 'Overdue Reviews',
      message: `${overdueReviews} reviews are overdue`,
      count: overdueReviews,
      priority: 'high',
      action: '/admin/reviews?status=overdue'
    });
  }

  // Articles ready for publication
  const readyForPublication = await Article.countDocuments({ status: 'accepted' });
  if (readyForPublication > 0) {
    notifications.push({
      type: 'ready_for_publication',
      title: 'Ready for Publication',
      message: `${readyForPublication} articles ready to be published`,
      count: readyForPublication,
      priority: 'medium',
      action: '/admin/publications/ready'
    });
  }

  // New user registrations (last 24 hours)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const newUsers = await User.countDocuments({ createdAt: { $gte: yesterday } });
  if (newUsers > 0) {
    notifications.push({
      type: 'new_users',
      title: 'New User Registrations',
      message: `${newUsers} new users registered in the last 24 hours`,
      count: newUsers,
      priority: 'low',
      action: '/admin/users?sortBy=createdAt&sortOrder=desc'
    });
  }

  // Articles requiring revision
  const revisionRequired = await Article.countDocuments({ status: 'revision-required' });
  if (revisionRequired > 0) {
    notifications.push({
      type: 'revision_required',
      title: 'Revisions Required',
      message: `${revisionRequired} articles need revision`,
      count: revisionRequired,
      priority: 'medium',
      action: '/admin/articles?status=revision-required'
    });
  }

  // Sort by priority
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  notifications.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  res.json({
    success: true,
    data: {
      notifications,
      totalCount: notifications.reduce((sum, notif) => sum + notif.count, 0)
    }
  });
});

// @desc    Get system health status
// @route   GET /api/admin/health
// @access  Private/Admin
const getSystemHealth = asyncHandler(async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {}
  };

  try {
    // Database connectivity
    const dbStart = Date.now();
    await User.findOne().limit(1);
    const dbTime = Date.now() - dbStart;
    
    health.checks.database = {
      status: dbTime < 1000 ? 'healthy' : 'slow',
      responseTime: `${dbTime}ms`,
      threshold: '1000ms'
    };

    // Memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memThreshold = 500; // MB
    
    health.checks.memory = {
      status: memUsageMB < memThreshold ? 'healthy' : 'warning',
      usage: `${memUsageMB}MB`,
      threshold: `${memThreshold}MB`
    };

    // Recent errors (last hour)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    // This would typically check error logs
    health.checks.errors = {
      status: 'healthy',
      recentErrors: 0,
      threshold: 10
    };

    // Overall status
    const allChecks = Object.values(health.checks);
    const hasUnhealthy = allChecks.some(check => check.status === 'unhealthy');
    const hasWarning = allChecks.some(check => check.status === 'warning');
    
    if (hasUnhealthy) {
      health.status = 'unhealthy';
    } else if (hasWarning) {
      health.status = 'warning';
    }

  } catch (error) {
    health.status = 'unhealthy';
    health.error = error.message;
  }

  res.json({
    success: true,
    data: health
  });
});

// @desc    Get activity feed
// @route   GET /api/admin/activity
// @access  Private/Admin
const getActivityFeed = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const type = req.query.type; // 'articles', 'users', 'reviews'

  const activities = [];

  // Recent article submissions
  if (!type || type === 'articles') {
    const recentArticles = await Article.find()
      .populate('journal', 'title')
      .sort({ submissionDate: -1 })
      .limit(10);

    recentArticles.forEach(article => {
      activities.push({
        type: 'article_submission',
        timestamp: article.submissionDate,
        user: article.authors[0]?.name || 'Unknown',
        action: 'submitted article',
        target: article.title,
        details: {
          journal: article.journal?.title,
          status: article.status,
          manuscriptId: article.manuscriptId
        }
      });
    });
  }

  // Recent user registrations
  if (!type || type === 'users') {
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10);

    recentUsers.forEach(user => {
      activities.push({
        type: 'user_registration',
        timestamp: user.createdAt,
        user: user.name,
        action: 'registered',
        target: user.email,
        details: {
          role: user.role,
          institution: user.institution
        }
      });
    });
  }

  // Recent review activities
  if (!type || type === 'reviews') {
    const articlesWithReviews = await Article.find({
      'reviews.submittedAt': { $exists: true }
    })
      .populate('reviewers', 'name')
      .sort({ 'reviews.submittedAt': -1 })
      .limit(10);

    articlesWithReviews.forEach(article => {
      article.reviews.forEach(review => {
        if (review.submittedAt) {
          activities.push({
            type: 'review_submission',
            timestamp: review.submittedAt,
            user: review.reviewer?.name || 'Unknown',
            action: 'submitted review',
            target: article.title,
            details: {
              rating: review.rating,
              recommendation: review.recommendation,
              status: review.status
            }
          });
        }
      });
    });
  }

  // Sort all activities by timestamp
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Pagination
  const total = activities.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedActivities = activities.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      activities: paginatedActivities,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Send notification to users
// @route   POST /api/admin/notifications/send
// @access  Private/Admin
const sendNotification = asyncHandler(async (req, res) => {
  const { userIds, type, title, message, priority = 'medium' } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    res.status(400);
    throw new Error('User IDs are required');
  }

  if (!type || !title || !message) {
    res.status(400);
    throw new Error('Type, title, and message are required');
  }

  // Validate users exist
  const users = await User.find({ _id: { $in: userIds } });
  if (users.length !== userIds.length) {
    res.status(400);
    throw new Error('One or more users not found');
  }

  // In a real implementation, you would:
  // 1. Store notifications in database
  // 2. Send email notifications
  // 3. Send push notifications
  // 4. Update user notification preferences

  const notification = {
    type,
    title,
    message,
    priority,
    sentAt: new Date(),
    recipients: users.length
  };

  res.json({
    success: true,
    data: notification,
    message: `Notification sent to ${users.length} users`
  });
});

module.exports = {
  getAdminNotifications,
  getSystemHealth,
  getActivityFeed,
  sendNotification
};
