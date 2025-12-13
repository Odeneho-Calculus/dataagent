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
      localStorage.removeItem('token');
      window.location.href = '/login';
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
  topup: (data) => api.post('/wallet/topup', data),
  getTransactions: (limit = 50, offset = 0) =>
    api.get(`/wallet/transactions?limit=${limit}&offset=${offset}`),
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

export default api;
