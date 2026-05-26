import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, RefreshCw, Tag } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import useTabStore from '../../../store/tabStore';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';
import DiskonForm from './DiskonForm';

const JENIS_BADGE = {
  PERSEN: 'bg-blue-100 text-blue-700',
  NOMINAL: 'bg-green-100 text-green-700',
  BELI_X_GRATIS_Y: 'bg-purple-100 text-purple-700',
};

const STATUS_BADGE = {
  AKTIF: 'bg-emerald-100 text-emerald-700',
  TIDAK_AKTIF: 'bg-gray-100 text-gray-500',
};

function formatTgl(tgl) {
  if (!tgl) return '-';
  return new Date(tgl).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Diskon() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const openTab = useTabStore((s) => s.openTab);
  const confirm = useConfirm();
  const { access } = useMenuAccess('penjualan.diskon');
  const canTambah = canAccess(access, 'tambah');
  const canUbah = canAccess(access, 'ubah');

  const load = useCallback(async () => {
    try {
      const { data: res } = await api.get('/diskon');
      setData(Array.isArray(res) ? res : []);
    } catch {
      toast.error('Gagal memuat data diskon');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = data.filter((d) => {
    const matchSearch = !search || d.namadiskon?.toLowerCase().includes(search.toLowerCase()) || d.kodediskon?.toLowerCase().includes(search.toLowerCase());
    const matchJenis = !filterJenis || d.jenis === filterJenis;
    const matchStatus = !filterStatus || d.status === filterStatus;
    return matchSearch && matchJenis && matchStatus;
  });

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(filtered, 20);
  useEffect(() => { resetPage(); }, [search, filterJenis, filterStatus]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleTambah = () => {
    openTab({ label: 'Tambah Diskon', icon: Plus, component: DiskonForm, props: { mode: 'add', onSuccess: load }, type: 'form_add' });
  };

  const handleEdit = (d) => {
    openTab({ label: `Edit ${d.kodediskon}`, icon: Pencil, component: DiskonForm, props: { mode: 'edit', id: d.idiskon, data: d, onSuccess: load }, type: 'form_edit' });
  };

  const handleDelete = async (id) => {
    const ok = await confirm({ message: 'Hapus diskon ini?' });
    if (!ok) return;
    try {
      await api.delete(`/diskon/${id}`);
      toast.success('Diskon dihapus');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal hapus');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Diskon &amp; Promo</h2>
          <p className="text-sm text-dark-300">Manajemen program diskon dan promo</p>
        </div>
        <div className="flex items-center gap-2">
          {canTambah && (
            <button onClick={handleTambah} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold">
              <Plus className="w-4 h-4" /> Tambah Diskon
            </button>
          )}
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-6 pb-3 shrink-0">
        <div className="bg-white rounded-2xl border border-primary-50 p-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama / kode diskon..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
            <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)}
              className="px-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20">
              <option value="">Semua Jenis</option>
              <option value="PERSEN">Persen</option>
              <option value="NOMINAL">Nominal</option>
              <option value="BELI_X_GRATIS_Y">Beli X Gratis Y</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20">
              <option value="">Semua Status</option>
              <option value="AKTIF">Aktif</option>
              <option value="TIDAK_AKTIF">Tidak Aktif</option>
            </select>
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama Diskon</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Jenis</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nilai</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Berlaku</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-20">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-dark-300">Tidak ada data diskon</td></tr>
                )}
                {paginatedItems.map((d) => (
                  <tr key={d.idiskon} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                    <td className="px-4 py-3 text-xs font-mono text-dark-300">{d.kodediskon}</td>
                    <td className="px-4 py-3 font-medium text-dark-500">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-dark-300" />
                        {d.namadiskon}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${JENIS_BADGE[d.jenis] || 'bg-gray-100 text-gray-600'}`}>
                        {d.jenis === 'BELI_X_GRATIS_Y' ? 'Beli X Gratis Y' : d.jenis}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-xs">
                      {d.jenis === 'PERSEN' ? `${d.nilai}%` : d.jenis === 'NOMINAL' ? `Rp ${Number(d.nilai || 0).toLocaleString('id-ID')}` : `Beli ${d.nilai_x}, Gratis ${d.nilai_y}`}
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-xs">{formatTgl(d.tglawal)} – {formatTgl(d.tglakhir)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[d.status] || 'bg-gray-100 text-gray-500'}`}>
                        {d.status === 'AKTIF' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {canUbah && (
                          <button onClick={() => handleEdit(d)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-300 hover:text-primary-500">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canTambah && (
                          <button onClick={() => handleDelete(d.idiskon)} className="p-1.5 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
}
