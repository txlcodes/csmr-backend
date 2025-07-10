const asyncHandler = require('express-async-handler');
const Article = require('../models/articleModel');
const mongoose = require('mongoose');

// @desc    Get all articles
// @route   GET /api/articles
// @access  Public
const getArticles = asyncHandler(async (req, res) => {
  // If in demo mode, return sample data
  if (global.isDemoMode) {
    const sampleArticles = [
      {
        _id: '507f1f77bcf86cd799439012',
        title: 'Sustainable Business Practices in Modern Organizations',
        abstract: 'This paper explores the implementation of sustainable business practices in modern organizations.',
        authors: [
          { name: 'Dr. Jane Doe', email: 'jane@example.com', affiliation: 'University of Technology' }
        ],
        journal: { _id: '507f1f77bcf86cd799439011', title: 'Journal of Sustainability', issn: '2456-7890' },
        keywords: ['sustainability', 'business', 'management'],
        status: 'published',
        submissionDate: new Date(),
        publicationDate: new Date(),
        volume: 1,
        issue: 1,
        pageRange: '1-15',
        doi: '10.1234/example.2024.001'
      }
    ];
    
    return res.json({
      articles: sampleArticles,
      page: 1,
      pages: 1,
    });
  }

  const pageSize = 10;
  const page = Number(req.query.page) || 1;

  const keyword = req.query.keyword
    ? {
        $or: [
          { title: { $regex: req.query.keyword, $options: 'i' } },
          { abstract: { $regex: req.query.keyword, $options: 'i' } },
          { keywords: { $regex: req.query.keyword, $options: 'i' } },
        ],
      }
    : {};

  const count = await Article.countDocuments({ ...keyword });
  const articles = await Article.find({ ...keyword })
    .populate('journal', 'title issn')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ submissionDate: -1 });

  res.json({
    articles,
    page,
    pages: Math.ceil(count / pageSize),
  });
});

// @desc    Get single article
// @route   GET /api/articles/:id
// @access  Public
const getArticleById = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id)
    .populate('journal', 'title issn')
    .populate('reviewers', 'name email')
    .populate('reviews.reviewer', 'name email');

  if (article) {
    res.json(article);
  } else {
    res.status(404);
    throw new Error('Article not found');
  }
});

// @desc    Create new article
// @route   POST /api/articles
// @access  Private
const createArticle = asyncHandler(async (req, res) => {
  const {
    title,
    abstract,
    // authors,
    journal,
    // keywords,
    volume,
    issue,
    pageRange,
    doi,
  } = req.body;

  // Check if article with same title exists
  const articleExists = await Article.findOne({ title });
  if (articleExists) {
    res.status(400);
    throw new Error('An article with this title already exists');
  }

  const authors = typeof req.body.authors === 'string'
  ? JSON.parse(req.body.authors)
  : req.body.authors;

const keywords = typeof req.body.keywords === 'string'
  ? JSON.parse(req.body.keywords)
  : req.body.keywords;

  // Generate manuscript ID
  const year = new Date().getFullYear();
  const count = await Article.countDocuments({ submissionDate: { $gte: new Date(year, 0, 1) } });
  const manuscriptId = `CSMR-${year}-${String(count + 1).padStart(3, '0')}`;

  // Create article
  const article = await Article.create({
    title,
    abstract,
    authors,
    journal,
    keywords,
    manuscriptId,
    pdfUrl: req.file ? req.file.path : null,
    volume,
    issue,
    pageRange,
    doi,
  });

  if (article) {
    res.status(201).json(article);
  } else {
    res.status(400);
    throw new Error('Invalid article data');
  }
});

