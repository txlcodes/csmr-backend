const express = require('express');
const router = express.Router();
const {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  addArticleReview,
  assignReviewers,
  assignEditor,
  getArticleReviewers,
  acceptReviewInvitation,
  declineReviewInvitation,
} = require('../controllers/articleController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(getArticles)
  .post(protect, admin, upload.single('pdf'), createArticle);

router.route('/:id')
  .get(getArticleById)
  .put(protect, admin, upload.single('pdf'), updateArticle)
  .delete(protect, admin, deleteArticle);

router.route('/:id/reviews').post(protect, addArticleReview);

// Review assignment routes (editor only)
router.route('/:id/assign-reviewers').put(protect, admin, assignReviewers);
router.route('/:id/assign-editor').put(protect, admin, assignEditor);

// Get reviewers for an article
router.route('/:id/reviewers').get(protect, getArticleReviewers);

// Reviewer actions
router.route('/:id/accept-review').put(protect, acceptReviewInvitation);
router.route('/:id/decline-review').put(protect, declineReviewInvitation);

module.exports = router; 