import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, RefreshCw, Settings } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import useTabStore from '../../../store/tabStore';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';
import AkunForm from './AkunForm';
import AkunSettingJurnalModal from './AkunSettingJurnalModal';

export default function Akun({ isActive }) {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showSettingJurnal, setShowSettingJurnal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const openTab = useTabStore((s) => s.openTab);
  const confirm = useConfirm();
  const { access } = useMenuAccess('master.akun');
  const canTambah = canAccess(access, 'tambah');
  const canUbah = canAccess(access, 'ubah');

  const load = useCallback(async () => { const { data: res } = await api.get('/akun'); setData(res); }, []);
  const filteredData = search ? data.filter(a => a.namaakun.toLowerCase().includes(search.toLowerCase()) || a.kodeakun.toLowerCase().includes(search.toLowerCase())) : data;
  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(filteredData, 20);
  useEffect(() => { resetPage(); }, [search]);
  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const handleTambah = () => { openTab({ label: 'Akun', icon: Plus, component: AkunForm, props: { mode: 'add', onSuccess: load }, type: 'form_add' }); };
  const handleEdit = (a) => { openTab({ label: ` ${a.kodeakun}`, icon: Pencil, component: AkunForm, props: { mode: 'edit', id: a.idakun, data: a, onSuccess: load }, type: 'form_edit' }); };
  const handleDelete = async (id) => { const c = await confirm({ message: 'Hapus akun ini?' }); if (!c) return; try { await api.delete(`/akun/${id}`); toast.success('Akun dihapus'); load(); } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); } };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div><h2 className="text-xl font-bold text-dark-500">Akun</h2><p className="text-sm text-dark-300">Daftar akun / chart of accounts</p></div>
        <div className="flex items-center gap-2">
          {canTambah && (
          <button onClick={handleTambah} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold"><Plus className="w-4 h-4" /> Tambah Akun</button>
          )}
          {selectedId && canTambah && (
          <button onClick={() => handleDelete(selectedId)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all active:scale-[0.98]"><Trash2 className="w-4 h-4" /> Hapus</button>
          )}
          {canUbah && (
          <button onClick={() => setShowSettingJurnal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold"><Settings className="w-4 h-4" /> Setting Default Jurnal</button>
          )}
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="relative max-w-md mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())}
            placeholder="Cari akun (nama / kode)..." className="input-upper w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <div className="overflow-y-auto scrollbar-thin">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-primary-50 bg-warm-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode Akun</th><th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama Akun</th><th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Saldo</th><th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((a) => (
                  <tr key={a.idakun}
                    onClick={() => setSelectedId(prev => prev === a.idakun ? null : a.idakun)}
                    onDoubleClick={() => canUbah && handleEdit(a)}
                    className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${
                      selectedId === a.idakun ? 'bg-primary-50 ring-1 ring-inset ring-primary-200' : 'hover:bg-warm-50/30'
                    }`}>
                    <td className="px-4 py-3 text-xs font-mono text-dark-300">{a.kodeakun}</td><td className="px-4 py-3 font-medium text-dark-500">{a.namaakun}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${a.saldo === 'KREDIT' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {a.saldo || 'DEBET'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-xs">{a.status || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
      </div>
      {showSettingJurnal && <AkunSettingJurnalModal onClose={() => setShowSettingJurnal(false)} />}
    </div>
  );
}
