const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Purchase = require('../models/Purchase');
const Order = require('../models/Order');
const ReferralSettings = require('../models/ReferralSettings');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ $or: [{ role: 'user' }, { role: { $exists: false } }] });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const activeUsers = await User.countDocuments({ $and: [{ $or: [{ role: 'user' }, { role: { $exists: false } }] }, { isActive: true }] });
    const totalTransactions = await Transaction.countDocuments();
    const totalPurchases = await Purchase.countDocuments();
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: 'completed' });

    const totalBalance = await User.aggregate([
      { $match: { $or: [{ role: 'user' }, { role: { $exists: false } }] } },
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);

    const totalReferralEarnings = await User.aggregate([
      { $match: { $or: [{ role: 'user' }, { role: { $exists: false } }] } },
      { $group: { _id: null, total: { $sum: '$referralEarnings' } } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        activeUsers,
        totalTransactions,
        totalPurchases,
        totalOrders,
        completedOrders,
        totalBalance: totalBalance[0]?.total || 0,
        totalReferralEarnings: totalReferralEarnings[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role = 'user', search = '' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (role === 'user') {
      query = { $or: [{ role: 'user' }, { role: { $exists: false } }] };
    } else {
      query = { role };
    }
    
    if (search) {
      query = {
        $and: [
          query,
          { $or: [
            { email: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } }
          ]}
        ]
      };
    }

    const users = await User.find(query)
      .select('-password')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "user" or "admin"',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: { id: user._id, isActive: user.isActive },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find()
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Transaction.countDocuments();

    res.status(200).json({
      success: true,
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getPurchases = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const purchases = await Purchase.find()
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Purchase.countDocuments();

    res.status(200).json({
      success: true,
      purchases,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const orders = await Order.find()
      .populate('userId', 'name email')
      .populate('dataPlanId', 'network dataSize planName')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments();

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getFullUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { banReason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot ban admin users',
      });
    }

    user.status = 'banned';
    user.banReason = banReason || 'No reason provided';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User banned successfully',
      user: { id: user._id, status: user.status, banReason: user.banReason },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.unbanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.status = 'active';
    user.banReason = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User unbanned successfully',
      user: { id: user._id, status: user.status },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    const { days } = req.body;
    
    if (!days || days <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid suspension duration in days',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot suspend admin users',
      });
    }

    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + days);

    user.status = 'suspended';
    user.suspendedUntil = suspendedUntil;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User suspended for ${days} days`,
      user: { 
        id: user._id, 
        status: user.status, 
        suspendedUntil: user.suspendedUntil 
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.unsuspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.status = 'active';
    user.suspendedUntil = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User suspension lifted',
      user: { id: user._id, status: user.status },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users',
      });
    }

    user.deletedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      user: { id: user._id, deletedAt: user.deletedAt },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.restoreUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.deletedAt = null;
    user.status = 'active';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User restored successfully',
      user: { id: user._id, deletedAt: user.deletedAt },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllReferrals = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    let query = { referralEarnings: { $gt: 0 } };

    if (search) {
      query = {
        $and: [
          query,
          { $or: [
            { email: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } },
            { referralCode: { $regex: search, $options: 'i' } }
          ]}
        ]
      };
    }

    const referrals = await User.find(query)
      .select('name email referralCode referralEarnings createdAt')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ referralEarnings: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      referrals,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getReferralStats = async (req, res) => {
  try {
    const totalReferralUsers = await User.countDocuments({ referralEarnings: { $gt: 0 } });
    
    const topReferrers = await User.find({ referralEarnings: { $gt: 0 } })
      .select('name email referralCode referralEarnings')
      .sort({ referralEarnings: -1 })
      .limit(10);

    const totalReferralEarnings = await User.aggregate([
      { $match: { referralEarnings: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$referralEarnings' } } }
    ]);

    const averageEarnings = totalReferralUsers > 0 
      ? (totalReferralEarnings[0]?.total || 0) / totalReferralUsers 
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalReferralUsers,
        totalReferralEarnings: totalReferralEarnings[0]?.total || 0,
        averageEarningsPerReferrer: averageEarnings,
        topReferrers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateReferralEarnings = async (req, res) => {
  try {
    const { earnings } = req.body;

    if (earnings === undefined || earnings < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid earnings amount',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { referralEarnings: earnings },
      { new: true, runValidators: true }
    ).select('name email referralCode referralEarnings');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Referral earnings updated successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.resetReferralCode = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.referralCode = 'REF' + user._id.toString().slice(-8).toUpperCase();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Referral code reset successfully',
      user: { id: user._id, referralCode: user.referralCode },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.resetAllReferralEarnings = async (req, res) => {
  try {
    const result = await User.updateMany(
      { referralEarnings: { $gt: 0 } },
      { referralEarnings: 0 }
    );

    res.status(200).json({
      success: true,
      message: 'All referral earnings reset successfully',
      updated: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getReferralSettings = async (req, res) => {
  try {
    let settings = await ReferralSettings.findOne();

    if (!settings) {
      settings = await ReferralSettings.create({
        amountPerReferral: 1,
        minimumWithdrawalAmount: 10,
        isEnabled: true,
        maxReferralsPerUser: null,
        description: 'Earn GHS per successful referral',
      });
    }

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateReferralSettings = async (req, res) => {
  try {
    const { amountPerReferral, minimumWithdrawalAmount, isEnabled, maxReferralsPerUser, description } = req.body;

    let settings = await ReferralSettings.findOne();

    if (!settings) {
      settings = await ReferralSettings.create({
        amountPerReferral: amountPerReferral ?? 1,
        minimumWithdrawalAmount: minimumWithdrawalAmount ?? 10,
        isEnabled: isEnabled ?? true,
        maxReferralsPerUser: maxReferralsPerUser ?? null,
        description: description ?? 'Earn GHS per successful referral',
      });
    } else {
      if (amountPerReferral !== undefined) settings.amountPerReferral = amountPerReferral;
      if (minimumWithdrawalAmount !== undefined) settings.minimumWithdrawalAmount = minimumWithdrawalAmount;
      if (isEnabled !== undefined) settings.isEnabled = isEnabled;
      if (maxReferralsPerUser !== undefined) settings.maxReferralsPerUser = maxReferralsPerUser;
      if (description !== undefined) settings.description = description;
      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: 'Referral settings updated successfully',
      settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
