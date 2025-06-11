const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const resourceController = require('../controllers/resourceController');
const { protect, admin } = require('../middleware/auth');

const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    return next();
  }
  res.status(403).json({ message: 'Access denied: Student role required' });
};

// Public route for fetching syllabi (for course listings)
router.get('/syllabi', resourceController.getAllSyllabi);

// Syllabus Routes (Admin only)
router.post('/syllabus', protect, admin, resourceController.addSyllabus);
router.get('/syllabus', protect, admin, resourceController.getAllSyllabi);
router.put('/syllabus/:syllabusId', protect, admin, resourceController.updateSyllabus);
router.delete('/syllabus/:syllabusId', protect, admin, resourceController.deleteSyllabus);

// Notes Routes (Admin only)
router.post('/notes', protect, admin, resourceController.addNotes);
router.get('/notes', protect, admin, resourceController.getAllNotes);
router.put('/notes/:notesId', protect, admin, resourceController.updateNotes);
router.delete('/notes/:notesId', protect, admin, resourceController.deleteNotes);

// Student Notes Route (Filtered by student's enrollment)
router.get('/student/notes', protect, isStudent, resourceController.getStudentNotes);

// Auth and Student Routes
router.post('/login', authController.login);
router.post('/forgotpassword', authController.forgotPassword);
router.put('/resetpassword/:resettoken', authController.resetPassword);
router.post('/enroll-student', protect, admin, authController.enrollStudent);
router.put('/students/:studentId', protect, admin, authController.updateStudent);
router.delete('/students/:studentId', protect, admin, authController.deleteStudent);
router.get('/students/:studentId', protect, admin, authController.getStudent);
router.get('/students', protect, admin, authController.getAllStudents);
router.get('/me', protect, authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;