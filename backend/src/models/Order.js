const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dataPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DataPlan',
      required: true,
    },
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    network: {
      type: String,
      enum: ['MTN', 'TELECEL', 'AIRTELTIGO'],
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    dataAmount: {
      type: String,
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['wallet', 'paystack'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    topzaOrderId: {
      type: String,
      default: null,
    },
    transactionReference: {
      type: String,
      default: null,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    paystackReference: {
      type: String,
      default: null,
    },
    providerMessage: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
