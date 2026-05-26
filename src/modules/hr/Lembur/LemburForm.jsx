import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import useTabStore from '../../../store/tabStore';

const INIT = { idkaryawan: '', tgllembur: '', jam_mulai: '', jam_selesai: '', tarif_per_jam: '', keterangan: '' };

export default function LemburForm({ mode, id, data, onSuccess, tabId }) {
  const [form, setForm] = useState(INIT);
  const [loading, setLoading] = useState(false);
  const [karyawanList, setKaryawanList] = useState([]);
  const closeTab = useTabStore((s) => s.closeTab);

  useEffect(() => {
    api.get('/karyawan').then((r) => setKaryawanList(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === 'edit' && data) {
      setForm({
        idkaryawan: data.idkaryawan || '',
        tgllembur: data.tgllembur ? data.tgllembur.split('T')[0] : '',
        jam_mulai: data.jam_mulai || '',
        jam_selesai: data.jam_selesai || '',
        tarif_per_jam: data.tarif_per_jam ?? '',
        keterangan: data.keterangan || '',
      });
    } else {
      setForm({ ...INIT });
    }
  }, [mode, data]);

  const totalJam = () => {
    if (!form.jam_mulai || !form.jam_selesai) return null;
    const [h1, m1] = form.jam_mulai.split(':').map(Number);
    const [h2, m2] = form.jam_selesai.split(':').map(Number);
    const total = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (total <= 0) return null;
    return (total / 60).toFixed(1);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const jam = totalJam();
    if (!jam) { toast.error('Jam selesai harus lebih dari jam mulai'); return; }
    setLoading(true);
    try {
      const payload = {
        idkaryawan: Number(form.idkaryawan),
        tgllembur: form.tgllembur,
        jam_mulai: form.jam_mulai,
        jam_selesai: form.jam_selesai,
        tarif_per_jam: form.tarif_per_jam !== '' ? Number(form.tarif_per_jam) : null,
        keterangan: form.keterangan,
      };
      if (mode === 'edit') {
        await api.put(`/lembur/${id}`, payload);
        toast.success('Lembur diupdate');
      } else {
        await api.post('/lembur', payload);
        toast.success('Lembur ditambah');
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
  const jam = totalJam();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 pt-4 pb-2 border-b border-primary-50 shrink-0">
        <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-warm-50 text-dark-400">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-dark-500">{mode === 'edit' ? 'Edit Lembur' : 'Input Lembur'}</h2>
          <p className="text-xs text-dark-300">Catat lembur karyawan</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSave} className="max-w-lg space-y-4">

          <div>
            <label className={lbl}>Karyawan</label>
            <select value={form.idkaryawan} onChange={(e) => setForm({ ...form, idkaryawan: e.target.value })} className={inp} required>
              <option value="">-- Pilih Karyawan --</option>
              {karyawanList.map((k) => <option key={k.idkaryawan} value={k.idkaryawan}>{k.namakaryawan}</option>)}
            </select>
          </div>

          <div>
            <label className={lbl}>Tanggal Lembur</label>
            <input type="date" value={form.tgllembur} onChange={(e) => setForm({ ...form, tgllembur: e.target.value })} className={inp} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Jam Mulai</label>
              <input type="time" value={form.jam_mulai} onChange={(e) => setForm({ ...form, jam_mulai: e.target.value })} className={inp} required />
            </div>
            <div>
              <label className={lbl}>Jam Selesai</label>
              <input type="time" value={form.jam_selesai} onChange={(e) => setForm({ ...form, jam_selesai: e.target.value })} className={inp} required />
            </div>
          </div>

          {jam && (
            <div className="px-3 py-2 rounded-xl bg-warm-50 border border-primary-50">
              <span className="text-xs text-dark-400">Total lembur: <strong className="text-dark-600">{jam} jam</strong></span>
            </div>
          )}

          <div>
            <label className={lbl}>Tarif Per Jam (Rp) <span className="font-normal text-dark-300">opsional – otomatis dari gaji pokok</span></label>
            <input type="number" min="0" value={form.tarif_per_jam} onChange={(e) => setForm({ ...form, tarif_per_jam: e.target.value })} className={inp} placeholder="Kosongkan untuk hitung otomatis" />
          </div>

          <div>
            <label className={lbl}>Keterangan <span className="font-normal text-dark-300">opsional</span></label>
            <input value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} className={inp} />
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
