const express = require('express');
const router = express.Router();
const {
  getPublicationWorkflow,
  getArticlesReadyForPublication,
  publishArticle,
  createJournalIssue,
  getJournalIssues,
  getPublicationMetrics,
  generateDOI
} = require('../controllers/publicationController');
const { protect, admin } = require('../middleware/authMiddleware');

// Apply admin protection to all routes
router.use(protect, admin);

// Publication workflow
router.get('/workflow', getPublicationWorkflow);
router.get('/ready', getArticlesReadyForPublication);
router.put('/:id/publish', publishArticle);

// Journal issues
router.post('/issues', createJournalIssue);
router.get('/issues', getJournalIssues);

// Metrics and analytics
router.get('/metrics', getPublicationMetrics);

// DOI generation
router.post('/:id/generate-doi', generateDOI);

module.exports = router;
