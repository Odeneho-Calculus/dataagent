const axios = require('axios');

const TOPZA_BASE_URL = process.env.TOPZA_BASE_URL || 'https://topza.culustech.com/api';
const TOPZA_API_KEY = process.env.TOPZA_API_KEY;

const topzaApi = axios.create({
  baseURL: TOPZA_BASE_URL,
  timeout: 10000,
});

topzaApi.interceptors.request.use((config) => {
  config.headers['X-API-Key'] = TOPZA_API_KEY;
  config.headers['Content-Type'] = 'application/json';
  return config;
});

exports.getWalletBalance = async () => {
  try {
    const response = await topzaApi.get('/v1/wallet/balance');
    
    console.log('[Topza API] Wallet balance response:', {
      statusCode: response.status,
      success: response.data?.success,
      balance: response.data?.data?.balance,
    });
    
    if (response.data && response.data.success) {
      const balance = response.data.data?.balance || 0;
      
      if (balance === undefined || balance === null || balance === 0) {
        console.error('[Topza API] Unable to extract balance from response:', response.data);
        return {
          success: false,
          balance: 0,
          error: 'Unable to extract balance from response',
        };
      }
      
      console.log('[Topza API] Balance fetched successfully:', balance);
      return {
        success: true,
        balance,
      };
    }
    
    const errorMsg = response.data?.message || 'Failed to fetch wallet balance';
    console.error('[Topza API] Wallet balance failed:', {
      success: response.data?.success,
      message: errorMsg,
    });
    
    return {
      success: false,
      balance: 0,
      error: errorMsg,
    };
  } catch (error) {
    console.error('[Topza API] Error fetching wallet balance:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    return {
      success: false,
      balance: 0,
      error: error.response?.data?.message || error.message || 'Failed to fetch wallet balance',
    };
  }
};

exports.fetchAllDataPlans = async () => {
  try {
    const response = await topzaApi.get('/v1/dataplans');
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('[Topza API] Error fetching data plans:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return [];
  }
};

exports.purchaseDataBundle = async (dataPlanId, phoneNumber) => {
  try {
    const requestBody = {
      dataPlanId,
      quantity: 1,
      phoneNumber,
      paymentMethod: 'wallet',
    };
    
    console.log('[Topza API] Sending purchase request:', requestBody);
    
    const response = await topzaApi.post('/v1/orders/buy', requestBody);
    
    console.log('[Topza API] Purchase response:', {
      statusCode: response.status,
      success: response.data?.success,
      message: response.data?.message,
      data: response.data?.data,
    });
    
    if (response.data && response.data.success) {
      console.log('[Topza API] Purchase successful');
      return {
        success: true,
        data: response.data.data,
      };
    }
    
    const errorMsg = response.data?.message || 'Purchase failed';
    console.error('[Topza API] Purchase failed:', {
      message: errorMsg,
      code: response.data?.code,
    });
    
    return {
      success: false,
      error: errorMsg,
    };
  } catch (error) {
    console.error('[Topza API] Error during purchase:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Purchase failed',
    };
  }
};

exports.checkOrdersStatus = async (orderIds) => {
  try {
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return {
        success: false,
        error: 'orderIds must be a non-empty array',
      };
    }

    if (orderIds.length > 100) {
      return {
        success: false,
        error: 'Maximum 100 orders can be checked at once',
      };
    }

    const requestBody = { orderIds };
    
    console.log('[Topza API] Checking status for', orderIds.length, 'orders');
    
    const response = await topzaApi.post('/v1/orders/check-status', requestBody);
    
    console.log('[Topza API] Bulk status check response:', {
      statusCode: response.status,
      success: response.data?.success,
      count: response.data?.count,
    });
    
    if (response.data && response.data.success) {
      console.log('[Topza API] Bulk status check successful');
      return {
        success: true,
        data: response.data.data,
        notFound: response.data.notFound || [],
      };
    }
    
    const errorMsg = response.data?.message || 'Failed to check order status';
    console.error('[Topza API] Status check failed:', {
      message: errorMsg,
      code: response.data?.code,
    });
    
    return {
      success: false,
      error: errorMsg,
    };
  } catch (error) {
    console.error('[Topza API] Error checking order status:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to check order status',
    };
  }
};

exports.getOrderStatus = async (orderId) => {
  try {
    console.log('[Topza API] Getting status for order:', orderId);
    
    const response = await topzaApi.get(`/v1/orders/${orderId}/status`);
    
    console.log('[Topza API] Order status response:', {
      statusCode: response.status,
      success: response.data?.success,
      status: response.data?.data?.status,
    });
    
    if (response.data && response.data.success) {
      console.log('[Topza API] Order status retrieved successfully');
      return {
        success: true,
        data: response.data.data,
      };
    }
    
    const errorMsg = response.data?.message || 'Failed to get order status';
    console.error('[Topza API] Get order status failed:', {
      message: errorMsg,
      code: response.data?.code,
    });
    
    return {
      success: false,
      error: errorMsg,
    };
  } catch (error) {
    console.error('[Topza API] Error getting order status:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get order status',
    };
  }
};

module.exports = exports;
