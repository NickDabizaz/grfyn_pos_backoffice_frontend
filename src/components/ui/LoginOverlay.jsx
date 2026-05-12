import { useState } from 'react';
import { Lock } from 'lucide-react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import toast from 'react-hot-toast';

/**
 * Floating login dialog that appears on top of the current workspace when
 * the session token expires (401). Allows the user to re-authenticate
 * without losing their open tabs.
 */
export default function LoginOverlay() {
  const { visible, hide } = useAuthModalStore();
  const setAuth           = useAuthStore((s) => s.setAuth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  if (!visible) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      localStorage.setItem('grfyn_token', data.token);
      localStorage.setItem('grfyn_user', JSON.stringify(data.user));
      setAuth(data.token, data.user, data.lokasi);
      toast.success('Sesi dipulihkan');
      hide();
      setUsername('');
      setPassword('');
    } catch {
      toast.error('Username atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-primary-500" />
          </div>
          <h2 className="text-lg font-bold text-dark-500">Sesi Berakhir</h2>
          <p className="text-sm text-dark-300 text-center mt-1">
            Login kembali untuk melanjutkan pekerjaan Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-dark-400 mb-1">Username</label>
            <input
              type="text"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-primary-100 bg-warm-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-primary-100 bg-warm-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Masuk…' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
