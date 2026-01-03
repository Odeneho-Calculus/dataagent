const express = require('express');
const router = express.Router();
const { getReferralSettings, getPublicStats } = require('../controllers/adminController');
const { getPublicActivePlans } = require('../controllers/dataPlanController');
const { getBusinessStatus } = require('../utils/topzaApi');

router.get('/referral-settings', getReferralSettings);
router.get('/dataplans', getPublicActivePlans);
router.get('/stats', getPublicStats);

router.get('/business-status', async (req, res) => {
  try {
    const status = await getBusinessStatus();
    res.json(status);
  } catch (error) {
    console.error('Error fetching business status:', error);
    res.status(500).json({
      success: false,
      isOpen: false,
      message: 'Failed to fetch business status',
    });
  }
});

module.exports = router;
