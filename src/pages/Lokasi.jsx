import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, Edit2 } from 'lucide-react';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import useTabStore from '../store/tabStore';
import LokasiForm from '../pages/LokasiForm';
import api from '../api/axios';

export default function Lokasi({ isActive }) {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const openTab = useTabStore((s) => s.openTab);

  const load = useCallback(async () => {
    const { data: res } = await api.get('/lokasi');
    setData(res);
  }, []);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(data, 20);
  useEffect(() => { resetPage(); }, [search]);
  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleTambah = () => {
    openTab({ label: 'Lokasi Baru', icon: Plus, component: LokasiForm, props: { onSuccess: load }, type: 'form_add' });
  };

  const handleEdit = (lokasi) => {
    openTab({ label: `Edit ${lokasi.namalokasi}`, icon: Edit2, component: LokasiForm, props: { id: lokasi.idlokasi, lokasi, onSuccess: load }, type: 'form_edit' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div><h2 className="text-xl font-bold text-dark-500">Lokasi</h2><p className="text-sm text-dark-300">Kelola data lokasi / cabang</p></div>
        <div className="flex items-center gap-2">
          <button onClick={handleTambah} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold"><Plus className="w-4 h-4" /> Lokasi Baru</button>
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="relative max-w-md mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kode / nama lokasi..." className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full bg-white text-dark-400" />
        </div>
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-primary-50 bg-warm-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama Lokasi</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Alamat</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">HP</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Default</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.filter(l => !search || l.kodelokasi?.toLowerCase().includes(search.toLowerCase()) || l.namalokasi?.toLowerCase().includes(search.toLowerCase())).map((lokasi) => (
                <tr key={lokasi.idlokasi} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                  <td className="px-4 py-3 font-mono text-xs text-dark-400">{lokasi.kodelokasi}</td>
                  <td className="px-4 py-3 font-medium text-dark-500">{lokasi.namalokasi}</td>
                  <td className="px-4 py-3 text-dark-400 max-w-xs truncate">{lokasi.alamat || '-'}</td>
                  <td className="px-4 py-3 text-dark-400">{lokasi.hp || '-'}</td>
                  <td className="px-4 py-3 text-center">{lokasi.isdefault ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-primary-50 text-primary-600">Default</span> : '-'}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${lokasi.status === 'AKTIF' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{lokasi.status}</span></td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleEdit(lokasi)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-500" title="Edit"><Edit2 className="w-4 h-4" /></button>
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
