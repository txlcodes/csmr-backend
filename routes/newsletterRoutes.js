const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Newsletter = require('../models/newsletterModel');

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter
// @access  Public
router.post('/', asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide an email address');
  }

  // Prevent duplicate subscriptions
  const existing = await Newsletter.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error('This email is already subscribed');
  }

  await Newsletter.create({ email });
  res.status(200).json({
    success: true,
    message: 'Successfully subscribed to newsletter'
  });
}));

module.exports = router; 