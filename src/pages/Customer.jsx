import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, Download, FileText, Upload, RefreshCw } from 'lucide-react';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import { useConfirm } from '../components/ui/ConfirmDialog';
import useTabStore from '../store/tabStore';
import CustomerForm from './CustomerForm';

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

export default function Customer({ isActive }) {
  const [data, setData]                         = useState([]);
  const [search, setSearch]                     = useState('');
  const [refreshing, setRefreshing]             = useState(false);
  const [showTemplateInfo, setShowTemplateInfo] = useState(false);
  const openTab                                 = useTabStore((s) => s.openTab);
  const confirm                                 = useConfirm();

  const load = useCallback(async () => {
    const { data: res } = await api.get('/customer');
    setData(res);
  }, []);

  const filteredData = search
    ? data.filter(c => c.namacustomer.toLowerCase().includes(search.toLowerCase()) || c.kodecustomer.toLowerCase().includes(search.toLowerCase()))
    : data;

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(filteredData, 20);
  useEffect(() => { resetPage(); }, [search]);
  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleTambah = () => {
    openTab({ label: 'Customer', icon: Plus, component: CustomerForm, props: { mode: 'add', onSuccess: load }, type: 'form_add' });
  };

  const handleEdit = (c) => {
    openTab({ label: ` ${c.kodecustomer}`, icon: Pencil, component: CustomerForm, props: { mode: 'edit', id: c.idcustomer, data: c, onSuccess: load }, type: 'form_edit' });
  };

  const handleDelete = async (id) => {
    const c = await confirm({ message: 'Hapus customer ini?' });
    if (!c) return;
    try { await api.delete(`/customer/${id}`); toast.success('Customer dihapus'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Customer</h2>
          <p className="text-sm text-dark-300">Manajemen data customer</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleTambah} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary-500/20 active:scale-[0.98]">
            <Plus className="w-4 h-4" /> Tambah Customer
          </button>
          <button onClick={() => downloadFile('/impor/customer/export', 'customer-export.csv')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => setShowTemplateInfo(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors">
            <FileText className="w-3.5 h-3.5" /> Unduh Template
          </button>
          <button onClick={() => handleImport('/impor/customer/import', load)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors">
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
          <button onClick={handleRefresh} disabled={refreshing} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="relative max-w-md mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())}
            placeholder="Cari customer..." className="input-upper w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <div className="overflow-y-auto scrollbar-thin">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-primary-50 bg-warm-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Alamat</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">HP</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-20">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((c) => (
                  <tr key={c.idcustomer} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                    <td className="px-4 py-3 text-xs font-mono text-dark-300">{c.kodecustomer}</td>
                    <td className="px-4 py-3 font-medium text-dark-500">{c.namacustomer}</td>
                    <td className="px-4 py-3 text-dark-400">{c.alamat || '-'}</td>
                    <td className="px-4 py-3 text-dark-400">{c.hp || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEdit(c)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-300 hover:text-primary-500"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(c.idcustomer)} className="p-1.5 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
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

      {showTemplateInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowTemplateInfo(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-dark-500 mb-1">Panduan Isi Template Customer</h3>
            <p className="text-xs text-dark-300 mb-4">Pastikan format CSV sudah sesuai sebelum import.</p>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3 p-3 rounded-xl bg-warm-50 border border-primary-50">
                <span className="font-mono font-semibold text-primary-600 w-32 shrink-0">namacustomer</span>
                <span className="text-dark-400"><span className="text-red-500 font-semibold">Wajib.</span> Nama customer, contoh: <span className="font-mono">TOKO MAJU JAYA</span></span>
              </div>
              <div className="flex gap-3 p-3 rounded-xl bg-warm-50 border border-primary-50">
                <span className="font-mono font-semibold text-primary-600 w-32 shrink-0">alamat</span>
                <span className="text-dark-400">Boleh kosong. Contoh: <span className="font-mono">JL. MERDEKA NO. 5</span></span>
              </div>
              <div className="flex gap-3 p-3 rounded-xl bg-warm-50 border border-primary-50">
                <span className="font-mono font-semibold text-primary-600 w-32 shrink-0">hp</span>
                <span className="text-dark-400">Boleh kosong. Nomor HP tanpa spasi, contoh: <span className="font-mono">081234567890</span></span>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowTemplateInfo(false)}
                className="px-4 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors">
                Batal
              </button>
              <button onClick={() => { setShowTemplateInfo(false); downloadFile('/impor/customer/template', 'customer-template.csv'); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold transition-colors">
                <FileText className="w-3.5 h-3.5" /> Unduh Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
