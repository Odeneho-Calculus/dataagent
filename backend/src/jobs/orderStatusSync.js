const cron = require('node-cron');
const Order = require('../models/Order');
const { checkOrdersStatus } = require('../utils/topzaApi');

let isSyncing = false;

const mapTopzaStatusToLocal = (topzaStatus) => {
  const statusMap = {
    'Pending': 'pending',
    'Processing': 'processing',
    'Completed': 'completed',
    'Failed': 'failed',
    'Cancelled': 'failed',
  };
  
  return statusMap[topzaStatus] || 'pending';
};

const syncOrderStatusesFromTopza = async () => {
  try {
    if (isSyncing) {
      console.log('[Order Sync] Sync already in progress, skipping...');
      return;
    }

    isSyncing = true;
    const startTime = Date.now();

    console.log('[Order Sync] Starting TOPZA order status synchronization...');

    const orders = await Order.find({ topzaOrderId: { $exists: true, $ne: null } });

    if (orders.length === 0) {
      console.log('[Order Sync] No orders with topzaOrderId found');
      isSyncing = false;
      return {
        success: true,
        message: 'No orders to sync',
        data: {
          totalOrders: 0,
          matched: 0,
          updated: 0,
          unchanged: 0,
          notMatched: 0,
          errors: 0,
          duration: `${Date.now() - startTime}ms`,
        },
      };
    }

    console.log(`[Order Sync] Found ${orders.length} orders to sync`);

    const orderIds = orders.map(order => order.topzaOrderId);
    let updated = 0;
    let unchanged = 0;
    let errors = 0;

    for (let i = 0; i < orderIds.length; i += 100) {
      const chunk = orderIds.slice(i, i + 100);
      
      console.log(`[Order Sync] Processing chunk ${Math.floor(i / 100) + 1} (${chunk.length} orders)...`);
      
      const result = await checkOrdersStatus(chunk);

      if (!result.success) {
        console.error('[Order Sync] Failed to check orders status:', result.error);
        errors += chunk.length;
        continue;
      }

      const topzaOrders = result.data || [];

      for (const topzaOrder of topzaOrders) {
        try {
          const localOrder = orders.find(o => o.topzaOrderId === topzaOrder.orderId);
          
          if (!localOrder) {
            console.warn('[Order Sync] Local order not found for TOPZA order:', topzaOrder.orderId);
            continue;
          }

          const newStatus = mapTopzaStatusToLocal(topzaOrder.status);

          if (localOrder.status !== newStatus) {
            const updateData = {
              status: newStatus,
              $push: {
                statusHistory: {
                  status: newStatus,
                  updatedAt: new Date(),
                  source: 'topza-sync',
                },
              },
            };

            if (newStatus === 'completed' && !localOrder.completedAt) {
              updateData.completedAt = new Date();
              updateData.completedBy = 'system';
            }

            await Order.findByIdAndUpdate(localOrder._id, updateData);
            
            console.log(`[Order Sync] Updated order ${localOrder.orderNumber}: ${localOrder.status} → ${newStatus}`);
            updated++;
          } else {
            unchanged++;
          }
        } catch (err) {
          console.error('[Order Sync] Error updating order:', err.message);
          errors++;
        }
      }

      if (result.notFound && result.notFound.length > 0) {
        console.warn('[Order Sync] Orders not found in TOPZA:', result.notFound);
      }
    }

    const duration = Date.now() - startTime;
    isSyncing = false;

    const syncResult = {
      success: true,
      message: 'Order synchronization completed',
      data: {
        totalOrders: orders.length,
        updated,
        unchanged,
        errors,
        duration: `${duration}ms`,
      },
    };

    console.log('[Order Sync] Synchronization completed:', syncResult.data);
    return syncResult;
  } catch (error) {
    console.error('[Order Sync] Fatal error during synchronization:', error);
    isSyncing = false;
    throw error;
  }
};

const startOrderStatusSyncJob = () => {
  const cronExpression = process.env.ORDER_SYNC_CRON || '*/2 * * * *';
  const timezone = process.env.TZ || 'UTC';

  console.log(`[Order Sync] Starting cron job with expression: "${cronExpression}" in timezone: ${timezone}`);

  cron.schedule(cronExpression, async () => {
    try {
      await syncOrderStatusesFromTopza();
    } catch (error) {
      console.error('[Order Sync] Cron job error:', error.message);
    }
  }, {
    timezone,
  });

  console.log('[Order Sync] Cron job initialized successfully');
};

module.exports = {
  syncOrderStatusesFromTopza,
  startOrderStatusSyncJob,
};
