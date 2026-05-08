import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import useTabStore from '../store/tabStore';

const INIT = { namacustomer: '', alamat: '', hp: '', status: 'AKTIF' };

export default function CustomerForm({ mode, id, data, onSuccess, tabId }) {
  const [form, setForm] = useState(INIT);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [kodeInput, setKodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const closeTab = useTabStore((s) => s.closeTab);

  useEffect(() => {
    if (mode === 'edit' && data) {
      setForm({ namacustomer: data.namacustomer, alamat: data.alamat || '', hp: data.hp || '', status: data.status || 'AKTIF' });
    } else if (mode === 'add') {
      setForm({ ...INIT });
      setAutoGenerate(true);
      setKodeInput('');
    }
  }, [mode, data]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'edit') {
        await api.put(`/customer/${id}`, form);
        toast.success('Customer diupdate');
      } else {
        const payload = { ...form };
        if (!autoGenerate && kodeInput.trim()) payload.kodecustomer = kodeInput.trim();
        await api.post('/customer', payload);
        toast.success('Customer ditambah');
      }
      if (onSuccess) onSuccess();
      closeTab(tabId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 pt-4 pb-2 border-b border-primary-50 shrink-0">
        <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-warm-50 text-dark-400">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-dark-500">{mode === 'edit' ? 'Edit Customer' : 'Tambah Customer'}</h2>
          <p className="text-xs text-dark-300">{mode === 'edit' ? `Edit: ${data?.kodecustomer}` : 'Form tambah data customer baru'}</p>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSave} className="max-w-2xl space-y-4">

          {/* Kode Customer */}
          <div>
            <label className="block text-xs font-semibold text-dark-400 mb-1">Kode Customer</label>
            {mode === 'edit' ? (
              <input value={data?.kodecustomer || ''} disabled
                className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm bg-warm-50 text-dark-300 cursor-not-allowed" />
            ) : (
              <div className="flex items-center gap-3">
                <input
                  disabled={autoGenerate}
                  value={autoGenerate ? '(Auto-generate)' : kodeInput}
                  onChange={(e) => setKodeInput(e.target.value.toUpperCase())}
                  placeholder="Masukkan kode customer..."
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
            <label className="block text-xs font-semibold text-dark-400 mb-1">Nama Customer</label>
            <input value={form.namacustomer} onChange={(e) => setForm({ ...form, namacustomer: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark-400 mb-1">Alamat</label>
            <textarea value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value.toUpperCase() })} rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark-400 mb-1">No HP</label>
            <input value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
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
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
