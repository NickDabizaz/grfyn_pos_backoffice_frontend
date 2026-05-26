import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, RefreshCw, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import useTabStore from '../../../store/tabStore';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';
import CutiForm from './CutiForm';

const STATUS_BADGE = {
  DRAFT: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const JENIS_BADGE = {
  TAHUNAN: 'bg-blue-100 text-blue-700',
  SAKIT: 'bg-orange-100 text-orange-700',
  IZIN: 'bg-purple-100 text-purple-700',
  MELAHIRKAN: 'bg-pink-100 text-pink-700',
  LAINNYA: 'bg-gray-100 text-gray-600',
};

function formatTgl(tgl) {
  if (!tgl) return '-';
  return new Date(tgl).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Cuti() {
  const [data, setData] = useState([]);
  const [karyawanList, setKaryawanList] = useState([]);
  const [filterKaryawan, setFilterKaryawan] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const openTab = useTabStore((s) => s.openTab);
  const confirm = useConfirm();
  const { access } = useMenuAccess('sdm.cuti');
  const canTambah = canAccess(access, 'tambah');
  const canApprove = canAccess(access, 'approve');

  const load = useCallback(async () => {
    try {
      const params = {};
      if (filterKaryawan) params.idkaryawan = filterKaryawan;
      if (filterJenis) params.jeniscuti = filterJenis;
      if (filterStatus) params.status = filterStatus;
      const { data: res } = await api.get('/cuti', { params });
      setData(Array.isArray(res) ? res : []);
    } catch { toast.error('Gagal memuat data cuti'); }
  }, [filterKaryawan, filterJenis, filterStatus]);

  useEffect(() => {
    load();
    api.get('/karyawan').then((r) => setKaryawanList(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, [load]);

  const filtered = search ? data.filter((d) => d.namakaryawan?.toLowerCase().includes(search.toLowerCase())) : data;
  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(filtered, 20);
  useEffect(() => { resetPage(); }, [search]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleTambah = () => {
    openTab({ label: 'Ajukan Cuti', icon: Plus, component: CutiForm, props: { mode: 'add', onSuccess: load }, type: 'form_add' });
  };

  const handleEdit = (d) => {
    if (d.status !== 'DRAFT') { toast.error('Hanya cuti DRAFT yang bisa diedit'); return; }
    openTab({ label: `Edit Cuti`, icon: Pencil, component: CutiForm, props: { mode: 'edit', id: d.idcuti, data: d, onSuccess: load }, type: 'form_edit' });
  };

  const handleApprove = async (d) => {
    const ok = await confirm({ message: `Approve cuti ${d.namakaryawan} (${d.jeniscuti})?` });
    if (!ok) return;
    try {
      await api.put(`/cuti/${d.idcuti}/approve`);
      toast.success('Cuti di-approve dan absensi otomatis dibuat');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal approve');
    }
  };

  const handleReject = async (d) => {
    const ok = await confirm({ message: `Tolak cuti ${d.namakaryawan}?` });
    if (!ok) return;
    try {
      await api.put(`/cuti/${d.idcuti}/reject`);
      toast.success('Cuti ditolak');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal tolak');
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({ message: 'Hapus pengajuan cuti ini?' });
    if (!ok) return;
    try {
      await api.delete(`/cuti/${id}`);
      toast.success('Cuti dihapus');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal hapus');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Cuti Karyawan</h2>
          <p className="text-sm text-dark-300">Manajemen pengajuan dan persetujuan cuti</p>
        </div>
        <div className="flex items-center gap-2">
          {canTambah && (
            <button onClick={handleTambah} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold">
              <Plus className="w-4 h-4" /> Ajukan Cuti
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
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama karyawan..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
            <select value={filterKaryawan} onChange={(e) => setFilterKaryawan(e.target.value)}
              className="px-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20">
              <option value="">Semua Karyawan</option>
              {karyawanList.map((k) => <option key={k.idkaryawan} value={k.idkaryawan}>{k.namakaryawan}</option>)}
            </select>
            <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)}
              className="px-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20">
              <option value="">Semua Jenis</option>
              {['TAHUNAN','SAKIT','IZIN','MELAHIRKAN','LAINNYA'].map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20">
              <option value="">Semua Status</option>
              <option value="DRAFT">Draft</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-primary-50 bg-warm-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Karyawan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Jenis</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Lama</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Keterangan</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-28">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-dark-300">Tidak ada data cuti</td></tr>
              )}
              {paginatedItems.map((d) => {
                const tglawal = new Date(d.tglawal);
                const tglakhir = new Date(d.tglakhir);
                const diffDays = Math.round((tglakhir - tglawal) / 86400000) + 1;
                return (
                  <tr key={d.idcuti} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                    <td className="px-4 py-3 font-medium text-dark-500">{d.namakaryawan}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${JENIS_BADGE[d.jeniscuti] || 'bg-gray-100 text-gray-600'}`}>{d.jeniscuti}</span>
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-xs">
                      <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatTgl(d.tglawal)} – {formatTgl(d.tglakhir)}</div>
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-semibold text-dark-500">{diffDays} hari</td>
                    <td className="px-4 py-3 text-dark-400 text-xs max-w-xs truncate">{d.keterangan || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[d.status] || 'bg-gray-100 text-gray-500'}`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {canApprove && d.status === 'DRAFT' && (
                          <>
                            <button onClick={() => handleApprove(d)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-dark-300 hover:text-emerald-600" title="Approve">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleReject(d)} className="p-1.5 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500" title="Tolak">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {canTambah && d.status === 'DRAFT' && (
                          <>
                            <button onClick={() => handleEdit(d)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-300 hover:text-primary-500">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(d.idcuti)} className="p-1.5 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
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
