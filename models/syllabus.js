const mongoose = require('mongoose');

const syllabusSchema = new mongoose.Schema({
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
  syllabusLink: {
    type: String,
    required: true,
    match: [/^https?:\/\/(www\.)?drive\.google\.com/, 'Please provide a valid Google Drive link']
  },
  duration: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    required: true,
    enum: ['Online', 'Offline', 'Hybrid']
  },
  programFeatures: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Syllabus', syllabusSchema);