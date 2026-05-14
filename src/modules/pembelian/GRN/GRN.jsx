import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import { formatRupiah, today } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import useTabStore from '../../../store/tabStore';
import GRNForm from './GRNForm';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';
import { BrowseSupplierModal } from '../../../lib/formHelpers';

export default function GRN() {
  const openOrFocusTab = useTabStore(s => s.openOrFocusTab);

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
    api.get('/grn', { params }).then(r => setList(r.data)).catch(() => {});
  }, [filterKode, filterSupplier, tglAwal, tglAkhir]);

  useEffect(() => { loadData(); }, [loadData]);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(list, 20);
  useEffect(() => { resetPage(); }, [filterKode, filterSupplier, tglAwal, tglAkhir]);

  const handleRefresh = () => { setRefreshing(true); loadData(); setTimeout(() => setRefreshing(false), 300); };

  const handleTambah = () => {
    openOrFocusTab({ label: 'GRN Baru', icon: Plus, component: GRNForm, props: { onSuccess: loadData }, type: 'form_add', kodemenu: 'grn-add' });
  };

  const handleEdit = async (g) => {
    try {
      const { data } = await api.get(`/grn/${g.idgrn}`);
      openOrFocusTab({
        label: `Edit ${data.kodegrn}`,
        icon: Plus,
        component: GRNForm,
        props: { onSuccess: loadData, editData: data },
        type: 'form_edit',
        kodemenu: `grn-edit-${data.idgrn}`,
      });
    } catch {
      toast.error('Gagal memuat data GRN');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Good Receipt Note (GRN)</h2>
          <p className="text-sm text-dark-300">Catat penerimaan barang dari supplier</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleTambah}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold">
            <Plus className="w-4 h-4" /> GRN Baru
          </button>
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-6 pb-3 shrink-0">
        <div className="bg-white rounded-2xl border border-primary-50 p-3 grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Kode GRN</label>
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
              <Flatpickr value={tglAwal} onChange={([d]) => setTglAwal(d.toISOString().slice(0, 10))} options={{ dateFormat: 'Y-m-d', locale: 'id' }} className="flatpickr-input flex-1 text-xs" placeholder="Dari" />
              <span className="text-[10px] text-dark-300 shrink-0">s/d</span>
              <Flatpickr value={tglAkhir} onChange={([d]) => setTglAkhir(d.toISOString().slice(0, 10))} options={{ dateFormat: 'Y-m-d', locale: 'id' }} className="flatpickr-input flex-1 text-xs" placeholder="Sampai" />
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode GRN</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode Beli</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Supplier</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Total</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-dark-300">Tidak ada data GRN</td></tr>
                )}
                {paginatedItems.map((g) => (
                  <tr key={g.idgrn}
                    onClick={() => setSelectedId(g.idgrn === selectedId ? null : g.idgrn)}
                    onDoubleClick={() => handleEdit(g)}
                    className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${selectedId === g.idgrn ? 'bg-primary-50 ring-1 ring-inset ring-primary-200' : 'hover:bg-warm-50/30'}`}>
                    <td className="px-4 py-3 text-xs font-mono font-semibold text-dark-400">{g.kodegrn}</td>
                    <td className="px-4 py-3 text-xs font-mono text-dark-300">{g.kodebeli || '-'}</td>
                    <td className="px-4 py-3 text-dark-400 text-xs">{String(g.tgltrans || '').slice(0, 10)}</td>
                    <td className="px-4 py-3 text-dark-500">{g.namasupplier || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-accent-600">{formatRupiah(g.grandtotal)}</td>
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
