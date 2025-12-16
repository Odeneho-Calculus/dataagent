const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getDashboardStats,
  getAllUsers,
  getUserById,
  getFullUserInfo,
  updateUserRole,
  toggleUserStatus,
  banUser,
  unbanUser,
  suspendUser,
  unsuspendUser,
  deleteUser,
  restoreUser,
  getTransactions,
  getPurchases,
  getOrders,
  getAllReferrals,
  getReferralStats,
  updateReferralEarnings,
  resetReferralCode,
  resetAllReferralEarnings,
  getReferralSettings,
  updateReferralSettings,
} = require('../controllers/adminController');

router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.get('/users/:id/full-info', getFullUserInfo);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.patch('/users/:id/ban', banUser);
router.patch('/users/:id/unban', unbanUser);
router.patch('/users/:id/suspend', suspendUser);
router.patch('/users/:id/unsuspend', unsuspendUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/restore', restoreUser);
router.get('/transactions', getTransactions);
router.get('/purchases', getPurchases);
router.get('/orders', getOrders);

router.get('/referrals/settings', getReferralSettings);
router.patch('/referrals/settings', updateReferralSettings);
router.get('/referrals/stats', getReferralStats);
router.get('/referrals', getAllReferrals);
router.patch('/referrals/:id/earnings', updateReferralEarnings);
router.patch('/referrals/:id/reset-code', resetReferralCode);
router.patch('/referrals/reset-all/earnings', resetAllReferralEarnings);

module.exports = router;
