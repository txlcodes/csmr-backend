const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllArticles,
  updateArticleStatus,
  assignReviewers,
  getReviewStats,
  getSystemAnalytics
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// Apply admin protection to all routes
router.use(protect, admin);

// Dashboard and analytics
router.get('/dashboard', getDashboardStats);
router.get('/analytics', getSystemAnalytics);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id', updateUserRole);
router.delete('/users/:id', deleteUser);

// Article management
router.get('/articles', getAllArticles);
router.put('/articles/:id/status', updateArticleStatus);
router.put('/articles/:id/assign-reviewers', assignReviewers);

// Review management
router.get('/reviews/stats', getReviewStats);

module.exports = router;
