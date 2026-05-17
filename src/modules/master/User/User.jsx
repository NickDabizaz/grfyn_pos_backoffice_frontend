import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import { Plus, Search, RefreshCw, Edit2 } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import useTabStore from '../../../store/tabStore';
import UserForm from './UserForm';

export default function User({ isActive }) {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const openTab = useTabStore((s) => s.openTab);

  const load = useCallback(async () => {
    const { data: res } = await api.get('/user');
    setData(res);
  }, []);

  const filteredData = data.filter(u => !search
    || u.username?.toLowerCase().includes(search.toLowerCase())
    || u.email?.toLowerCase().includes(search.toLowerCase())
    || u.hp?.toLowerCase().includes(search.toLowerCase()));
  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(filteredData, 20);
  useEffect(() => { resetPage(); }, [search]);
  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleTambah = () => {
    openTab({ label: 'User Baru', icon: Plus, component: UserForm, props: { onSuccess: load }, type: 'form_add' });
  };

  const handleEdit = (user) => {
    openTab({ label: `Edit ${user.username}`, icon: Edit2, component: UserForm, props: { id: user.iduser, user, onSuccess: load }, type: 'form_edit' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div><h2 className="text-xl font-bold text-dark-500">User</h2><p className="text-sm text-dark-300">Kelola pengguna & akses menu</p></div>
        <div className="flex items-center gap-2">
          <button onClick={handleTambah} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold"><Plus className="w-4 h-4" /> User Baru</button>
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="relative max-w-md mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari username / email / hp..." className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full bg-white text-dark-400" />
        </div>
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-primary-50 bg-warm-50/50">
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-16">No</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Username</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">HP</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((user, index) => {
                const isSelected = selectedId === user.iduser;
                return (
                <tr
                  key={user.iduser}
                  onClick={() => setSelectedId(user.iduser)}
                  onDoubleClick={() => handleEdit(user)}
                  className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${
                    isSelected ? 'bg-primary-100 text-dark-700 ring-1 ring-inset ring-primary-300' : 'hover:bg-warm-50/30'
                  }`}
                >
                  <td className="px-4 py-3 text-center text-dark-300">{(page - 1) * 20 + index + 1}</td>
                  <td className="px-4 py-3 font-medium text-dark-500">{user.username}</td>
                  <td className="px-4 py-3 text-dark-400">{user.email || '-'}</td>
                  <td className="px-4 py-3 text-dark-400">{user.hp || '-'}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${user.status === 'AKTIF' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{user.status}</span></td>
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
