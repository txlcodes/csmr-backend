const express = require('express');
const router = express.Router();
const {
  getAllReviews,
  getReviewStatistics,
  bulkAssignReviewers,
  updateReviewStatus,
  getReviewerPerformance
} = require('../controllers/reviewController');
const { protect, admin } = require('../middleware/authMiddleware');

// Apply admin protection to all routes
router.use(protect, admin);

// Review management
router.get('/', getAllReviews);
router.get('/statistics', getReviewStatistics);
router.get('/reviewer-performance', getReviewerPerformance);

// Review assignments
router.post('/bulk-assign', bulkAssignReviewers);
router.put('/:reviewId/status', updateReviewStatus);

module.exports = router;
