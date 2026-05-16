import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../api/axios';
import { formatRupiah, today } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import useTabStore from '../../../store/tabStore';
import SalesOrderForm from './SalesOrderForm';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';
import { BrowseCustomerModal } from '../../../lib/formHelpers';
import { useConfirm } from '../../../components/ui/ConfirmDialog';

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
  CANCELLED: 'bg-red-50 text-red-400 border-red-100',
};

export default function SalesOrder() {
  const openOrFocusTab = useTabStore(s => s.openOrFocusTab);
  const refreshToken = useTabStore(s => s.refreshTokens?.['penjualan.so']);
  const confirm = useConfirm();
  const lastRowClickRef = useRef({ id: null, at: 0 });

  const [list, setList]             = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterKode, setFilterKode] = useState('');
  const [filterCustomer, setFilterCustomer] = useState(null);
  const [filterStatus, setFilterStatus]     = useState('');
  const [tglAwal, setTglAwal]   = useState(today());
  const [tglAkhir, setTglAkhir] = useState(today());
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const loadData = useCallback(() => {
    const params = { tglwal: tglAwal, tglakhir: tglAkhir };
    if (filterKode) params.search = filterKode;
    if (filterCustomer) params.idcustomer = filterCustomer.idcustomer;
    if (filterStatus) params.status = filterStatus;
    api.get('/sales-order', { params }).then(r => setList(r.data)).catch(() => {});
  }, [filterKode, filterCustomer, filterStatus, tglAwal, tglAkhir]);

  useEffect(() => { loadData(); }, [loadData, refreshToken]);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(list, 20);
  useEffect(() => { resetPage(); }, [filterKode, filterCustomer, filterStatus, tglAwal, tglAkhir]);

  const handleRefresh = () => { setRefreshing(true); loadData(); setTimeout(() => setRefreshing(false), 300); };

  const handleTambah = () => {
    openOrFocusTab({ label: 'SO Baru', icon: Plus, component: SalesOrderForm, props: { onSuccess: loadData }, type: 'form_add', kodemenu: 'so-add' });
  };

  const handleEdit = async (so) => {
    try {
      const { data } = await api.get(`/sales-order/${so.idso}`);
      openOrFocusTab({
        label: `Edit ${data.kodeso}`,
        icon: Plus,
        component: SalesOrderForm,
        props: { onSuccess: loadData, editData: data },
        type: 'form_edit',
        kodemenu: `so-edit-${data.idso}`,
      });
    } catch {
      toast.error('Gagal memuat data SO');
    }
  };

  const handleRowClick = (so) => {
    const now = Date.now();
    const last = lastRowClickRef.current;
    if (last.id === so.idso && now - last.at < 400) {
      lastRowClickRef.current = { id: null, at: 0 };
      handleEdit(so);
      return;
    }
    lastRowClickRef.current = { id: so.idso, at: now };
    setSelectedId(so.idso === selectedId ? null : so.idso);
  };

  const handleApprove = async (e, id) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Approve Sales Order',
      message: 'Approve Sales Order ini?',
      confirmText: 'Approve',
      cancelText: 'Batal',
      variant: 'primary',
    });
    if (!confirmed) return;
    try {
      await api.put(`/sales-order/${id}/approve`);
      toast.success('Sales Order diapprove');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal approve');
    }
  };

  const handleBatal = async (e, id) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Batalkan Sales Order',
      message: 'Batalkan Sales Order ini?',
      confirmText: 'Batalkan',
      cancelText: 'Batal',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await api.put(`/sales-order/${id}/batal`);
      toast.success('Sales Order dibatalkan');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan');
    }
  };

  const handleUnapprove = async (e, id) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Batal Approve Sales Order',
      message: 'Kembalikan Sales Order ini ke DRAFT?',
      confirmText: 'Batal Approve',
      cancelText: 'Tutup',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await api.put(`/sales-order/${id}/unapprove`);
      toast.success('Approve Sales Order dibatalkan');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal batal approve');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Sales Order (SO)</h2>
          <p className="text-sm text-dark-300">Kelola sales order ke customer</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleTambah}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold">
            <Plus className="w-4 h-4" /> SO Baru
          </button>
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-6 pb-3 shrink-0">
        <div className="bg-white rounded-2xl border border-primary-50 p-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Kode SO</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
              <input type="text" value={filterKode} onChange={e => setFilterKode(e.target.value.toUpperCase())} placeholder="Cari kode..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Customer</label>
            <div className="flex gap-1.5">
              <div className="flex-1 flex items-center px-2.5 py-2 rounded-lg border border-primary-100 bg-warm-50/40 text-xs min-h-[34px] overflow-hidden">
                {filterCustomer ? <span className="text-dark-500 truncate">{filterCustomer.namacustomer}</span> : <span className="text-dark-300">Semua customer</span>}
              </div>
              <button onClick={() => setShowCustomerModal(true)} className="px-2.5 py-1.5 rounded-lg border border-primary-100 text-[10px] font-semibold text-dark-400 hover:bg-warm-50 shrink-0">Browse</button>
              {filterCustomer && <button onClick={() => setFilterCustomer(null)} className="px-2 py-1.5 rounded-lg border border-red-100 text-[10px] text-red-400 hover:bg-red-50 shrink-0">✕</button>}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20">
              <option value="">Semua Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="APPROVED">APPROVED</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode SO</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Customer</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-32">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-dark-300">Tidak ada data sales order</td></tr>
                )}
                {paginatedItems.map((so) => (
                  <tr key={so.idso}
                    onClick={() => handleRowClick(so)}
                    onDoubleClick={() => handleEdit(so)}
                    className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${selectedId === so.idso ? 'bg-primary-50 ring-1 ring-inset ring-primary-200' : 'hover:bg-warm-50/30'}`}>
                    <td className="px-4 py-3 text-xs font-mono font-semibold text-dark-400">{so.kodeso}</td>
                    <td className="px-4 py-3 text-dark-400 text-xs">{String(so.tgltrans || '').slice(0, 10)}</td>
                    <td className="px-4 py-3 text-dark-500">{so.namacustomer || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-accent-600">{formatRupiah(so.grandtotal)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGE[so.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>{so.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {so.status === 'DRAFT' && (
                          <>
                            <button onClick={(e) => handleApprove(e, so.idso)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                              <CheckCircle className="w-3 h-3" /> Approve
                            </button>
                            <button onClick={(e) => handleBatal(e, so.idso)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-red-50 text-red-500 hover:bg-red-100">
                              <XCircle className="w-3 h-3" /> Batal
                            </button>
                          </>
                        )}
                        {so.status === 'APPROVED' && (
                          <button onClick={(e) => handleUnapprove(e, so.idso)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100">
                            <XCircle className="w-3 h-3" /> Batal Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
      </div>

      {showCustomerModal && (
        <BrowseCustomerModal onSelect={c => { setFilterCustomer(c); setShowCustomerModal(false); }} onClose={() => setShowCustomerModal(false)} />
      )}
    </div>
  );
}
