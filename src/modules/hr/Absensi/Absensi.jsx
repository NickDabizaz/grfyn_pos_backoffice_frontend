import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../api/axios';
import { today } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, CheckCircle, RotateCcw, Ban, Pencil } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import useTabStore from '../../../store/tabStore';
import AbsensiForm from './AbsensiForm';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';
import { useConfirm } from '../../../components/ui/ConfirmDialog';

const BADGE = {
  DRAFT: 'bg-amber-50 text-amber-600',
  APPROVED: 'bg-emerald-50 text-emerald-600',
  CONFIRMED: 'bg-blue-50 text-blue-600',
  CANCELLED: 'bg-red-50 text-red-600',
};

export default function Absensi() {
  const openOrFocusTab = useTabStore(s => s.openOrFocusTab);
  const confirm = useConfirm();
  const lastRowClickRef = useRef({ id: null, at: 0 });
  const { access } = useMenuAccess('sdm.absensi');
  const canTambah = canAccess(access, 'tambah');
  const canUbah = canAccess(access, 'ubah');
  const canApprove = canAccess(access, 'approve');
  const canBatalApprove = canAccess(access, 'batalapprove');
  const canBatal = canAccess(access, 'bataltransaksi');

  const [list, setList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [tglAwal, setTglAwal] = useState(today());
  const [tglAkhir, setTglAkhir] = useState(today());

  const loadData = useCallback(() => {
    const params = { tglwal: tglAwal, tglakhir: tglAkhir };
    if (search) params.search = search;
    api.get('/absensi', { params }).then(r => setList(r.data || [])).catch(() => {});
  }, [search, tglAwal, tglAkhir]);

  useEffect(() => { loadData(); }, [loadData]);
  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(list, 20);
  useEffect(() => { resetPage(); }, [search, tglAwal, tglAkhir]);

  const selectedRow = list.find(a => a.idabsen === selectedId);
  const handleRefresh = () => { setRefreshing(true); loadData(); setTimeout(() => setRefreshing(false), 300); };
  const openForm = (row = null) => openOrFocusTab({ label: row ? `Absensi ${row.kodeabsen}` : 'Absensi Baru', icon: row ? Pencil : Plus, component: AbsensiForm, props: { absensiId: row?.idabsen, onSuccess: loadData }, type: row ? 'form_edit' : 'form_add', kodemenu: row ? `absensi-${row.idabsen}` : 'absensi-add' });

  const handleRowClick = (row) => {
    const now = Date.now();
    const last = lastRowClickRef.current;
    if (last.id === row.idabsen && now - last.at < 400) {
      lastRowClickRef.current = { id: null, at: 0 };
      openForm(row);
      return;
    }
    lastRowClickRef.current = { id: row.idabsen, at: now };
    setSelectedId(row.idabsen === selectedId ? null : row.idabsen);
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
          <h2 className="text-xl font-bold text-dark-500">Absensi</h2>
          <p className="text-sm text-dark-300">Transaksi absensi harian per lokasi</p>
        </div>
        <div className="flex items-center gap-2">
          {canTambah && <button onClick={() => openForm()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold"><Plus className="w-4 h-4" /> Absensi Baru</button>}
          {selectedRow?.status === 'DRAFT' && canUbah && <button onClick={() => openForm(selectedRow)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-sm font-semibold hover:bg-blue-100"><Pencil className="w-4 h-4" /> Edit</button>}
          {selectedRow?.status === 'DRAFT' && canApprove && <button onClick={() => action(`Approve ${selectedRow.kodeabsen}?`, () => api.put(`/absensi/${selectedRow.idabsen}/approve`), 'Absensi diapprove')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm font-semibold hover:bg-emerald-100"><CheckCircle className="w-4 h-4" /> Approve</button>}
          {selectedRow?.status === 'APPROVED' && canBatalApprove && <button onClick={() => action(`Batal approve ${selectedRow.kodeabsen}?`, () => api.put(`/absensi/${selectedRow.idabsen}/unapprove`), 'Approve dibatalkan')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 text-sm font-semibold hover:bg-amber-100"><RotateCcw className="w-4 h-4" /> Batal Approve</button>}
          {selectedRow && ['DRAFT', 'APPROVED'].includes(selectedRow.status) && canBatal && <button onClick={() => action(`Batalkan transaksi ${selectedRow.kodeabsen}?`, () => api.put(`/absensi/${selectedRow.idabsen}/cancel`), 'Absensi dibatalkan')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-100"><Ban className="w-4 h-4" /> Batal Transaksi</button>}
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50"><RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      <div className="px-6 pb-3 shrink-0">
        <div className="bg-white rounded-2xl border border-primary-50 p-3 grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Cari</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Kode / lokasi..." className="w-full pl-8 pr-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
          </div>
          <div></div>
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Tanggal</label>
            <div className="flex items-center gap-1.5">
              <Flatpickr value={tglAwal} onChange={([d]) => setTglAwal(d.toISOString().slice(0, 10))} options={{ dateFormat: 'Y-m-d', locale: 'id' }} className="flatpickr-input flex-1 text-xs" />
              <span className="text-[10px] text-dark-300 shrink-0">s/d</span>
              <Flatpickr value={tglAkhir} onChange={([d]) => setTglAkhir(d.toISOString().slice(0, 10))} options={{ dateFormat: 'Y-m-d', locale: 'id' }} className="flatpickr-input flex-1 text-xs" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary-50 bg-warm-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Lokasi</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Karyawan</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-dark-300">Tidak ada data absensi</td></tr>}
              {paginatedItems.map(a => (
                <tr key={a.idabsen} onClick={() => handleRowClick(a)} onDoubleClick={() => openForm(a)} className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${selectedId === a.idabsen ? 'bg-primary-50 ring-1 ring-inset ring-primary-200' : 'hover:bg-warm-50/30'}`}>
                  <td className="px-4 py-3 text-xs font-mono text-dark-400">{a.kodeabsen}</td>
                  <td className="px-4 py-3 text-dark-400 text-xs">{String(a.tgltrans || '').slice(0, 10)}</td>
                  <td className="px-4 py-3 text-dark-500 font-medium">{a.namalokasi || '-'}</td>
                  <td className="px-4 py-3 text-right text-dark-500 text-xs">{a.total_karyawan || 0}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${BADGE[a.status] || 'bg-gray-50 text-gray-500'}`}>{a.status}</span></td>
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
