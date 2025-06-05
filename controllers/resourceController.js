const Syllabus = require('../models/syllabus');
const Notes = require('../models/notes');

const resourceController = {
  // Add Syllabus
  addSyllabus: async (req, res) => {
    const { class: classNum, curriculum, subject, syllabusLink, duration, frequency, mode, programFeatures } = req.body;
    try {
      const syllabus = new Syllabus({
        class: classNum,
        curriculum,
        subject,
        syllabusLink,
        duration,
        frequency,
        mode,
        programFeatures,
        createdBy: req.user.id
      });
      await syllabus.save();
      res.status(201).json({ message: 'Syllabus added successfully', syllabusId: syllabus._id });
    } catch (error) {
      console.error('Add syllabus error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get All Syllabi
  getAllSyllabi: async (req, res) => {
    try {
      const syllabi = await Syllabus.find().populate('createdBy', 'name email');
      console.log('Fetched syllabi count:', syllabi.length); // Log number of syllabi
      if (!syllabi || syllabi.length === 0) {
        return res.status(200).json({ message: 'No syllabi found', data: [] });
      }
      res.json(syllabi);
    } catch (error) {
      console.error('Get all syllabi error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Update Syllabus
  updateSyllabus: async (req, res) => {
    const { syllabusId } = req.params;
    const { class: classNum, curriculum, subject, syllabusLink, duration, frequency, mode, programFeatures } = req.body;
    try {
      const syllabus = await Syllabus.findById(syllabusId);
      if (!syllabus) {
        return res.status(404).json({ message: 'Syllabus not found' });
      }
      if (syllabus.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this syllabus' });
      }
      syllabus.class = classNum || syllabus.class;
      syllabus.curriculum = curriculum || syllabus.curriculum;
      syllabus.subject = subject || syllabus.subject;
      syllabus.syllabusLink = syllabusLink || syllabus.syllabusLink;
      syllabus.duration = duration || syllabus.duration;
      syllabus.frequency = frequency || syllabus.frequency;
      syllabus.mode = mode || syllabus.mode;
      syllabus.programFeatures = programFeatures || syllabus.programFeatures;
      await syllabus.save();
      res.json({ message: 'Syllabus updated successfully', syllabusId: syllabus._id });
    } catch (error) {
      console.error('Update syllabus error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Delete Syllabus
  deleteSyllabus: async (req, res) => {
    const { syllabusId } = req.params;
    try {
      const syllabus = await Syllabus.findById(syllabusId);
      if (!syllabus) {
        return res.status(404).json({ message: 'Syllabus not found' });
      }
      if (syllabus.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this syllabus' });
      }
      await Syllabus.deleteOne({ _id: syllabusId });
      res.json({ message: 'Syllabus deleted successfully' });
    } catch (error) {
      console.error('Delete syllabus error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Add Notes
  addNotes: async (req, res) => {
    const { class: classNum, curriculum, subject, notesLink } = req.body;
    try {
      const notes = new Notes({
        class: classNum,
        curriculum,
        subject,
        notesLink,
        createdBy: req.user.id
      });
      await notes.save();
      res.status(201).json({ message: 'Notes added successfully', notesId: notes._id });
    } catch (error) {
      console.error('Add notes error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get All Notes
  getAllNotes: async (req, res) => {
    try {
      const notes = await Notes.find().populate('createdBy', 'name email');
      console.log('Fetched notes count:', notes.length); // Log number of notes
      if (!notes || notes.length === 0) {
        return res.status(200).json({ message: 'No notes found', data: [] });
      }
      res.json(notes);
    } catch (error) {
      console.error('Get all notes error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Update Notes
  updateNotes: async (req, res) => {
    const { notesId } = req.params;
    const { class: classNum, curriculum, subject, notesLink } = req.body;
    try {
      const notes = await Notes.findById(notesId);
      if (!notes) {
        return res.status(404).json({ message: 'Notes not found' });
      }
      if (notes.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this notes' });
      }
      notes.class = classNum || notes.class;
      notes.curriculum = curriculum || notes.curriculum;
      notes.subject = subject || notes.subject;
      notes.notesLink = notesLink || notes.notesLink;
      await notes.save();
      res.json({ message: 'Notes updated successfully', notesId: notes._id });
    } catch (error) {
      console.error('Update notes error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Delete Notes
  deleteNotes: async (req, res) => {
    const { notesId } = req.params;
    try {
      const notes = await Notes.findById(notesId);
      if (!notes) {
        return res.status(404).json({ message: 'Notes not found' });
      }
      if (notes.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this notes' });
      }
      await Notes.deleteOne({ _id: notesId });
      res.json({ message: 'Notes deleted successfully' });
    } catch (error) {
      console.error('Delete notes error:', error);
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = resourceController;