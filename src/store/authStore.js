import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('grfyn_token') || null,
  user: JSON.parse(localStorage.getItem('grfyn_user') || 'null'),
  login: (token, user) => {
    localStorage.setItem('grfyn_token', token);
    localStorage.setItem('grfyn_user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('grfyn_token');
    localStorage.removeItem('grfyn_user');
    set({ token: null, user: null });
  },
  updateUser: (user) => {
    localStorage.setItem('grfyn_user', JSON.stringify(user));
    set({ user });
  }
}));
