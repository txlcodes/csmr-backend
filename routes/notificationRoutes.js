const express = require('express');
const router = express.Router();
const {
  getAdminNotifications,
  getSystemHealth,
  getActivityFeed,
  sendNotification
} = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/authMiddleware');

// Apply admin protection to all routes
router.use(protect, admin);

// Notifications
router.get('/', getAdminNotifications);
router.post('/send', sendNotification);

// System monitoring
router.get('/health', getSystemHealth);
router.get('/activity', getActivityFeed);

module.exports = router;
