import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TabBar from './TabBar';
import TabContent from './TabContent';
import useTabStore from '../store/tabStore';
import { useAuthStore } from '../store/authStore';
import { openPageFromSidebar, DASHBOARD_KODE } from '../lib/pageRegistry.jsx';
import api, { clearProactiveRefresh } from '../api/axios';

let dashboardOpened = false;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.token);
  const closeAllTabs = useTabStore((s) => s.closeAllTabs);
  const openOrFocus = useTabStore((s) => s.openOrFocusTab);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    // Cek token valid; jika gagal biarkan axios interceptor yang
    // menangani refresh token atau logout.
    api.get('/auth/me').catch(() => {
      // Tidak perlu redirect manual — interceptor sudah handle.
    });
  }, [token, navigate]);

  useEffect(() => {
    if (token && !dashboardOpened) {
      dashboardOpened = true;
      const tabs = useTabStore.getState().tabs;
      const alreadyOpen = tabs.some(t => t.kodemenu === DASHBOARD_KODE);
      if (!alreadyOpen) openPageFromSidebar(DASHBOARD_KODE, openOrFocus);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams(location.search);
    if (params.get('open') === 'subscription') {
      openPageFromSidebar('subscription', openOrFocus);
      navigate(location.pathname, { replace: true });
    }
  }, [token, location.pathname, location.search, navigate, openOrFocus]);

  const handleLogout = () => {
    dashboardOpened = false;
    closeAllTabs();
    logout();
    clearProactiveRefresh();
    navigate('/login');
  };

  return (
    <>
      <div className="flex h-screen bg-surface">
        <Sidebar onLogout={handleLogout} />
        <div className="ml-64 flex-1 flex flex-col min-w-0">
          <TabBar />
          <TabContent />
        </div>
      </div>
    </>
  );
}
