import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('grfyn_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('grfyn_token');
      localStorage.removeItem('grfyn_user');
      if (window.location.pathname === '/login' || window.location.pathname === '/register') {
        // Already on auth page — just reject, no overlay needed
        return Promise.reject(err);
      }
      // Show overlay instead of hard redirect so open tabs are preserved
      import('../store/authModalStore.js').then(({ useAuthModalStore }) => {
        useAuthModalStore.getState().show();
      });
    }
    return Promise.reject(err);
  }
);

export default api;
