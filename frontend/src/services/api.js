import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isRegisterRequest = error.config?.url?.includes('/auth/register');
      
      if (!isLoginRequest && !isRegisterRequest) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

export const wallet = {
  getBalance: () => api.get('/wallet/balance'),
  initializePayment: (data) => api.post('/wallet/initialize-payment', data),
  verifyPayment: (data) => api.post('/wallet/verify-payment', data),
  getTransactions: (limit = 50, offset = 0) =>
    api.get(`/wallet/transactions?limit=${limit}&offset=${offset}`),
  verifyTransactionStatus: (data) => api.post('/wallet/verify-transaction-status', data),
};

export const purchases = {
  create: (data) => api.post('/purchases/create', data),
  list: (limit = 50, offset = 0) =>
    api.get(`/purchases/list?limit=${limit}&offset=${offset}`),
  buyDataBundle: (data) => api.post('/purchases/buy', data),
  verifyPurchase: (data) => api.post('/purchases/verify', data),
  getOrders: (limit = 50, offset = 0) =>
    api.get(`/purchases/orders?limit=${limit}&offset=${offset}`),
  getOrderById: (id) => api.get(`/purchases/orders/${id}`),
};

export const user = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
};

export const publicAPI = {
  getReferralSettings: () => api.get('/public/referral-settings'),
  getActivePlans: (limit = 10, offset = 0) => api.get(`/public/dataplans?limit=${limit}&offset=${offset}`),
};

export const admin = {
  getDashboardStats: () => api.get('/admin/stats'),
  getAllUsers: (page = 1, limit = 10, role = 'user', search = '') =>
    api.get(`/admin/users?page=${page}&limit=${limit}&role=${role}&search=${search}`),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  getFullUserInfo: (id) => api.get(`/admin/users/${id}/full-info`),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/toggle-status`),
  banUser: (id, banReason = '') => api.patch(`/admin/users/${id}/ban`, { banReason }),
  unbanUser: (id) => api.patch(`/admin/users/${id}/unban`),
  suspendUser: (id, days) => api.patch(`/admin/users/${id}/suspend`, { days }),
  unsuspendUser: (id) => api.patch(`/admin/users/${id}/unsuspend`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  restoreUser: (id) => api.patch(`/admin/users/${id}/restore`),
  getTransactions: (page = 1, limit = 10, type = '', status = '') =>
    api.get(`/admin/transactions?page=${page}&limit=${limit}&type=${type}&status=${status}`),
  deleteTransaction: (id) => api.delete(`/admin/transactions/${id}`),
  deleteAllTransactions: () => api.delete('/admin/transactions'),
  bulkDeleteTransactionsByStatus: (status) =>
    api.post('/admin/transactions/bulk-delete', { status }),
  getPurchases: (page = 1, limit = 10) =>
    api.get(`/admin/purchases?page=${page}&limit=${limit}`),
  getOrders: (page = 1, limit = 10, status = '', network = '') =>
    api.get(`/admin/orders?page=${page}&limit=${limit}&status=${status}&network=${network}`),
  syncOrdersFromTopza: () => api.post('/admin/orders/sync-topza'),
  updateOrderStatus: (id, status, adminNotes = '') =>
    api.patch(`/admin/orders/${id}/status`, { status, adminNotes }),
  deleteOrder: (id) => api.delete(`/admin/orders/${id}`),
  bulkDeleteOrdersByStatus: (status) =>
    api.post('/admin/orders/bulk-delete', { status }),
  getReferralStats: () => api.get('/admin/referrals/stats'),
  getAllReferrals: (page = 1, limit = 10, search = '') =>
    api.get(`/admin/referrals?page=${page}&limit=${limit}&search=${search}`),
  updateReferralEarnings: (id, earnings) =>
    api.patch(`/admin/referrals/${id}/earnings`, { earnings }),
  resetReferralCode: (id) => api.patch(`/admin/referrals/${id}/reset-code`),
  resetAllReferralEarnings: () => api.patch('/admin/referrals/reset-all/earnings'),
  getReferralSettings: () => api.get('/admin/referrals/settings'),
  updateReferralSettings: (settings) => api.patch('/admin/referrals/settings', settings),
  getTopzaWalletSettings: () => api.get('/admin/topza/settings'),
  getTopzaWalletTransactions: (page = 1, limit = 20, type = '', status = '') =>
    api.get(`/admin/topza/transactions?page=${page}&limit=${limit}&type=${type}&status=${status}`),
  getNotifications: (page = 1, limit = 20, type = '', isRead = '', search = '') =>
    api.get(`/admin/notifications?page=${page}&limit=${limit}&type=${type}&isRead=${isRead}&search=${search}`),
  getNotificationStats: () => api.get('/admin/notifications/stats'),
  markNotificationAsRead: (id) => api.patch(`/admin/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.patch('/admin/notifications/mark-all/read'),
  deleteNotification: (id) => api.delete(`/admin/notifications/${id}`),
  deleteAllNotifications: () => api.delete('/admin/notifications'),
};

export const dataplans = {
  list: (network = '', status = 'active', page = 1, limit = 10) =>
    api.get(`/dataplans/list?network=${network}&status=${status}&page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/dataplans/${id}`),
  sync: () => api.post('/dataplans/sync'),
  updatePrices: (id, costPrice, sellingPrice) =>
    api.patch(`/dataplans/${id}/prices`, { costPrice, sellingPrice }),
  clearEdits: (id) => api.patch(`/dataplans/${id}/clear-edits`),
  toggleStatus: (id) => api.patch(`/dataplans/${id}/toggle-status`),
  delete: (id) => api.delete(`/dataplans/${id}`),
};

export default api;
