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
    const { page = 1, limit = 10, type = '', status = '' } = req.query;
    const skip = (page - 1) * limit;

    const allTransactions = [];

    const txFilter = {};
    const orderFilter = {};

    if (type && type !== 'data_purchase') {
      txFilter.type = type;
    }
    
    if (status) {
      if (type === 'data_purchase' || !type) {
        if (status === 'successful') {
          orderFilter.status = 'completed';
        } else {
          orderFilter.status = status;
        }
      }
      if (type !== 'data_purchase') {
        txFilter.status = status;
      }
    }

    if (!type || type === 'data_purchase') {
      const orders = await Order.find(orderFilter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });

      const formattedOrders = orders.map(order => {
        console.log('[Admin Get Transactions] Data purchase order:', {
          orderId: order._id,
          amount: order.amount,
          dataPlanId: order.dataPlanId,
          status: order.status,
        });
        return {
          _id: order._id,
          userId: order.userId,
          type: 'data_purchase',
          amount: order.amount,
          currency: 'GHS',
          status: order.status === 'completed' ? 'successful' : order.status,
          reference: order.orderNumber,
          description: `${order.planName} - ${order.dataAmount}`,
          isAPI: false,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          _isOrder: true,
        };
      });

      allTransactions.push(...formattedOrders);
    }

    if (!type || type !== 'data_purchase') {
      const transactions = await Transaction.find(txFilter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });

      allTransactions.push(...transactions);
    }

    allTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = allTransactions.length;
    const paginatedTransactions = allTransactions.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      transactions: paginatedTransactions,
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

exports.deleteTransaction = async (req, res) => {
  try {
    const transactionId = req.params.id;

    const transaction = await Transaction.findByIdAndDelete(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      transaction: {
        id: transaction._id,
        reference: transaction.reference,
      },
    });
  } catch (error) {
    console.error('deleteTransaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteAllTransactions = async (req, res) => {
  try {
    const result = await Transaction.deleteMany({});

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} transactions`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('deleteAllTransactions error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.bulkDeleteTransactionsByStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['successful', 'pending', 'failed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be successful, pending, failed, or cancelled',
      });
    }

    const result = await Transaction.deleteMany({ status });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} transactions with status: ${status}`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('bulkDeleteTransactionsByStatus error:', error);
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
    const { page = 1, limit = 10, status, network } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;
    if (network) filter.network = network;

    const orders = await Order.find(filter)
      .populate('userId', 'name email phone')
      .populate('dataPlanId', 'network dataSize planName')
      .populate('transactionId', 'reference amount status')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        orders: orders.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber,
          topzaOrderId: order.topzaOrderId,
          status: order.status,
          user: order.userId,
          network: order.network,
          phoneNumber: order.phoneNumber,
          dataAmount: order.dataAmount,
          planName: order.planName,
          amount: order.amount,
          paymentMethod: order.paymentMethod,
          transactionReference: order.transactionReference,
          paystackReference: order.paystackReference,
          transaction: order.transactionId,
          providerMessage: order.providerMessage,
          errorMessage: order.errorMessage,
          date: order.createdAt,
        })),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
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

exports.syncOrderStatusesFromTopza = async (req, res) => {
  try {
    console.log('[Admin] Manual order sync triggered by admin');
    const { syncOrderStatusesFromTopza } = require('../jobs/orderStatusSync');
    
    const result = await syncOrderStatusesFromTopza();

    res.status(200).json({
      success: result.success,
      message: 'Manual order sync completed. Use the order status update endpoint to manually change statuses.',
      data: result.data,
    });
  } catch (error) {
    console.error('syncOrderStatusesFromTopza error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const orderId = req.params.id;

    if (!['pending', 'processing', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, processing, completed, or failed',
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const oldStatus = order.status;
    order.status = status;
    
    if (adminNotes) {
      order.adminNotes = adminNotes;
    }

    if (status === 'completed' && !order.completedAt) {
      order.completedAt = new Date();
      order.completedBy = 'admin';
    }

    if (!order.statusHistory) {
      order.statusHistory = [];
    }

    order.statusHistory.push({
      status,
      updatedAt: new Date(),
      source: 'admin',
      notes: adminNotes || null,
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated from ${oldStatus} to ${status}`,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        adminNotes: order.adminNotes,
        completedAt: order.completedAt,
        completedBy: order.completedBy,
      },
    });
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findByIdAndDelete(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
      },
    });
  } catch (error) {
    console.error('deleteOrder error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.bulkDeleteOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'processing', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, processing, completed, or failed',
      });
    }

    const result = await Order.deleteMany({ status });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} orders with status: ${status}`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('bulkDeleteOrdersByStatus error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getTopzaWalletSettings = async (req, res) => {
  try {
    const { getWalletBalance } = require('../utils/topzaApi');
    
    const balanceResult = await getWalletBalance();
    
    const now = new Date();
    
    res.status(200).json({
      success: true,
      data: {
        lastSync: now,
        balance: balanceResult.success ? balanceResult.balance : 0,
        previousBalance: balanceResult.success ? balanceResult.balance : 0,
        syncStatus: balanceResult.success ? 'Success' : 'Error',
        createdCount: 0,
        updatedCount: 42,
        error: balanceResult.success ? null : balanceResult.error,
      },
    });
  } catch (error) {
    console.error('getTopzaWalletSettings error:', error);
    const now = new Date();
    res.status(200).json({
      success: true,
      data: {
        lastSync: now,
        balance: 0,
        previousBalance: 0,
        syncStatus: 'Error',
        createdCount: 0,
        updatedCount: 0,
        error: error.message,
      },
    });
  }
};

exports.getTopzaWalletTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type = '', status = '', startDate, endDate, minAmount, maxAmount } = req.query;
    const { getWalletTransactions } = require('../utils/topzaApi');
    
    const filters = {};
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (minAmount) filters.minAmount = minAmount;
    if (maxAmount) filters.maxAmount = maxAmount;
    
    const result = await getWalletTransactions(parseInt(page), parseInt(limit), filters);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } else {
      res.status(200).json({
        success: true,
        data: {
          transactions: [],
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: 1,
          totalTransactions: 0,
          hasNextPage: false,
        },
        error: result.error,
      });
    }
  } catch (error) {
    console.error('getTopzaWalletTransactions error:', error);
    res.status(200).json({
      success: true,
      data: {
        transactions: [],
      },
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalTransactions: 0,
        hasNextPage: false,
      },
      error: error.message,
    });
  }
};

exports.getPublicStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ $or: [{ role: 'user' }, { role: { $exists: false } }] });
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    
    const successRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalOrdersCompleted: completedOrders,
        successRate: parseFloat(successRate),
      },
    });
  } catch (error) {
    console.error('getPublicStats error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
