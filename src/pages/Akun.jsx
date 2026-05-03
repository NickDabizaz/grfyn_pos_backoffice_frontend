import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useConfirm } from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, RefreshCw } from 'lucide-react';
import SearchableSelect from '../components/ui/SearchableSelect';

export default function Akun() {
  const confirm = useConfirm();
  const [data, setData]         = useState([]);
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm] = useState({ namaakun: '', posisi: 'DEBET' });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: res } = await api.get('/akun');
    if (search) {
      const s = search.toLowerCase();
      setData(res.filter(a => a.namaakun.toLowerCase().includes(s) || a.kodeakun.toLowerCase().includes(s)));
    } else {
      setData(res);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/akun/${editId}`, form);
        toast.success('Akun diupdate');
      } else {
        await api.post('/akun', form);
        toast.success('Akun ditambah');
      }
      setShowForm(false); setEditId(null);
      setForm({ namaakun: '', posisi: 'DEBET' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const handleEdit = (a) => {
    setEditId(a.idakun);
    setForm({ namaakun: a.namaakun, posisi: a.posisi });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!(await confirm({ message: 'Hapus akun ini?' }))) return;
    try { await api.delete(`/akun/${id}`); toast.success('Akun dihapus'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-500">Akun</h2>
          <p className="text-sm text-dark-300">Daftar akun / chart of accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing}
            className={`p-2 rounded-xl border border-primary-100 text-dark-400 hover:bg-warm-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh halaman">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => { setEditId(null); setForm({ namaakun: '', posisi: 'DEBET' }); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary-500/20 active:scale-[0.98]">
          <Plus className="w-4 h-4" /> Tambah Akun
        </button>
      </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())}
          placeholder="Cari akun (nama / kode)..." className="input-upper w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
      </div>

      <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-primary-50 bg-warm-50/50">
                <th className="text-left   px-4 py-3 text-xs font-semibold text-dark-300">Kode Akun</th>
                <th className="text-left   px-4 py-3 text-xs font-semibold text-dark-300">Nama Akun</th>
                <th className="text-left   px-4 py-3 text-xs font-semibold text-dark-300">Posisi</th>
                <th className="text-left   px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-20">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.idakun} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                  <td className="px-4 py-3 text-xs font-mono text-dark-300">{a.kodeakun}</td>
                  <td className="px-4 py-3 font-medium text-dark-500">{a.namaakun}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${a.posisi === 'DEBET' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {a.posisi}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-dark-400 text-xs">{a.status || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleEdit(a)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-300 hover:text-primary-500"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(a.idakun)} className="p-1.5 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{animation: 'fadeIn 0.2s ease'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in">
            <h3 className="text-lg font-bold text-dark-500 mb-4">{editId ? 'Edit' : 'Tambah'} Akun</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Nama Akun</label>
                <input value={form.namaakun} onChange={(e) => setForm({...form, namaakun: e.target.value.toUpperCase()})}
                  className="input-upper w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Posisi</label>
                <SearchableSelect
                  value={form.posisi}
                  onChange={(val) => setForm({...form, posisi: val})}
                  options={[{ value: 'DEBET', label: 'DEBET' }, { value: 'KREDIT', label: 'KREDIT' }]}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">Batal</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
