import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Save, Upload } from 'lucide-react';

export default function Setting() {
  const [form, setForm] = useState({
    namatenant: '', alamat: '', hp: '', email: '', ppn: 11,
    cekminus: 'TIDAK', pakaibahanbaku: 'YA', pakaiPPN: 'YA', logo: '',
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    api.get('/setting/toko')
      .then(r => { setForm(f => ({ ...f, ...r.data })); setLoading(false); })
      .catch(() => { toast.error('Gagal memuat setting'); setLoading(false); });
  }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? (checked ? 'YA' : 'TIDAK') : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/setting/toko', {
        namatenant    : form.namatenant,
        alamat        : form.alamat,
        hp            : form.hp,
        email         : form.email,
        ppn           : parseFloat(form.ppn) || 0,
        cekminus      : form.cekminus,
        pakaibahanbaku: form.pakaibahanbaku,
        pakaiPPN      : form.pakaiPPN,
      });
      if (logoFile) {
        const fd = new FormData();
        fd.append('logo', logoFile);
        const r = await api.put('/setting/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setForm(f => ({ ...f, logo: r.data.logo }));
        setLogoFile(null);
      }
      toast.success('Setting berhasil disimpan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  if (loading) return <div className="p-8 text-sm text-dark-300">Memuat...</div>;

  const logoSrc = logoPreview || (form.logo ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${form.logo}` : null);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Setting Perusahaan</h2>
          <p className="text-sm text-dark-300">Konfigurasi data toko dan preferensi sistem</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold disabled:opacity-60">
          <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="grid grid-cols-3 gap-4">

          {/* Data Toko */}
          <div className="col-span-2 bg-white rounded-2xl border border-primary-50 p-5 space-y-4">
            <h3 className="text-sm font-bold text-dark-400">Data Toko</h3>
            <div>
              <label className="block text-xs font-semibold text-dark-300 mb-1">Nama Toko</label>
              <input name="namatenant" value={form.namatenant} onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark-300 mb-1">Alamat</label>
              <textarea name="alamat" value={form.alamat || ''} onChange={handleChange} rows={3}
                className="w-full px-3 py-2 rounded-lg border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1">No. HP / Telp</label>
                <input name="hp" value={form.hp || ''} onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1">Email</label>
                <input name="email" type="email" value={form.email || ''} onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="bg-white rounded-2xl border border-primary-50 p-5 space-y-3">
            <h3 className="text-sm font-bold text-dark-400">Logo Toko</h3>
            <div className="flex flex-col items-center gap-3">
              <div className="w-32 h-32 rounded-xl border border-primary-100 bg-warm-50 flex items-center justify-center overflow-hidden">
                {logoSrc
                  ? <img src={logoSrc} alt="Logo" className="w-full h-full object-contain" />
                  : <span className="text-xs text-dark-300">Belum ada logo</span>}
              </div>
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Pilih Logo
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
              {logoFile && <p className="text-[10px] text-dark-300 text-center truncate w-full">{logoFile.name}</p>}
            </div>
          </div>

          {/* Konfigurasi Sistem */}
          <div className="col-span-3 bg-white rounded-2xl border border-primary-50 p-5 space-y-4">
            <h3 className="text-sm font-bold text-dark-400">Konfigurasi Sistem</h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-dark-300 mb-1">PPN (%)</label>
                <input name="ppn" type="number" min="0" max="100" step="0.01" value={form.ppn} onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                <p className="text-[10px] text-dark-300 mt-1">Persentase PPN default untuk transaksi</p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="block text-xs font-semibold text-dark-300">Pakai PPN</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="pakaiPPN" checked={form.pakaiPPN === 'YA'} onChange={handleChange}
                    className="w-4 h-4 rounded accent-primary-500" />
                  <span className="text-sm text-dark-400">Aktifkan PPN di transaksi</span>
                </label>
                <p className="text-[10px] text-dark-300">Jika aktif, PPN dihitung secara default pada setiap item transaksi</p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="block text-xs font-semibold text-dark-300">Cek Stok Minus</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="cekminus" checked={form.cekminus === 'YA'} onChange={handleChange}
                    className="w-4 h-4 rounded accent-primary-500" />
                  <span className="text-sm text-dark-400">Aktifkan cek stok minus</span>
                </label>
                <p className="text-[10px] text-dark-300">Jika aktif, penjualan/keluar stok ditolak jika stok tidak cukup</p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="block text-xs font-semibold text-dark-300">Pakai Bahan Baku</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="pakaibahanbaku" checked={form.pakaibahanbaku === 'YA'} onChange={handleChange}
                    className="w-4 h-4 rounded accent-primary-500" />
                  <span className="text-sm text-dark-400">Aktifkan fitur bahan baku / produksi</span>
                </label>
                <p className="text-[10px] text-dark-300">Jika aktif, menu produksi dan resep tersedia</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
