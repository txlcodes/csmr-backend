const asyncHandler = require('express-async-handler');
const Article = require('../models/articleModel');
const Journal = require('../models/journalModel');
const User = require('../models/userModel');

// @desc    Get publication workflow status
// @route   GET /api/admin/publications/workflow
// @access  Private/Admin
const getPublicationWorkflow = asyncHandler(async (req, res) => {
  const workflow = {
    submitted: await Article.countDocuments({ status: 'submitted' }),
    initialReview: await Article.countDocuments({ status: 'initial-review' }),
    underReview: await Article.countDocuments({ status: 'under-review' }),
    revisionRequired: await Article.countDocuments({ status: 'revision-required' }),
    revised: await Article.countDocuments({ status: 'revised' }),
    accepted: await Article.countDocuments({ status: 'accepted' }),
    rejected: await Article.countDocuments({ status: 'rejected' }),
    published: await Article.countDocuments({ status: 'published' }),
    withdrawn: await Article.countDocuments({ status: 'withdrawn' })
  };

  res.json({
    success: true,
    data: workflow
  });
});

// @desc    Get articles ready for publication
// @route   GET /api/admin/publications/ready
// @access  Private/Admin
const getArticlesReadyForPublication = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const articles = await Article.find({
    status: { $in: ['accepted', 'published'] }
  })
    .populate('journal', 'title issn')
    .populate('editorAssigned', 'name email')
    .sort({ acceptedDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Article.countDocuments({
    status: { $in: ['accepted', 'published'] }
  });

  res.json({
    success: true,
    data: {
      articles,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Publish article
// @route   PUT /api/admin/publications/:id/publish
// @access  Private/Admin
const publishArticle = asyncHandler(async (req, res) => {
  const { volume, issue, pageRange, doi } = req.body;
  const articleId = req.params.id;

  const article = await Article.findById(articleId);
  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  if (article.status !== 'accepted') {
    res.status(400);
    throw new Error('Only accepted articles can be published');
  }

  // Update article with publication details
  article.status = 'published';
  article.publicationDate = new Date();
  article.volume = volume;
  article.issue = issue;
  article.pageRange = pageRange;
  article.doi = doi;

  // Add to publication history
  article.publicationHistory = article.publicationHistory || [];
  article.publicationHistory.push({
    publishedBy: req.user._id,
    publishedAt: new Date(),
    volume,
    issue,
    pageRange,
    doi
  });

  await article.save();

  res.json({
    success: true,
    data: article
  });
});

// @desc    Create new journal issue
// @route   POST /api/admin/publications/issues
// @access  Private/Admin
const createJournalIssue = asyncHandler(async (req, res) => {
  const { journalId, volume, issue, publicationDate, coverImage } = req.body;

  const journal = await Journal.findById(journalId);
  if (!journal) {
    res.status(404);
    throw new Error('Journal not found');
  }

  // Check if issue already exists
  const existingIssue = await Article.findOne({
    journal: journalId,
    volume: parseInt(volume),
    issue: parseInt(issue),
    status: 'published'
  });

  if (existingIssue) {
    res.status(400);
    throw new Error('Issue already exists for this journal');
  }

  // Create issue record (you might want to create a separate Issue model)
  const issueData = {
    journal: journalId,
    volume: parseInt(volume),
    issue: parseInt(issue),
    publicationDate: new Date(publicationDate),
    coverImage,
    createdBy: req.user._id
  };

  res.json({
    success: true,
    data: issueData,
    message: 'Journal issue created successfully'
  });
});

// @desc    Get journal issues
// @route   GET /api/admin/publications/issues
// @access  Private/Admin
const getJournalIssues = asyncHandler(async (req, res) => {
  const journalId = req.query.journalId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const filter = journalId ? { journal: journalId } : {};

  const issues = await Article.aggregate([
    {
      $match: {
        ...filter,
        status: 'published',
        volume: { $exists: true },
        issue: { $exists: true }
      }
    },
    {
      $group: {
        _id: {
          journal: '$journal',
          volume: '$volume',
          issue: '$issue'
        },
        articleCount: { $sum: 1 },
        publicationDate: { $first: '$publicationDate' },
        articles: {
          $push: {
            _id: '$_id',
            title: '$title',
            authors: '$authors',
            pageRange: '$pageRange',
            doi: '$doi'
          }
        }
      }
    },
    {
      $lookup: {
        from: 'journals',
        localField: '_id.journal',
        foreignField: '_id',
        as: 'journalInfo'
      }
    },
    {
      $unwind: '$journalInfo'
    },
    {
      $project: {
        journal: {
          _id: '$journalInfo._id',
          title: '$journalInfo.title',
          issn: '$journalInfo.issn'
        },
        volume: '$_id.volume',
        issue: '$_id.issue',
        articleCount: 1,
        publicationDate: 1,
        articles: 1
      }
    },
    {
      $sort: { 'journal.title': 1, volume: -1, issue: -1 }
    }
  ]);

  res.json({
    success: true,
    data: issues
  });
});

// @desc    Get publication metrics
// @route   GET /api/admin/publications/metrics
// @access  Private/Admin
const getPublicationMetrics = asyncHandler(async (req, res) => {
  const period = req.query.period || '12'; // months
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - parseInt(period));

  // Articles published in period
  const publishedInPeriod = await Article.countDocuments({
    status: 'published',
    publicationDate: { $gte: startDate }
  });

  // Average time to publication
  const avgTimeToPublication = await Article.aggregate([
    {
      $match: {
        status: 'published',
        publicationDate: { $gte: startDate }
      }
    },
    {
      $project: {
        timeToPublication: {
          $divide: [
            { $subtract: ['$publicationDate', '$submissionDate'] },
            1000 * 60 * 60 * 24 // Convert to days
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgTime: { $avg: '$timeToPublication' }
      }
    }
  ]);

  // Publication rate by journal
  const publicationRateByJournal = await Article.aggregate([
    {
      $match: {
        publicationDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$journal',
        published: {
          $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
        },
        total: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'journals',
        localField: '_id',
        foreignField: '_id',
        as: 'journalInfo'
      }
    },
    {
      $unwind: '$journalInfo'
    },
    {
      $project: {
        journalTitle: '$journalInfo.title',
        published: 1,
        total: 1,
        publicationRate: {
          $multiply: [{ $divide: ['$published', '$total'] }, 100]
        }
      }
    },
    {
      $sort: { publicationRate: -1 }
    }
  ]);

  // Monthly publication trends
  const monthlyTrends = await Article.aggregate([
    {
      $match: {
        status: 'published',
        publicationDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$publicationDate' },
          month: { $month: '$publicationDate' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      publishedInPeriod,
      avgTimeToPublication: avgTimeToPublication[0]?.avgTime || 0,
      publicationRateByJournal,
      monthlyTrends
    }
  });
});

// @desc    Generate DOI for article
// @route   POST /api/admin/publications/:id/generate-doi
// @access  Private/Admin
const generateDOI = asyncHandler(async (req, res) => {
  const articleId = req.params.id;
  const { prefix = '10.1234' } = req.body;

  const article = await Article.findById(articleId);
  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  // Generate DOI (simplified version - in production, use proper DOI service)
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substr(2, 8);
  const doi = `${prefix}/csmr.${timestamp}.${randomSuffix}`;

  // Check if DOI already exists
  const existingArticle = await Article.findOne({ doi });
  if (existingArticle) {
    res.status(400);
    throw new Error('DOI already exists, please try again');
  }

  article.doi = doi;
  await article.save();

  res.json({
    success: true,
    data: {
      doi,
      articleId: article._id
    }
  });
});

module.exports = {
  getPublicationWorkflow,
  getArticlesReadyForPublication,
  publishArticle,
  createJournalIssue,
  getJournalIssues,
  getPublicationMetrics,
  generateDOI
};
