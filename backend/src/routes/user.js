const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ 
      success: true, 
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        balance: user.balance,
        referralCode: user.referralCode,
        referralEarnings: user.referralEarnings,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, phone },
      { new: true }
    );
    res.json({ 
      success: true, 
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        balance: user.balance,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
