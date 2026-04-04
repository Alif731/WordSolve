const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  conceptId: { type: String, required: true },
  questionId: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  response: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attempt', attemptSchema);
