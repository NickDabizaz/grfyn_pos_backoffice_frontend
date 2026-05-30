import { useEffect, useState } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import useTabStore from '../../../store/tabStore';

const BULAN_OPTIONS = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

export default function PayrollForm({ onSuccess, tabId }) {
  const closeTab = useTabStore(s => s.closeTab);
  const now = new Date();
  const [lokasiList, setLokasiList] = useState([]);
  const [bulan, setBulan] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [tahun, setTahun] = useState(String(now.getFullYear()));
  const [idlokasi, setIdlokasi] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/lokasi').then(r => {
      setLokasiList(r.data || []);
      if (r.data?.[0]) setIdlokasi(r.data[0].idlokasi);
    }).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!bulan) return toast.error('Pilih bulan gaji');
    if (!/^\d{4}$/.test(String(tahun))) return toast.error('Tahun wajib 4 digit');
    if (!idlokasi) return toast.error('Pilih lokasi');
    setLoading(true);
    try {
      const periodbulan = `${tahun}-${bulan}`;
      await api.post('/payroll/generate', { periodbulan, idlokasi: Number(idlokasi) });
      toast.success('Gaji berhasil digenerate');
      onSuccess?.();
      closeTab(tabId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal generate gaji');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500';
  const labelClass = 'block text-xs font-medium text-dark-300 mb-1';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 pt-4 pb-2 border-b border-primary-100 shrink-0">
        <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400"><ArrowLeft className="w-5 h-5" /></button>
        <div><h2 className="text-lg font-bold text-dark-500">Generate Gaji</h2><p className="text-xs text-dark-300">Mengambil absensi APPROVED pada periode terpilih</p></div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-md space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Bulan *</label>
              <select value={bulan} onChange={e => setBulan(e.target.value)} className={inputClass}>
                {BULAN_OPTIONS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Tahun *</label>
              <input
                type="number"
                min="2000"
                max="2100"
                value={tahun}
                onChange={e => setTahun(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Lokasi *</label>
            <select value={idlokasi} onChange={e => setIdlokasi(e.target.value)} className={inputClass}>
              <option value="">-- Pilih Lokasi --</option>
              {lokasiList.map(l => <option key={l.idlokasi} value={l.idlokasi}>{l.kodelokasi} - {l.namalokasi}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <button type="button" onClick={() => closeTab(tabId)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400">Batal</button>
            <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
