import { useState, useEffect } from 'react';
import api from '../api/axios';
import { formatDate } from '../lib/utils';
import toast from 'react-hot-toast';
import { Lock, Plus, RefreshCw, Search } from 'lucide-react';
import SearchableSelect from '../components/ui/SearchableSelect';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';

export default function Closing() {
  const [closing, setClosing] = useState([]);
  const [clsJenis, setClsJenis] = useState('harian');
  const [clsTgl, setClsTgl] = useState(new Date().toISOString().slice(0, 10));
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = () => {
    const params = search ? { search } : {};
    api.get('/stok/closing', { params }).then((r) => setClosing(r.data));
  };
  useEffect(() => { load(); }, [search]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => { load(); setTimeout(r, 200); });
    setRefreshing(false);
  };

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(closing, 20);
  useEffect(() => { resetPage(); }, [search]);

  const handleClosing = async () => {
    try {
      await api.post('/stok/closing', { jenis: clsJenis, tglclosing: clsTgl });
      toast.success('Closing berhasil');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-500">Closing</h2>
          <p className="text-sm text-dark-300">Tutup periode stok (Harian / Bulanan)</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
          title="Refresh halaman">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-primary-50">
        <h3 className="text-sm font-bold text-dark-500 mb-3 flex items-center gap-2"><Lock className="w-4 h-4 text-accent-500" /> Closing Baru</h3>
        <p className="text-xs text-dark-300 mb-4">Closing akan menghitung ulang saldo stok dan menyimpan snapshot untuk perhitungan HPP.</p>
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-dark-400 mb-1">Jenis</label>
            <SearchableSelect
              value={clsJenis}
              onChange={setClsJenis}
              options={[{ value: 'harian', label: 'Harian' }, { value: 'bulanan', label: 'Bulanan' }]}
              className="w-40"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark-400 mb-1">Tanggal Closing</label>
            <input type="date" value={clsTgl} onChange={(e) => setClsTgl(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-primary-100 text-sm" />
          </div>
          <button onClick={handleClosing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-accent-500/20 active:scale-[0.98]">
            <Lock className="w-3.5 h-3.5" /> Proses Closing
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())}
          placeholder="Cari kode closing..." className="input-upper w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
      </div>

      <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary-50 bg-warm-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Jenis</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((c) => (
              <tr key={c.idclosing} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                <td className="px-4 py-3 text-xs font-mono text-dark-300">{c.kodeclosing}</td>
                <td className="px-4 py-3 text-dark-400">{formatDate(c.tglclosing)}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-lg bg-accent-50 text-accent-600 text-[10px] font-bold uppercase">{c.jenis}</span>
                </td>
                <td className="px-4 py-3 text-emerald-600 text-xs font-bold">Selesai</td>
              </tr>
            ))}
            {closing.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-dark-300 text-sm">Belum ada closing</td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </div>
    </div>
  );
}
