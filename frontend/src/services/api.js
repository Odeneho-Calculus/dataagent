import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
};

export const user = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
};

export const admin = {
  getDashboardStats: () => api.get('/admin/stats'),
  getAllUsers: (page = 1, limit = 10, role = 'user', search = '') =>
    api.get(`/admin/users?page=${page}&limit=${limit}&role=${role}&search=${search}`),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/toggle-status`),
  getTransactions: (page = 1, limit = 10) =>
    api.get(`/admin/transactions?page=${page}&limit=${limit}`),
  getPurchases: (page = 1, limit = 10) =>
    api.get(`/admin/purchases?page=${page}&limit=${limit}`),
};

export const dataplans = {
  list: (network = '', status = 'active') =>
    api.get(`/dataplans/list?network=${network}&status=${status}`),
  getById: (id) => api.get(`/dataplans/${id}`),
  sync: () => api.post('/dataplans/sync'),
  updatePrices: (id, costPrice, sellingPrice) =>
    api.patch(`/dataplans/${id}/prices`, { costPrice, sellingPrice }),
  clearEdits: (id) => api.patch(`/dataplans/${id}/clear-edits`),
  toggleStatus: (id) => api.patch(`/dataplans/${id}/toggle-status`),
  delete: (id) => api.delete(`/dataplans/${id}`),
};

export default api;
