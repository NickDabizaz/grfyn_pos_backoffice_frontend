import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Search, RefreshCw, AlertTriangle, Layers } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import useTabStore from '../../../store/tabStore';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';
import BatchLotForm from './BatchLotForm';

const TAB = { LIST: 'list', EXPIRING: 'expiring' };

function formatTgl(tgl) {
  if (!tgl) return '-';
  return new Date(tgl).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ExpiringPane() {
  const [data, setData] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/batch-lot/expiring', { params: { days } });
      setData(Array.isArray(res) ? res : []);
    } catch { toast.error('Gagal memuat data expiring'); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-dark-400">Tampilkan batch kadaluarsa dalam</label>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20">
            {[7, 14, 30, 60, 90].map((d) => <option key={d} value={d}>{d} hari</option>)}
          </select>
          <span className="text-xs text-dark-400">ke depan</span>
        </div>
        <button onClick={load} disabled={loading} className="p-2 rounded-xl border border-primary-100 hover:bg-warm-50 text-dark-400">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary-50 bg-warm-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">No. Batch</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama Barang</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Qty Sisa</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tgl Kadaluarsa</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Sisa Hari</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && !loading && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-dark-300">
                {`Tidak ada batch kadaluarsa dalam ${days} hari`}
              </td></tr>
            )}
            {data.map((b) => (
              <tr key={b.idbatch} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                <td className="px-4 py-3 font-mono text-xs text-dark-400">{b.nomorbatch}</td>
                <td className="px-4 py-3 font-medium text-dark-500">{b.namabarang}</td>
                <td className="px-4 py-3 text-right text-dark-400">{Number(b.qty_sisa || 0).toLocaleString('id-ID')}</td>
                <td className="px-4 py-3 text-dark-400 text-xs">{formatTgl(b.tglkadaluarsa)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${b.days_to_expire <= 7 ? 'bg-red-100 text-red-700' : b.days_to_expire <= 14 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {b.days_to_expire} hari
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BatchLot() {
  const [activeTab, setActiveTab] = useState(TAB.LIST);
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [showExpired, setShowExpired] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const openTab = useTabStore((s) => s.openTab);
  const { access } = useMenuAccess('stok.batchlot');
  const canTambah = canAccess(access, 'tambah');
  const canUbah = canAccess(access, 'ubah');

  const load = useCallback(async () => {
    try {
      const params = {};
      if (showExpired) params.show_expired = true;
      const { data: res } = await api.get('/batch-lot', { params });
      setData(Array.isArray(res) ? res : []);
    } catch { toast.error('Gagal memuat data batch'); }
  }, [showExpired]);

  useEffect(() => { load(); }, [load]);

  const filtered = search ? data.filter((d) => d.nomorbatch?.toLowerCase().includes(search.toLowerCase()) || d.namabarang?.toLowerCase().includes(search.toLowerCase())) : data;
  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(filtered, 20);
  useEffect(() => { resetPage(); }, [search]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleTambah = () => {
    openTab({ label: 'Tambah Batch/Lot', icon: Plus, component: BatchLotForm, props: { mode: 'add', onSuccess: load }, type: 'form_add' });
  };

  const handleEdit = (d) => {
    openTab({ label: `Edit ${d.nomorbatch}`, icon: Pencil, component: BatchLotForm, props: { mode: 'edit', id: d.idbatch, data: d, onSuccess: load }, type: 'form_edit' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Batch / Lot Tracking</h2>
          <p className="text-sm text-dark-300">Kelola batch produk dan pantau tanggal kadaluarsa</p>
        </div>
        <div className="flex items-center gap-2">
          {canTambah && activeTab === TAB.LIST && (
            <button onClick={handleTambah} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold">
              <Plus className="w-4 h-4" /> Tambah Batch
            </button>
          )}
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-6 shrink-0">
        <div className="flex gap-1 border-b border-primary-50">
          {[
            { key: TAB.LIST, label: 'Daftar Batch', Icon: Layers },
            { key: TAB.EXPIRING, label: 'Hampir Kadaluarsa', Icon: AlertTriangle },
          ].map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${activeTab === key ? 'border-primary-500 text-primary-600' : 'border-transparent text-dark-400 hover:text-dark-500'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === TAB.LIST && (
        <>
          <div className="px-6 pt-3 pb-3 shrink-0">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari no. batch / nama barang..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border border-primary-100 hover:bg-warm-50">
                <input type="checkbox" checked={showExpired} onChange={(e) => setShowExpired(e.target.checked)} className="w-3.5 h-3.5 accent-primary-500" />
                <span className="text-xs font-medium text-dark-400">Tampilkan expired</span>
              </label>
            </div>
          </div>

          <div className="flex-1 overflow-auto px-6 pb-4">
            <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-primary-50 bg-warm-50/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">No. Batch</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama Barang</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tgl Produksi</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tgl Kadaluarsa</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Qty Sisa</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Satuan</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-dark-300">Belum ada data batch</td></tr>
                  )}
                  {paginatedItems.map((b) => {
                    const isExpired = b.tglkadaluarsa && new Date(b.tglkadaluarsa) < new Date();
                    return (
                      <tr key={b.idbatch} className={`border-b border-primary-50/50 text-sm ${isExpired ? 'bg-red-50/50' : 'hover:bg-warm-50/30'}`}>
                        <td className="px-4 py-3 font-mono text-xs text-dark-400">{b.nomorbatch}</td>
                        <td className="px-4 py-3 font-medium text-dark-500">{b.namabarang}</td>
                        <td className="px-4 py-3 text-dark-400 text-xs">{formatTgl(b.tglproduksi)}</td>
                        <td className="px-4 py-3 text-xs">
                          <span className={isExpired ? 'text-red-500 font-semibold' : 'text-dark-400'}>{formatTgl(b.tglkadaluarsa)}</span>
                          {isExpired && <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Expired</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-dark-500">{Number(b.qty_sisa || 0).toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3 text-dark-400 text-xs">{b.satuan || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          {canUbah && (
                            <button onClick={() => handleEdit(b)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-300 hover:text-primary-500">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pagination page={page} totalPages={totalPages} setPage={setPage} />
            </div>
          </div>
        </>
      )}

      {activeTab === TAB.EXPIRING && <ExpiringPane />}
    </div>
  );
}
