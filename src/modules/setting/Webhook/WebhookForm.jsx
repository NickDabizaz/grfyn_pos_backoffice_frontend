import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import useTabStore from '../../../store/tabStore';

const ALL_EVENTS = [
  { value: 'JUAL_APPROVED', label: 'Invoice penjualan di-approve' },
  { value: 'JUAL_CANCELLED', label: 'Invoice penjualan dibatalkan' },
  { value: 'BELI_APPROVED', label: 'Invoice pembelian di-approve' },
  { value: 'BELI_CANCELLED', label: 'Invoice pembelian dibatalkan' },
  { value: 'STOK_KRITIS', label: 'Stok barang di bawah minimum' },
  { value: 'POIN_DITAMBAH', label: 'Poin customer bertambah' },
  { value: 'PAYROLL_APPROVED', label: 'Payroll di-approve' },
];

const INIT = { namawebhook: '', url: '', events: [], secret: '' };

export default function WebhookForm({ mode, id, data, onSuccess, tabId }) {
  const [form, setForm] = useState(INIT);
  const [loading, setLoading] = useState(false);
  const closeTab = useTabStore((s) => s.closeTab);

  useEffect(() => {
    if (mode === 'edit' && data) {
      setForm({
        namawebhook: data.namawebhook || '',
        url: data.url || '',
        events: data.events || [],
        secret: data.secret || '',
      });
    } else {
      setForm({ ...INIT });
    }
  }, [mode, data]);

  const toggleEvent = (ev) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(ev) ? prev.events.filter((e) => e !== ev) : [...prev.events, ev],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.events.length === 0) { toast.error('Pilih minimal 1 event'); return; }
    setLoading(true);
    try {
      if (mode === 'edit') {
        await api.put(`/webhook/${id}`, form);
        toast.success('Webhook diupdate');
      } else {
        await api.post('/webhook', form);
        toast.success('Webhook ditambah');
      }
      if (onSuccess) onSuccess();
      closeTab(tabId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20';
  const lbl = 'block text-xs font-semibold text-dark-400 mb-1';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 pt-4 pb-2 border-b border-primary-50 shrink-0">
        <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-warm-50 text-dark-400">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-dark-500">{mode === 'edit' ? 'Edit Webhook' : 'Tambah Webhook'}</h2>
          <p className="text-xs text-dark-300">Konfigurasi endpoint dan event webhook</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSave} className="max-w-lg space-y-4">

          <div>
            <label className={lbl}>Nama Webhook</label>
            <input value={form.namawebhook} onChange={(e) => setForm({ ...form, namawebhook: e.target.value })} className={inp} required placeholder="Contoh: Notif ke Sistem Gudang" />
          </div>

          <div>
            <label className={lbl}>URL Endpoint</label>
            <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className={inp} required placeholder="https://example.com/webhook" />
          </div>

          <div>
            <label className={lbl}>Secret Key <span className="font-normal text-dark-300">opsional — untuk verifikasi signature</span></label>
            <input value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} className={inp} placeholder="Rahasia untuk HMAC signature" />
          </div>

          <div>
            <label className={lbl}>Events <span className="text-red-500">*</span></label>
            <div className="space-y-2 p-3 rounded-xl border border-primary-100 bg-white">
              {ALL_EVENTS.map((ev) => (
                <label key={ev.value} className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={form.events.includes(ev.value)} onChange={() => toggleEvent(ev.value)}
                    className="w-4 h-4 mt-0.5 accent-primary-500 rounded shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-dark-500">{ev.value}</p>
                    <p className="text-[10px] text-dark-300">{ev.label}</p>
                  </div>
                </label>
              ))}
            </div>
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
