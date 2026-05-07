import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, Edit2, KeyRound } from 'lucide-react';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import useTabStore from '../store/tabStore';
import UserForm from '../pages/UserForm';

export default function User({ isActive }) {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const openTab = useTabStore((s) => s.openTab);

  const load = useCallback(async () => {
    const { data: res } = await api.get('/user');
    setData(res);
  }, []);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(data, 20);
  useEffect(() => { resetPage(); }, [search]);
  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleTambah = () => {
    openTab({ label: 'User Baru', icon: Plus, component: UserForm, props: { onSuccess: load }, type: 'form_add' });
  };

  const handleEdit = (user) => {
    openTab({ label: `Edit ${user.username}`, icon: Edit2, component: UserForm, props: { id: user.iduser, user, onSuccess: load }, type: 'form_edit' });
  };

  const handleResetPassword = async (user) => {
    const newPass = prompt(`Reset password untuk ${user.username}? Masukkan password baru (min 6 karakter):`);
    if (!newPass) return;
    if (newPass.length < 6) return toast.error('Password minimal 6 karakter');
    try {
      await api.put(`/user/${user.iduser}/reset-password`, { newPass });
      toast.success(`Password ${user.username} berhasil direset`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal reset password');
    }
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
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari username / nama..." className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full bg-white text-dark-400" />
        </div>
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-primary-50 bg-warm-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Username</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">HP</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Lokasi</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Menu</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Owner</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.filter(u => !search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.namauser?.toLowerCase().includes(search.toLowerCase())).map((user) => (
                <tr key={user.iduser} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                  <td className="px-4 py-3 font-medium text-dark-500">{user.username}</td>
                  <td className="px-4 py-3 text-dark-400">{user.namauser}</td>
                  <td className="px-4 py-3 text-dark-400">{user.email || '-'}</td>
                  <td className="px-4 py-3 text-dark-400">{user.hp || '-'}</td>
                  <td className="px-4 py-3 text-center text-dark-400">{user.jml_lokasi || 0}</td>
                  <td className="px-4 py-3 text-center text-dark-400">{user.jml_menu || 0}</td>
                  <td className="px-4 py-3 text-center">{user.isowner ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-600">Owner</span> : '-'}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${user.status === 'AKTIF' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{user.status}</span></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleEdit(user)} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-500" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleResetPassword(user)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600" title="Reset Password"><KeyRound className="w-4 h-4" /></button>
                    </div>
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
