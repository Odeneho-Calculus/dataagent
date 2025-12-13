const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

router.get('/balance', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, balance: user.balance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/topup', protect, async (req, res) => {
  try {
    const { amount, paystackReference } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid amount' 
      });
    }

    const transaction = await Transaction.create({
      userId: req.userId,
      type: 'wallet_topup',
      amount,
      reference: 'TXN' + Date.now(),
      paystackReference,
      status: 'completed',
    });

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $inc: { balance: amount } },
      { new: true }
    );

    res.json({ 
      success: true, 
      balance: user.balance, 
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        reference: transaction.reference,
        status: transaction.status,
        createdAt: transaction.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/transactions', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    const total = await Transaction.countDocuments({ userId: req.userId });

    res.json({ 
      success: true, 
      transactions,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/verify', protect, async (req, res) => {
  try {
    const { reference } = req.body;
    
    const transaction = await Transaction.findOne({ reference });
    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }

    res.json({ 
      success: true, 
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        status: transaction.status,
        reference: transaction.reference,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
