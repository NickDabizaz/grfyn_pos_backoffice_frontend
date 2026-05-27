import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import useTabStore from '../../../store/tabStore';
import KaryawanForm from './KaryawanForm';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';
import { useConfirm } from '../../../components/ui/ConfirmDialog';

export default function Karyawan() {
  const openOrFocusTab = useTabStore(s => s.openOrFocusTab);
  const confirm = useConfirm();
  const lastRowClickRef = useRef({ id: null, at: 0 });
  const { access } = useMenuAccess('sdm.karyawan');
  const canTambah = canAccess(access, 'tambah');
  const canUbah = canAccess(access, 'ubah');

  const [list, setList]             = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterKode, setFilterKode] = useState('');

  const loadData = useCallback(() => {
    const params = {};
    if (filterKode) params.search = filterKode;
    api.get('/karyawan', { params }).then(r => setList(r.data)).catch(() => {});
  }, [filterKode]);

  useEffect(() => { loadData(); }, [loadData]);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(list, 20);
  useEffect(() => { resetPage(); }, [filterKode]);

  const handleRefresh = () => { setRefreshing(true); loadData(); setTimeout(() => setRefreshing(false), 300); };

  const handleTambah = () => {
    openOrFocusTab({ label: 'Karyawan Baru', icon: Plus, component: KaryawanForm, props: { onSuccess: loadData }, type: 'form_add', kodemenu: 'karyawan-add' });
  };

  const handleEdit = (k) => {
    openOrFocusTab({
      label: `Edit ${k.namakaryawan}`,
      icon: Pencil,
      component: KaryawanForm,
      props: { existingData: k, onSuccess: loadData },
      type: 'form_edit',
      kodemenu: `karyawan-edit-${k.idkaryawan}`,
    });
  };

  const handleRowClick = (k) => {
    const now = Date.now();
    const last = lastRowClickRef.current;
    if (last.id === k.idkaryawan && now - last.at < 400) {
      lastRowClickRef.current = { id: null, at: 0 };
      canUbah && handleEdit(k);
      return;
    }
    lastRowClickRef.current = { id: k.idkaryawan, at: now };
    setSelectedId(k.idkaryawan === selectedId ? null : k.idkaryawan);
  };

  const handleHapus = async () => {
    if (!selectedRow) return;
    const ok = await confirm({ message: `Hapus karyawan "${selectedRow.namakaryawan}"?` });
    if (!ok) return;
    try {
      await api.delete(`/karyawan/${selectedRow.idkaryawan}`);
      toast.success('Karyawan berhasil dihapus');
      setSelectedId(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal hapus');
    }
  };

  const selectedRow = list.find(k => k.idkaryawan === selectedId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Data Karyawan</h2>
          <p className="text-sm text-dark-300">Kelola data karyawan perusahaan</p>
        </div>
        <div className="flex items-center gap-2">
          {canTambah && (
            <button onClick={handleTambah}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold">
              <Plus className="w-4 h-4" /> Karyawan Baru
            </button>
          )}
          {selectedRow && canUbah && (
            <button onClick={() => handleEdit(selectedRow)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-sm font-semibold hover:bg-blue-100">
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )}
          {selectedRow && canTambah && (
            <button onClick={handleHapus}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-100">
              <Trash2 className="w-4 h-4" /> Hapus
            </button>
          )}
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-6 pb-3 shrink-0">
        <div className="bg-white rounded-2xl border border-primary-50 p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
            <input type="text" value={filterKode} onChange={e => setFilterKode(e.target.value)} placeholder="Cari kode / nama karyawan..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <div className="overflow-y-auto scrollbar-thin">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-primary-50 bg-warm-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama Karyawan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Jabatan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">No. HP</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-dark-300">Tidak ada data karyawan</td></tr>
                )}
                {paginatedItems.map((k) => (
                  <tr key={k.idkaryawan}
                    onClick={() => handleRowClick(k)}
                    onDoubleClick={() => canUbah && handleEdit(k)}
                    className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${selectedId === k.idkaryawan ? 'bg-primary-50 ring-1 ring-inset ring-primary-200' : 'hover:bg-warm-50/30'}`}>
                    <td className="px-4 py-3 text-xs font-mono text-dark-400">{k.kodekaryawan}</td>
                    <td className="px-4 py-3 text-dark-500 font-medium">{k.namakaryawan}</td>
                    <td className="px-4 py-3 text-dark-400 text-xs">{k.jabatan || '-'}</td>
                    <td className="px-4 py-3 text-dark-400 text-xs">{k.email || '-'}</td>
                    <td className="px-4 py-3 text-dark-400 text-xs">{k.nohp || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
      </div>
    </div>
  );
}
