const cron = require('node-cron');
const Order = require('../models/Order');
const { checkOrdersStatus, getOrderByReference } = require('../utils/topzaApi');

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

    const allOrders = await Order.find({
      status: { $in: ['pending', 'processing'] },
    });

    if (allOrders.length === 0) {
      console.log('[Order Sync] No pending/processing orders found');
      isSyncing = false;
      return {
        success: true,
        message: 'No orders to sync',
        data: {
          totalOrders: 0,
          synced: 0,
          updated: 0,
          unchanged: 0,
          errors: 0,
          duration: `${Date.now() - startTime}ms`,
        },
      };
    }

    console.log(`[Order Sync] Found ${allOrders.length} pending/processing orders`);

    const ordersWithValidTopzaId = [];
    const ordersRequiringLookup = [];

    for (const order of allOrders) {
      if (order.topzaOrderId && typeof order.topzaOrderId === 'string' && order.topzaOrderId.trim().length > 0) {
        ordersWithValidTopzaId.push(order);
      } else {
        ordersRequiringLookup.push(order);
      }
    }

    console.log(`[Order Sync] ${ordersWithValidTopzaId.length} orders have topzaOrderId, ${ordersRequiringLookup.length} need lookup`);

    for (const order of ordersRequiringLookup) {
      try {
        console.log(`[Order Sync] Looking up order on Topza by reference: ${order.orderNumber}`);
        const result = await getOrderByReference(order.orderNumber);

        if (result.success && result.data?.orderId) {
          order.topzaOrderId = result.data.orderId;
          await order.save();
          console.log(`[Order Sync] Found and saved topzaOrderId for ${order.orderNumber} → ${result.data.orderId}`);
          ordersWithValidTopzaId.push(order);
        } else {
          console.warn(`[Order Sync] Could not find order on Topza: ${order.orderNumber}`, result.error);
        }
      } catch (err) {
        console.error(`[Order Sync] Error looking up ${order.orderNumber}:`, err.message);
      }
    }

    if (ordersWithValidTopzaId.length === 0) {
      console.log('[Order Sync] No orders with valid topzaOrderId to sync');
      isSyncing = false;
      return {
        success: true,
        message: 'No valid orders to sync',
        data: {
          totalOrders: allOrders.length,
          synced: 0,
          updated: 0,
          unchanged: 0,
          errors: 0,
          duration: `${Date.now() - startTime}ms`,
        },
      };
    }

    console.log(`[Order Sync] Syncing status for ${ordersWithValidTopzaId.length} orders`);

    const orderIds = ordersWithValidTopzaId
      .map(order => order.topzaOrderId)
      .filter(id => id && id !== 'null' && id !== 'undefined' && typeof id === 'string' && id.trim().length > 0);

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
          const localOrder = ordersWithValidTopzaId.find(o => o.topzaOrderId === topzaOrder.orderId);
          
          if (!localOrder) {
            console.warn('[Order Sync] Local order not found for TOPZA order:', topzaOrder.orderId);
            continue;
          }

          const newStatus = mapTopzaStatusToLocal(topzaOrder.status);
          let statusChanged = false;
          let metadataChanged = false;

          const updateData = {
            $push: {
              statusHistory: {
                status: newStatus,
                updatedAt: new Date(),
                source: 'topza-sync',
              },
            },
          };

          if (localOrder.status !== newStatus) {
            updateData.status = newStatus;
            statusChanged = true;
          }

          if (newStatus === 'completed' && !localOrder.completedAt) {
            updateData.completedAt = new Date();
            updateData.completedBy = 'system';
            statusChanged = true;
          }

          if (localOrder.source !== topzaOrder.source) {
            updateData.source = topzaOrder.source;
            metadataChanged = true;
            console.log(`[Order Sync] Updated source for ${localOrder.orderNumber}: ${localOrder.source} → ${topzaOrder.source}`);
          }

          if (localOrder.apiPartnerName !== topzaOrder.apiPartnerName) {
            updateData.apiPartnerName = topzaOrder.apiPartnerName;
            metadataChanged = true;
            console.log(`[Order Sync] Updated apiPartnerName for ${localOrder.orderNumber}: ${localOrder.apiPartnerName} → ${topzaOrder.apiPartnerName}`);
          }

          if (statusChanged || metadataChanged) {
            await Order.findByIdAndUpdate(localOrder._id, updateData);
            
            if (statusChanged) {
              console.log(`[Order Sync] Updated order ${localOrder.orderNumber}: ${localOrder.status} → ${newStatus}`);
            }
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
        for (const notFoundId of result.notFound) {
          const failedOrder = ordersWithValidTopzaId.find(o => o.topzaOrderId === notFoundId);
          if (failedOrder) {
            console.warn('[Order Sync] Failed order details:', {
              localId: failedOrder._id,
              orderNumber: failedOrder.orderNumber,
              topzaOrderId: failedOrder.topzaOrderId,
              source: failedOrder.source,
              apiPartnerName: failedOrder.apiPartnerName,
              status: failedOrder.status,
            });
          }
        }
      }
    }

    const duration = Date.now() - startTime;
    isSyncing = false;

    const syncResult = {
      success: true,
      message: 'Order synchronization completed',
      data: {
        totalOrdersFound: allOrders.length,
        ordersWithTopzaId: ordersWithValidTopzaId.length,
        ordersLookedUpOnTopza: ordersRequiringLookup.length,
        synced: orderIds.length,
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
