const mongoose = require('mongoose');

const journalSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    issn: {
      type: String,
      required: [true, 'Please add an ISSN number'],
      unique: true,
      match: [/^\d{4}-\d{3}[\dX]$/, 'Please add a valid ISSN number'],
    },
    chiefEditor: {
      type: String,
      required: [true, 'Please add a chief editor'],
    },
    scope: {
      type: [String],
      required: [true, 'Please add journal scope'],
    },
    indexing: [String],
    impactFactor: {
      type: Number,
      default: 0,
    },
    publishingFrequency: {
      type: String,
      required: [true, 'Please add publishing frequency'],
    },
    openAccess: {
      type: Boolean,
      default: true,
    },
    peerReviewed: {
      type: Boolean,
      default: true,
    },
    coverImage: {
      type: String,
      default: 'default-journal-cover.jpg',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Journal', journalSchema); 