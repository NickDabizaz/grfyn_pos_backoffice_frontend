import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { formatRupiah, today } from '../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, Printer, Pencil, Undo2 } from 'lucide-react';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import useTabStore from '../store/tabStore';
import ReturJualForm from './ReturJualForm';
import { BrowseCustomerModal } from '../lib/formHelpers';
import { useConfirm } from '../components/ui/ConfirmDialog';

function printNotaRetur(data, user) {
  const items = data.items || [];
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Nota Retur - ${data.kodereturjual}</title>
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
  .totals{margin-top:14px;text-align:right}
  .grand{font-size:14px;font-weight:bold;margin-top:4px}
  @media print{body{margin:0}}
</style></head><body>
<h2>${user?.namatenant || 'GRFYN POS'}</h2>
<p class="center" style="color:#888;margin:0 0 12px">NOTA RETUR PENJUALAN</p>
<div class="info">
  <span>Kode Retur</span><span>${data.kodereturjual}</span>
  <span>Tanggal</span><span>${String(data.tgltrans || '').slice(0, 10)}</span>
  <span>Customer</span><span>${data.namacustomer || '-'}</span>
  <span>Kode Jual</span><span>${data.kodejual || '-'}</span>
</div>
<table><thead><tr>
  <th style="width:32px">No</th><th>Kode</th><th>Nama Barang</th>
  <th class="r" style="width:50px">Jml</th>
  <th class="r" style="width:90px">Harga</th>
  <th class="r" style="width:100px">Subtotal</th>
  <th class="c" style="width:120px">Tindak Lanjut</th>
</tr></thead><tbody>
${items.map((item, i) => `<tr>
  <td class="c">${i + 1}</td>
  <td>${item.kodebarang || ''}</td>
  <td>${item.namabarang || ''}</td>
  <td class="r">${item.jml}</td>
  <td class="r">${Number(item.harga).toLocaleString('id-ID')}</td>
  <td class="r">${Number(item.subtotal).toLocaleString('id-ID')}</td>
  <td class="c">${item.tindaklanjut || '-'}</td>
</tr>`).join('')}
</tbody></table>
<div class="totals">
  <div class="grand">Total: ${Number(data.total).toLocaleString('id-ID')}</div>
</div>
</body></html>`;
  const w = window.open('', '_blank', 'width=820,height=640');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}

export default function ReturJual({ isActive }) {
  const user    = useAuthStore(s => s.user);
  const openTab = useTabStore(s => s.openTab);
  const confirm = useConfirm();

  const [retur, setRetur]             = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [filterKode, setFilterKode]         = useState('');
  const [filterCustomer, setFilterCustomer] = useState(null);
  const [tglAwal, setTglAwal]               = useState(today());
  const [tglAkhir, setTglAkhir]             = useState(today());

  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const loadRetur = useCallback(() => {
    const params = {};
    if (filterKode)     params.search     = filterKode;
    if (filterCustomer) params.idcustomer = filterCustomer.idcustomer;
    params.tglwal   = tglAwal;
    params.tglakhir = tglAkhir;
    api.get('/returjual', { params }).then(r => setRetur(r.data)).catch(() => {});
  }, [filterKode, filterCustomer, tglAwal, tglAkhir]);

  useEffect(() => { loadRetur(); }, [loadRetur]);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(retur, 20);
  useEffect(() => { resetPage(); }, [filterKode, filterCustomer, tglAwal, tglAkhir]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRetur();
    setTimeout(() => setRefreshing(false), 300);
  };

  const handleTambah = () => {
    openTab({ label: 'Retur Penjualan Baru', icon: Undo2, component: ReturJualForm, props: { onSuccess: loadRetur }, type: 'form_add' });
  };

  const handleEdit = async (r) => {
    if (r.status === 'VOID') return toast.error('Retur VOID tidak dapat diedit');
    try {
      const { data } = await api.get(`/returjual/${r.idreturjual}`);
      openTab({
        label: `Edit ${r.kodereturjual}`,
        icon: Pencil,
        component: ReturJualForm,
        props: { onSuccess: loadRetur, editData: data },
        type: 'form_edit',
      });
    } catch {
      toast.error('Gagal memuat data retur');
    }
  };

  const handleRowClick = (r) => setSelectedId(r.idreturjual === selectedId ? null : r.idreturjual);

  const handleCancel = async (e, id) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Batalkan Retur',
      message: 'Batalkan retur ini? Stok akan dikembalikan seperti semula.',
      confirmText: 'Batalkan',
      cancelText: 'Batal',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await api.put(`/returjual/${id}/cancel`);
      toast.success('Retur dibatalkan');
      if (selectedId === id) setSelectedId(null);
      loadRetur();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  const handleCetak = async () => {
    if (!selectedId) return;
    try {
      const { data } = await api.get(`/returjual/${selectedId}`);
      printNotaRetur(data, user);
    } catch {
      toast.error('Gagal memuat data untuk cetak');
    }
  };

  const selectedRow = retur.find(r => r.idreturjual === selectedId);

  return (
    <div className="flex flex-col h-full">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Retur Penjualan</h2>
          <p className="text-sm text-dark-300">Catat retur / pengembalian barang dari customer</p>
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
            <Plus className="w-4 h-4" /> Retur Baru
          </button>
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 pb-3 shrink-0">
        <div className="bg-white rounded-2xl border border-primary-50 p-3 grid grid-cols-2 gap-3 md:grid-cols-3">

          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Kode Retur</label>
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

      {/* Grid */}
      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          
          <div className="overflow-y-auto scrollbar-thin">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-primary-50 bg-warm-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode Jual</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-20">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-dark-300">Tidak ada data retur</td></tr>
                )}
                {paginatedItems.map((r) => {
                  const isSelected = selectedId === r.idreturjual;
                  return (
                    <tr key={r.idreturjual}
                      onClick={() => handleRowClick(r)}
                      onDoubleClick={() => handleEdit(r)}
                      className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${
                        r.status === 'VOID'
                          ? 'bg-red-50/30 opacity-60'
                          : isSelected
                            ? 'bg-primary-50 ring-1 ring-inset ring-primary-200'
                            : 'hover:bg-warm-50/30'
                      }`}>
                      <td className="px-4 py-3 text-xs font-mono font-semibold text-dark-400">{r.kodereturjual}</td>
                      <td className="px-4 py-3 text-dark-400 text-xs">{String(r.tgltrans || '').slice(0, 10)}</td>
                      <td className="px-4 py-3 text-dark-500">{r.namacustomer || '-'}</td>
                      <td className="px-4 py-3 text-xs font-mono text-dark-300">{r.kodejual || '-'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-accent-600">{formatRupiah(r.total)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                          r.status === 'VOID' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {r.status === 'VOID' ? 'VOID' : 'AKTIF'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.status !== 'VOID' && (
                          <button
                            onClick={(e) => handleCancel(e, r.idreturjual)}
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
