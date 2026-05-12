import { create } from 'zustand';

/**
 * Controls the login-overlay that appears when a 401 response is received.
 * This keeps the user's open tabs intact instead of redirecting to /login.
 */
export const useAuthModalStore = create((set) => ({
  visible: false,
  show   : () => set({ visible: true }),
  hide   : () => set({ visible: false }),
}));
