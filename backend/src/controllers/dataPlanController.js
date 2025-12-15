const DataPlan = require('../models/DataPlan');
const { fetchAllDataPlans } = require('../utils/topzaApi');

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

    let synced = 0;
    let updated = 0;

    for (const plan of plans) {
      const network = normalizeNetwork(plan.network);
      const costPrice = parseFloat(plan.price || 0);
      
      const existingPlan = await DataPlan.findOne({
        network,
        apiPlanId: plan.id || plan._id,
      });

      if (existingPlan) {
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
          dataSize: plan.dataAmount,
          validity: plan.validity,
          apiPlanId: plan.id || plan._id,
          costPrice,
          sellingPrice: costPrice,
          originalCostPrice: costPrice,
          lastSyncedAt: new Date(),
        });
        synced++;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Data plans synced successfully',
      stats: {
        synced,
        updated,
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
    const { network, status = 'active' } = req.query;
    const query = {};

    if (network) {
      query.network = network;
    }
    if (status) {
      query.status = status;
    }

    const plans = await DataPlan.find(query).sort({ network: 1, createdAt: 1 });

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
