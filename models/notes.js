const mongoose = require('mongoose');

const notesSchema = new mongoose.Schema({
  class: {
    type: String,
    required: true,
    enum: ['8', '9', '10', '11', '12']
  },
  curriculum: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  notesLink: {
    type: String,
    required: true,
    match: [/^https?:\/\/(www\.)?drive\.google\.com/, 'Please provide a valid Google Drive link']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notes', notesSchema);