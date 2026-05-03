import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    api.get('/auth/me').catch(() => {
      logout();
      navigate('/login');
    });
  }, []);

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="ml-64 flex-1 p-6 max-w-[calc(100vw-16rem)]">
        <div className="animate-in">{children}</div>
      </main>
    </div>
  );
}
