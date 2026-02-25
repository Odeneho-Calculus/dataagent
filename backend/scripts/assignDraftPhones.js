require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const formatArg = (process.argv[2] || '0').toLowerCase();
const format = ['233', '0', 'both'].includes(formatArg) ? formatArg : null;

if (!format) {
  console.error('Usage: node scripts/assignDraftPhones.js <format>');
  console.error('Format must be "0", "233", or "both"');
  process.exit(1);
}

const buildDraftPhone = () => {
  const digits = Math.floor(100000000 + Math.random() * 900000000).toString();
  if (format === 'both') {
    return Math.random() < 0.5 ? `0${digits}` : `233${digits}`;
  }
  return format === '233' ? `233${digits}` : `0${digits}`;
};

async function assignDraftPhones() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const existingPhones = new Set(
      (await User.find({ phone: { $nin: [null, ''] } }).select('phone'))
        .map((user) => user.phone)
        .filter(Boolean)
    );

    const filter = {
      $or: [{ phone: { $exists: false } }, { phone: null }, { phone: '' }],
    };

    const users = await User.find(filter).select('_id');

    if (users.length === 0) {
      console.log('No users missing phone numbers');
      process.exit(0);
    }

    const bulkOps = users.map((user) => {
      let draftPhone = buildDraftPhone();
      while (existingPhones.has(draftPhone)) {
        draftPhone = buildDraftPhone();
      }
      existingPhones.add(draftPhone);
      return {
        updateOne: {
          filter: { _id: user._id },
          update: { $set: { phone: draftPhone } },
        },
      };
    });

    const result = await User.bulkWrite(bulkOps);

    console.log(`✓ Assigned draft phone numbers to ${result.modifiedCount} users`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

assignDraftPhones();
