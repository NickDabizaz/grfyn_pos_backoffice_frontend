import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

let isRefreshing = false;
let pendingQueue = [];
let proactiveRefreshTimer = null;

const drainQueue = (token) => {
  pendingQueue.forEach(prom => prom.resolve(token));
  pendingQueue = [];
};

const rejectQueue = (err) => {
  pendingQueue.forEach(prom => prom.reject(err));
  pendingQueue = [];
};

export const clearProactiveRefresh = () => {
  if (proactiveRefreshTimer) {
    clearInterval(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }
};

const logoutExpiredSession = async () => {
  clearProactiveRefresh();
  rejectQueue(new Error('Session expired'));

  const [{ useAuthStore }, { useAuthModalStore }] = await Promise.all([
    import('../store/authStore.js'),
    import('../store/authModalStore.js'),
  ]);

  useAuthModalStore.getState().hide();
  useAuthStore.getState().logout();

  if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
    window.location.replace('/login');
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
  const lokasiRaw = localStorage.getItem('grfyn_lokasi');
  if (lokasiRaw) {
    try {
      const lokasi = JSON.parse(lokasiRaw);
      if (lokasi?.idlokasi) config.headers['X-Lokasi-Id'] = lokasi.idlokasi;
    } catch {}
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

      // Jika ada token, coba refresh dulu sebelum logout
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
        } catch {
          isRefreshing = false;
          await logoutExpiredSession();
          return Promise.reject(err);
        }
      }

      // Tidak ada token, langsung logout ke halaman login.
      await logoutExpiredSession();
    }
    return Promise.reject(err);
  }
);

export default api;
