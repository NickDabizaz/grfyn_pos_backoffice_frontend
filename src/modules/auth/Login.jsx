import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api, { scheduleProactiveRefresh } from '../../api/axios';
import toast from 'react-hot-toast';
import { Store, LogIn, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needSelect, setNeedSelect] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedLokasi, setSelectedLokasi] = useState('');
  const loginAction = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const demoUsername = 'demo@grfyn.id';
  const demoPassword = 'pass123';

  const fillDemoAccount = () => {
    setUsername(demoUsername);
    setPassword(demoPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return toast.error('Lengkapi username dan password');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, pass: password });

      if (data.needSelectLocation) {
        setLocations(data.locations);
        setNeedSelect(true);
        setLoading(false);
        return;
      }

      loginAction(data.token, data.user, data.lokasi);
      scheduleProactiveRefresh();
      toast.success(`Selamat datang, ${data.user.namauser}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login gagal');
      setLoading(false);
    }
  };

  const handleSelectLocation = async () => {
    if (!selectedLokasi) return toast.error('Pilih lokasi terlebih dahulu');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/select-location', {
        username,
        idlokasi: Number(selectedLokasi),
      });
      loginAction(data.token, data.user, data.lokasi);
      scheduleProactiveRefresh();
      toast.success(`Selamat datang, ${data.user.namauser}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memilih lokasi');
    } finally {
      setLoading(false);
    }
  };

  if (needSelect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-100/50 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent-100/50 blur-3xl" />
        </div>
        <div className="relative w-full max-w-md animate-in">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500 mb-3 shadow-lg shadow-primary-500/20">
                <Store className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl font-bold text-dark-500">Pilih Lokasi</h1>
              <p className="text-sm text-dark-300 mt-1">Pilih lokasi untuk melanjutkan</p>
            </div>
            <div className="space-y-3 mb-6">
              {locations.map((loc) => (
                <button
                  key={loc.idlokasi}
                  onClick={() => setSelectedLokasi(loc.idlokasi)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedLokasi === loc.idlokasi
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-primary-100 bg-warm-50 hover:border-primary-300'
                  }`}
                >
                  <p className="font-semibold text-dark-500">{loc.namalokasi}</p>
                  <p className="text-xs text-dark-300">{loc.kodelokasi} - {loc.alamat}</p>
                </button>
              ))}
            </div>
            <button
              onClick={handleSelectLocation}
              disabled={loading || !selectedLokasi}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm transition-all disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
            <button
              onClick={() => { setNeedSelect(false); setSelectedLokasi(''); }}
              className="w-full text-center text-xs text-dark-300 hover:text-dark-500 mt-3"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-100/50 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent-100/50 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-warm-100/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-in">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-primary-500/5 border border-white/60 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500 mb-4 shadow-lg shadow-primary-500/20">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-dark-500">Grfyn POS</h1>
            <p className="text-sm text-dark-300 mt-1">Masuk untuk melanjutkan</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-dark-500 text-sm placeholder-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
                placeholder="username"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-primary-100 bg-warm-50 text-dark-500 text-sm placeholder-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
                  placeholder="password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300 hover:text-dark-500"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:shadow-primary-500/20 active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-5 rounded-2xl border border-primary-100 bg-primary-50/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Akun Demo</p>
                <p className="mt-2 text-sm font-semibold text-dark-500">{demoUsername}</p>
                <p className="text-xs text-dark-300">Password: {demoPassword}</p>
              </div>
              <button
                type="button"
                onClick={fillDemoAccount}
                className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-primary-700 shadow-sm ring-1 ring-primary-100 transition-all hover:bg-primary-500 hover:text-white"
              >
                Gunakan
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-dark-300 mt-4">
            Belum punya akun?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:underline">
              Daftar Perusahaan
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
