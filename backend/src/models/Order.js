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
    },
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    network: {
      type: String,
      enum: ['MTN', 'TELECEL', 'AIRTELTIGO'],
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    dataAmount: {
      type: String,
    },
    planName: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['wallet', 'paystack', 'store'],
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
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: String,
      enum: ['admin', 'system'],
      default: null,
    },
    adminModified: {
      type: Boolean,
      default: false,
    },
    adminModifiedAt: {
      type: Date,
      default: null,
    },
    adminModifiedFields: [String],
    adminNotes: {
      type: String,
      default: null,
    },
    statusHistory: [
      {
        status: String,
        updatedAt: Date,
        source: String,
        notes: String,
      },
    ],
    source: {
      type: String,
      enum: ['direct', 'store', 'api'],
      default: 'direct',
    },
    apiPartnerName: {
      type: String,
      default: null,
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    guestInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guest',
      default: null,
    },
    dataBundle: {
      dataPlanId: String,
      network: String,
      planName: String,
      dataAmount: String,
      amount: Number,
      phoneNumber: String,
    },
    autoCompletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ network: 1 });
orderSchema.index({ topzaOrderId: 1 });

module.exports = mongoose.model('Order', orderSchema);
