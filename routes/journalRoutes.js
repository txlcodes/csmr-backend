const express = require('express');
const router = express.Router();
const {
  getJournals,
  getJournal,
  createJournal,
  updateJournal,
  deleteJournal,
} = require('../controllers/journalController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(getJournals)
  .post(protect, admin, upload.single('coverImage'), createJournal);

router.route('/:id')
  .get(getJournal)
  .put(protect, admin, upload.single('coverImage'), updateJournal)
  .delete(protect, admin, deleteJournal);

module.exports = router; 