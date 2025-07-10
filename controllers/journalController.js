const asyncHandler = require('express-async-handler');
const Journal = require('../models/journalModel');

// @desc    Get all journals
// @route   GET /api/journals
// @access  Public
const getJournals = asyncHandler(async (req, res) => {
  // If in demo mode, return sample data
  if (global.isDemoMode) {
    const sampleJournals = [
      {
        _id: '507f1f77bcf86cd799439011',
        title: 'Journal of Sustainability and Management Research',
        description: 'Leading journal in sustainability and management research',
        issn: '2456-7890',
        chiefEditor: 'Dr. John Smith',
        scope: 'Sustainability, Management, Business Ethics',
        indexing: ['Scopus', 'Web of Science'],
        impactFactor: 2.45,
        publishingFrequency: 'Quarterly',
        openAccess: true,
        peerReviewed: true,
        coverImage: 'default-journal-cover.jpg'
      }
    ];
    return res.status(200).json(sampleJournals);
  }
  
  const journals = await Journal.find({});
  res.status(200).json(journals);
});

// @desc    Get single journal
// @route   GET /api/journals/:id
// @access  Public
const getJournal = asyncHandler(async (req, res) => {
  const journal = await Journal.findById(req.params.id);
  
  if (!journal) {
    res.status(404);
    throw new Error('Journal not found');
  }
  
  res.status(200).json(journal);
});

// @desc    Create journal
// @route   POST /api/journals
// @access  Private/Admin
const createJournal = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    issn,
    chiefEditor,
    scope,
    indexing,
    impactFactor,
    publishingFrequency,
    openAccess,
    peerReviewed,
  } = req.body;

  // Check if journal already exists
  const journalExists = await Journal.findOne({ $or: [{ title }, { issn }] });
  if (journalExists) {
    res.status(400);
    throw new Error('Journal with this title or ISSN already exists');
  }

  const journal = await Journal.create({
    title,
    description,
    issn,
    chiefEditor,
    scope,
    indexing,
    impactFactor,
    publishingFrequency,
    openAccess,
    peerReviewed,
    coverImage: req.file ? req.file.path : 'default-journal-cover.jpg',
  });

  res.status(201).json(journal);
});

// @desc    Update journal
// @route   PUT /api/journals/:id
// @access  Private/Admin
const updateJournal = asyncHandler(async (req, res) => {
  const journal = await Journal.findById(req.params.id);

  if (!journal) {
    res.status(404);
    throw new Error('Journal not found');
  }

  const updatedJournal = await Journal.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json(updatedJournal);
});

// @desc    Delete journal
// @route   DELETE /api/journals/:id
// @access  Private/Admin
const deleteJournal = asyncHandler(async (req, res) => {
  const journal = await Journal.findById(req.params.id);

  if (!journal) {
    res.status(404);
    throw new Error('Journal not found');
  }

  await journal.deleteOne();
  res.status(200).json({ message: 'Journal removed' });
});

module.exports = {
  getJournals,
  getJournal,
  createJournal,
  updateJournal,
  deleteJournal,
};