// @desc    Update article
// @route   PUT /api/articles/:id
// @access  Private/Admin
const updateArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);

  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  const {
    title,
    abstract,
    authors,
    journal,
    keywords,
    status,
    volume,
    issue,
    pageRange,
    doi,
  } = req.body;

  article.title = title || article.title;
  article.abstract = abstract || article.abstract;

  // Parse authors if sent as JSON string (especially when using FormData)
  if (authors) {
    try {
      article.authors = typeof authors === 'string' ? JSON.parse(authors) : authors;
    } catch (error) {
      res.status(400);
      throw new Error('Invalid authors format');
    }
  }

  // Parse keywords if sent as JSON string
  if (keywords) {
    try {
      article.keywords = typeof keywords === 'string' ? JSON.parse(keywords) : keywords;
    } catch (error) {
      res.status(400);
      throw new Error('Invalid keywords format');
    }
  }

  // Validate journal ObjectId if provided
  if (journal) {
    if (mongoose.Types.ObjectId.isValid(journal)) {
      article.journal = journal;
    } else {
      res.status(400);
      throw new Error('Invalid journal ID');
    }
  }

  article.status = status || article.status;
  article.volume = volume || article.volume;
  article.issue = issue || article.issue;
  article.pageRange = pageRange || article.pageRange;
  article.doi = doi || article.doi;

  if (req.file) {
    article.pdfUrl = req.file.path;
  }

  if (status === 'published' && !article.publicationDate) {
    article.publicationDate = Date.now();
  }

  const updatedArticle = await article.save();
  res.json(updatedArticle);
});

// @desc    Delete article
// @route   DELETE /api/articles/:id
// @access  Private/Admin
const deleteArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);

  if (article) {
    await article.deleteOne();
    res.json({ message: 'Article removed' });
  } else {
    res.status(404);
    throw new Error('Article not found');
  }
});

// @desc    Add review to article
// @route   POST /api/articles/:id/reviews
// @access  Private/Reviewer
const addArticleReview = asyncHandler(async (req, res) => {
  const { 
    criteria,
    summary,
    strengths,
    weaknesses,
    detailedComments,
    confidentialComments,
    recommendation,
    filesForAuthors
  } = req.body;

  const article = await Article.findById(req.params.id);

  if (article) {
    // Find existing review by this reviewer
    const existingReviewIndex = article.reviews.findIndex(
      (r) => r.reviewer.toString() === req.user._id.toString()
    );

    if (existingReviewIndex !== -1 && article.reviews[existingReviewIndex].status === 'submitted') {
      res.status(400);
      throw new Error('You have already submitted a review for this article');
    }

    const review = {
      reviewer: req.user._id,
      reviewSubmittedDate: Date.now(),
      status: 'submitted',
      criteria,
      summary,
      strengths,
      weaknesses,
      detailedComments,
      confidentialComments,
      recommendation,
      filesForAuthors: filesForAuthors || []
    };

    if (existingReviewIndex !== -1) {
      // Update existing review
      article.reviews[existingReviewIndex] = { ...article.reviews[existingReviewIndex], ...review };
    } else {
      // Add new review
      article.reviews.push(review);
      if (!article.reviewers.includes(req.user._id)) {
        article.reviewers.push(req.user._id);
      }
    }

    // Add to editorial history
    article.editorialHistory.push({
      action: 'review-completed',
      performedBy: req.user._id,
      notes: `Review submitted with recommendation: ${recommendation}`
    });

    // Update article status based on reviews
    const allReviews = article.reviews.filter(r => r.status === 'submitted');
    const minReviewsRequired = 2;
    
    if (allReviews.length >= minReviewsRequired) {
      const recommendations = allReviews.map(r => r.recommendation);
      const rejectCount = recommendations.filter(r => r === 'reject').length;
      const acceptCount = recommendations.filter(r => r === 'accept' || r === 'accept-minor').length;
      const revisionCount = recommendations.filter(r => r === 'major-revision').length;

      if (rejectCount >= minReviewsRequired / 2) {
        article.status = 'rejected';
      } else if (acceptCount === allReviews.length) {
        article.status = 'accepted';
      } else if (revisionCount > 0) {
        article.status = 'revision-required';
      }
    }

    await article.save();
    res.status(201).json({ 
      success: true,
      message: 'Review submitted successfully',
      articleStatus: article.status 
    });
  } else {
    res.status(404);
    throw new Error('Article not found');
  }
});

