const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/User');
const Student = require('../models/studentModel');

// Debug: Log to verify imports
console.log('User model:', User);
console.log('Student model:', Student);

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const authController = {
  login: async (req, res) => {
    const { email, password } = req.body;
    try {
      if (!User || typeof User.findOne !== 'function') {
        throw new Error('User model is not properly defined');
      }
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      const authPayload = {
        id: user.id,
        name: user.name,
        role: user.role,
      };
      const authToken = jwt.sign(authPayload, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
      const metaPayload = {
        name: user.name,
        role: user.role,
      };
      const metaToken = jwt.sign(metaPayload, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
      res.cookie('token', authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 60 * 60 * 1000,
      });
      res.cookie('userMeta', metaToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 60 * 60 * 1000,
      });
      res.json({ message: 'Login successful' });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  forgotPassword: async (req, res) => {
    const { email } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const resetToken = crypto.randomBytes(20).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
      await user.save();
      const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
      const message = `
        Dear ${user.name},
        You are receiving this email because you requested a password reset.
        Please click the following link to reset your password:
        ${resetUrl}
        This link will expire in 10 minutes.
        Regards,
        Masterminds Academy Admin
      `;
      await transporter.sendMail({
        to: user.email,
        subject: 'Password Reset Request',
        text: message,
      });
      res.json({ message: 'Email sent with password reset instructions' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  resetPassword: async (req, res) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');
    try {
      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }
      user.password = await bcrypt.hash(req.body.password, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  getMe: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('name role');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ name: user.name, role: user.role });
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  logout: async (req, res) => {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    });
    res.clearCookie('userMeta', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    });
    res.json({ message: 'Logout successful' });
  },

  enrollStudent: async (req, res) => {
    const { name, email, phoneNumber, address, class: studentClass, curricula, subjects, paymentStatus, paymentAmount } = req.body;
    const defaultPassword = '123456';
    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      user = new User({
        name,
        email,
        password: await bcrypt.hash(defaultPassword, 10),
        role: 'student',
      });
      await user.save();
      const student = new Student({
        user: user._id,
        name,
        email,
        phoneNumber,
        address,
        class: studentClass,
        curricula: curricula || [],
        subjects: subjects || [],
        payment: {
          status: paymentStatus || 'pending',
          amount: paymentAmount || 0,
        },
      });
      await student.save();

      // Enhanced HTML email template
      const htmlMessage = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Masterminds Academy</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
              padding: 30px 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 300;
            }
            .content {
              padding: 40px 30px;
            }
            .welcome-text {
              font-size: 18px;
              color: #2c3e50;
              margin-bottom: 25px;
            }
            .credentials-box {
              background: #f8f9fa;
              border-left: 4px solid #667eea;
              padding: 20px;
              margin: 25px 0;
              border-radius: 5px;
            }
            .credentials-title {
              font-size: 18px;
              font-weight: 600;
              color: #2c3e50;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
            }
            .credential-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin: 10px 0;
              padding: 8px 0;
              border-bottom: 1px solid #e9ecef;
            }
            .credential-item:last-child {
              border-bottom: none;
            }
            .credential-label {
              font-weight: 600;
              color: #495057;
            }
            .credential-value {
              font-family: 'Courier New', monospace;
              background: #e9ecef;
              padding: 4px 8px;
              border-radius: 4px;
              font-weight: 500;
            }
            .payment-info {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 5px;
              padding: 20px;
              margin: 25px 0;
            }
            .payment-status {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .status-pending {
              background: #fff3cd;
              color: #856404;
            }
            .status-paid {
              background: #d1edff;
              color: #0c5460;
            }
            .important-note {
              background: #f8d7da;
              border: 1px solid #f5c6cb;
              color: #721c24;
              padding: 15px;
              border-radius: 5px;
              margin: 25px 0;
            }
            .footer {
              background: #2c3e50;
              color: white;
              text-align: center;
              padding: 25px;
            }
            .footer p {
              margin: 5px 0;
            }
            .btn {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 25px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: 600;
            }
            @media (max-width: 600px) {
              .container {
                margin: 10px;
                border-radius: 5px;
              }
              .content {
                padding: 20px;
              }
              .credential-item {
                flex-direction: column;
                align-items: flex-start;
              }
              .credential-value {
                margin-top: 5px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Welcome to Masterminds Academy</h1>
            </div>
            
            <div class="content">
              <p class="welcome-text">
                Dear <strong>${name}</strong>,
              </p>
              
              <p>
                Congratulations! Your student account has been successfully created at 
                <strong>Masterminds Academy</strong>. We're excited to have you join our 
                learning community.
              </p>
              
              <div class="credentials-box">
                <div class="credentials-title">
                  🔐 Your Login Credentials
                </div>
                <div class="credential-item">
                  <span class="credential-label">Email:</span>
                  <span class="credential-value">${email}</span>
                </div>
                <div class="credential-item">
                  <span class="credential-label">Password:</span>
                  <span class="credential-value">${defaultPassword}</span>
                </div>
              </div>
              
              <div class="payment-info">
                <h3 style="margin-top: 0; color: #856404;">💳 Payment Information</h3>
                <div class="credential-item">
                  <span class="credential-label">Status:</span>
                  <span class="payment-status ${student.payment.status === 'paid' ? 'status-paid' : 'status-pending'}">
                    ${student.payment.status}
                  </span>
                </div>
                <div class="credential-item">
                  <span class="credential-label">Amount:</span>
                  <span class="credential-value">$${student.payment.amount}</span>
                </div>
              </div>
              
              <div class="important-note">
                <strong>⚠️ Important Security Notice:</strong><br>
                For your security, please change your password immediately after your first login.
              </div>
              
              <p>
                You can now access your student portal and begin your learning journey with us. 
                If you have any questions or need assistance, please don't hesitate to contact 
                our support team.
              </p>
              
              <center>
                <a href="#" class="btn">Access Student Portal</a>
              </center>
            </div>
            
            <div class="footer">
              <p><strong>Masterminds Academy</strong></p>
              <p>Empowering Knowledge</p>
              <p>📧 support@mastermindsacademy.com | 📞 +1 (555) 123-4567</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Plain text version for email clients that don't support HTML
      const textMessage = `
Dear ${name},

Welcome to Masterminds Academy!

Your student account has been successfully created.

LOGIN CREDENTIALS:
Email: ${email}
Password: ${defaultPassword}

PAYMENT INFORMATION:
Status: ${student.payment.status}
Amount: $${student.payment.amount}

IMPORTANT: Please change your password after your first login for security.

Best regards,
Masterminds Academy Team
      `;

      await transporter.sendMail({
        to: email,
        subject: '🎓 Welcome to Masterminds Academy - Account Created',
        text: textMessage,
        html: htmlMessage,
      });

      res.status(201).json({ 
        message: 'Student enrolled successfully and welcome email sent', 
        studentId: student._id 
      });
    } catch (error) {
      console.error('Enroll student error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  updateStudent: async (req, res) => {
    const { studentId } = req.params;
    const {
      name,
      email,
      phoneNumber,
      address,
      class: studentClass,
      curricula,
      subjects,
      payment,
    } = req.body;
    try {
      console.log('Update request body:', req.body);
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      student.name = name || student.name;
      student.email = email || student.email;
      student.phoneNumber = phoneNumber || student.phoneNumber;
      student.address = address || student.address;
      student.class = studentClass || student.class;
      student.curricula = curricula || student.curricula;
      student.subjects = subjects || student.subjects;
      student.payment = {
        status: payment?.status || student.payment.status,
        amount: payment?.amount != null ? Number(payment.amount) : student.payment.amount,
      };
      await student.save();
      const user = await User.findById(student.user);
      if (!user) {
        return res.status(404).json({ message: 'Associated user not found' });
      }
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser._id.toString() !== user._id.toString()) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }
      user.name = name || user.name;
      user.email = email || user.email;
      await user.save();
      res.json({ message: 'Student details updated successfully' });
    } catch (error) {
      console.error('Update student error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  deleteStudent: async (req, res) => {
    const { studentId } = req.params;
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      const user = await User.findById(student.user);
      if (!user) {
        return res.status(404).json({ message: 'Associated user not found' });
      }
      await Student.deleteOne({ _id: studentId });
      await User.deleteOne({ _id: student.user });
      res.json({ message: 'Student and associated user deleted successfully' });
    } catch (error) {
      console.error('Delete student error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  getStudent: async (req, res) => {
    const { studentId } = req.params;
    try {
      const student = await Student.findById(studentId).populate('user', 'name email role');
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      res.json(student);
    } catch (error) {
      console.error('Get student error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  getAllStudents: async (req, res) => {
    try {
      const students = await Student.find().populate('user', 'name email role');
      res.json(students);
    } catch (error) {
      console.error('Get all students error:', error);
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = authController;