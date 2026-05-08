import { useState, useEffect } from 'react';
import api from '../api/axios';
import { formatRupiah } from '../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, AlertTriangle, ChevronDown, ChevronUp, Download, FileText, Upload, RefreshCw } from 'lucide-react';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import { useConfirm } from '../components/ui/ConfirmDialog';
import useTabStore from '../store/tabStore';
import BarangForm from './BarangForm';

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
      toast.success(`Import selesai: ${data.success} berhasil, ${data.errors?.length || 0} gagal`);
      onSuccess();
    } catch (err) { toast.error(err.response?.data?.message || 'Import gagal'); }
  };
  input.click();
};

export default function Barang({ isActive, tabState, updateTabState }) {
  const [barang, setBarang]                     = useState([]);
  const [search, setSearch]                     = useState('');
  const [warnings, setWarnings]                 = useState([]);
  const [historyBeli, setHistoryBeli]           = useState([]);
  const [historyJual, setHistoryJual]           = useState([]);
  const [showHistory, setShowHistory]           = useState(null);
  const [refreshing, setRefreshing]             = useState(false);
  const [showTemplateInfo, setShowTemplateInfo] = useState(false);

  const openTab = useTabStore((s) => s.openTab);
  const confirm = useConfirm();

  const load = () => {
    const params = search ? { search } : {};
    api.get('/barang', { params }).then((r) => setBarang(r.data));
  };
  useEffect(() => { load(); api.get('/barang/check-price').then((r) => setWarnings(r.data.warnings)); }, [search]);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(barang, 20);
  useEffect(() => { resetPage(); }, [search]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      load(),
      api.get('/barang/check-price').then((r) => setWarnings(r.data.warnings))
    ]);
    setRefreshing(false);
  };

  const handleTambah = () => {
    openTab({
      label    : 'Barang',
      icon     : Plus,
      component: BarangForm,
      props    : { mode: 'add', onSuccess: load },
      type     : 'form_add',
    });
  };

  const handleEdit = (b) => {
    openTab({
      label    : `${b.kodebarang}`,
      icon     : Pencil,
      component: BarangForm,
      props    : { mode: 'edit', idbarang: b.idbarang, data: b, onSuccess: load },
      type     : 'form_edit',
    });
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({ message: 'Hapus barang ini?' });
    if (!confirmed) return;
    try {
      await api.delete(`/barang/${id}`);
      toast.success('Barang dihapus');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  const loadHistory = async (id) => {
    const [beli, jual] = await Promise.all([api.get(`/barang/${id}/hargabeli`), api.get(`/barang/${id}/hargajual`)]);
    setHistoryBeli(beli.data); setHistoryJual(jual.data);
    setShowHistory(showHistory === id ? null : id);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Barang</h2>
          <p className="text-sm text-dark-300">Manajemen produk dan harga</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleTambah}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary-500/20 active:scale-[0.98]">
            <Plus className="w-4 h-4" /> Tambah Barang
          </button>
          <button onClick={() => downloadFile('/impor/barang/export', 'barang-export.csv')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => setShowTemplateInfo(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors">
            <FileText className="w-3.5 h-3.5" /> Unduh Template
          </button>
          <button onClick={() => handleImport('/impor/barang/import', load)}
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

      {warnings > 0 && (
        <div className="flex items-center gap-2 mx-6 mb-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          <AlertTriangle className="w-4 h-4" /> Ada {warnings} barang dengan harga jual di bawah harga beli!
        </div>
      )}

      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="relative max-w-md mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())}
            placeholder="Cari barang (kode/nama)..." className="input-upper w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
        </div>

        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[900px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-primary-50 bg-warm-50/50">
                  <th className="text-center px-3 py-3 text-xs font-semibold text-dark-300 w-[7%]">Kode</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-dark-300 w-[18%]">Nama Barang</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-dark-300 w-[5%]">Sat. Bessr</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-dark-300 w-[5%]">Sat. Sedang</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-dark-300 w-[5%]">Sat. Kecil</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-dark-300 w-[5%]">Konversi1</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-dark-300 w-[5%]">Konversi2</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-dark-300 w-[11%]">Jenis</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-dark-300 w-[9%]">Harga Beli</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-dark-300 w-[9%]">Harga Jual</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-dark-300 w-[5%]">Stok Min</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-dark-300 w-[9%]">Status</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-dark-300 w-[7%]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((b) => (
                  <>
                  <tr key={b.idbarang} className="border-b border-primary-50/50 hover:bg-warm-50/30 transition-colors text-sm">
                    <td className="px-3 py-3 text-xs font-mono text-dark-300">{b.kodebarang}</td>
                    <td className="px-3 py-3 font-medium text-dark-500">{b.namabarang}</td>
                    <td className="px-3 py-3 text-dark-400">{b.satuanbesar || '-'}</td>
                    <td className="px-3 py-3 text-dark-400">{b.satuansedang || '-'}</td>
                    <td className="px-3 py-3 text-dark-400">{b.satuankecil || '-'}</td>
                    <td className="px-3 py-3 text-center text-dark-300">{b.konversi1 || 0}</td>
                    <td className="px-3 py-3 text-center text-dark-300">{b.konversi2 || 0}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-block whitespace-nowrap text-[10px] font-semibold px-1.5 py-0.5 rounded-lg ${
                        b.jenis === 'BAHAN BAKU' ? 'bg-amber-50 text-amber-700' :
                        b.jenis === 'BAHAN SETENGAH JADI' ? 'bg-blue-50 text-blue-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        {b.jenis || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-dark-400">{formatRupiah(b.hargabeli_terbaru)}</td>
                    <td className={`px-3 py-3 text-right font-mono font-semibold ${b.hargajual_terbaru && b.hargabeli_terbaru && parseFloat(b.hargajual_terbaru) < parseFloat(b.hargabeli_terbaru) ? 'text-red-500' : 'text-accent-600'}`}>
                      {formatRupiah(b.hargajual_terbaru)}
                    </td>
                    <td className="px-3 py-3 text-center text-dark-400">{b.stokmin}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-block whitespace-nowrap text-[10px] font-semibold px-1.5 py-0.5 rounded-lg ${
                        b.status === 'AKTIF' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {b.status || 'AKTIF'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => loadHistory(b.idbarang)} className="p-1.5 rounded-lg hover:bg-accent-50 text-dark-300 hover:text-accent-500" title="Lihat history harga">
                          {showHistory === b.idbarang ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleEdit(b)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-300 hover:text-primary-500" title="Edit barang"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(b.idbarang)} className="p-1.5 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500" title="Hapus barang"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                  {showHistory === b.idbarang && (
                    <tr key={`h-${b.idbarang}`}>
                      <td colSpan={12} className="px-4 py-3 bg-warm-50/30">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="font-semibold text-dark-400 mb-2">History Harga Beli</p>
                            {historyBeli.length === 0 ? (
                              <p className="text-dark-300 py-2">Belum ada history</p>
                            ) : (
                              historyBeli.map((h) => (
                                <div key={h.idhargabeli} className="flex justify-between py-1 border-b border-primary-50">
                                  <span className="text-dark-300">{h.tgltrans?.slice(0,10)}</span>
                                  <span className="font-mono text-dark-500">{formatRupiah(h.hargabeli)}</span>
                                </div>
                              ))
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-dark-400 mb-2">History Harga Jual</p>
                            {historyJual.length === 0 ? (
                              <p className="text-dark-300 py-2">Belum ada history</p>
                            ) : (
                              historyJual.map((h) => (
                                <div key={h.idhargajual} className="flex justify-between py-1 border-b border-primary-50">
                                  <span className="text-dark-300">{h.tgltrans?.slice(0,10)}</span>
                                  <span className="font-mono text-dark-500">{formatRupiah(h.hargajual)}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </>
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
            <h3 className="text-base font-bold text-dark-500 mb-1">Panduan Isi Template Barang</h3>
            <p className="text-xs text-dark-300 mb-4">Pastikan format CSV sudah sesuai sebelum import.</p>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3 p-3 rounded-xl bg-warm-50 border border-primary-50">
                <span className="font-mono font-semibold text-primary-600 w-32 shrink-0">namabarang</span>
                <span className="text-dark-400"><span className="text-red-500 font-semibold">Wajib.</span> Nama produk, contoh: <span className="font-mono">BERAS PREMIUM 5KG</span></span>
              </div>
              <div className="flex gap-3 p-3 rounded-xl bg-warm-50 border border-primary-50">
                <span className="font-mono font-semibold text-primary-600 w-32 shrink-0">satuanbesar / satuansedang / satuankecil</span>
                <span className="text-dark-400"><span className="text-red-500 font-semibold">Minimal 1 diisi.</span> Contoh: <span className="font-mono">KAR</span> / <span className="font-mono">SAK</span> / <span className="font-mono">KG</span>. Kolom yang tidak dipakai boleh kosong.</span>
              </div>
              <div className="flex gap-3 p-3 rounded-xl bg-warm-50 border border-primary-50">
                <span className="font-mono font-semibold text-primary-600 w-32 shrink-0">konversi1 konversi2</span>
                <span className="text-dark-400"><span className="text-red-500 font-semibold">Wajib diisi.</span> Rasio antar satuan. Jika hanya 1 satuan, isi kedua kolom dengan <span className="font-mono">1</span>. Contoh 3 satuan: konversi1 = <span className="font-mono">5</span> (1 KAR = 5 SAK), konversi2 = <span className="font-mono">50</span> (1 SAK = 50 KG).</span>
              </div>
              <div className="flex gap-3 p-3 rounded-xl bg-warm-50 border border-primary-50">
                <span className="font-mono font-semibold text-primary-600 w-32 shrink-0">jenis</span>
                <span className="text-dark-400">Kategori barang, boleh kosong. Contoh: <span className="font-mono">SEMBAKO</span></span>
              </div>
              <div className="flex gap-3 p-3 rounded-xl bg-warm-50 border border-primary-50">
                <span className="font-mono font-semibold text-primary-600 w-32 shrink-0">stokmin</span>
                <span className="text-dark-400">Stok minimum untuk notifikasi. Jika tidak tahu, isi <span className="font-mono">0</span>.</span>
              </div>
              <div className="flex gap-3 p-3 rounded-xl bg-warm-50 border border-primary-50">
                <span className="font-mono font-semibold text-primary-600 w-32 shrink-0">hargabeli hargajual</span>
                <span className="text-dark-400">Boleh dikosongkan. Isi angka tanpa titik/koma, contoh: <span className="font-mono">12500</span></span>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowTemplateInfo(false)}
                className="px-4 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors">
                Batal
              </button>
              <button onClick={() => { setShowTemplateInfo(false); downloadFile('/impor/barang/template', 'barang-template.csv'); }}
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
