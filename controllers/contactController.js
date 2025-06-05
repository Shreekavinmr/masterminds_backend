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

// Controller to handle contact form submission
const sendContactEmail = async (req, res) => {
  const { name, email, type, subject, message, newsletter } = req.body;

  // Basic validation for form fields
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  if (!email.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }
  if (message.length > 280) {
    return res.status(400).json({ success: false, message: 'Message exceeds 280 characters' });
  }

  // Validate admin email
  if (!process.env.ADMIN_EMAIL) {
    console.error('ADMIN_EMAIL is not defined in .env');
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }

  // Email options
  const mailOptions = {
    from: `"Contact Form" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL, // Corrected to ADMIN_EMAIL
    subject: `New Contact Form: ${subject}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Inquiry Type:</strong> ${type || 'Not specified'}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong> ${message}</p>
      <p><em>Submitted on: ${new Date().toLocaleString()}</em></p>
    `,
  };

  try {
    // Send email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

module.exports = { sendContactEmail };