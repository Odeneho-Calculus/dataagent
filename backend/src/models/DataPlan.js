const mongoose = require('mongoose');

const dataPlanSchema = new mongoose.Schema(
  {
    network: {
      type: String,
      enum: ['MTN', 'TELECEL', 'AIRTELTIGO'],
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    dataSize: {
      type: String,
      required: true,
    },
    validity: {
      type: String,
      required: true,
    },
    apiPlanId: {
      type: String,
      required: true,
    },
    costPrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    originalCostPrice: {
      type: Number,
      required: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive',
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

dataPlanSchema.index({ network: 1, apiPlanId: 1 }, { unique: true });

module.exports = mongoose.model('DataPlan', dataPlanSchema);
