const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Controller to handle enrollment form submission
const sendEnrollEmail = async (req, res) => {
  const { name, email, phoneNumber, curricula, subjects } = req.body;

  // Basic validation
  if (!name || !email || !phoneNumber) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  if (!email.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }
  if (phoneNumber.length < 10) {
    return res.status(400).json({ success: false, message: 'Invalid phone number' });
  }

  // Validate admin email
  if (!process.env.ADMIN_EMAIL) {
    console.error('ADMIN_EMAIL is not defined in .env');
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }

  // Email options
  const mailOptions = {
    from: `"Enrollment Form" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `New Enrollment Inquiry from ${name}`,
    html: `
      <h2>New Enrollment Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone Number:</strong> ${phoneNumber}</p>
      <p><strong>Subjects:</strong> ${subjects?.length > 0 ? subjects.join(', ') : 'Not specified'}</p>
      <p><strong>Curricula:</strong> ${curricula?.length > 0 ? curricula.join(', ') : 'Not specified'}</p>
      <p><em>Submitted on: ${new Date().toLocaleString()}</em></p>
    `,
  };

  try {
    // Send email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Enrollment request submitted successfully' });
  } catch (error) {
    console.error('Error sending enrollment email:', error);
    res.status(500).json({ success: false, message: 'Failed to send enrollment request' });
  }
};

module.exports = { sendEnrollEmail };