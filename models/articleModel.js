const mongoose = require('mongoose');

const articleSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      unique: true,
    },
    abstract: {
      type: String,
      required: [true, 'Please add an abstract'],
    },
    authors: [{
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      affiliation: {
        type: String,
        required: true,
      },
      orcidId: String,
      isCorresponding: {
        type: Boolean,
        default: false,
      },
    }],
    journal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Journal',
      required: true,
    },
    keywords: {
      type: [String],
      required: [true, 'Please add keywords'],
      validate: [arrayLimit, 'Keywords cannot exceed 5'],
    },
    pdfUrl: {
      type: String,
      required: [true, 'Please upload PDF file'],
    },
    status: {
      type: String,
      enum: ['submitted', 'initial-review', 'under-review', 'revision-required', 'revised', 'accepted', 'rejected', 'published', 'withdrawn'],
      default: 'submitted',
    },
    manuscriptId: {
      type: String,
      unique: true,
      required: true,
    },
    revisionNumber: {
      type: Number,
      default: 0,
    },
    editorAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    associateEditor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    submissionDate: {
      type: Date,
      default: Date.now,
    },
    publicationDate: {
      type: Date,
    },
    volume: {
      type: Number,
    },
    issue: {
      type: Number,
    },
    pageRange: {
      start: Number,
      end: Number,
    },
    doi: {
      type: String,
      unique: true,
      sparse: true,
    },
    citations: {
      type: Number,
      default: 0,
    },
    reviewers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    reviews: [{
      reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      reviewStartDate: {
        type: Date,
        default: Date.now,
      },
      reviewSubmittedDate: {
        type: Date,
      },
      status: {
        type: String,
        enum: ['pending', 'in-progress', 'submitted', 'declined'],
        default: 'pending',
      },
      criteria: {
        originality: {
          type: Number,
          min: 1,
          max: 5,
        },
        methodology: {
          type: Number,
          min: 1,
          max: 5,
        },
        results: {
          type: Number,
          min: 1,
          max: 5,
        },
        writingQuality: {
          type: Number,
          min: 1,
          max: 5,
        },
        significance: {
          type: Number,
          min: 1,
          max: 5,
        },
      },
      summary: {
        type: String,
      },
      strengths: {
        type: String,
      },
      weaknesses: {
        type: String,
      },
      detailedComments: {
        type: String,
        required: true,
      },
      confidentialComments: {
        type: String,
      },
      recommendation: {
        type: String,
        enum: ['accept', 'accept-minor', 'major-revision', 'reject'],
        required: true,
      },
      filesForAuthors: [{
        filename: String,
        url: String,
        uploadedAt: Date,
      }],
    }],
    revisions: [{
      revisionNumber: Number,
      submittedDate: Date,
      responseToReviewers: String,
      changesHighlighted: String,
      revisedPdfUrl: String,
    }],
    editorialHistory: [{
      action: {
        type: String,
        enum: ['assigned-editor', 'assigned-reviewers', 'review-completed', 'decision-made', 'revision-requested', 'revision-submitted'],
      },
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      date: {
        type: Date,
        default: Date.now,
      },
      notes: String,
    }],
    finalDecision: {
      decision: {
        type: String,
        enum: ['accept', 'reject'],
      },
      decisionDate: Date,
      decisionMaker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      decisionLetter: String,
    },
  },
  {
    timestamps: true,
  }
);

// Validate keywords array length
function arrayLimit(val) {
  return val.length <= 5;
}

module.exports = mongoose.model('Article', articleSchema); 