import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, RefreshCw, CheckCircle, BarChart3 } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import useTabStore from '../../../store/tabStore';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';
import AnggaranForm from './AnggaranForm';
import AnggaranRealisasi from './AnggaranRealisasi';

const STATUS_BADGE = {
  DRAFT: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
};

export default function Anggaran() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const openTab = useTabStore((s) => s.openTab);
  const confirm = useConfirm();
  const lastRowClickRef = useRef({ id: null, at: 0 });
  const { access } = useMenuAccess('keuangan.anggaran');
  const canTambah = canAccess(access, 'tambah');
  const canUbah = canAccess(access, 'ubah');
  const canApprove = canAccess(access, 'approve');

  const load = useCallback(async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const { data: res } = await api.get('/anggaran', { params });
      setData(Array.isArray(res) ? res : []);
    } catch { toast.error('Gagal memuat data anggaran'); }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const filtered = search ? data.filter((d) => d.namaanggaran?.toLowerCase().includes(search.toLowerCase()) || d.periode?.includes(search)) : data;
  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(filtered, 20);
  useEffect(() => { resetPage(); }, [search]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleTambah = () => {
    openTab({ label: 'Buat Anggaran', icon: Plus, component: AnggaranForm, props: { mode: 'add', onSuccess: load }, type: 'form_add' });
  };

  const handleEdit = (d) => {
    if (!d) return;
    if (d.status !== 'DRAFT') { toast.error('Hanya anggaran DRAFT yang bisa diedit'); return; }
    openTab({ label: `Edit ${d.namaanggaran}`, icon: Pencil, component: AnggaranForm, props: { mode: 'edit', id: d.idanggaran, data: d, onSuccess: load }, type: 'form_edit' });
  };

  const handleRowClick = (d) => {
    const now = Date.now();
    const last = lastRowClickRef.current;
    if (last.id === d.idanggaran && now - last.at < 400) {
      lastRowClickRef.current = { id: null, at: 0 };
      handleEdit(d);
      return;
    }
    lastRowClickRef.current = { id: d.idanggaran, at: now };
    setSelectedId(d.idanggaran === selectedId ? null : d.idanggaran);
  };

  const handleApprove = async () => {
    if (!selectedRow) return;
    const ok = await confirm({ message: `Approve anggaran "${selectedRow.namaanggaran}"?` });
    if (!ok) return;
    try {
      await api.put(`/anggaran/${selectedRow.idanggaran}/approve`);
      toast.success('Anggaran di-approve');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal approve');
    }
  };

  const handleDelete = async () => {
    if (!selectedRow) return;
    const ok = await confirm({ message: 'Hapus anggaran ini?' });
    if (!ok) return;
    try {
      await api.delete(`/anggaran/${selectedRow.idanggaran}`);
      toast.success('Anggaran dihapus');
      setSelectedId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal hapus');
    }
  };

  const handleRealisasi = () => {
    if (!selectedRow) return;
    openTab({ label: `Realisasi ${selectedRow.namaanggaran}`, icon: BarChart3, component: AnggaranRealisasi, props: { id: selectedRow.idanggaran, nama: selectedRow.namaanggaran }, type: 'list', kodemenu: `anggaran-realisasi-${selectedRow.idanggaran}` });
  };

  const selectedRow = data.find(d => d.idanggaran === selectedId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Anggaran (Budgeting)</h2>
          <p className="text-sm text-dark-300">Kelola anggaran dan realisasi keuangan</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedRow && (
            <button onClick={handleRealisasi} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-50 border border-primary-200 text-primary-600 text-sm font-semibold hover:bg-primary-100 transition-colors">
              <BarChart3 className="w-4 h-4" /> Realisasi
            </button>
          )}
          {selectedRow && selectedRow.status === 'DRAFT' && canApprove && (
            <button onClick={handleApprove} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm font-semibold hover:bg-emerald-100 transition-colors">
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
          )}
          {selectedRow && selectedRow.status === 'DRAFT' && canUbah && (
            <button onClick={() => handleEdit(selectedRow)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-sm font-semibold hover:bg-blue-100 transition-colors">
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )}
          {selectedRow && selectedRow.status === 'DRAFT' && canTambah && (
            <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors">
              <Trash2 className="w-4 h-4" /> Hapus
            </button>
          )}
          {canTambah && (
            <button onClick={handleTambah} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold">
              <Plus className="w-4 h-4" /> Buat Anggaran
            </button>
          )}
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-6 pb-3 shrink-0">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama / periode anggaran..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20">
            <option value="">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="APPROVED">Approved</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-primary-50 bg-warm-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama Anggaran</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Periode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Berlaku</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-dark-300">Belum ada anggaran</td></tr>
              )}
              {paginatedItems.map((d) => {
                const isSelected = selectedId === d.idanggaran;
                return (
                  <tr key={d.idanggaran}
                    onClick={() => handleRowClick(d)}
                    onDoubleClick={() => handleEdit(d)}
                    className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${
                      isSelected ? 'bg-primary-50 ring-1 ring-inset ring-primary-200' : 'hover:bg-warm-50/30'
                    }`}>
                    <td className="px-4 py-3 font-medium text-dark-500">{d.namaanggaran}</td>
                    <td className="px-4 py-3 text-dark-400 text-xs">{d.periode}</td>
                    <td className="px-4 py-3 text-dark-400 text-xs">
                      {d.tglawal ? new Date(d.tglawal).toLocaleDateString('id-ID') : '-'} – {d.tglakhir ? new Date(d.tglakhir).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[d.status] || 'bg-gray-100 text-gray-500'}`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
      </div>
    </div>
  );
}
