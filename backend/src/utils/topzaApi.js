const axios = require('axios');

const TOPZA_BASE_URL = process.env.TOPZA_BASE_URL || 'https://topza.culustech.com/api';
const TOPZA_API_KEY = process.env.TOPZA_API_KEY;

console.log('[Topza API] Base URL:', TOPZA_BASE_URL);
console.log('[Topza API] API Key set:', !!TOPZA_API_KEY);

const topzaApi = axios.create({
  baseURL: TOPZA_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': TOPZA_API_KEY,
  },
  timeout: 10000,
});

exports.fetchAllDataPlans = async () => {
  try {
    console.log('[Topza API] Fetching from:', TOPZA_BASE_URL + '/v1/dataplans');
    const response = await topzaApi.get('/v1/dataplans');
    console.log('[Topza API] Response status:', response.status);
    console.log('[Topza API] Response data success:', response.data?.success);
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      console.log('[Topza API] Plans found:', response.data.data.length);
      return response.data.data;
    }
    
    console.log('[Topza API] Invalid response structure');
    return [];
  } catch (error) {
    console.error('[Topza API] Error Details:');
    console.error('  Message:', error.message);
    console.error('  Status:', error.response?.status);
    console.error('  Status Text:', error.response?.statusText);
    console.error('  Data:', error.response?.data);
    console.error('  Code:', error.code);
    return [];
  }
};

module.exports = exports;
