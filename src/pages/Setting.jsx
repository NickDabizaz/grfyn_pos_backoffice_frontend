import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { formatRupiah } from '../lib/utils';
import toast from 'react-hot-toast';
import { Store, Key, Image, Save, RefreshCw } from 'lucide-react';

export default function Setting() {
  const user                    = useAuthStore((s) => s.user);
  const updateUser              = useAuthStore((s) => s.updateUser);
  const [toko, setToko]         = useState({ namatoko: '', alamat: '', hp: '', email: '', ppn: 11 });
  const [password, setPassword] = useState({ oldPass: '', newPass: '' });
  const [logo, setLogo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) setToko({ namatoko: user.namatoko || '', alamat: user.alamat || '', hp: user.hp || '', email: user.email || '', ppn: user.ppn ?? 11 });
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (user) setToko({ namatoko: user.namatoko || '', alamat: user.alamat || '', hp: user.hp || '', email: user.email || '', ppn: user.ppn ?? 11 });
    setTimeout(() => setRefreshing(false), 300);
  };

  const saveToko = async () => {
    try {
      await api.put('/setting/toko', toko);
      updateUser({ ...user, ...toko });
      toast.success('Info toko disimpan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  const changePassword = async () => {
    if (!password.oldPass || !password.newPass) return toast.error('Lengkapi password');
    try {
      await api.put('/auth/password', password);
      toast.success('Password diubah');
      setPassword({ oldPass: '', newPass: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  const uploadLogo = async () => {
    if (!logo) return;
    const formData = new FormData();
    formData.append('logo', logo);
    try {
      const { data } = await api.put('/setting/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser({ ...user, logo: data.logo });
      toast.success('Logo diupload');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-500">Setting</h2>
          <p className="text-sm text-dark-300">Konfigurasi toko & akun</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
          title="Refresh halaman">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Info Toko */}
        <div className="bg-white rounded-2xl p-5 border border-primary-50">
          <h3 className="text-sm font-bold text-dark-500 flex items-center gap-2 mb-4">
            <Store className="w-4 h-4 text-primary-500" /> Info Toko
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1">Nama Toko</label>
              <input value={toko.namatoko} onChange={(e) => setToko({...toko, namatoko: e.target.value.toUpperCase()})}
                className="input-upper w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1">Alamat</label>
              <textarea value={toko.alamat} onChange={(e) => setToko({...toko, alamat: e.target.value.toUpperCase()})}
                rows={2} className="input-upper w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">No HP</label>
                <input value={toko.hp} onChange={(e) => setToko({...toko, hp: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Email</label>
                <input value={toko.email} onChange={(e) => setToko({...toko, email: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1">PPN (%)</label>
              <div className="flex items-center gap-3">
                <input type="number" value={toko.ppn} onChange={(e) => setToko({...toko, ppn: parseFloat(e.target.value) || 0})}
                  disabled={toko.ppn === 0}
                  className="w-32 px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:bg-gray-50" />
                <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-dark-400">
                  <input
                    type="checkbox"
                    checked={toko.ppn > 0}
                    onChange={(e) => setToko({...toko, ppn: e.target.checked ? 11 : 0})}
                    className="w-4 h-4 accent-primary-500 cursor-pointer"
                  />
                  Pakai PPN
                </label>
              </div>
            </div>
            <button onClick={saveToko}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-all">
              <Save className="w-4 h-4" /> Simpan
            </button>
          </div>
        </div>

        {/* Ganti Password & Logo */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-primary-50">
            <h3 className="text-sm font-bold text-dark-500 flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 text-amber-500" /> Ganti Password
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Password Lama</label>
                <input type="password" value={password.oldPass} onChange={(e) => setPassword({...password, oldPass: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Password Baru</label>
                <input type="password" value={password.newPass} onChange={(e) => setPassword({...password, newPass: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <button onClick={changePassword}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all">
                <Key className="w-4 h-4" /> Ubah Password
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-primary-50">
            <h3 className="text-sm font-bold text-dark-500 flex items-center gap-2 mb-4">
              <Image className="w-4 h-4 text-accent-500" /> Logo Toko
            </h3>
            {user?.logo && (
              <img src={user.logo} alt="Logo" className="w-20 h-20 rounded-xl object-cover mb-3 border border-primary-100" />
            )}
            <div className="flex gap-2">
              <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files[0])}
                className="flex-1 text-sm text-dark-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100" />
              <button onClick={uploadLogo} disabled={!logo}
                className="px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold disabled:opacity-50 transition-all">
                Upload
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
