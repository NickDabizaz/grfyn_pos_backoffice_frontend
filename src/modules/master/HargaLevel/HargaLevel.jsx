import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, RefreshCw, Layers } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import useTabStore from '../../../store/tabStore';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';
import HargaLevelForm from './HargaLevelForm';

export default function HargaLevel() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const openTab = useTabStore((s) => s.openTab);
  const confirm = useConfirm();
  const { access } = useMenuAccess('master.hargalevel');
  const canTambah = canAccess(access, 'tambah');
  const canUbah = canAccess(access, 'ubah');

  const load = useCallback(async () => {
    try {
      const { data: res } = await api.get('/harga-level');
      setData(Array.isArray(res) ? res : []);
    } catch {
      toast.error('Gagal memuat data level harga');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = search ? data.filter((d) => d.namalevel?.toLowerCase().includes(search.toLowerCase())) : data;
  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(filtered, 20);
  useEffect(() => { resetPage(); }, [search]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleTambah = () => {
    openTab({ label: 'Tambah Level Harga', icon: Plus, component: HargaLevelForm, props: { mode: 'add', onSuccess: load }, type: 'form_add' });
  };

  const handleEdit = (d) => {
    openTab({ label: `Edit ${d.namalevel}`, icon: Pencil, component: HargaLevelForm, props: { mode: 'edit', id: d.idhargajuallevel, data: d, onSuccess: load }, type: 'form_edit' });
  };

  const handleDelete = async (id) => {
    const ok = await confirm({ message: 'Hapus level harga ini?' });
    if (!ok) return;
    try {
      await api.delete(`/harga-level/${id}`);
      toast.success('Level harga dihapus');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal hapus');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Multi-Level Harga Jual</h2>
          <p className="text-sm text-dark-300">Atur harga jual berbeda untuk tiap segmen customer</p>
        </div>
        <div className="flex items-center gap-2">
          {canTambah && (
            <button onClick={handleTambah} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold">
              <Plus className="w-4 h-4" /> Tambah Level
            </button>
          )}
          {selectedId && canTambah && (
            <button onClick={() => handleDelete(selectedId)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all active:scale-[0.98]">
              <Trash2 className="w-4 h-4" /> Hapus
            </button>
          )}
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-6 pb-3 shrink-0">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama level..."
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-primary-50 bg-warm-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Urutan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama Level</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Deskripsi</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Jml Barang</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-dark-300">Belum ada level harga</td></tr>
              )}
              {paginatedItems.map((d) => (
                <tr key={d.idhargajuallevel}
                  onClick={() => setSelectedId(prev => prev === d.idhargajuallevel ? null : d.idhargajuallevel)}
                  onDoubleClick={() => canUbah && handleEdit(d)}
                  className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${
                    selectedId === d.idhargajuallevel ? 'bg-primary-50 ring-1 ring-inset ring-primary-200' : 'hover:bg-warm-50/30'
                  }`}>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                      {d.urutan || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-dark-500">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-dark-300" />
                      {d.namalevel}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-dark-400 text-xs">{d.deskripsi || '-'}</td>
                  <td className="px-4 py-3 text-center text-xs text-dark-400">{d.jumlah_item ?? '-'}</td>
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
