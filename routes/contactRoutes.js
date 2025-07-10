const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Contact = require('../models/contactModel');

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
router.post('/', asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    res.status(400);
    throw new Error('Please fill in all fields');
  }

  await Contact.create({ name, email, subject, message });
  res.status(200).json({ 
    success: true, 
    message: 'Contact form submitted successfully' 
  });
}));

module.exports = router; 