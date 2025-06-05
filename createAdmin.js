const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    const email = 'mrshreekavin@gmail.com';
    const password = '123456';

    let user = await User.findOne({ email });
    if (user) {
      console.log('Admin already exists');
      return;
    }

    user = new User({
      name: 'Admin User',
      email,
      password: await bcrypt.hash(password, 10),
      role: 'admin',
    });

    await user.save();
    console.log('Admin created successfully');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    mongoose.connection.close();
  }
};

createAdmin();