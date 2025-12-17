const express = require('express');
const router = express.Router();
const { getReferralSettings } = require('../controllers/adminController');
const { getPublicActivePlans } = require('../controllers/dataPlanController');

router.get('/referral-settings', getReferralSettings);
router.get('/dataplans', getPublicActivePlans);

module.exports = router;
