const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getNotifications,
  getNotificationStats,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} = require('../controllers/notificationController');

router.use(protect, adminOnly);

router.get('/', getNotifications);
router.get('/stats', getNotificationStats);
router.patch('/:id/read', markAsRead);
router.patch('/mark-all/read', markAllAsRead);
router.delete('/:id', deleteNotification);
router.delete('/', deleteAllNotifications);

module.exports = router;