// @desc    Assign reviewers to article
// @route   PUT /api/articles/:id/assign-reviewers
// @access  Private/Admin/Editor
const assignReviewers = asyncHandler(async (req, res) => {
  const { reviewerIds } = req.body;

  if (!reviewerIds || !Array.isArray(reviewerIds) || reviewerIds.length === 0) {
    res.status(400);
    throw new Error('Please provide reviewer IDs');
  }

  const article = await Article.findById(req.params.id);

  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  // Add reviewers and create review entries
  for (const reviewerId of reviewerIds) {
    if (!article.reviewers.includes(reviewerId)) {
      article.reviewers.push(reviewerId);
      
      // Create a pending review entry
      article.reviews.push({
        reviewer: reviewerId,
        status: 'pending',
        reviewStartDate: Date.now()
      });
    }
  }

  // Update article status
  if (article.status === 'submitted') {
    article.status = 'under-review';
  }

  // Add to editorial history
  article.editorialHistory.push({
    action: 'assigned-reviewers',
    performedBy: req.user._id,
    notes: `Assigned ${reviewerIds.length} reviewer(s)`
  });

  await article.save();

  res.json({
    success: true,
    message: 'Reviewers assigned successfully',
    reviewers: article.reviewers
  });
});

// @desc    Assign editor to article
// @route   PUT /api/articles/:id/assign-editor
// @access  Private/Admin
const assignEditor = asyncHandler(async (req, res) => {
  const { editorId, associateEditorId } = req.body;

  const article = await Article.findById(req.params.id);

  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  if (editorId) {
    article.editorAssigned = editorId;
  }

  if (associateEditorId) {
    article.associateEditor = associateEditorId;
  }

  // Add to editorial history
  article.editorialHistory.push({
    action: 'assigned-editor',
    performedBy: req.user._id,
    notes: `Assigned editor(s)`
  });

  await article.save();

  res.json({
    success: true,
    message: 'Editor assigned successfully'
  });
});

// @desc    Get reviewers for an article
// @route   GET /api/articles/:id/reviewers
// @access  Private
const getArticleReviewers = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id)
    .populate('reviewers', 'name email institution')
    .populate('reviews.reviewer', 'name email');

  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  res.json({
    reviewers: article.reviewers,
    reviews: article.reviews
  });
});

// @desc    Accept review invitation
// @route   PUT /api/articles/:id/accept-review
// @access  Private/Reviewer
const acceptReviewInvitation = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);

  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  const reviewIndex = article.reviews.findIndex(
    r => r.reviewer.toString() === req.user._id.toString() && r.status === 'pending'
  );

  if (reviewIndex === -1) {
    res.status(400);
    throw new Error('No pending review invitation found');
  }

  article.reviews[reviewIndex].status = 'in-progress';

  await article.save();

  res.json({
    success: true,
    message: 'Review invitation accepted'
  });
});

// @desc    Decline review invitation
// @route   PUT /api/articles/:id/decline-review
// @access  Private/Reviewer
const declineReviewInvitation = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const article = await Article.findById(req.params.id);

  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  const reviewIndex = article.reviews.findIndex(
    r => r.reviewer.toString() === req.user._id.toString() && r.status === 'pending'
  );

  if (reviewIndex === -1) {
    res.status(400);
    throw new Error('No pending review invitation found');
  }

  article.reviews[reviewIndex].status = 'declined';
  if (reason) {
    article.reviews[reviewIndex].confidentialComments = `Declined: ${reason}`;
  }

  // Remove from reviewers list
  article.reviewers = article.reviewers.filter(
    r => r.toString() !== req.user._id.toString()
  );

  await article.save();

  res.json({
    success: true,
    message: 'Review invitation declined'
  });
});

module.exports = {
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
}; 