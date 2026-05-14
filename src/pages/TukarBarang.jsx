import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { formatRupiah, today } from '../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, Printer, Pencil, Repeat } from 'lucide-react';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import useTabStore from '../store/tabStore';
import TukarBarangForm from './TukarBarangForm';
import { BrowseCustomerModal } from '../lib/formHelpers';
import { useConfirm } from '../components/ui/ConfirmDialog';

function printNotaTukar(data, user) {
  const kembali = data.items_kembali || [];
  const baru    = data.items_baru || [];
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Nota Tukar Barang - ${data.kodetukarbarang}</title>
<style>
  body{font-family:Arial,sans-serif;font-size:12px;margin:20px;color:#333}
  h2{text-align:center;margin:0 0 2px}
  .center{text-align:center}
  .info{margin:12px 0;display:grid;grid-template-columns:130px 1fr;gap:2px 8px}
  .info span:first-child{font-weight:bold;color:#555}
  table{width:100%;border-collapse:collapse;margin-top:14px}
  th{background:#f4f4f4;padding:6px 8px;text-align:left;border-bottom:2px solid #ddd;font-size:11px}
  td{padding:5px 8px;border-bottom:1px solid #eee;font-size:11px}
  .r{text-align:right} .c{text-align:center}
  .section-title{margin-top:16px;font-weight:bold;font-size:13px}
  @media print{body{margin:0}}
</style></head><body>
<h2>${user?.namatenant || 'GRFYN POS'}</h2>
<p class="center" style="color:#888;margin:0 0 12px">NOTA TUKAR BARANG</p>
<div class="info">
  <span>Kode Tukar</span><span>${data.kodetukarbarang}</span>
  <span>Tanggal</span><span>${String(data.tgltrans || '').slice(0, 10)}</span>
  <span>Customer</span><span>${data.namacustomer || '-'}</span>
</div>
<p class="section-title">Barang Dikembalikan</p>
<table><thead><tr>
  <th style="width:32px">No</th><th>Kode</th><th>Nama Barang</th>
  <th class="r" style="width:50px">Jml</th><th class="r" style="width:90px">Harga</th>
  <th class="c" style="width:140px">Tindak Lanjut</th>
</tr></thead><tbody>
${kembali.map((item, i) => `<tr>
  <td class="c">${i + 1}</td><td>${item.kodebarang || ''}</td><td>${item.namabarang || ''}</td>
  <td class="r">${item.jml}</td><td class="r">${Number(item.harga).toLocaleString('id-ID')}</td>
  <td class="c">${item.tindaklanjut || '-'}</td>
</tr>`).join('')}
</tbody></table>
<p class="section-title">Barang Pengganti</p>
<table><thead><tr>
  <th style="width:32px">No</th><th>Kode</th><th>Nama Barang</th>
  <th class="r" style="width:50px">Jml</th><th class="r" style="width:90px">Harga</th>
  <th class="r" style="width:100px">Subtotal</th>
</tr></thead><tbody>
${baru.map((item, i) => `<tr>
  <td class="c">${i + 1}</td><td>${item.kodebarang || ''}</td><td>${item.namabarang || ''}</td>
  <td class="r">${item.jml}</td><td class="r">${Number(item.harga).toLocaleString('id-ID')}</td>
  <td class="r">${Number(item.subtotal).toLocaleString('id-ID')}</td>
</tr>`).join('')}
</tbody></table>
</body></html>`;
  const w = window.open('', '_blank', 'width=820,height=640');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}

export default function TukarBarang({ isActive }) {
  const user    = useAuthStore(s => s.user);
  const openTab = useTabStore(s => s.openTab);
  const confirm = useConfirm();

  const [tukar, setTukar]             = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [filterKode, setFilterKode]         = useState('');
  const [filterCustomer, setFilterCustomer] = useState(null);
  const [tglAwal, setTglAwal]               = useState(today());
  const [tglAkhir, setTglAkhir]             = useState(today());

  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const loadTukar = useCallback(() => {
    const params = {};
    if (filterKode)     params.search     = filterKode;
    if (filterCustomer) params.idcustomer = filterCustomer.idcustomer;
    params.tglwal   = tglAwal;
    params.tglakhir = tglAkhir;
    api.get('/tukarbarang', { params }).then(r => setTukar(r.data)).catch(() => {});
  }, [filterKode, filterCustomer, tglAwal, tglAkhir]);

  useEffect(() => { loadTukar(); }, [loadTukar]);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(tukar, 20);
  useEffect(() => { resetPage(); }, [filterKode, filterCustomer, tglAwal, tglAkhir]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTukar();
    setTimeout(() => setRefreshing(false), 300);
  };

  const handleTambah = () => {
    openTab({ label: 'Tukar Barang Baru', icon: Repeat, component: TukarBarangForm, props: { onSuccess: loadTukar }, type: 'form_add' });
  };

  const handleEdit = async (t) => {
    if (t.status === 'VOID') return toast.error('Tukar barang VOID tidak dapat diedit');
    try {
      const { data } = await api.get(`/tukarbarang/${t.idtukarbarang}`);
      openTab({
        label: `Edit ${t.kodetukarbarang}`,
        icon: Pencil,
        component: TukarBarangForm,
        props: { onSuccess: loadTukar, editData: data },
        type: 'form_edit',
      });
    } catch {
      toast.error('Gagal memuat data tukar barang');
    }
  };

  const handleRowClick = (t) => setSelectedId(t.idtukarbarang === selectedId ? null : t.idtukarbarang);

  const handleCancel = async (e, id) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Batalkan Tukar Barang',
      message: 'Batalkan tukar barang ini? Stok akan dikembalikan seperti semula.',
      confirmText: 'Batalkan',
      cancelText: 'Batal',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await api.put(`/tukarbarang/${id}/cancel`);
      toast.success('Tukar barang dibatalkan');
      if (selectedId === id) setSelectedId(null);
      loadTukar();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  const handleCetak = async () => {
    if (!selectedId) return;
    try {
      const { data } = await api.get(`/tukarbarang/${selectedId}`);
      printNotaTukar(data, user);
    } catch {
      toast.error('Gagal memuat data untuk cetak');
    }
  };

  const selectedRow = tukar.find(t => t.idtukarbarang === selectedId);

  return (
    <div className="flex flex-col h-full">

      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Tukar Barang</h2>
          <p className="text-sm text-dark-300">Catat penukaran / penggantian barang dari customer</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedRow && selectedRow.status !== 'VOID' && (
            <button onClick={handleCetak}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-50 border border-primary-200 text-primary-600 text-sm font-semibold hover:bg-primary-100 transition-colors">
              <Printer className="w-4 h-4" /> Cetak
            </button>
          )}
          <button onClick={handleTambah}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold">
            <Plus className="w-4 h-4" /> Tukar Barang Baru
          </button>
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-6 pb-3 shrink-0">
        <div className="bg-white rounded-2xl border border-primary-50 p-3 grid grid-cols-2 gap-3 md:grid-cols-3">

          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Kode Tukar</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
              <input type="text" value={filterKode}
                onChange={e => setFilterKode(e.target.value.toUpperCase())}
                placeholder="Cari kode..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Customer</label>
            <div className="flex gap-1.5">
              <div className="flex-1 flex items-center px-2.5 py-2 rounded-lg border border-primary-100 bg-warm-50/40 text-xs min-h-[34px] overflow-hidden">
                {filterCustomer
                  ? <span className="text-dark-500 truncate">{filterCustomer.namacustomer}</span>
                  : <span className="text-dark-300">Semua customer</span>
                }
              </div>
              <button onClick={() => setShowCustomerModal(true)}
                className="px-2.5 py-1.5 rounded-lg border border-primary-100 text-[10px] font-semibold text-dark-400 hover:bg-warm-50 shrink-0">
                Browse
              </button>
              {filterCustomer && (
                <button onClick={() => setFilterCustomer(null)}
                  className="px-2 py-1.5 rounded-lg border border-red-100 text-[10px] text-red-400 hover:bg-red-50 shrink-0">&times;</button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Tanggal</label>
            <div className="flex items-center gap-1.5">
              <input type="date" value={tglAwal} onChange={e => setTglAwal(e.target.value)}
                className="flex-1 px-2 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20" />
              <span className="text-[10px] text-dark-300 shrink-0">s/d</span>
              <input type="date" value={tglAkhir} onChange={e => setTglAkhir(e.target.value)}
                className="flex-1 px-2 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20" />
            </div>
          </div>

        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          
          <div className="overflow-y-auto scrollbar-thin">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-primary-50 bg-warm-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Customer</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-20">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-dark-300">Tidak ada data tukar barang</td></tr>
                )}
                {paginatedItems.map((t) => {
                  const isSelected = selectedId === t.idtukarbarang;
                  return (
                    <tr key={t.idtukarbarang}
                      onClick={() => handleRowClick(t)}
                      onDoubleClick={() => handleEdit(t)}
                      className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${
                        t.status === 'VOID'
                          ? 'bg-red-50/30 opacity-60'
                          : isSelected
                            ? 'bg-primary-50 ring-1 ring-inset ring-primary-200'
                            : 'hover:bg-warm-50/30'
                      }`}>
                      <td className="px-4 py-3 text-xs font-mono font-semibold text-dark-400">{t.kodetukarbarang}</td>
                      <td className="px-4 py-3 text-dark-400 text-xs">{String(t.tgltrans || '').slice(0, 10)}</td>
                      <td className="px-4 py-3 text-dark-500">{t.namacustomer || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                          t.status === 'VOID' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {t.status === 'VOID' ? 'VOID' : 'AKTIF'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {t.status !== 'VOID' && (
                          <button
                            onClick={(e) => handleCancel(e, t.idtukarbarang)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                            Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
      </div>

      {showCustomerModal && (
        <BrowseCustomerModal
          onSelect={c => { setFilterCustomer(c); setShowCustomerModal(false); }}
          onClose={() => setShowCustomerModal(false)}
        />
      )}
    </div>
  );
}
