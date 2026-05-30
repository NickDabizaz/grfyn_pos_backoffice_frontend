import { useEffect, useState } from 'react';
import api from '../../../api/axios';
import { formatRupiah } from '../../../lib/utils';
import { ArrowLeft, Loader2, Save, Printer, FileBarChart } from 'lucide-react';
import toast from 'react-hot-toast';
import useTabStore from '../../../store/tabStore';
import { useAuthStore } from '../../../store/authStore';
import LaporanResultPage from '../../laporan/LaporanResultPage';

const BADGE = {
  DRAFT: 'bg-amber-50 text-amber-600 border-amber-100',
  APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  CONFIRMED: 'bg-blue-50 text-blue-600 border-blue-100',
  CANCELLED: 'bg-red-50 text-red-600 border-red-100',
};

export default function PayrollDetail({ payrollId, onSuccess, tabId }) {
  const closeTab = useTabStore(s => s.closeTab);
  const openTab = useTabStore(s => s.openTab);
  const token = useAuthStore(s => s.token);
  const [data, setData] = useState(null);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/payroll/${payrollId}`)
      .then(r => {
        setData(r.data);
        setDetails(r.data.details || []);
      })
      .catch(err => toast.error(err.response?.data?.message || 'Gagal memuat gaji'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (payrollId) load(); }, [payrollId]);

  const updateDetail = (id, patch) => setDetails(prev => prev.map(d => {
    if (d.idgajidtl !== id) return d;
    const next = { ...d, ...patch };
    const bonus = Number(next.bonus || 0);
    next.total = Number(next.gaji || 0) + bonus;
    return next;
  }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/payroll/${payrollId}`, { details });
      toast.success('Detail gaji disimpan');
      onSuccess?.();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan detail');
    } finally {
      setSaving(false);
    }
  };

  const printSlip = () => {
    openTab({
      label: `Slip ${data.kodegaji}`,
      component: LaporanResultPage,
      props: { url: `/api/laporan/slip-gaji/${payrollId}?format=html`, token, label: `Slip Gaji ${data.kodegaji}` },
      type: 'report',
      kodemenu: null,
      icon: FileBarChart,
    });
  };

  if (loading) return <div className="p-8 text-sm text-dark-300">Memuat...</div>;
  if (!data) return <div className="p-8 text-sm text-dark-300">Data tidak ditemukan</div>;

  const readOnly = data.status !== 'DRAFT';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-primary-100 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h2 className="text-lg font-bold text-dark-500">Detail Gaji {data.kodegaji}</h2>
            <p className="text-xs text-dark-300">{data.periodbulan} - {data.namalokasi}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={printSlip} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50"><Printer className="w-4 h-4" /> Slip Gaji</button>
          {!readOnly && <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan</button>}
        </div>
      </div>

      <div className="p-6 space-y-4 overflow-auto">
        <div className="bg-white rounded-2xl border border-primary-50 p-4 grid grid-cols-5 gap-4">
          <div><p className="text-[10px] font-semibold text-dark-300">Status</p><span className={`inline-flex mt-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${BADGE[data.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>{data.status}</span></div>
          <div><p className="text-[10px] font-semibold text-dark-300">Total Gaji</p><p className="text-sm font-bold text-dark-500">{formatRupiah(data.totalgaji)}</p></div>
          <div><p className="text-[10px] font-semibold text-dark-300">Bonus</p><p className="text-sm font-bold text-dark-500">{formatRupiah(data.totalbonus)}</p></div>
          <div><p className="text-[10px] font-semibold text-dark-300">Cash</p><p className="text-sm font-bold text-dark-500">{formatRupiah(data.totalcash)}</p></div>
          <div><p className="text-[10px] font-semibold text-dark-300">Bank</p><p className="text-sm font-bold text-dark-500">{formatRupiah(data.totalbank)}</p></div>
        </div>

        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary-50 bg-warm-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Karyawan</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Absen</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Potong</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Gaji</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Bonus</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Total</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Cash</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Bank</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {details.map(d => (
                <tr key={d.idgajidtl} className="border-b border-primary-50/50 text-xs">
                  <td className="px-4 py-3 text-dark-500 font-medium">{d.kodekaryawan} - {d.namakaryawan}</td>
                  <td className="px-4 py-3 text-right text-dark-400">{d.totalabsen}</td>
                  <td className="px-4 py-3 text-right text-dark-400">{d.totalpotongabsen}</td>
                  <td className="px-4 py-3 text-right text-dark-500">{formatRupiah(d.gaji)}</td>
                  <td className="px-4 py-3 text-right"><input type="number" disabled={readOnly} value={d.bonus || 0} onChange={e => updateDetail(d.idgajidtl, { bonus: Number(e.target.value || 0) })} className="w-24 text-right px-2 py-1.5 rounded-lg border border-primary-100 disabled:bg-gray-50" /></td>
                  <td className="px-4 py-3 text-right font-semibold text-accent-600">{formatRupiah(d.total)}</td>
                  <td className="px-4 py-3 text-right"><input type="number" disabled={readOnly} value={d.bayarcash || 0} onChange={e => updateDetail(d.idgajidtl, { bayarcash: Number(e.target.value || 0) })} className="w-24 text-right px-2 py-1.5 rounded-lg border border-primary-100 disabled:bg-gray-50" /></td>
                  <td className="px-4 py-3 text-right"><input type="number" disabled={readOnly} value={d.bayarbank || 0} onChange={e => updateDetail(d.idgajidtl, { bayarbank: Number(e.target.value || 0) })} className="w-24 text-right px-2 py-1.5 rounded-lg border border-primary-100 disabled:bg-gray-50" /></td>
                  <td className="px-4 py-3"><input disabled={readOnly} value={d.catatan || ''} onChange={e => updateDetail(d.idgajidtl, { catatan: e.target.value })} className="w-full px-2 py-1.5 rounded-lg border border-primary-100 disabled:bg-gray-50" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
