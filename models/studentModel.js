const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
  },
  address: {
    type: String,
  },
  class: {
    type: String,
  },
  curricula: [{
    type: String,
  }],
  subjects: [{
    type: String,
  }],
  payment: {
    status: {
      type: String,
      enum: ['pending', 'partial', 'completed'],
      default: 'pending',
    },
    amount: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;