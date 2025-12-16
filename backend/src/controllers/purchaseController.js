const axios = require('axios');
const User = require('../models/User');
const Order = require('../models/Order');
const DataPlan = require('../models/DataPlan');
const Transaction = require('../models/Transaction');
const { purchaseDataBundle, getWalletBalance } = require('../utils/topzaApi');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';

const paystackAPI = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
  },
});

exports.buyDataBundle = async (req, res) => {
  try {
    const { dataPlanId, phoneNumber, paymentMethod } = req.body;

    if (!dataPlanId || !phoneNumber || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: dataPlanId, phoneNumber, paymentMethod',
      });
    }

    if (!['wallet', 'paystack'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Must be "wallet" or "paystack"',
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const plan = await DataPlan.findById(dataPlanId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Data plan not found' });
    }

    if (plan.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This data plan is not available' });
    }

    const orderNumber = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 9);

    const order = await Order.create({
      userId: req.userId,
      dataPlanId,
      orderNumber,
      network: plan.network,
      phoneNumber,
      dataAmount: plan.dataSize,
      planName: plan.planName,
      amount: plan.sellingPrice,
      paymentMethod,
      status: 'pending',
    });

    if (paymentMethod === 'wallet') {
      return handleWalletPayment(req, res, user, plan, order);
    } else if (paymentMethod === 'paystack') {
      return handlePaystackPayment(req, res, user, plan, order);
    }
  } catch (error) {
    console.error('[Buy Data Bundle] Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const handleWalletPayment = async (req, res, user, plan, order) => {
  try {
    if (user.balance < plan.sellingPrice) {
      order.status = 'failed';
      order.errorMessage = 'Insufficient wallet balance';
      await order.save();

      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance',
        required: plan.sellingPrice,
        available: user.balance,
      });
    }

    const topzaBalanceCheck = await getWalletBalance();
    console.log('[Wallet Payment] Topza balance check:', {
      success: topzaBalanceCheck.success,
      balance: topzaBalanceCheck.balance,
      required: plan.sellingPrice,
      error: topzaBalanceCheck.error,
    });
    
    if (!topzaBalanceCheck.success || topzaBalanceCheck.balance < plan.sellingPrice) {
      order.status = 'failed';
      order.errorMessage = 'Data purchase currently unavailable';
      await order.save();

      console.error('[Wallet Payment] Failed:', {
        topzaSuccess: topzaBalanceCheck.success,
        balance: topzaBalanceCheck.balance,
        required: plan.sellingPrice,
        error: topzaBalanceCheck.error,
      });

      return res.status(503).json({
        success: false,
        message: 'Data purchase currently unavailable',
      });
    }

    order.status = 'processing';
    await order.save();

    const topzaResponse = await purchaseDataBundle(plan.apiPlanId, order.phoneNumber);
    console.log('[Wallet Payment] Purchase response:', {
      success: topzaResponse.success,
      error: topzaResponse.error,
      dataPlanId: plan.apiPlanId,
      phoneNumber: order.phoneNumber,
    });

    if (!topzaResponse.success) {
      order.status = 'failed';
      order.errorMessage = topzaResponse.error;
      await order.save();

      console.error('[Wallet Payment] Purchase failed:', {
        error: topzaResponse.error,
        dataPlanId: plan.apiPlanId,
        phoneNumber: order.phoneNumber,
      });

      return res.status(400).json({
        success: false,
        message: topzaResponse.error || 'Failed to process purchase with provider',
      });
    }

    const topzaData = topzaResponse.data;

    console.log('[Wallet Payment] Full Topza response:', JSON.stringify(topzaData, null, 2));

    const transaction = await Transaction.create({
      userId: req.userId,
      type: 'data_purchase',
      amount: 0,
      reference: topzaData.transaction?.reference || 'TXN' + Date.now(),
      paystackReference: null,
      status: 'completed',
      description: `Data purchase: ${plan.dataSize} ${plan.network} to ${order.phoneNumber}`,
    });

    await User.findByIdAndUpdate(
      req.userId,
      { 
        $inc: { 
          balance: -plan.sellingPrice,
          totalSpent: plan.sellingPrice,
          dataUsed: parseFloat(plan.dataSize) || 0
        } 
      },
      { new: true }
    );

    order.status = 'processing';
    order.topzaOrderId = topzaData.order?.id;
    order.transactionReference = topzaData.transaction?.reference;
    order.transactionId = transaction._id;
    order.providerMessage = topzaData.providerMessage;
    await order.save();

    const updatedUser = await User.findById(req.userId);

    res.status(200).json({
      success: true,
      message: 'Data bundle purchased successfully',
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          network: order.network,
          phoneNumber: order.phoneNumber,
          dataAmount: order.dataAmount,
          planName: order.planName,
          amount: order.amount,
          date: order.createdAt,
        },
        transaction: {
          id: transaction._id,
          reference: transaction.reference,
          amount: Math.abs(transaction.amount),
          status: transaction.status,
        },
        wallet: {
          balance: updatedUser.balance,
          previousBalance: updatedUser.balance + plan.sellingPrice,
        },
        providerMessage: topzaData.providerMessage,
      },
    });
  } catch (error) {
    console.error('[Wallet Payment] Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack,
    });
    order.status = 'failed';
    order.errorMessage = error.message;
    await order.save();

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const handlePaystackPayment = async (req, res, user, plan, order) => {
  try {
    const topzaBalanceCheck = await getWalletBalance();
    console.log('[Paystack Payment] Topza balance check:', {
      success: topzaBalanceCheck.success,
      balance: topzaBalanceCheck.balance,
      required: plan.sellingPrice,
      error: topzaBalanceCheck.error,
    });
    
    if (!topzaBalanceCheck.success || topzaBalanceCheck.balance < plan.sellingPrice) {
      order.status = 'failed';
      order.errorMessage = 'Data purchase currently unavailable';
      await order.save();

      console.error('[Paystack Payment] Failed:', {
        topzaSuccess: topzaBalanceCheck.success,
        balance: topzaBalanceCheck.balance,
        required: plan.sellingPrice,
        error: topzaBalanceCheck.error,
      });

      return res.status(503).json({
        success: false,
        message: 'Data purchase currently unavailable',
      });
    }

    const reference = 'DT' + Date.now() + Math.random().toString(36).substr(2, 9);

    const transaction = await Transaction.create({
      userId: req.userId,
      type: 'data_purchase',
      amount: 0,
      reference,
      status: 'pending',
      description: `Data purchase: ${plan.dataSize} ${plan.network} to ${order.phoneNumber}`,
    });

    const paystackPayload = {
      email: user.email,
      amount: Math.round(plan.sellingPrice * 100),
      reference,
      metadata: {
        userId: req.userId.toString(),
        orderId: order._id.toString(),
        transactionId: transaction._id.toString(),
        type: 'data_purchase',
        dataPlanId: plan._id.toString(),
        phoneNumber: order.phoneNumber,
      },
    };

    const paystackResponse = await paystackAPI.post('/transaction/initialize', paystackPayload);
    
    console.log('[Paystack Payment] Initialize response:', {
      status: paystackResponse.data.status,
      message: paystackResponse.data.message,
      reference,
    });

    if (!paystackResponse.data.status) {
      order.status = 'failed';
      order.errorMessage = paystackResponse.data.message;
      transaction.status = 'failed';
      await Promise.all([order.save(), transaction.save()]);

      console.error('[Paystack Payment] Initialize failed:', {
        status: paystackResponse.data.status,
        message: paystackResponse.data.message,
        reference,
      });

      return res.status(400).json({
        success: false,
        message: paystackResponse.data.message,
      });
    }

    order.paystackReference = reference;
    order.transactionReference = reference;
    order.transactionId = transaction._id;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Paystack payment initialization successful',
      data: {
        reference,
        authorizationUrl: paystackResponse.data.data.authorization_url,
        accessCode: paystackResponse.data.data.access_code,
        orderId: order._id,
      },
    });
  } catch (error) {
    console.error('[Paystack Payment] Initialization error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack,
    });
    order.status = 'failed';
    order.errorMessage = error.message;
    await order.save();

    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message,
    });
  }
};

