import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, Download, FileText, Upload, RefreshCw } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import useTabStore from '../../../store/tabStore';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';
import SupplierForm from './SupplierForm';

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

export default function Supplier({ isActive }) {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showTemplateInfo, setShowTemplateInfo] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const openTab = useTabStore((s) => s.openTab);
  const confirm = useConfirm();
  const { access } = useMenuAccess('master.supplier');
  const canTambah = canAccess(access, 'tambah');
  const canUbah = canAccess(access, 'ubah');

  const load = useCallback(async () => {
    const { data: res } = await api.get('/supplier');
    setData(res);
  }, []);

  const filteredData = search ? data.filter(s => s.namasupplier.toLowerCase().includes(search.toLowerCase()) || s.kodesupplier.toLowerCase().includes(search.toLowerCase())) : data;
  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(filteredData, 20);
  useEffect(() => { resetPage(); }, [search]);
  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const handleTambah = () => { openTab({ label: 'Supplier', icon: Plus, component: SupplierForm, props: { mode: 'add', onSuccess: load }, type: 'form_add' }); };
  const handleEdit = (s) => { openTab({ label: ` ${s.kodesupplier}`, icon: Pencil, component: SupplierForm, props: { mode: 'edit', id: s.idsupplier, data: s, onSuccess: load }, type: 'form_edit' }); };
  const handleDelete = async (id) => { const c = await confirm({ message: 'Hapus supplier ini?' }); if (!c) return; try { await api.delete(`/supplier/${id}`); toast.success('Supplier dihapus'); load(); } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); } };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div><h2 className="text-xl font-bold text-dark-500">Supplier</h2><p className="text-sm text-dark-300">Manajemen data supplier</p></div>
        <div className="flex items-center gap-2">
          {canTambah && (
          <button onClick={handleTambah} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold"><Plus className="w-4 h-4" /> Tambah Supplier</button>
          )}
          {selectedId && canTambah && (
          <button onClick={() => handleDelete(selectedId)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all active:scale-[0.98]"><Trash2 className="w-4 h-4" /> Hapus</button>
          )}
          <button onClick={() => downloadFile('/impor/supplier/export', 'supplier-export.csv')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50"><Download className="w-3.5 h-3.5" /> Export</button>
          <button onClick={() => setShowTemplateInfo(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50"><FileText className="w-3.5 h-3.5" /> Unduh Template</button>
          <button onClick={() => handleImport('/impor/supplier/import', load)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50"><Upload className="w-3.5 h-3.5" /> Import</button>
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="relative max-w-md mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())}
            placeholder="Cari supplier..." className="input-upper w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <div className="overflow-y-auto scrollbar-thin">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-primary-50 bg-warm-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th><th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama</th><th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Alamat</th><th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">HP</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((s) => (
                  <tr key={s.idsupplier}
                    onClick={() => setSelectedId(prev => prev === s.idsupplier ? null : s.idsupplier)}
                    onDoubleClick={() => canUbah && handleEdit(s)}
                    className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${
                      selectedId === s.idsupplier ? 'bg-primary-50 ring-1 ring-inset ring-primary-200' : 'hover:bg-warm-50/30'
                    }`}>
                    <td className="px-4 py-3 text-xs font-mono text-dark-300">{s.kodesupplier}</td><td className="px-4 py-3 font-medium text-dark-500">{s.namasupplier}</td><td className="px-4 py-3 text-dark-400">{s.alamat || '-'}</td><td className="px-4 py-3 text-dark-400">{s.hp || '-'}</td>
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
            <h3 className="text-base font-bold text-dark-500 mb-1">Panduan Isi Template Supplier</h3>
            <p className="text-xs text-dark-300 mb-4">Pastikan format CSV sudah sesuai sebelum import.</p>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3 p-3 rounded-xl bg-warm-50 border border-primary-50">
                <span className="font-mono font-semibold text-primary-600 w-32 shrink-0">namasupplier</span>
                <span className="text-dark-400"><span className="text-red-500 font-semibold">Wajib.</span> Nama supplier, contoh: <span className="font-mono">PT SUMBER MAKMUR</span></span>
              </div>
              <div className="flex gap-3 p-3 rounded-xl bg-warm-50 border border-primary-50">
                <span className="font-mono font-semibold text-primary-600 w-32 shrink-0">alamat</span>
                <span className="text-dark-400">Boleh kosong. Contoh: <span className="font-mono">JL. INDUSTRI NO. 10</span></span>
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
              <button onClick={() => { setShowTemplateInfo(false); downloadFile('/impor/supplier/template', 'supplier-template.csv'); }}
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
