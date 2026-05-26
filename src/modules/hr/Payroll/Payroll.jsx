import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import { formatRupiah } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, CheckCircle, Trash2, RotateCcw, Eye } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import useTabStore from '../../../store/tabStore';
import PayrollForm from './PayrollForm';
import PayrollDetail from './PayrollDetail';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';

const STATUS_BADGE = {
  DRAFT:   'bg-amber-50 text-amber-600 border-amber-100',
  POSTED:  'bg-emerald-50 text-emerald-600 border-emerald-100',
  POSTING: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

export default function Payroll() {
  const openOrFocusTab = useTabStore(s => s.openOrFocusTab);
  const { access } = useMenuAccess('sdm.payroll');
  const canTambah = canAccess(access, 'tambah');
  const canUbah = canAccess(access, 'ubah');

  const [list, setList]           = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterBulan, setFilterBulan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const loadData = useCallback(() => {
    const params = {};
    if (filterBulan) params.bulan = filterBulan;
    if (filterStatus) params.status = filterStatus;
    api.get('/payroll', { params }).then(r => setList(r.data)).catch(() => {});
  }, [filterBulan, filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(list, 20);
  useEffect(() => { resetPage(); }, [filterBulan, filterStatus]);

  const handleRefresh = () => { setRefreshing(true); loadData(); setTimeout(() => setRefreshing(false), 300); };

  const handleTambah = () => {
    openOrFocusTab({ label: 'Generate Payroll', icon: Plus, component: PayrollForm, props: { onSuccess: loadData }, type: 'form_add', kodemenu: 'payroll-generate' });
  };

  const handlePosting = async (id) => {
    if (!confirm('Post payroll ini ke jurnal akuntansi?')) return;
    try {
      await api.put(`/payroll/${id}/posting`);
      toast.success('Payroll berhasil diposting');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal posting');
    }
  };

  const handleCancel = async (id, nama) => {
    if (!confirm(`Hapus payroll DRAFT untuk "${nama}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await api.delete(`/payroll/${id}`);
      toast.success('Payroll berhasil dihapus');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus payroll');
    }
  };

  const handleUnpost = async (id) => {
    if (!confirm('Unpost payroll ini? Status akan kembali ke DRAFT dan jurnal akan dihapus.')) return;
    try {
      await api.put(`/payroll/${id}/unpost`);
      toast.success('Payroll berhasil di-unpost');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal unpost payroll');
    }
  };

  const handleDetail = (p) => {
    openOrFocusTab({
      label: `Detail ${p.namakaryawan} ${p.bulanpayroll || ''}`.trim(),
      icon: Eye,
      component: PayrollDetail,
      props: { payrollId: p.idpayroll },
      type: 'detail',
      kodemenu: `payroll-detail-${p.idpayroll}`,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Payroll Karyawan</h2>
          <p className="text-sm text-dark-300">Kelola payroll dan gaji karyawan</p>
        </div>
        <div className="flex items-center gap-2">
          {canTambah && (
            <button onClick={handleTambah}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold">
              <Plus className="w-4 h-4" /> Generate Payroll
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
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Bulan</label>
            <input type="month" value={filterBulan} onChange={e => setFilterBulan(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20">
              <option value="">Semua Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="POSTED">POSTED</option>
              <option value="POSTING">POSTING</option>
            </select>
          </div>
          <div></div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <div className="overflow-y-auto scrollbar-thin">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-primary-50 bg-warm-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Bulan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Karyawan</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Gaji Pokok</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Tunjangan</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Potongan</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Bersih</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-32">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-dark-300">Tidak ada data payroll</td></tr>
                )}
                {paginatedItems.map((p) => (
                  <tr key={p.idpayroll}
                    onClick={() => setSelectedId(p.idpayroll === selectedId ? null : p.idpayroll)}
                    className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${selectedId === p.idpayroll ? 'bg-primary-50 ring-1 ring-inset ring-primary-200' : 'hover:bg-warm-50/30'}`}>
                    <td className="px-4 py-3 text-dark-400 text-xs">{p.bulanpayroll || '-'}</td>
                    <td className="px-4 py-3 text-dark-500 font-medium">{p.namakaryawan || '-'}</td>
                    <td className="px-4 py-3 text-right text-dark-500 text-xs">{formatRupiah(p.gajipokok)}</td>
                    <td className="px-4 py-3 text-right text-dark-500 text-xs">{formatRupiah(p.tunjangan)}</td>
                    <td className="px-4 py-3 text-right text-dark-500 text-xs">{formatRupiah(p.potongan)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-accent-600">{formatRupiah(p.gajinetbersih)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGE[p.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {p.status === 'DRAFT' && canUbah && (
                          <button onClick={(e) => { e.stopPropagation(); handlePosting(p.idpayroll); }} title="Post ke jurnal" className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                            <CheckCircle className="w-3 h-3" /> Post
                          </button>
                        )}
                        {p.status === 'DRAFT' && canUbah && (
                          <button onClick={(e) => { e.stopPropagation(); handleCancel(p.idpayroll, p.namakaryawan); }} title="Hapus payroll" className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(p.status === 'POSTED' || p.status === 'POSTING') && canUbah && (
                          <button onClick={(e) => { e.stopPropagation(); handleUnpost(p.idpayroll); }} title="Unpost payroll" className="text-amber-500 hover:text-amber-700 p-1 rounded hover:bg-amber-50">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleDetail(p); }} title="Lihat detail" className="text-primary-500 hover:text-primary-700 p-1 rounded hover:bg-primary-50">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
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
