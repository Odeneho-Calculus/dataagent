const axios = require('axios');

const TOPZA_BASE_URL = process.env.TOPZA_BASE_URL || 'https://topza.culustech.com/api';
const TOPZA_API_KEY = process.env.TOPZA_API_KEY;

const topzaApi = axios.create({
  baseURL: TOPZA_BASE_URL,
  timeout: 30000,
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
      const balance = response.data.data?.balance;
      
      if (balance === undefined || balance === null) {
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
    let allPlans = [];
    let page = 1;
    let totalPages = 1;
    const limit = 100;
    const provider = process.env.TOPZA_PROVIDER;
    const offerSlug = process.env.TOPZA_OFFER_SLUG;

    console.log('[Topza API] Starting data plans fetch with pagination');

    while (page <= totalPages) {
      const params = { page, limit };
      if (provider) {
        params.provider = provider;
      }
      if (offerSlug) {
        params.offerSlug = offerSlug;
      }

      const response = await topzaApi.get('/v1/dataplans', { params });
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const plans = response.data.data;
        allPlans = allPlans.concat(plans);
        
        if (response.data.pagination) {
          totalPages = response.data.pagination.pages;
          console.log(`[Topza API] Fetched page ${page} of ${totalPages}, received ${plans.length} plans`);
        }
        
        page++;
      } else {
        break;
      }
    }

    console.log(`[Topza API] Total data plans fetched: ${allPlans.length}`);
    return allPlans;
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
      phoneNumber,
      paymentMethod: 'wallet',
    };
    
    console.log('[Topza API] Sending purchase request:', {
      requestBody,
      dataPlanId,
      dataPlanIdType: typeof dataPlanId,
      dataPlanIdLength: dataPlanId?.length,
      phoneNumber,
      paymentMethod: 'wallet',
    });
    
    const response = await topzaApi.post('/v1/orders/buy', requestBody);
    
    console.log('[Topza API] Purchase response:', {
      statusCode: response.status,
      success: response.data?.success,
      message: response.data?.message,
      dataPlanId: dataPlanId,
      fullResponse: response.data,
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
      statusText: error.response?.statusText,
      data: error.response?.data,
      fullError: JSON.stringify(error.response?.data, null, 2),
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
      },
    });
    
    // Extract the most specific error message available
    const errorData = error.response?.data;
    let errorMessage = 'Purchase failed';
    
    if (errorData) {
      // Check for detailed provider message first (most specific)
      if (errorData.details?.providerMessage) {
        errorMessage = errorData.details.providerMessage;
      }
      // Then check for general details message
      else if (errorData.details?.originalMessage) {
        errorMessage = errorData.details.originalMessage;
      }
      // Then check for error code-based message
      else if (errorData.code === 'DUPLICATE_ORDER') {
        errorMessage = 'A data purchase is already being processed for this phone number. Please wait a few minutes before trying again.';
      }
      // Finally use the general message
      else if (errorData.message) {
        errorMessage = errorData.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      errorCode: errorData?.code,
    };
  }
};

exports.getDataPlanById = async (planId) => {
  try {
    console.log('[Topza API] Fetching plan by ID:', planId);
    
    const response = await topzaApi.get(`/v1/dataplans/${planId}`);
    
    console.log('[Topza API] Plan fetch response:', {
      statusCode: response.status,
      success: response.data?.success,
      plan: response.data?.data,
    });
    
    if (response.data && response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    }
    
    return {
      success: false,
      error: response.data?.message || 'Plan not found',
    };
  } catch (error) {
    console.error('[Topza API] Error fetching plan:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch plan',
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
    
    console.log('[Topza API] Checking status for', orderIds.length, 'orders', {
      sampleIds: orderIds.slice(0, 3),
      apiKey: TOPZA_API_KEY ? `${TOPZA_API_KEY.substring(0, 10)}...` : 'NOT SET',
      baseUrl: TOPZA_BASE_URL,
    });
    
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

exports.getOrderByReference = async (orderNumber) => {
  try {
    console.log('[Topza API] Getting order by reference:', orderNumber);
    
    const response = await topzaApi.get(`/v1/orders/reference/${orderNumber}`);
    
    console.log('[Topza API] Get by reference response:', {
      statusCode: response.status,
      success: response.data?.success,
      orderId: response.data?.data?.orderId,
    });
    
    if (response.data && response.data.success) {
      console.log('[Topza API] Order retrieved by reference successfully');
      return {
        success: true,
        data: response.data.data,
      };
    }
    
    const errorMsg = response.data?.message || 'Order not found';
    console.error('[Topza API] Get by reference failed:', {
      message: errorMsg,
      code: response.data?.code,
    });
    
    return {
      success: false,
      error: errorMsg,
    };
  } catch (error) {
    console.error('[Topza API] Error getting order by reference:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get order by reference',
    };
  }
};

exports.getWalletTransactions = async (page = 1, limit = 20, filters = {}) => {
  try {
    const params = {
      page,
      limit,
      ...filters,
    };
    
    console.log('[Topza API] Fetching wallet transactions:', params);
    
    const response = await topzaApi.get('/v1/wallet/transactions', { params });
    
    console.log('[Topza API] Wallet transactions response:', {
      statusCode: response.status,
      success: response.data?.success,
      transactionCount: response.data?.data?.transactions?.length,
    });
    
    if (response.data && response.data.success) {
      console.log('[Topza API] Wallet transactions retrieved successfully');
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.data?.pagination,
      };
    }
    
    const errorMsg = response.data?.message || 'Failed to fetch wallet transactions';
    console.error('[Topza API] Wallet transactions failed:', {
      message: errorMsg,
      code: response.data?.code,
    });
    
    return {
      success: false,
      error: errorMsg,
    };
  } catch (error) {
    console.error('[Topza API] Error fetching wallet transactions:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch wallet transactions',
    };
  }
};

exports.getBusinessStatus = async () => {
  try {
    console.log('[Topza API] Fetching business status');
    
    const response = await topzaApi.get('/v1/business/status');
    
    console.log('[Topza API] Business status response:', {
      statusCode: response.status,
      success: response.data?.success,
      isOpen: response.data?.data?.isOpen,
    });
    
    if (response.data && response.data.success && response.data.data) {
      console.log('[Topza API] Business status retrieved successfully');
      return {
        success: true,
        data: response.data.data,
      };
    }
    
    const errorMsg = response.data?.message || 'Failed to fetch business status';
    console.error('[Topza API] Business status failed:', {
      message: errorMsg,
      code: response.data?.code,
    });
    
    return {
      success: false,
      message: errorMsg,
    };
  } catch (error) {
    console.error('[Topza API] Error fetching business status:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      baseUrl: TOPZA_BASE_URL,
      timeout: error.config?.timeout,
    });

    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to fetch business status',
      details: error.response?.data || null,
    };
  }
};

module.exports = exports;
