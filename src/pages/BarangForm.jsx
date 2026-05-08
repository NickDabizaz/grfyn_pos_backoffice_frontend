import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import SearchableSelect from '../components/ui/SearchableSelect';
import useTabStore from '../store/tabStore';

const INIT = { namabarang: '', satuanbesar: '', satuansedang: '', satuankecil: '', konversi1: 1, konversi2: 1, jenis: 'BAHAN JADI', stokmin: 1, hargabeli: '0', hargajual: '0', status: 'AKTIF' };

export default function BarangForm({ mode, idbarang, data, onSuccess, tabId, isActive }) {
  const [form, setForm]                 = useState(INIT);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [kodeInput, setKodeInput]       = useState('');
  const [loading, setLoading]           = useState(false);
  const closeTab                        = useTabStore((s) => s.closeTab);

  useEffect(() => {
    if (mode === 'edit' && data) {
      setForm({
        namabarang  : data.namabarang,
        satuanbesar : data.satuanbesar || '',
        satuansedang: data.satuansedang || '',
        satuankecil : data.satuankecil || '',
        konversi1   : data.konversi1 || 0,
        konversi2   : data.konversi2 || 0,
        jenis       : data.jenis || 'BAHAN JADI',
        stokmin     : data.stokmin || 0,
        hargabeli   : data.hargabeli_terbaru || '',
        hargajual   : data.hargajual_terbaru || '',
        status      : data.status || 'AKTIF',
      });
    } else if (mode === 'add') {
      setForm({ ...INIT });
      setAutoGenerate(true);
      setKodeInput('');
    }
  }, [mode, data]);

  const validateSatuan = () => {
    const units = [form.satuanbesar, form.satuansedang, form.satuankecil].filter(u => u && u.trim());
    const uniqueUnits = new Set(units);
    if (units.length !== uniqueUnits.size) {
      toast.error('Satuan tidak boleh sama! Hanya satuan terkecil yang akan disimpan.');
      setForm({ ...form, satuanbesar: '', satuansedang: '' });
      return false;
    }
    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateSatuan()) return;

    setLoading(true);
    try {
      if (mode === 'edit') {
        await api.put(`/barang/${idbarang}`, form);
        toast.success('Barang diupdate');
      } else {
        const payload = { ...form };
        if (!autoGenerate && kodeInput.trim()) payload.kodebarang = kodeInput.trim();
        await api.post('/barang', payload);
        toast.success('Barang ditambah');
      }
      if (onSuccess) onSuccess();
      closeTab(tabId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    } finally {
      setLoading(false);
    }
  };

  const jenisOptions = [
    { value: 'BAHAN BAKU', label: 'BAHAN BAKU' },
    { value: 'BAHAN SETENGAH JADI', label: 'BAHAN SETENGAH JADI' },
    { value: 'BAHAN JADI', label: 'BAHAN JADI' }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 pt-4 pb-2 border-b border-primary-50 shrink-0">
        <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-warm-50 text-dark-400">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-dark-500">{mode === 'edit' ? 'Edit Barang' : 'Tambah Barang'}</h2>
          <p className="text-xs text-dark-300">{mode === 'edit' ? `Edit: ${data?.kodebarang}` : 'Form tambah data barang baru'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSave} className="max-w-2xl space-y-4">

          {/* Kode Barang */}
          <div>
            <label className="block text-xs font-semibold text-dark-400 mb-1">Kode Barang</label>
            {mode === 'edit' ? (
              <input value={data?.kodebarang || ''} disabled
                className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm bg-warm-50 text-dark-300 cursor-not-allowed" />
            ) : (
              <div className="flex items-center gap-3">
                <input
                  disabled={autoGenerate}
                  value={autoGenerate ? '(Auto-generate)' : kodeInput}
                  onChange={(e) => setKodeInput(e.target.value.toUpperCase())}
                  placeholder="Masukkan kode barang..."
                  className="flex-1 px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-warm-50 disabled:text-dark-300 disabled:cursor-not-allowed"
                />
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input type="checkbox" checked={autoGenerate}
                    onChange={(e) => { setAutoGenerate(e.target.checked); if (e.target.checked) setKodeInput(''); }}
                    className="w-3.5 h-3.5 rounded accent-primary-500" />
                  <span className="text-xs text-dark-400 font-medium">Generate</span>
                </label>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-400 mb-1">Nama Barang</label>
            <input value={form.namabarang} onChange={(e) => setForm({ ...form, namabarang: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" required />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1">Satuan Besar</label>
              <input value={form.satuanbesar} onChange={(e) => setForm({ ...form, satuanbesar: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" placeholder="SATUAN BESAR" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1">Satuan Sedang</label>
              <input value={form.satuansedang} onChange={(e) => setForm({ ...form, satuansedang: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" placeholder="SATUAN SEDANG" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1">Satuan Kecil</label>
              <input value={form.satuankecil} onChange={(e) => setForm({ ...form, satuankecil: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" placeholder="SATUAN KECIL" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1">
                Konversi 1 <span className="text-[10px] text-dark-200">(Satuan Besar &#x2192; Satuan Sedang)</span>
              </label>
              <input type="number" value={form.konversi1} onChange={(e) => setForm({ ...form, konversi1: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" placeholder="36" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1">
                Konversi 2 <span className="text-[10px] text-dark-200">(Satuan Sedang &#x2192; Satuan Kecil)</span>
              </label>
              <input type="number" value={form.konversi2} onChange={(e) => setForm({ ...form, konversi2: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" placeholder="1000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1">Jenis</label>
              <SearchableSelect
                value={form.jenis}
                onChange={(val) => setForm({ ...form, jenis: val })}
                options={jenisOptions}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1">Stok Minimum (Satuan Terkecil)</label>
              <input type="number" value={form.stokmin} onChange={(e) => setForm({ ...form, stokmin: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1">Harga Beli</label>
              <input type="number" value={form.hargabeli} onChange={(e) => setForm({ ...form, hargabeli: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1">Harga Jual</label>
              <input type="number" value={form.hargajual} onChange={(e) => setForm({ ...form, hargajual: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              {form.hargabeli && form.hargajual && parseFloat(form.hargajual) < parseFloat(form.hargabeli) && (
                <p className="text-[10px] text-red-500 mt-1">Harga jual di bawah harga beli!</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-dark-400 mb-2">Status</label>
            <button type="button"
              onClick={() => setForm({ ...form, status: form.status === 'AKTIF' ? 'TIDAK AKTIF' : 'AKTIF' })}
              className="flex items-center gap-3">
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.status === 'AKTIF' ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.status === 'AKTIF' ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <span className={`text-sm font-semibold ${form.status === 'AKTIF' ? 'text-emerald-600' : 'text-gray-400'}`}>
                {form.status === 'AKTIF' ? 'Aktif' : 'Tidak Aktif'}
              </span>
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => closeTab(tabId)} className="flex-1 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">Batal</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
