import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, Eye, XCircle } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import useTabStore from '../../../store/tabStore';
import HitungHPPForm from './HitungHPPForm';
import HitungHPPDetail from './HitungHPPDetail';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function formatPeriode(periodbulan) {
  if (!periodbulan) return '-';
  const [y, m] = periodbulan.split('-');
  return `${BULAN[parseInt(m) - 1]} ${y}`;
}

export default function HitungHPP({ isActive }) {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [tahun, setTahun] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const openTab = useTabStore((s) => s.openTab);
  const { access } = useMenuAccess('stok.hitunghpp');
  const canTambah = canAccess(access, 'tambah');
  const canUbah = canAccess(access, 'ubah');

  const load = useCallback(async () => {
    const params = {};
    if (status) params.status = status;
    if (tahun) params.tahun = tahun;
    const { data: res } = await api.get('/hitunghpp', { params });
    setData(res);
  }, [status, tahun]);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(data, 20);
  useEffect(() => { resetPage(); }, [search]);
  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleTambah = () => {
    openTab({
      label: 'Hitung Periode Baru',
      icon: Plus,
      component: HitungHPPForm,
      props: { onSuccess: load },
      type: 'form_add'
    });
  };

  const handleDetail = (item) => {
    openTab({
      label: `HPP ${formatPeriode(item.periodbulan)}`,
      icon: Eye,
      component: HitungHPPDetail,
      props: { id: item.idhitunghpp, onSuccess: load },
      type: 'detail'
    });
  };

  const handleCancel = async (item) => {
    if (!confirm(`Batal Hitung HPP ${formatPeriode(item.periodbulan)}? Status akan menjadi CANCELED.`)) return;
    try {
      await api.put(`/hitunghpp/${item.idhitunghpp}/cancel`);
      toast.success(`HPP ${formatPeriode(item.periodbulan)} menjadi CANCELED`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal cancel');
    }
  };

  const tahunOptions = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 5; y--) tahunOptions.push(String(y));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Hitung HPP</h2>
          <p className="text-sm text-dark-300">Perhitungan Harga Pokok Penjualan per periode</p>
        </div>
        <div className="flex items-center gap-2">
          {canTambah && <button onClick={handleTambah} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold">
            <Plus className="w-4 h-4" /> Hitung Periode Baru
          </button>}
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 px-6 pb-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-dark-400">
          <option value="">Semua Status</option>
          <option value="APPROVED">APPROVED</option>
          <option value="CANCELED">CANCELED</option>
        </select>
        <select value={tahun} onChange={(e) => setTahun(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-dark-400">
          <option value="">Semua Tahun</option>
          {tahunOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari kode HPP..." className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full bg-white text-dark-400" />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          {paginatedItems.filter(i => !search || i.kodehitunghpp?.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
            <div className="p-12 text-center text-dark-300">
              <p className="text-lg font-semibold mb-1">Belum ada perhitungan HPP</p>
              <p className="text-sm">Klik "Hitung Periode Baru" untuk mulai.</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-primary-50 bg-warm-50/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">No</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode HPP</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Periode</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tgl Posting</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Total Pembelian</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Total HPP Jual</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Saldo Akhir</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">User</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.filter(i => !search || i.kodehitunghpp?.toLowerCase().includes(search.toLowerCase())).map((item, idx) => (
                    <tr key={item.idhitunghpp} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                      <td className="px-4 py-3 text-dark-300">{idx + 1}</td>
                      <td className="px-4 py-3 text-xs font-mono text-dark-400">{item.kodehitunghpp}</td>
                      <td className="px-4 py-3 font-medium text-dark-500">{formatPeriode(item.periodbulan)}</td>
                      <td className="px-4 py-3 text-dark-400">{item.tglakhir?.slice(0, 10)}</td>
                      <td className="px-4 py-3 text-right text-dark-400">{Number(item.totalpembelian).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right text-dark-500 font-semibold">{Number(item.totalhppjual).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right text-dark-400">{Number(item.totalsaldoakhir).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-dark-400">{item.namauser || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{item.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleDetail(item)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-500" title="Detail"><Eye className="w-4 h-4" /></button>
                          {item.status === 'APPROVED' && <button onClick={() => handleCancel(item)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Batal Hitung HPP"><XCircle className="w-4 h-4" /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={page} totalPages={totalPages} setPage={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
