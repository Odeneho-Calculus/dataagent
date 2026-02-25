require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4];
const phone = process.argv[5];

if (!email || !password || !name) {
  console.error('Usage: node scripts/createAdmin.js <email> <password> <name> [phone]');
  console.error('Example: node scripts/createAdmin.js admin@example.com password123 "Admin User" 233501234567');
  process.exit(1);
}

if (password.length < 6) {
  console.error('Password must be at least 6 characters');
  process.exit(1);
}

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error(`User with email ${email} already exists`);
      process.exit(1);
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        console.error(`Phone number ${phone} already in use`);
        process.exit(1);
      }
    }

    let draftPhone = phone || `0${Math.floor(100000000 + Math.random() * 900000000)}`;
    if (!phone) {
      let phoneExists = await User.findOne({ phone: draftPhone });
      while (phoneExists) {
        draftPhone = `0${Math.floor(100000000 + Math.random() * 900000000)}`;
        phoneExists = await User.findOne({ phone: draftPhone });
      }
    }

    const admin = await User.create({
      email,
      password,
      name,
      phone: draftPhone,
      role: 'admin',
      isActive: true,
    });

    console.log(`✓ Successfully created admin account`);
    console.log(`  Name: ${admin.name}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Role: admin`);
    console.log(`\nYou can now login with these credentials`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