exports.verifyDataPurchase = async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Reference is required',
      });
    }

    const order = await Order.findOne({
      transactionReference: reference,
      userId: req.userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const paystackResponse = await paystackAPI.get(`/transaction/verify/${reference}`);
    
    console.log('[Paystack Verification] Verify response:', {
      status: paystackResponse.data.status,
      message: paystackResponse.data.message,
      reference,
    });

    if (!paystackResponse.data.status) {
      console.error('[Paystack Verification] Verification failed:', {
        status: paystackResponse.data.status,
        message: paystackResponse.data.message,
        reference,
      });
      
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    const paystackData = paystackResponse.data.data;

    if (paystackData.status !== 'success') {
      order.status = 'failed';
      await order.save();

      console.error('[Paystack Verification] Payment status not success:', {
        paystackStatus: paystackData.status,
        reference,
      });

      return res.json({
        success: false,
        message: 'Payment was not successful',
        status: paystackData.status,
      });
    }

    if (order.status === 'completed') {
      return res.json({
        success: true,
        message: 'Payment already verified',
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
        },
      });
    }

    const topzaBalanceCheck = await getWalletBalance();
    console.log('[Verify Data Purchase] Topza balance check:', {
      success: topzaBalanceCheck.success,
      balance: topzaBalanceCheck.balance,
      required: order.amount,
      error: topzaBalanceCheck.error,
    });
    
    if (!topzaBalanceCheck.success || topzaBalanceCheck.balance < order.amount) {
      order.status = 'failed';
      order.errorMessage = 'Data purchase currently unavailable';
      await order.save();

      console.error('[Verify Data Purchase] Failed:', {
        topzaSuccess: topzaBalanceCheck.success,
        balance: topzaBalanceCheck.balance,
        required: order.amount,
        error: topzaBalanceCheck.error,
      });

      return res.status(503).json({
        success: false,
        message: 'Data purchase currently unavailable',
      });
    }

    order.status = 'processing';
    await order.save();

    const plan = await DataPlan.findById(order.dataPlanId);
    const topzaResponse = await purchaseDataBundle(plan.apiPlanId, order.phoneNumber);
    
    console.log('[Verify Data Purchase] Purchase response:', {
      success: topzaResponse.success,
      error: topzaResponse.error,
      dataPlanId: plan.apiPlanId,
      phoneNumber: order.phoneNumber,
    });

    if (!topzaResponse.success) {
      order.status = 'failed';
      order.errorMessage = topzaResponse.error;
      
      const transaction = await Transaction.findOne({ reference });
      if (transaction) {
        transaction.status = 'failed';
        await transaction.save();
      }
      
      await order.save();

      console.error('[Verify Data Purchase] Purchase failed:', {
        error: topzaResponse.error,
        dataPlanId: plan.apiPlanId,
        phoneNumber: order.phoneNumber,
      });

      return res.status(400).json({
        success: false,
        message: topzaResponse.error || 'Failed to process purchase with provider',
      });
    }

    const topzaData = topzaResponse.data;

    console.log('[Verify Data Purchase] Full Topza response:', JSON.stringify(topzaData, null, 2));

    const transaction = await Transaction.findOne({ reference });
    if (transaction) {
      transaction.status = 'completed';
      transaction.paystackReference = paystackData.reference;
      await transaction.save();
    }

    const planData = await DataPlan.findById(order.dataPlanId);
    
    const updateData = { 
      $inc: { 
        totalSpent: order.amount,
        dataUsed: parseFloat(planData?.dataSize) || parseFloat(order.dataAmount) || 0
      } 
    };

    // Only deduct from wallet if payment was made via wallet
    // For Paystack, user already paid Paystack, not wallet
    if (order.paymentMethod === 'wallet') {
      updateData.$inc.balance = -order.amount;
    }
    
    await User.findByIdAndUpdate(req.userId, updateData, { new: true });

    order.status = 'processing';
    order.topzaOrderId = topzaData.order?.id;
    if (transaction) {
      order.transactionId = transaction._id;
    }
    order.providerMessage = topzaData.providerMessage;
    await order.save();

    const updatedUser = await User.findById(req.userId);

    res.json({
      success: true,
      message: 'Data bundle purchased successfully',
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          topzaOrderId: topzaData.order?.id,
          status: topzaData.order?.status || order.status,
          network: order.network,
          phoneNumber: order.phoneNumber,
          dataAmount: order.dataAmount,
          planName: order.planName,
          amount: order.amount,
          date: order.createdAt,
        },
        transaction: {
          id: transaction._id,
          reference: transaction.reference,
          amount: Math.abs(transaction.amount),
          status: transaction.status,
        },
        wallet: {
          balance: updatedUser.balance,
          previousBalance: updatedUser.balance + order.amount,
        },
        providerMessage: topzaData.providerMessage,
      },
    });
  } catch (error) {
    console.error('[Verify Data Purchase] Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message,
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const orders = await Order.find({ userId: req.userId })
      .populate('dataPlanId', 'network dataSize planName')
      .populate('transactionId', 'reference amount status')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    const total = await Order.countDocuments({ userId: req.userId });

    res.json({
      success: true,
      data: {
        orders: orders.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber,
          topzaOrderId: order.topzaOrderId,
          status: order.status,
          network: order.network,
          phoneNumber: order.phoneNumber,
          dataAmount: order.dataAmount,
          planName: order.planName,
          amount: order.amount,
          paymentMethod: order.paymentMethod,
          transactionReference: order.transactionReference,
          transaction: order.transactionId,
          providerMessage: order.providerMessage,
          date: order.createdAt,
        })),
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.userId,
    })
      .populate('dataPlanId', 'network dataSize planName')
      .populate('transactionId', 'reference amount status');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: order._id,
        orderNumber: order.orderNumber,
        topzaOrderId: order.topzaOrderId,
        status: order.status,
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
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
