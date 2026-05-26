import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('grfyn_token') || null,
  user: JSON.parse(localStorage.getItem('grfyn_user') || 'null'),
  lokasi: JSON.parse(localStorage.getItem('grfyn_lokasi') || 'null'),

  login: (token, user, lokasi) => {
    localStorage.setItem('grfyn_token', token);
    localStorage.setItem('grfyn_user', JSON.stringify(user));
    if (lokasi) localStorage.setItem('grfyn_lokasi', JSON.stringify(lokasi));
    set({ token, user, lokasi: lokasi || null });
  },

  logout: () => {
    localStorage.removeItem('grfyn_token');
    localStorage.removeItem('grfyn_user');
    localStorage.removeItem('grfyn_lokasi');
    localStorage.removeItem('grfyn_refresh_token');
    set({ token: null, user: null, lokasi: null });
  },

  updateUser: (user) => {
    localStorage.setItem('grfyn_user', JSON.stringify(user));
    set({ user });
  },
}));
