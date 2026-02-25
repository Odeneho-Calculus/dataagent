const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { createNotification } = require('./notificationController');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

exports.register = async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email, password, name, and phone' 
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already in use'
      });
    }

    const user = await User.create({ email, password, name, phone });
    const token = generateToken(user._id);

    await createNotification({
      type: 'user_created',
      title: 'New User Registration',
      message: `New user ${name} (${email}) has registered`,
      description: `A new user account has been created with email: ${email}. Referral code: ${user.referralCode}`,
      severity: 'info',
      data: {
        userId: user._id,
        userName: name,
        userEmail: email,
      },
      actionUrl: `/admin/users/${user._id}`,
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        balance: user.balance,
        referralCode: user.referralCode,
        role: user.role,
        totalSpent: user.totalSpent,
        dataUsed: user.dataUsed,
        referralEarnings: user.referralEarnings,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    if (user.deletedAt) {
      return res.status(401).json({ 
        success: false, 
        message: 'Your account has been deleted' 
      });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account has been banned. Reason: ' + (user.banReason || 'No reason provided') 
      });
    }

    if (user.status === 'suspended') {
      if (user.suspendedUntil && new Date() >= user.suspendedUntil) {
        user.status = 'active';
        user.suspendedUntil = null;
        await user.save();
      } else {
        return res.status(403).json({ 
          success: false, 
          message: 'Your account is suspended until ' + (user.suspendedUntil ? new Date(user.suspendedUntil).toLocaleDateString() : 'further notice') 
        });
      }
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        balance: user.balance,
        referralCode: user.referralCode,
        role: user.role,
        totalSpent: user.totalSpent,
        dataUsed: user.dataUsed,
        referralEarnings: user.referralEarnings,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        balance: user.balance,
        referralCode: user.referralCode,
        role: user.role,
        totalSpent: user.totalSpent,
        dataUsed: user.dataUsed,
        referralEarnings: user.referralEarnings,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
