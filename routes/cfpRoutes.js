const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, admin } = require('../middleware/authMiddleware');
const CFP = require('../models/cfpModel');

// @desc    Get all CFPs
// @route   GET /api/cfp
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const cfps = await CFP.find().sort({ createdAt: -1 });
  res.status(200).json({ cfps });
}));

// @desc    Get single CFP
// @route   GET /api/cfp/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const cfp = await CFP.findById(req.params.id);
  if (!cfp) {
    res.status(404);
    throw new Error('CFP not found');
  }
  res.status(200).json(cfp);
}));

// @desc    Create new CFP
// @route   POST /api/cfp
// @access  Private/Admin
router.post('/', protect, admin, asyncHandler(async (req, res) => {
  const { title, description, deadline } = req.body;
  const cfp = await CFP.create({ title, description, deadline });
  res.status(201).json({ success: true, message: 'CFP created successfully', cfp });
}));

// @desc    Update CFP
// @route   PUT /api/cfp/:id
// @access  Private/Admin
router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
  const cfp = await CFP.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!cfp) {
    res.status(404);
    throw new Error('CFP not found');
  }
  res.status(200).json({ success: true, message: 'CFP updated successfully', cfp });
}));

// @desc    Delete CFP
// @route   DELETE /api/cfp/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  const cfp = await CFP.findByIdAndDelete(req.params.id);
  if (!cfp) {
    res.status(404);
    throw new Error('CFP not found');
  }
  res.status(200).json({ success: true, message: 'CFP deleted successfully' });
}));

module.exports = router; 