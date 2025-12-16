const express = require('express');
const router = express.Router();
const { getReferralSettings } = require('../controllers/adminController');

router.get('/referral-settings', getReferralSettings);

module.exports = router;
