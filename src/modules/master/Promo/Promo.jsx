import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, Search, RefreshCw, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import useTabStore from '../../../store/tabStore';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';
import PromoForm from './PromoForm';

const JENIS_LABEL = {
  PERSEN_ITEM: 'Persen Item',
  NOMINAL_ITEM: 'Nominal Item',
  PERSEN_TRANSAKSI: 'Persen Transaksi',
  NOMINAL_TRANSAKSI: 'Nominal Transaksi',
  BELI_X_GRATIS_Y: 'Beli X Gratis Y',
};

const JENIS_BADGE = {
  PERSEN_ITEM: 'bg-blue-100 text-blue-700',
  NOMINAL_ITEM: 'bg-green-100 text-green-700',
  PERSEN_TRANSAKSI: 'bg-cyan-100 text-cyan-700',
  NOMINAL_TRANSAKSI: 'bg-emerald-100 text-emerald-700',
  BELI_X_GRATIS_Y: 'bg-purple-100 text-purple-700',
};

const STATUS_BADGE = {
  AKTIF: 'bg-emerald-100 text-emerald-700',
  NONAKTIF: 'bg-gray-100 text-gray-500',
};

function formatTgl(tgl) {
  if (!tgl) return '-';
  return new Date(tgl).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatNilai(d) {
  if (d.jenis === 'BELI_X_GRATIS_Y') return `Beli ${d.nilai_x || 0}, Gratis ${d.nilai_y || 0}`;
  if (d.jenis?.includes('PERSEN')) return `${Number(d.nilai || 0)}%`;
  return `Rp ${Number(d.nilai || 0).toLocaleString('id-ID')}`;
}

export default function Promo({ kodemenu }) {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBerlaku, setFilterBerlaku] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const openTab = useTabStore((s) => s.openTab);
  const confirm = useConfirm();
  const { access } = useMenuAccess(kodemenu || 'master.promo');
  const canTambah = canAccess(access, 'tambah');
  const canUbah = canAccess(access, 'ubah');

  const load = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filterJenis) params.jenis = filterJenis;
      if (filterStatus) params.status = filterStatus;
      if (filterBerlaku) params.berlaku_untuk = filterBerlaku;
      const { data: res } = await api.get('/promo', { params });
      setData(Array.isArray(res) ? res : []);
    } catch {
      toast.error('Gagal memuat data promo');
    }
  }, [search, filterJenis, filterStatus, filterBerlaku]);

  useEffect(() => { load(); }, [load]);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(data, 20);
  useEffect(() => { resetPage(); }, [search, filterJenis, filterStatus, filterBerlaku]);
  useEffect(() => {
    if (selectedId && !data.some((d) => d.idpromo === selectedId)) setSelectedId(null);
  }, [data, selectedId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleTambah = () => {
    openTab({ label: 'Tambah Promo', icon: Plus, component: PromoForm, props: { mode: 'add', onSuccess: load }, type: 'form_add' });
  };

  const handleEdit = async (d) => {
    try {
      const { data: detail } = await api.get(`/promo/${d.idpromo}`);
      openTab({ label: `Edit ${d.kodepromo}`, icon: Tag, component: PromoForm, props: { mode: 'edit', id: d.idpromo, data: detail, onSuccess: load }, type: 'form_edit' });
    } catch {
      toast.error('Gagal memuat detail promo');
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Hapus Promo',
      message: 'Hapus promo ini? Promo yang sudah digunakan tidak dapat dihapus.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/promo/${id}`);
      toast.success('Promo dihapus');
      setSelectedId(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal hapus promo');
    }
  };

  const handleToggleStatus = async (promo) => {
    const nextStatus = promo.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
    try {
      const { data: detail } = await api.get(`/promo/${promo.idpromo}`);
      await api.put(`/promo/${promo.idpromo}`, {
        kodepromo: detail.kodepromo,
        namapromo: detail.namapromo,
        deskripsi: detail.deskripsi || null,
        jenis: detail.jenis,
        berlaku_untuk: detail.berlaku_untuk,
        nilai: Number(detail.nilai || 0),
        nilai_x: detail.nilai_x,
        nilai_y: detail.nilai_y,
        min_transaksi: Number(detail.min_transaksi || 0),
        min_qty: Number(detail.min_qty || 0),
        max_diskon: detail.max_diskon,
        max_penggunaan: detail.max_penggunaan,
        tglawal: detail.tglawal,
        tglakhir: detail.tglakhir,
        berlaku_semua_barang: Boolean(Number(detail.berlaku_semua_barang ?? 1)),
        status: nextStatus,
        items: Boolean(Number(detail.berlaku_semua_barang ?? 1)) ? [] : (detail.items || []).map((item) => item.idbarang),
        barang_gratis: detail.jenis === 'BELI_X_GRATIS_Y'
          ? (detail.barang_gratis || []).map((item) => ({ idbarang: item.idbarang, jml: item.jml || 1 }))
          : [],
      });
      toast.success(nextStatus === 'AKTIF' ? 'Promo diaktifkan' : 'Promo dinonaktifkan');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status promo');
    }
  };

  const selectedRow = data.find((d) => d.idpromo === selectedId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Master Promo</h2>
          <p className="text-sm text-dark-300">Katalog promo otomatis untuk penjualan dan pembelian</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedRow && canUbah && (
            <button onClick={() => handleToggleStatus(selectedRow)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-dark-400 text-sm font-semibold hover:bg-warm-50">
              {selectedRow.status === 'AKTIF' ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
              {selectedRow.status === 'AKTIF' ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          )}
          {canTambah && (
            <button onClick={handleTambah} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold">
              <Plus className="w-4 h-4" /> Tambah Promo
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
        <div className="bg-white rounded-2xl border border-primary-50 p-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_150px_170px]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kode atau nama promo..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
            <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)}
              className="px-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20">
              <option value="">Semua Jenis</option>
              {Object.entries(JENIS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20">
              <option value="">Semua Status</option>
              <option value="AKTIF">Aktif</option>
              <option value="NONAKTIF">Nonaktif</option>
            </select>
            <select value={filterBerlaku} onChange={(e) => setFilterBerlaku(e.target.value)}
              className="px-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20">
              <option value="">Semua Transaksi</option>
              <option value="PENJUALAN">Penjualan</option>
              <option value="PEMBELIAN">Pembelian</option>
              <option value="KEDUANYA">Keduanya</option>
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Jenis</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Berlaku Untuk</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Periode</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Nilai</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Terpakai</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-dark-300">Tidak ada data promo</td></tr>
                )}
                {paginatedItems.map((d) => (
                  <tr
                    key={d.idpromo}
                    onClick={() => setSelectedId((prev) => prev === d.idpromo ? null : d.idpromo)}
                    onDoubleClick={() => canUbah && handleEdit(d)}
                    className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${
                      selectedId === d.idpromo ? 'bg-primary-50 ring-1 ring-inset ring-primary-200' : 'hover:bg-warm-50/30'
                    }`}
                  >
                    <td className="px-4 py-3 text-xs font-mono text-dark-300">{d.kodepromo}</td>
                    <td className="px-4 py-3 font-medium text-dark-500">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-dark-300" />
                        {d.namapromo}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${JENIS_BADGE[d.jenis] || 'bg-gray-100 text-gray-600'}`}>
                        {JENIS_LABEL[d.jenis] || d.jenis}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-xs">{d.berlaku_untuk}</td>
                    <td className="px-4 py-3 text-dark-400 text-xs">{formatTgl(d.tglawal)} - {formatTgl(d.tglakhir)}</td>
                    <td className="px-4 py-3 text-right text-dark-400 text-xs">{formatNilai(d)}</td>
                    <td className="px-4 py-3 text-center text-xs text-dark-400">
                      {Number(d.jumlah_digunakan || 0).toLocaleString('id-ID')}
                      {d.max_penggunaan ? ` / ${Number(d.max_penggunaan).toLocaleString('id-ID')}` : ''}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[d.status] || 'bg-gray-100 text-gray-500'}`}>
                        {d.status === 'AKTIF' ? 'Aktif' : 'Nonaktif'}
                      </span>
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
