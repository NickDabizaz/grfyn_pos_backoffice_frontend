import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, RefreshCw, Calculator, Cpu } from 'lucide-react';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import useTabStore from '../../store/tabStore';
import { useMenuAccess, canAccess } from '../../hooks/useMenuAccess';
import AsetTetapForm from './AsetTetapForm';

const STATUS_BADGE = {
  AKTIF: 'bg-emerald-100 text-emerald-700',
  HABIS: 'bg-gray-100 text-gray-500',
  DIJUAL: 'bg-blue-100 text-blue-700',
};

function formatRp(val) {
  return `Rp ${Number(val || 0).toLocaleString('id-ID')}`;
}

export default function AsetTetap() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [kategoriList, setKategoriList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [bulkPeriode, setBulkPeriode] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const openTab = useTabStore((s) => s.openTab);
  const confirm = useConfirm();
  const { access } = useMenuAccess('aset.tetap');
  const canTambah = canAccess(access, 'tambah');
  const canUbah = canAccess(access, 'ubah');
  const canApprove = canAccess(access, 'approve');

  const load = useCallback(async () => {
    try {
      const params = {};
      if (filterKategori) params.kategori = filterKategori;
      if (filterStatus) params.status = filterStatus;
      const { data: res } = await api.get('/aset', { params });
      setData(Array.isArray(res) ? res : []);
    } catch { toast.error('Gagal memuat data aset'); }
  }, [filterKategori, filterStatus]);

  const loadKategori = useCallback(async () => {
    try {
      const { data: res } = await api.get('/aset/kategori');
      setKategoriList(Array.isArray(res) ? res : []);
    } catch {}
  }, []);

  useEffect(() => { load(); loadKategori(); }, [load, loadKategori]);

  const filtered = search ? data.filter((d) => d.namaaset?.toLowerCase().includes(search.toLowerCase())) : data;
  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(filtered, 20);
  useEffect(() => { resetPage(); }, [search]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleTambah = () => {
    openTab({ label: 'Tambah Aset', icon: Plus, component: AsetTetapForm, props: { mode: 'add', onSuccess: load }, type: 'form_add' });
  };

  const handleEdit = (d) => {
    openTab({ label: `Edit ${d.namaaset}`, icon: Pencil, component: AsetTetapForm, props: { mode: 'edit', id: d.idaset, data: d, onSuccess: load }, type: 'form_edit' });
  };

  const handleDelete = async (id) => {
    const ok = await confirm({ message: 'Hapus aset ini? Hanya bisa jika belum ada penyusutan.' });
    if (!ok) return;
    try {
      await api.delete(`/aset/${id}`);
      toast.success('Aset dihapus');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal hapus');
    }
  };

  const handleHitungPenyusutan = async (id, nama) => {
    const periode = prompt('Masukkan periode (YYYY-MM):', new Date().toISOString().slice(0, 7));
    if (!periode) return;
    try {
      await api.post(`/aset/${id}/hitung-penyusutan`, { periode });
      toast.success(`Penyusutan ${nama} berhasil dihitung`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal hitung penyusutan');
    }
  };

  const handleBulkPenyusutan = async () => {
    if (!bulkPeriode) { toast.error('Pilih periode terlebih dahulu'); return; }
    const ok = await confirm({ message: `Hitung penyusutan semua aset untuk periode ${bulkPeriode}?` });
    if (!ok) return;
    setBulkLoading(true);
    try {
      const { data: res } = await api.post('/aset/hitung-penyusutan-bulk', { periode: bulkPeriode });
      toast.success(`Selesai: ${res.processed} diproses, ${res.skipped} dilewati, ${res.errors} error`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Aset Tetap</h2>
          <p className="text-sm text-dark-300">Manajemen aset tetap dan penyusutan</p>
        </div>
        <div className="flex items-center gap-2">
          {canTambah && (
            <button onClick={handleTambah} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold">
              <Plus className="w-4 h-4" /> Tambah Aset
            </button>
          )}
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {canApprove && (
        <div className="px-6 pb-3 shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-warm-50 border border-primary-50">
            <Calculator className="w-4 h-4 text-dark-400" />
            <span className="text-xs font-semibold text-dark-400">Hitung Penyusutan Bulk:</span>
            <input type="month" value={bulkPeriode} onChange={(e) => setBulkPeriode(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20" />
            <button onClick={handleBulkPenyusutan} disabled={bulkLoading}
              className="px-3 py-1.5 rounded-lg bg-accent-500 text-white text-xs font-semibold hover:bg-accent-600 disabled:opacity-50">
              {bulkLoading ? 'Menghitung...' : 'Hitung Semua'}
            </button>
          </div>
        </div>
      )}

      <div className="px-6 pb-3 shrink-0">
        <div className="bg-white rounded-2xl border border-primary-50 p-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama aset..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
            <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}
              className="px-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20">
              <option value="">Semua Kategori</option>
              {kategoriList.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20">
              <option value="">Semua Status</option>
              <option value="AKTIF">Aktif</option>
              <option value="HABIS">Habis</option>
              <option value="DIJUAL">Dijual</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-primary-50 bg-warm-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama Aset</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kategori</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tgl Beli</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Nilai Beli</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Nilai Buku</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Metode</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-24">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-dark-300">Belum ada data aset</td></tr>
              )}
              {paginatedItems.map((d) => (
                <tr key={d.idaset} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                  <td className="px-4 py-3 font-medium text-dark-500">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-dark-300" />
                      {d.namaaset}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-dark-400 text-xs">{d.kategori || '-'}</td>
                  <td className="px-4 py-3 text-dark-400 text-xs">{d.tglbeli ? new Date(d.tglbeli).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-4 py-3 text-right text-dark-400 text-xs">{formatRp(d.nilai_beli)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-dark-500 text-xs">{formatRp(d.nilai_buku)}</td>
                  <td className="px-4 py-3 text-dark-400 text-xs">{d.metode_penyusutan === 'GARIS_LURUS' ? 'Garis Lurus' : d.metode_penyusutan || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[d.status] || 'bg-gray-100 text-gray-500'}`}>
                      {d.status || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {canApprove && (
                        <button onClick={() => handleHitungPenyusutan(d.idaset, d.namaaset)}
                          className="p-1.5 rounded-lg hover:bg-accent-50 text-dark-300 hover:text-accent-600" title="Hitung Penyusutan">
                          <Calculator className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canUbah && (
                        <button onClick={() => handleEdit(d)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-300 hover:text-primary-500">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canTambah && (
                        <button onClick={() => handleDelete(d.idaset)} className="p-1.5 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
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
