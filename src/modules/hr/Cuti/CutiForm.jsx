import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Star } from 'lucide-react';
import useTabStore from '../../../store/tabStore';

const INIT = { idkaryawan: '', jeniscuti: 'TAHUNAN', tglawal: '', tglakhir: '', keterangan: '' };

export default function CutiForm({ mode, id, data, onSuccess, tabId }) {
  const [form, setForm] = useState(INIT);
  const [loading, setLoading] = useState(false);
  const [karyawanList, setKaryawanList] = useState([]);
  const [saldo, setSaldo] = useState(null);
  const closeTab = useTabStore((s) => s.closeTab);

  useEffect(() => {
    api.get('/karyawan').then((r) => setKaryawanList(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === 'edit' && data) {
      setForm({
        idkaryawan: data.idkaryawan || '',
        jeniscuti: data.jeniscuti || 'TAHUNAN',
        tglawal: data.tglawal ? data.tglawal.split('T')[0] : '',
        tglakhir: data.tglakhir ? data.tglakhir.split('T')[0] : '',
        keterangan: data.keterangan || '',
      });
    } else {
      setForm({ ...INIT });
    }
  }, [mode, data]);

  useEffect(() => {
    if (!form.idkaryawan) { setSaldo(null); return; }
    api.get(`/cuti/saldo/${form.idkaryawan}`).then((r) => setSaldo(r.data)).catch(() => setSaldo(null));
  }, [form.idkaryawan]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.tglawal || !form.tglakhir) { toast.error('Tanggal harus diisi'); return; }
    if (form.tglakhir < form.tglawal) { toast.error('Tanggal akhir harus setelah tanggal awal'); return; }
    setLoading(true);
    try {
      if (mode === 'edit') {
        await api.put(`/cuti/${id}`, form);
        toast.success('Cuti diupdate');
      } else {
        await api.post('/cuti', { ...form, idkaryawan: Number(form.idkaryawan) });
        toast.success('Cuti diajukan');
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

  const lama = form.tglawal && form.tglakhir
    ? Math.max(0, Math.round((new Date(form.tglakhir) - new Date(form.tglawal)) / 86400000) + 1)
    : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 pt-4 pb-2 border-b border-primary-50 shrink-0">
        <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-warm-50 text-dark-400">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-dark-500">{mode === 'edit' ? 'Edit Pengajuan Cuti' : 'Ajukan Cuti'}</h2>
          <p className="text-xs text-dark-300">Form pengajuan cuti karyawan</p>
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

          {saldo && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 mb-2">Saldo Cuti Tersisa</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(saldo).map(([jenis, jumlah]) => (
                  <span key={jenis} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-blue-100 text-xs">
                    <Star className="w-3 h-3 text-blue-400" />
                    <span className="text-blue-700 font-semibold">{jenis}</span>
                    <span className="text-blue-500">{jumlah} hari</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={lbl}>Jenis Cuti</label>
            <select value={form.jeniscuti} onChange={(e) => setForm({ ...form, jeniscuti: e.target.value })} className={inp}>
              {['TAHUNAN','SAKIT','IZIN','MELAHIRKAN','LAINNYA'].map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Tanggal Mulai</label>
              <input type="date" value={form.tglawal} onChange={(e) => setForm({ ...form, tglawal: e.target.value })} className={inp} required />
            </div>
            <div>
              <label className={lbl}>Tanggal Akhir</label>
              <input type="date" value={form.tglakhir} onChange={(e) => setForm({ ...form, tglakhir: e.target.value })} className={inp} required />
            </div>
          </div>

          {lama > 0 && (
            <div className="px-3 py-2 rounded-xl bg-warm-50 border border-primary-50">
              <span className="text-xs text-dark-400">Lama cuti: <strong className="text-dark-600">{lama} hari</strong></span>
            </div>
          )}

          <div>
            <label className={lbl}>Keterangan <span className="font-normal text-dark-300">opsional</span></label>
            <textarea value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} rows={3} className={inp} />
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
