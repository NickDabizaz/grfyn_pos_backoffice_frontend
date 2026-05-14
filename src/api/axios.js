import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

let isRefreshing = false;
let pendingQueue = [];
let proactiveRefreshTimer = null;

const drainQueue = (token) => {
  pendingQueue.forEach(prom => prom.resolve(token));
  pendingQueue = [];
};

export const clearProactiveRefresh = () => {
  if (proactiveRefreshTimer) {
    clearInterval(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }
};

export const scheduleProactiveRefresh = () => {
  clearProactiveRefresh();
  // Refresh token setiap 1 jam 45 menit (token expire 2 jam)
  proactiveRefreshTimer = setInterval(async () => {
    const token = localStorage.getItem('grfyn_token');
    if (!token) return;
    try {
      const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });
      localStorage.setItem('grfyn_token', data.token);
      localStorage.setItem('grfyn_user', JSON.stringify(data.user));
      import('../store/authStore.js').then(({ useAuthStore }) => {
        useAuthStore.getState().login(data.token, data.user);
      });
    } catch {
      // Biarkan interceptor response menangani jika refresh gagal
    }
  }, 1000 * 60 * 105); // 105 menit
};

// Schedule proactive refresh saat awal jika ada token
if (localStorage.getItem('grfyn_token')) {
  scheduleProactiveRefresh();
}

// Refresh juga saat user kembali ke tab/browser setelah lama tidak aktif
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    const token = localStorage.getItem('grfyn_token');
    if (token) {
      axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      }).then(({ data }) => {
        localStorage.setItem('grfyn_token', data.token);
        localStorage.setItem('grfyn_user', JSON.stringify(data.user));
        import('../store/authStore.js').then(({ useAuthStore }) => {
          useAuthStore.getState().login(data.token, data.user);
        });
      }).catch(() => {
        // Biarkan interceptor menangani
      });
    }
  }
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
  async (err) => {
    if (err.response?.status === 401) {
      if (window.location.pathname === '/login' || window.location.pathname === '/register') {
        return Promise.reject(err);
      }

      const token = localStorage.getItem('grfyn_token');
      const originalConfig = err.config;

      // Jika sedang ada refresh, queue request ini agar diretry nanti
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalConfig.headers.Authorization = `Bearer ${newToken}`;
          return api.request(originalConfig);
        }).catch(() => Promise.reject(err));
      }

      // Jika ada token, coba refresh dulu sebelum show overlay
      if (token) {
        isRefreshing = true;
        try {
          const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000,
          });

          localStorage.setItem('grfyn_token', data.token);
          localStorage.setItem('grfyn_user', JSON.stringify(data.user));

          import('../store/authStore.js').then(({ useAuthStore }) => {
            useAuthStore.getState().login(data.token, data.user);
          });

          isRefreshing = false;
          drainQueue(data.token);

          originalConfig.headers.Authorization = `Bearer ${data.token}`;
          return api.request(originalConfig);
        } catch (refreshErr) {
          isRefreshing = false;
          localStorage.removeItem('grfyn_token');
          localStorage.removeItem('grfyn_user');
          pendingQueue.forEach(prom => prom.reject(refreshErr));
          pendingQueue = [];
          clearProactiveRefresh();

          import('../store/authModalStore.js').then(({ useAuthModalStore }) => {
            useAuthModalStore.getState().show();
          });
          return Promise.reject(err);
        }
      }

      // Tidak ada token, langsung show overlay
      localStorage.removeItem('grfyn_token');
      localStorage.removeItem('grfyn_user');
      import('../store/authModalStore.js').then(({ useAuthModalStore }) => {
        useAuthModalStore.getState().show();
      });
    }
    return Promise.reject(err);
  }
);

export default api;
