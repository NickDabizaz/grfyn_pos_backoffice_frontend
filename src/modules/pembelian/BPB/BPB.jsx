import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../api/axios';
import { useAuthStore } from '../../../store/authStore';
import { formatRupiah, today } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, CheckCircle, XCircle, Printer } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import useTabStore from '../../../store/tabStore';
import BPBForm from './BPBForm';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';
import { BrowseSupplierModal } from '../../../lib/formHelpers';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { printFakturA4 } from '../../../lib/fakturPrint';
import { canAccess, useMenuAccess } from '../../../hooks/useMenuAccess';

function toDateInputValue(value) {
  if (!value) return today();
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return today();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const STATUS_BADGE = {
  DRAFT:     'bg-amber-50 text-amber-600 border-amber-100',
  APPROVED:  'bg-emerald-50 text-emerald-600 border-emerald-100',
  CONFIRMED: 'bg-blue-50 text-blue-600 border-blue-100',
  CANCELLED: 'bg-red-50 text-red-500 border-red-100',
};

export default function BPB() {
  const user = useAuthStore(s => s.user);
  const openOrFocusTab = useTabStore(s => s.openOrFocusTab);
  const requestRefresh = useTabStore(s => s.requestRefresh);
  const refreshToken = useTabStore(s => s.refreshTokens?.['pembelian.bpb']);
  const confirm = useConfirm();
  const lastRowClickRef = useRef({ id: null, at: 0 });
  const { access } = useMenuAccess('pembelian.bpb');

  const [list, setList]             = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterKode, setFilterKode] = useState('');
  const [filterSupplier, setFilterSupplier] = useState(null);
  const [tglAwal, setTglAwal]   = useState(today());
  const [tglAkhir, setTglAkhir] = useState(today());
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  const loadData = useCallback(() => {
    const params = { tglwal: tglAwal, tglakhir: tglAkhir };
    if (filterKode) params.search = filterKode;
    if (filterSupplier) params.idsupplier = filterSupplier.idsupplier;
    api.get('/bpb', { params }).then(r => setList(r.data)).catch(() => {});
  }, [filterKode, filterSupplier, tglAwal, tglAkhir]);

  useEffect(() => { loadData(); }, [loadData, refreshToken]);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(list, 20);
  useEffect(() => { resetPage(); }, [filterKode, filterSupplier, tglAwal, tglAkhir]);

  const handleRefresh = () => { setRefreshing(true); loadData(); setTimeout(() => setRefreshing(false), 300); };

  const handleTambah = () => {
    if (!canAccess(access, 'tambah')) return toast.error('Tidak memiliki akses tambah');
    openOrFocusTab({ label: 'BPB Baru', icon: Plus, component: BPBForm, props: { onSuccess: loadData }, type: 'form_add', kodemenu: 'bpb-add' });
  };

  const handleEdit = async (g) => {
    if (!canAccess(access, 'ubah')) return toast.error('Tidak memiliki akses ubah');
    try {
      const { data } = await api.get(`/bpb/${g.idbpb}`);
      openOrFocusTab({
        label: `Edit ${data.kodebpb}`,
        icon: Plus,
        component: BPBForm,
        props: { onSuccess: loadData, editData: data },
        type: 'form_edit',
        kodemenu: `bpb-edit-${data.idbpb}`,
      });
    } catch {
      toast.error('Gagal memuat data BPB');
    }
  };

  const handleRowClick = (g) => {
    const now = Date.now();
    const last = lastRowClickRef.current;
    if (last.id === g.idbpb && now - last.at < 400) {
      lastRowClickRef.current = { id: null, at: 0 };
      handleEdit(g);
      return;
    }
    lastRowClickRef.current = { id: g.idbpb, at: now };
    setSelectedId(g.idbpb === selectedId ? null : g.idbpb);
  };

  const handleApprove = async () => {
    if (!canAccess(access, 'approve')) return toast.error('Tidak memiliki akses approve');
    const confirmed = await confirm({
      title: 'Approve BPB',
      message: 'Approve BPB ini?',
      confirmText: 'Approve',
      cancelText: 'Batal',
      variant: 'primary',
    });
    if (!confirmed) return;
    try {
      await api.put(`/bpb/${selectedRow.idbpb}/approve`);
      toast.success('BPB diapprove');
      loadData();
      requestRefresh('pembelian.po');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal approve');
    }
  };

  const handleUnapprove = async () => {
    if (!canAccess(access, 'batalapprove')) return toast.error('Tidak memiliki akses batal approve');
    const confirmed = await confirm({
      title: 'Batal Approve BPB',
      message: 'Kembalikan BPB ini ke DRAFT?',
      confirmText: 'Batal Approve',
      cancelText: 'Tutup',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await api.put(`/bpb/${selectedRow.idbpb}/unapprove`);
      toast.success('Approve BPB dibatalkan');
      loadData();
      requestRefresh('pembelian.po');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal batal approve');
    }
  };

  const handleBatal = async () => {
    if (!canAccess(access, 'bataltransaksi')) return toast.error('Tidak memiliki akses batal transaksi');
    const confirmed = await confirm({
      title: 'Batalkan BPB',
      message: 'Batalkan BPB DRAFT ini? Stok penerimaan dari BPB ini akan dikembalikan.',
      confirmText: 'Batalkan',
      cancelText: 'Tutup',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await api.put(`/bpb/${selectedRow.idbpb}/batal`);
      toast.success('BPB dibatalkan');
      setSelectedId(null);
      loadData();
      requestRefresh('pembelian.po');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan BPB');
    }
  };

  const handleCetak = async () => {
    if (!selectedId) return;
    if (!canAccess(access, 'cetak')) return toast.error('Tidak memiliki akses cetak');
    try {
      const { data } = await api.get(`/bpb/${selectedId}`);
      printFakturA4({
        title: 'FAKTUR BPB',
        codeLabel: 'Kode BPB',
        code: data.kodebpb,
        partnerLabel: 'Supplier',
        partner: data.namasupplier,
        data,
        user,
      });
    } catch {
      toast.error('Gagal memuat faktur BPB');
    }
  };

  const selectedRow = list.find(g => g.idbpb === selectedId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Bukti Penerimaan Barang (BPB)</h2>
          <p className="text-sm text-dark-300">Catat penerimaan barang dari supplier</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedRow && selectedRow.status !== 'CANCELLED' && canAccess(access, 'cetak') && (
            <button onClick={handleCetak}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-50 border border-primary-200 text-primary-600 text-sm font-semibold hover:bg-primary-100">
              <Printer className="w-4 h-4" /> Cetak
            </button>
          )}
          {selectedRow && selectedRow.status === 'DRAFT' && canAccess(access, 'approve') && (
            <button onClick={handleApprove}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm font-semibold hover:bg-emerald-100 transition-colors">
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
          )}
          {selectedRow && selectedRow.status === 'DRAFT' && canAccess(access, 'bataltransaksi') && (
            <button onClick={handleBatal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-100 transition-colors">
              <XCircle className="w-4 h-4" /> Batal Transaksi
            </button>
          )}
          {selectedRow && selectedRow.status === 'APPROVED' && canAccess(access, 'batalapprove') && (
            <button onClick={handleUnapprove}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 text-sm font-semibold hover:bg-amber-100 transition-colors">
              <XCircle className="w-4 h-4" /> Batal Approve
            </button>
          )}
          {canAccess(access, 'tambah') && <button onClick={handleTambah}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold">
            <Plus className="w-4 h-4" /> BPB Baru
          </button>}
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-6 pb-3 shrink-0">
        <div className="bg-white rounded-2xl border border-primary-50 p-3 grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Kode BPB</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
              <input type="text" value={filterKode} onChange={e => setFilterKode(e.target.value.toUpperCase())} placeholder="Cari kode..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Supplier</label>
            <div className="flex gap-1.5">
              <div className="flex-1 flex items-center px-2.5 py-2 rounded-lg border border-primary-100 bg-warm-50/40 text-xs min-h-[34px] overflow-hidden">
                {filterSupplier ? <span className="text-dark-500 truncate">{filterSupplier.namasupplier}</span> : <span className="text-dark-300">Semua supplier</span>}
              </div>
              <button onClick={() => setShowSupplierModal(true)} className="px-2.5 py-1.5 rounded-lg border border-primary-100 text-[10px] font-semibold text-dark-400 hover:bg-warm-50 shrink-0">Browse</button>
              {filterSupplier && <button onClick={() => setFilterSupplier(null)} className="px-2 py-1.5 rounded-lg border border-red-100 text-[10px] text-red-400 hover:bg-red-50 shrink-0">✕</button>}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Tanggal</label>
            <div className="flex items-center gap-1.5">
              <Flatpickr value={tglAwal} onChange={([d]) => setTglAwal(toDateInputValue(d))} options={{ dateFormat: 'Y-m-d', locale: 'id' }} className="flatpickr-input flex-1 text-xs" placeholder="Dari" />
              <span className="text-[10px] text-dark-300 shrink-0">s/d</span>
              <Flatpickr value={tglAkhir} onChange={([d]) => setTglAkhir(toDateInputValue(d))} options={{ dateFormat: 'Y-m-d', locale: 'id' }} className="flatpickr-input flex-1 text-xs" placeholder="Sampai" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <div className="overflow-y-auto scrollbar-thin">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-primary-50 bg-warm-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode BPB</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode PO</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Supplier</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-dark-300">Tidak ada data BPB</td></tr>
                )}
                {paginatedItems.map((g) => (
                  <tr key={g.idbpb}
                    onClick={() => handleRowClick(g)}
                    onDoubleClick={() => handleEdit(g)}
                    className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${selectedId === g.idbpb ? 'bg-primary-50 ring-1 ring-inset ring-primary-200' : 'hover:bg-warm-50/30'}`}>
                    <td className="px-4 py-3 text-xs font-mono font-semibold text-dark-400">{g.kodebpb}</td>
                    <td className="px-4 py-3 text-xs font-mono text-dark-300">{g.kodepurchaseorder || '-'}</td>
                    <td className="px-4 py-3 text-dark-400 text-xs">{String(g.tgltrans || '').slice(0, 10)}</td>
                    <td className="px-4 py-3 text-dark-500">{g.namasupplier || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-accent-600">{formatRupiah(g.grandtotal)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGE[g.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>{g.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
      </div>

      {showSupplierModal && (
        <BrowseSupplierModal onSelect={s => { setFilterSupplier(s); setShowSupplierModal(false); }} onClose={() => setShowSupplierModal(false)} />
      )}
    </div>
  );
}
