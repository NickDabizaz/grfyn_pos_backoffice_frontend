import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, Download, FileText, Upload, RefreshCw } from 'lucide-react';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';

const downloadFile = (url, filename) => {
  api.get(url, { responseType: 'blob' }).then((r) => {
    const blob = new Blob([r.data], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  });
};

const handleImport = (url, onSuccess) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post(url, formData);
      toast.success(`Import selesai: ${data.success} berhasil, ${data.errors} gagal`);
      onSuccess();
    } catch (err) { toast.error(err.response?.data?.message || 'Import gagal'); }
  };
  input.click();
};

export default function Supplier() {
  const [data, setData]         = useState([]);
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm] = useState({ namasupplier: '', alamat: '', hp: '' });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: res } = await api.get('/supplier');
    setData(res);
    setLoading(false);
  }, []);

  const filteredData = search
    ? data.filter(s => s.namasupplier.toLowerCase().includes(search.toLowerCase()) || s.kodesupplier.toLowerCase().includes(search.toLowerCase()))
    : data;

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(filteredData, 20);
  useEffect(() => { resetPage(); }, [search]);

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
        await api.put(`/supplier/${editId}`, form);
        toast.success('Supplier diupdate');
      } else {
        await api.post('/supplier', form);
        toast.success('Supplier ditambah');
      }
      setShowForm(false); setEditId(null);
      setForm({ namasupplier: '', alamat: '', hp: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const handleEdit = (s) => {
    setEditId(s.idsupplier);
    setForm({ namasupplier: s.namasupplier, alamat: s.alamat || '', hp: s.hp || '' });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus supplier ini?')) return;
    try { await api.delete(`/supplier/${id}`); toast.success('Supplier dihapus'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-500">Supplier</h2>
          <p className="text-sm text-dark-300">Manajemen data supplier</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditId(null); setForm({ namasupplier: '', alamat: '', hp: '' }); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary-500/20 active:scale-[0.98]">
            <Plus className="w-4 h-4" /> Tambah Supplier
          </button>
          <button onClick={() => downloadFile('/impor/supplier/export', 'supplier-export.csv')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => downloadFile('/impor/supplier/template', 'supplier-template.csv')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors">
            <FileText className="w-3.5 h-3.5" /> Template
          </button>
          <button onClick={() => handleImport('/impor/supplier/import', load)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors">
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
          <button onClick={handleRefresh} disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh halaman">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())}
          placeholder="Cari supplier..." className="input-upper w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
      </div>

      <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-primary-50 bg-warm-50/50">
                <th className="text-left   px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
                <th className="text-left   px-4 py-3 text-xs font-semibold text-dark-300">Nama</th>
                <th className="text-left   px-4 py-3 text-xs font-semibold text-dark-300">Alamat</th>
                <th className="text-left   px-4 py-3 text-xs font-semibold text-dark-300">HP</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-20">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((s) => (
                <tr key={s.idsupplier} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                  <td className="px-4 py-3 text-xs font-mono text-dark-300">{s.kodesupplier}</td>
                  <td className="px-4 py-3 font-medium text-dark-500">{s.namasupplier}</td>
                  <td className="px-4 py-3 text-dark-400">{s.alamat || '-'}</td>
                  <td className="px-4 py-3 text-dark-400">{s.hp || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleEdit(s)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-300 hover:text-primary-500"><Pencil className="w-3.5 h-3.5" /></button>
                      {s.kodesupplier !== 'SUP-0001' && (
                        <button onClick={() => handleDelete(s.idsupplier)} className="p-1.5 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{animation: 'fadeIn 0.2s ease'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in">
            <h3 className="text-lg font-bold text-dark-500 mb-4">{editId ? 'Edit' : 'Tambah'} Supplier</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Nama Supplier</label>
                <input value={form.namasupplier} onChange={(e) => setForm({...form, namasupplier: e.target.value.toUpperCase()})}
                  className="input-upper w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Alamat</label>
                <textarea value={form.alamat} onChange={(e) => setForm({...form, alamat: e.target.value.toUpperCase()})} rows={2}
                  className="input-upper w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">No HP</label>
                <input value={form.hp} onChange={(e) => setForm({...form, hp: e.target.value.toUpperCase()})}
                  className="input-upper w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
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
