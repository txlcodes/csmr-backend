const mongoose = require('mongoose');

const cfpSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  deadline: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('CFP', cfpSchema); 