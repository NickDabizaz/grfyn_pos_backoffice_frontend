import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import { useAuthStore } from '../../../store/authStore';
import { formatRupiah, today } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, Printer, Pencil, Undo2, XCircle } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import useTabStore from '../../../store/tabStore';
import ReturBeliForm from './ReturBeliForm';
import { BrowseSupplierModal } from '../../../lib/formHelpers';
import { useConfirm } from '../../../components/ui/ConfirmDialog';

function printNotaRetur(data, user) {
  const items = data.items || [];
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Nota Retur Beli - ${data.kodereturbeli}</title>
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
<p class="center" style="color:#888;margin:0 0 12px">NOTA RETUR PEMBELIAN</p>
<div class="info">
  <span>Kode Retur</span><span>${data.kodereturbeli}</span>
  <span>Tanggal</span><span>${String(data.tgltrans || '').slice(0, 10)}</span>
  <span>Supplier</span><span>${data.namasupplier || '-'}</span>
  <span>Kode Beli</span><span>${data.kodebeli || '-'}</span>
</div>
<table><thead><tr>
  <th style="width:32px">No</th><th>Kode</th><th>Nama Barang</th>
  <th class="r" style="width:50px">Jml</th>
  <th class="c" style="width:60px">Sat</th>
  <th class="r" style="width:90px">Harga</th>
  <th class="r" style="width:100px">Subtotal</th>
</tr></thead><tbody>
${items.map((item, i) => `<tr>
  <td class="c">${i + 1}</td>
  <td>${item.kodebarang || ''}</td>
  <td>${item.namabarang || ''}</td>
  <td class="r">${item.jml}</td>
  <td class="c">${item.satuan || ''}</td>
  <td class="r">${Number(item.harga).toLocaleString('id-ID')}</td>
  <td class="r">${Number(item.subtotal).toLocaleString('id-ID')}</td>
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

export default function ReturBeli({ isActive }) {
  const user    = useAuthStore(s => s.user);
  const openTab = useTabStore(s => s.openTab);
  const confirm = useConfirm();

  const [retur, setRetur]             = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [filterKode, setFilterKode]         = useState('');
  const [filterSupplier, setFilterSupplier] = useState(null);
  const [tglAwal, setTglAwal]               = useState(today());
  const [tglAkhir, setTglAkhir]             = useState(today());

  const [showSupplierModal, setShowSupplierModal] = useState(false);

  const loadRetur = useCallback(() => {
    const params = {};
    if (filterKode)     params.search     = filterKode;
    if (filterSupplier) params.idsupplier = filterSupplier.idsupplier;
    params.tglwal   = tglAwal;
    params.tglakhir = tglAkhir;
    api.get('/returbeli', { params }).then(r => setRetur(r.data)).catch(() => {});
  }, [filterKode, filterSupplier, tglAwal, tglAkhir]);

  useEffect(() => { loadRetur(); }, [loadRetur]);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(retur, 20);
  useEffect(() => { resetPage(); }, [filterKode, filterSupplier, tglAwal, tglAkhir]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRetur();
    setTimeout(() => setRefreshing(false), 300);
  };

  const handleTambah = () => {
    openTab({ label: 'Retur Pembelian Baru', icon: Undo2, component: ReturBeliForm, props: { onSuccess: loadRetur }, type: 'form_add' });
  };

  const handleEdit = async (r) => {
    if (r.status === 'CANCELLED') return toast.error('Retur CANCELLED tidak dapat diedit');
    if (r.status !== 'DRAFT') return toast.error('Hanya retur DRAFT yang dapat diedit');
    try {
      const { data } = await api.get(`/returbeli/${r.idreturbeli}`);
      openTab({
        label: `Edit ${r.kodereturbeli}`,
        icon: Pencil,
        component: ReturBeliForm,
        props: { onSuccess: loadRetur, editData: data },
        type: 'form_edit',
      });
    } catch {
      toast.error('Gagal memuat data retur');
    }
  };

  const handleRowClick = (r) => setSelectedId(r.idreturbeli === selectedId ? null : r.idreturbeli);

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
      await api.put(`/returbeli/${id}/cancel`);
      toast.success('Retur dibatalkan');
      if (selectedId === id) setSelectedId(null);
      loadRetur();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  const handleUnapprove = async (e, id) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Batal Approve Retur Pembelian',
      message: 'Kembalikan Retur Pembelian ini ke DRAFT? Stok dan kartu hutang retur akan dibalik.',
      confirmText: 'Batal Approve',
      cancelText: 'Tutup',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await api.put(`/returbeli/${id}/unapprove`);
      toast.success('Approve Retur Pembelian dibatalkan');
      loadRetur();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal batal approve');
    }
  };

  const handleCetak = async () => {
    if (!selectedId) return;
    try {
      const { data } = await api.get(`/returbeli/${selectedId}`);
      printNotaRetur(data, user);
    } catch {
      toast.error('Gagal memuat data untuk cetak');
    }
  };

  const selectedRow = retur.find(r => r.idreturbeli === selectedId);

  return (
    <div className="flex flex-col h-full">

      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Retur Pembelian</h2>
          <p className="text-sm text-dark-300">Catat retur / pengembalian barang ke supplier</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedRow && selectedRow.status === 'APPROVED' && (
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
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Supplier</label>
            <div className="flex gap-1.5">
              <div className="flex-1 flex items-center px-2.5 py-2 rounded-lg border border-primary-100 bg-warm-50/40 text-xs min-h-[34px] overflow-hidden">
                {filterSupplier
                  ? <span className="text-dark-500 truncate">{filterSupplier.namasupplier}</span>
                  : <span className="text-dark-300">Semua supplier</span>
                }
              </div>
              <button onClick={() => setShowSupplierModal(true)}
                className="px-2.5 py-1.5 rounded-lg border border-primary-100 text-[10px] font-semibold text-dark-400 hover:bg-warm-50 shrink-0">
                Browse
              </button>
              {filterSupplier && (
                <button onClick={() => setFilterSupplier(null)}
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Supplier</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode Beli</th>
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
                  const isSelected = selectedId === r.idreturbeli;
                  return (
                    <tr key={r.idreturbeli}
                      onClick={() => handleRowClick(r)}
                      onDoubleClick={() => handleEdit(r)}
                      className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${
                        r.status === 'CANCELLED'
                          ? 'bg-red-50/30 opacity-60'
                          : isSelected
                            ? 'bg-primary-50 ring-1 ring-inset ring-primary-200'
                            : 'hover:bg-warm-50/30'
                      }`}>
                      <td className="px-4 py-3 text-xs font-mono font-semibold text-dark-400">{r.kodereturbeli}</td>
                      <td className="px-4 py-3 text-dark-400 text-xs">{String(r.tgltrans || '').slice(0, 10)}</td>
                      <td className="px-4 py-3 text-dark-500">{r.namasupplier || '-'}</td>
                      <td className="px-4 py-3 text-xs font-mono text-dark-300">{r.kodebeli || '-'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-accent-600">{formatRupiah(r.total)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                          r.status === 'CANCELLED'
                            ? 'bg-red-50 text-red-600'
                            : r.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-amber-50 text-amber-600'
                        }`}>
                          {r.status || 'DRAFT'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {r.status === 'APPROVED' && (
                            <button
                              onClick={(e) => handleUnapprove(e, r.idreturbeli)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors">
                              <XCircle className="w-3 h-3" /> Batal Approve
                            </button>
                          )}
                          {r.status !== 'CANCELLED' && (
                            <button
                              onClick={(e) => handleCancel(e, r.idreturbeli)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                              Hapus
                            </button>
                          )}
                        </div>
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

      {showSupplierModal && (
        <BrowseSupplierModal
          onSelect={s => { setFilterSupplier(s); setShowSupplierModal(false); }}
          onClose={() => setShowSupplierModal(false)}
        />
      )}
    </div>
  );
}
