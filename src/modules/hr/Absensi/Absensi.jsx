import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import { today } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, Trash2 } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import useTabStore from '../../../store/tabStore';
import AbsensiForm from './AbsensiForm';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';

export default function Absensi() {
  const openOrFocusTab = useTabStore(s => s.openOrFocusTab);
  const { access } = useMenuAccess('sdm.absensi');
  const canTambah = canAccess(access, 'tambah');
  const canUbah = canAccess(access, 'ubah');

  const [list, setList]           = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterKaryawan, setFilterKaryawan] = useState('');
  const [tglAwal, setTglAwal]   = useState(today());
  const [tglAkhir, setTglAkhir] = useState(today());

  const loadData = useCallback(() => {
    const params = { tglwal: tglAwal, tglakhir: tglAkhir };
    if (filterKaryawan) params.search = filterKaryawan;
    api.get('/absensi', { params }).then(r => setList(r.data)).catch(() => {});
  }, [filterKaryawan, tglAwal, tglAkhir]);

  useEffect(() => { loadData(); }, [loadData]);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(list, 20);
  useEffect(() => { resetPage(); }, [filterKaryawan, tglAwal, tglAkhir]);

  const handleRefresh = () => { setRefreshing(true); loadData(); setTimeout(() => setRefreshing(false), 300); };

  const selectedRow = list.find(a => a.idabsensi === selectedId);

  const handleHapus = async () => {
    if (!selectedRow) return;
    if (!confirm(`Hapus absensi "${selectedRow.namakaryawan}" tanggal ${String(selectedRow.tglabsensi || '').slice(0, 10)}?`)) return;
    try {
      await api.delete(`/absensi/${selectedRow.idabsensi}`);
      toast.success('Absensi berhasil dihapus');
      setSelectedId(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus absensi');
    }
  };

  const handleTambah = () => {
    openOrFocusTab({ label: 'Absensi Baru', icon: Plus, component: AbsensiForm, props: { onSuccess: loadData }, type: 'form_add', kodemenu: 'absensi-add' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Absensi Karyawan</h2>
          <p className="text-sm text-dark-300">Catat dan kelola absensi karyawan</p>
        </div>
        <div className="flex items-center gap-2">
          {canTambah && (
            <button onClick={handleTambah}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold">
              <Plus className="w-4 h-4" /> Absensi Baru
            </button>
          )}
          {selectedRow && canUbah && (
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
        <div className="bg-white rounded-2xl border border-primary-50 p-3 grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Cari Karyawan</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
              <input type="text" value={filterKaryawan} onChange={e => setFilterKaryawan(e.target.value)} placeholder="Kode / nama karyawan..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
          </div>
          <div></div>
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Karyawan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-dark-300">Tidak ada data absensi</td></tr>
                )}
                {paginatedItems.map((a) => (
                  <tr key={a.idabsensi}
                    onClick={() => setSelectedId(a.idabsensi === selectedId ? null : a.idabsensi)}
                    className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${selectedId === a.idabsensi ? 'bg-primary-50 ring-1 ring-inset ring-primary-200' : 'hover:bg-warm-50/30'}`}>
                    <td className="px-4 py-3 text-dark-400 text-xs">{String(a.tglabsensi || '').slice(0, 10)}</td>
                    <td className="px-4 py-3 text-dark-500 font-medium">{a.namakaryawan || '-'}</td>
                    <td className="px-4 py-3 text-dark-400 text-xs">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${a.status === 'HADIR' ? 'bg-emerald-50 text-emerald-600' : a.status === 'SAKIT' ? 'bg-yellow-50 text-yellow-600' : a.status === 'CUTI' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-xs">{a.keterangan || '-'}</td>
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
