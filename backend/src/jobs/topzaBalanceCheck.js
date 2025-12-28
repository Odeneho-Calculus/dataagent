const cron = require('node-cron');
const { getWalletBalance } = require('../utils/topzaApi');
const { createNotification } = require('../controllers/notificationController');

let isChecking = false;
let lastNotificationTime = null;

const checkTopzaBalance = async () => {
  try {
    if (isChecking) {
      console.log('[Topza Balance] Check already in progress, skipping...');
      return;
    }

    isChecking = true;
    const now = new Date();
    
    console.log('[Topza Balance] Checking wallet balance...');

    const result = await getWalletBalance();

    if (!result.success) {
      console.warn('[Topza Balance] Failed to fetch balance:', result.error);
      isChecking = false;
      return;
    }

    const balance = result.balance || 0;
    const threshold = parseFloat(process.env.TOPZA_LOW_BALANCE_THRESHOLD || 10);

    console.log(`[Topza Balance] Current balance: ${balance} GHS (threshold: ${threshold} GHS)`);

    if (balance < threshold) {
      const timeSinceLastNotification = lastNotificationTime 
        ? now - lastNotificationTime 
        : Infinity;

      const notificationInterval = 60 * 60 * 1000;

      if (timeSinceLastNotification >= notificationInterval) {
        const notificationResult = await createNotification({
          type: 'low_balance',
          title: 'Low Topza Wallet Balance',
          message: `Your Topza wallet balance is low (${balance.toFixed(2)} GHS)`,
          description: `Current balance is below the threshold of ${threshold} GHS. Please top up your Topza wallet to ensure uninterrupted service.`,
          severity: 'warning',
          data: {
            balance,
            threshold,
            metadata: {
              timestamp: now,
              source: 'cron-job',
            },
          },
          actionUrl: '/admin/topza-settings',
        });

        if (notificationResult.success) {
          lastNotificationTime = now;
          console.log('[Topza Balance] Low balance notification created');
        } else {
          console.error('[Topza Balance] Failed to create notification:', notificationResult.error);
        }
      } else {
        const minutesUntilNext = Math.ceil((notificationInterval - timeSinceLastNotification) / 60000);
        console.log(`[Topza Balance] Notification already sent recently. Next one in ~${minutesUntilNext} minutes`);
      }
    }

    isChecking = false;
  } catch (error) {
    console.error('[Topza Balance] Error checking balance:', error.message);
    isChecking = false;
  }
};

const startTopzaBalanceCheckJob = () => {
  const cronExpression = process.env.TOPZA_BALANCE_CHECK_CRON || '*/5 * * * *';
  const timezone = process.env.TZ || 'UTC';

  console.log(`[Topza Balance] Starting cron job with expression: "${cronExpression}" in timezone: ${timezone}`);

  cron.schedule(cronExpression, async () => {
    try {
      await checkTopzaBalance();
    } catch (error) {
      console.error('[Topza Balance] Cron job error:', error.message);
    }
  }, {
    timezone,
  });

  console.log('[Topza Balance] Cron job initialized successfully');
};

module.exports = {
  checkTopzaBalance,
  startTopzaBalanceCheckJob,
};
