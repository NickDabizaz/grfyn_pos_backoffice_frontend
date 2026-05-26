import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, RefreshCw, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import useTabStore from '../../../store/tabStore';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';
import LemburForm from './LemburForm';

const STATUS_BADGE = {
  DRAFT: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
};

const TAB = { LIST: 'list', REKAP: 'rekap' };

function RekapPane() {
  const [bulan, setBulan] = useState(new Date().toISOString().slice(0, 7));
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/lembur/rekap', { params: { bulan } });
      setData(Array.isArray(res) ? res : []);
    } catch { toast.error('Gagal memuat rekap lembur'); }
    finally { setLoading(false); }
  }, [bulan]);

  useEffect(() => { load(); }, [load]);

  const total = data.reduce((s, d) => s + Number(d.total_bayar || 0), 0);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <label className="text-xs font-semibold text-dark-400">Bulan:</label>
        <input type="month" value={bulan} onChange={(e) => setBulan(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
        <button onClick={load} disabled={loading} className="p-2 rounded-xl border border-primary-100 hover:bg-warm-50 text-dark-400">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {data.length > 0 && (
        <div className="p-3 rounded-xl bg-warm-50 border border-primary-50 mb-4 flex items-center gap-3">
          <div>
            <p className="text-xs text-dark-300">Total Bayar Lembur {bulan}</p>
            <p className="text-lg font-bold text-dark-500">Rp {total.toLocaleString('id-ID')}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary-50 bg-warm-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Karyawan</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Jml Lembur</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Total Jam</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Total Bayar</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-dark-300">Memuat...</td></tr>}
            {!loading && data.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-dark-300">Tidak ada data lembur bulan ini</td></tr>}
            {data.map((d) => (
              <tr key={d.idkaryawan} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                <td className="px-4 py-3 font-medium text-dark-500">{d.namakaryawan}</td>
                <td className="px-4 py-3 text-center text-dark-400">{d.jumlah_lembur}</td>
                <td className="px-4 py-3 text-right text-dark-400">{Number(d.total_jam || 0).toFixed(1)} jam</td>
                <td className="px-4 py-3 text-right font-semibold text-dark-500">Rp {Number(d.total_bayar || 0).toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Lembur() {
  const [activeTab, setActiveTab] = useState(TAB.LIST);
  const [data, setData] = useState([]);
  const [karyawanList, setKaryawanList] = useState([]);
  const [filterKaryawan, setFilterKaryawan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const openTab = useTabStore((s) => s.openTab);
  const confirm = useConfirm();
  const { access } = useMenuAccess('sdm.lembur');
  const canTambah = canAccess(access, 'tambah');
  const canApprove = canAccess(access, 'approve');

  const load = useCallback(async () => {
    try {
      const params = {};
      if (filterKaryawan) params.idkaryawan = filterKaryawan;
      if (filterStatus) params.status = filterStatus;
      const { data: res } = await api.get('/lembur', { params });
      setData(Array.isArray(res) ? res : []);
    } catch { toast.error('Gagal memuat data lembur'); }
  }, [filterKaryawan, filterStatus]);

  useEffect(() => {
    load();
    api.get('/karyawan').then((r) => setKaryawanList(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, [load]);

  const filtered = search ? data.filter((d) => d.namakaryawan?.toLowerCase().includes(search.toLowerCase())) : data;
  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(filtered, 20);
  useEffect(() => { resetPage(); }, [search]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleTambah = () => {
    openTab({ label: 'Input Lembur', icon: Plus, component: LemburForm, props: { mode: 'add', onSuccess: load }, type: 'form_add' });
  };

  const handleApprove = async (d) => {
    const ok = await confirm({ message: `Approve lembur ${d.namakaryawan} tgl ${d.tgllembur}?` });
    if (!ok) return;
    try {
      await api.put(`/lembur/${d.idlembur}/approve`);
      toast.success('Lembur di-approve');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal approve');
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({ message: 'Hapus data lembur ini?' });
    if (!ok) return;
    try {
      await api.delete(`/lembur/${id}`);
      toast.success('Lembur dihapus');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal hapus');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Lembur Karyawan</h2>
          <p className="text-sm text-dark-300">Input dan persetujuan lembur karyawan</p>
        </div>
        <div className="flex items-center gap-2">
          {canTambah && activeTab === TAB.LIST && (
            <button onClick={handleTambah} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold">
              <Plus className="w-4 h-4" /> Input Lembur
            </button>
          )}
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-6 shrink-0">
        <div className="flex gap-1 border-b border-primary-50">
          {[
            { key: TAB.LIST, label: 'Daftar Lembur', Icon: Clock },
            { key: TAB.REKAP, label: 'Rekap Bulanan', Icon: BarChart3 },
          ].map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${activeTab === key ? 'border-primary-500 text-primary-600' : 'border-transparent text-dark-400 hover:text-dark-500'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === TAB.LIST && (
        <>
          <div className="px-6 pt-3 pb-3 shrink-0">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama karyawan..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <select value={filterKaryawan} onChange={(e) => setFilterKaryawan(e.target.value)}
                className="px-3 py-2 rounded-xl border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                <option value="">Semua Karyawan</option>
                {karyawanList.map((k) => <option key={k.idkaryawan} value={k.idkaryawan}>{k.namakaryawan}</option>)}
              </select>
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
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Karyawan</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tgl Lembur</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Jam</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Total Jam</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Tarif/Jam</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Total Bayar</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-dark-300">Tidak ada data lembur</td></tr>
                  )}
                  {paginatedItems.map((d) => (
                    <tr key={d.idlembur} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                      <td className="px-4 py-3 font-medium text-dark-500">{d.namakaryawan}</td>
                      <td className="px-4 py-3 text-dark-400 text-xs">{d.tgllembur ? new Date(d.tgllembur).toLocaleDateString('id-ID') : '-'}</td>
                      <td className="px-4 py-3 text-dark-400 text-xs">{d.jam_mulai} – {d.jam_selesai}</td>
                      <td className="px-4 py-3 text-right text-dark-400 text-xs">{Number(d.total_jam || 0).toFixed(1)} jam</td>
                      <td className="px-4 py-3 text-right text-dark-400 text-xs">Rp {Number(d.tarif_per_jam || 0).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right font-semibold text-dark-500 text-xs">Rp {Number(d.total_bayar || 0).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[d.status] || 'bg-gray-100 text-gray-500'}`}>{d.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {canApprove && d.status === 'DRAFT' && (
                            <button onClick={() => handleApprove(d)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-dark-300 hover:text-emerald-600" title="Approve">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canTambah && d.status === 'DRAFT' && (
                            <button onClick={() => handleDelete(d.idlembur)} className="p-1.5 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500">
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
        </>
      )}

      {activeTab === TAB.REKAP && <RekapPane />}
    </div>
  );
}
