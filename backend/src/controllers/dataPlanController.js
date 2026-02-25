const DataPlan = require('../models/DataPlan');
const { fetchAllDataPlans } = require('../utils/topzaApi');

const parseDataAmountInMB = (dataAmount) => {
  if (!dataAmount || typeof dataAmount !== 'string') return null;
  const trimmed = dataAmount.trim().toUpperCase();
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(GB|MB)$/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (Number.isNaN(value)) return null;
  return match[2] === 'GB' ? Math.round(value * 1024) : Math.round(value);
};

const normalizeNetwork = (network) => {
  const map = {
    'MTN': 'MTN',
    'mtn': 'MTN',
    'Telecel': 'TELECEL',
    'telecel': 'TELECEL',
    'TELECEL': 'TELECEL',
    'AirtelTigo': 'AIRTELTIGO',
    'airteltigo': 'AIRTELTIGO',
    'AIRTELTIGO': 'AIRTELTIGO',
    'AT_PREMIUM': 'AIRTELTIGO',
    'YELLO': 'MTN',
  };
  return map[network] || network;
};

exports.syncDataPlans = async (req, res) => {
  try {
    const plans = await fetchAllDataPlans();
    
    if (!plans || plans.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch data plans from Topza API',
      });
    }

    console.log('[Sync] Sample plan from Topza API:', JSON.stringify(plans[0], null, 2));

    let synced = 0;
    let updated = 0;
    let deleted = 0;

    const keepKeys = new Set();

    for (const plan of plans) {
      const network = normalizeNetwork(plan.network);
      const costPrice = parseFloat(plan.price || 0);
      const dataSize = plan.dataAmount || plan.dataSize || '';
      const dataAmountInMB = Number(plan.dataAmountInMB) || parseDataAmountInMB(dataSize);
      const inStock = plan.inStock !== undefined ? plan.inStock : true;
      const isActive = plan.isActive !== undefined ? plan.isActive : true;
      const discount = plan.discount !== undefined ? plan.discount : 0;
      const apiPlanId = plan.id || plan._id;

      console.log(`[Sync] Processing plan: network=${network}, planName=${plan.planName}, apiPlanId=${apiPlanId}, planId.id=${plan.id}, planId._id=${plan._id}`);

      keepKeys.add(`${network}::${apiPlanId}`);
      
      const existingPlan = await DataPlan.findOne({
        network,
        apiPlanId,
      });

      if (existingPlan) {
        // Always update non-price fields from API
        existingPlan.planName = plan.planName;
        existingPlan.dataSize = dataSize;
        existingPlan.dataAmountInMB = dataAmountInMB;
        existingPlan.validity = plan.validity;
        existingPlan.category = plan.category;
        existingPlan.inStock = inStock;
        existingPlan.isActive = isActive;
        existingPlan.discount = discount;

        // Keep existing status - don't override admin's choice

        // Only update prices if not edited by admin
        if (!existingPlan.isEdited) {
          existingPlan.costPrice = costPrice;
          existingPlan.originalCostPrice = costPrice;
          existingPlan.sellingPrice = costPrice;
        }
        
        existingPlan.lastSyncedAt = new Date();
        await existingPlan.save();
        updated++;
      } else {
        await DataPlan.create({
          network,
          planName: plan.planName,
          dataSize,
          dataAmountInMB,
          validity: plan.validity,
          category: plan.category,
          apiPlanId,
          costPrice,
          sellingPrice: costPrice,
          originalCostPrice: costPrice,
          inStock,
          isActive,
          discount,
          lastSyncedAt: new Date(),
        });
        synced++;
      }
    }

    const existingPlans = await DataPlan.find().select('_id network apiPlanId');
    const deleteIds = existingPlans
      .filter((plan) => !keepKeys.has(`${plan.network}::${plan.apiPlanId}`))
      .map((plan) => plan._id);

    if (deleteIds.length > 0) {
      const deleteResult = await DataPlan.deleteMany({ _id: { $in: deleteIds } });
      deleted = deleteResult.deletedCount || 0;
    }

    res.status(200).json({
      success: true,
      message: 'Data plans synced successfully',
      stats: {
        synced,
        updated,
        deleted,
        total: synced + updated,
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDataPlans = async (req, res) => {
  try {
    const { network, status, page = 1, limit = 100 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    if (network && network !== 'all') {
      query.network = network;
    }
    if (status) {
      query.status = status;
    }

    const total = await DataPlan.countDocuments(query);
    const plans = await DataPlan.find(query)
      .sort({ network: 1, createdAt: 1 })
      .limit(parseInt(limit))
      .skip(skip);

    const groupedByNetwork = plans.reduce((acc, plan) => {
      if (!acc[plan.network]) {
        acc[plan.network] = [];
      }
      acc[plan.network].push(plan);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      plans,
      grouped: groupedByNetwork,
      count: plans.length,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDataPlanById = async (req, res) => {
  try {
    const plan = await DataPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Data plan not found',
      });
    }

    res.status(200).json({
      success: true,
      plan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateDataPlanPrices = async (req, res) => {
  try {
    const { costPrice, sellingPrice } = req.body;
    const plan = await DataPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Data plan not found',
      });
    }

    if (!plan.inStock) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify out-of-stock data plans. This plan is unavailable from the provider.',
      });
    }

    if (costPrice !== undefined) {
      plan.costPrice = parseFloat(costPrice);
    }
    if (sellingPrice !== undefined) {
      plan.sellingPrice = parseFloat(sellingPrice);
    }

    plan.isEdited = true;
    await plan.save();

    const discount = plan.costPrice > 0 
      ? (((plan.costPrice - plan.sellingPrice) / plan.costPrice) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      message: 'Data plan prices updated successfully',
      plan,
      discount: `${discount}%`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.clearDataPlanEdits = async (req, res) => {
  try {
    const plan = await DataPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Data plan not found',
      });
    }

    if (!plan.inStock) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify out-of-stock data plans. This plan is unavailable from the provider.',
      });
    }

    plan.costPrice = plan.originalCostPrice;
    plan.sellingPrice = plan.originalCostPrice;
    plan.isEdited = false;
    await plan.save();

    res.status(200).json({
      success: true,
      message: 'Data plan edits cleared successfully',
      plan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.toggleDataPlanStatus = async (req, res) => {
  try {
    const plan = await DataPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Data plan not found',
      });
    }

    if (!plan.inStock) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify out-of-stock data plans. This plan is unavailable from the provider.',
      });
    }

    plan.status = plan.status === 'active' ? 'inactive' : 'active';
    await plan.save();

    res.status(200).json({
      success: true,
      message: `Data plan ${plan.status} successfully`,
      plan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteDataPlan = async (req, res) => {
  try {
    const plan = await DataPlan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Data plan not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Data plan deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDataPlanStats = async (req, res) => {
  try {
    const { network } = req.query;
    const query = {};

    if (network && network !== 'all') {
      query.network = network;
    }

    const totalPlans = await DataPlan.countDocuments(query);
    const activePlans = await DataPlan.countDocuments({ ...query, status: 'active' });
    const outOfStockPlans = await DataPlan.countDocuments({ ...query, inStock: false });

    const plans = await DataPlan.find(query);
    let totalMargin = 0;
    plans.forEach(plan => {
      const margin = plan.costPrice > 0 
        ? ((plan.sellingPrice - plan.costPrice) / plan.costPrice) * 100 
        : 0;
      totalMargin += margin;
    });
    const avgMargin = plans.length > 0 ? (totalMargin / plans.length).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalPlans,
        activePlans,
        outOfStockPlans,
        avgMargin: parseFloat(avgMargin),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getPublicActivePlans = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const skip = parseInt(offset);
    const query = { status: 'active', inStock: true };

    const total = await DataPlan.countDocuments(query);
    const plans = await DataPlan.find(query)
      .sort({ network: 1, createdAt: 1 })
      .limit(parseInt(limit))
      .skip(skip);

    const groupedByNetwork = plans.reduce((acc, plan) => {
      if (!acc[plan.network]) {
        acc[plan.network] = [];
      }
      acc[plan.network].push(plan);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      plans,
      grouped: groupedByNetwork,
      count: plans.length,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: skip,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
