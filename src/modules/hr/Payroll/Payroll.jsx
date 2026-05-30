import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../api/axios';
import { formatRupiah } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, CheckCircle, Ban, RotateCcw, Eye } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import useTabStore from '../../../store/tabStore';
import PayrollForm from './PayrollForm';
import PayrollDetail from './PayrollDetail';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';
import { useConfirm } from '../../../components/ui/ConfirmDialog';

const BULAN_OPTIONS = [
  { value: '', label: 'Semua Bulan' },
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

const BADGE = {
  DRAFT: 'bg-amber-50 text-amber-600 border-amber-100',
  APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  CONFIRMED: 'bg-blue-50 text-blue-600 border-blue-100',
  CANCELLED: 'bg-red-50 text-red-600 border-red-100',
};

export default function Payroll() {
  const openOrFocusTab = useTabStore(s => s.openOrFocusTab);
  const confirm = useConfirm();
  const lastRowClickRef = useRef({ id: null, at: 0 });
  const { access } = useMenuAccess('sdm.gaji');
  const canTambah = canAccess(access, 'tambah');
  const canApprove = canAccess(access, 'approve');
  const canBatalApprove = canAccess(access, 'batalapprove');
  const canBatal = canAccess(access, 'bataltransaksi');

  const [list, setList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [bulan, setBulan] = useState('');
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [status, setStatus] = useState('');

  const loadData = useCallback(() => {
    const params = {};
    if (bulan && tahun) params.periodbulan = `${tahun}-${bulan}`;
    if (status) params.status = status;
    api.get('/payroll', { params }).then(r => setList(r.data || [])).catch(() => {});
  }, [bulan, tahun, status]);

  useEffect(() => { loadData(); }, [loadData]);
  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(list, 20);
  useEffect(() => { resetPage(); }, [bulan, tahun, status]);

  const selectedRow = list.find(p => p.idgaji === selectedId);
  const handleRefresh = () => { setRefreshing(true); loadData(); setTimeout(() => setRefreshing(false), 300); };
  const handleTambah = () => openOrFocusTab({ label: 'Generate Gaji', icon: Plus, component: PayrollForm, props: { onSuccess: loadData }, type: 'form_add', kodemenu: 'gaji-generate' });
  const handleDetail = (p) => openOrFocusTab({ label: `Gaji ${p.kodegaji}`, icon: Eye, component: PayrollDetail, props: { payrollId: p.idgaji, onSuccess: loadData }, type: 'detail', kodemenu: `gaji-detail-${p.idgaji}` });

  const handleRowClick = (p) => {
    const now = Date.now();
    const last = lastRowClickRef.current;
    if (last.id === p.idgaji && now - last.at < 400) {
      lastRowClickRef.current = { id: null, at: 0 };
      handleDetail(p);
      return;
    }
    lastRowClickRef.current = { id: p.idgaji, at: now };
    setSelectedId(p.idgaji === selectedId ? null : p.idgaji);
  };

  const action = async (message, fn, success) => {
    if (!selectedRow) return;
    const ok = await confirm({ message });
    if (!ok) return;
    try {
      await fn();
      toast.success(success);
      setSelectedId(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Proses gagal');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Gaji</h2>
          <p className="text-sm text-dark-300">Generate, koreksi bonus, approve, dan cetak slip gaji</p>
        </div>
        <div className="flex items-center gap-2">
          {canTambah && <button onClick={handleTambah} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold"><Plus className="w-4 h-4" /> Generate Gaji</button>}
          {selectedRow && <button onClick={() => handleDetail(selectedRow)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50"><Eye className="w-4 h-4" /> Detail</button>}
          {selectedRow?.status === 'DRAFT' && canApprove && <button onClick={() => action(`Approve ${selectedRow.kodegaji}?`, () => api.put(`/payroll/${selectedRow.idgaji}/approve`), 'Gaji diapprove')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm font-semibold hover:bg-emerald-100"><CheckCircle className="w-4 h-4" /> Approve</button>}
          {selectedRow?.status === 'APPROVED' && canBatalApprove && <button onClick={() => action(`Batal approve ${selectedRow.kodegaji}?`, () => api.put(`/payroll/${selectedRow.idgaji}/unapprove`), 'Approve gaji dibatalkan')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 text-sm font-semibold hover:bg-amber-100"><RotateCcw className="w-4 h-4" /> Batal Approve</button>}
          {selectedRow && ['DRAFT', 'APPROVED'].includes(selectedRow.status) && canBatal && <button onClick={() => action(`Batalkan transaksi ${selectedRow.kodegaji}?`, () => api.put(`/payroll/${selectedRow.idgaji}/cancel`), 'Gaji dibatalkan')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-100"><Ban className="w-4 h-4" /> Batal Transaksi</button>}
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50"><RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      <div className="px-6 pb-3 shrink-0">
        <div className="bg-white rounded-2xl border border-primary-50 p-3 grid grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Bulan</label>
            <select value={bulan} onChange={e => setBulan(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20">
              {BULAN_OPTIONS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Tahun</label>
            <input type="number" min="2000" max="2100" value={tahun} onChange={e => setTahun(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20">
              <option value="">Semua Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="APPROVED">APPROVED</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div></div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary-50 bg-warm-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Periode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Lokasi</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Karyawan</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Gaji</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Bonus</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Total</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Cash</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Bank</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 && <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-dark-300">Tidak ada data gaji</td></tr>}
              {paginatedItems.map(p => (
                <tr key={p.idgaji} onClick={() => handleRowClick(p)} onDoubleClick={() => handleDetail(p)} className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${selectedId === p.idgaji ? 'bg-primary-50 ring-1 ring-inset ring-primary-200' : 'hover:bg-warm-50/30'}`}>
                  <td className="px-4 py-3 text-xs font-mono text-dark-400">{p.kodegaji}</td>
                  <td className="px-4 py-3 text-dark-400 text-xs">{p.periodbulan}</td>
                  <td className="px-4 py-3 text-dark-500 font-medium">{p.namalokasi || '-'}</td>
                  <td className="px-4 py-3 text-right text-dark-500 text-xs">{p.total_karyawan || 0}</td>
                  <td className="px-4 py-3 text-right text-dark-500 text-xs">{formatRupiah(p.totalgaji)}</td>
                  <td className="px-4 py-3 text-right text-dark-500 text-xs">{formatRupiah(p.totalbonus)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-accent-600">{formatRupiah(p.total)}</td>
                  <td className="px-4 py-3 text-right text-dark-500 text-xs">{formatRupiah(p.totalcash)}</td>
                  <td className="px-4 py-3 text-right text-dark-500 text-xs">{formatRupiah(p.totalbank)}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${BADGE[p.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
      </div>
    </div>
  );
}
