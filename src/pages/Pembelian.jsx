import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { formatRupiah, today } from '../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, Printer, Pencil } from 'lucide-react';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import useTabStore from '../store/tabStore';
import PembelianForm from './PembelianForm';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';
import { BrowseSupplierModal, BrowseLokasiModal } from '../lib/formHelpers';
import { useConfirm } from '../components/ui/ConfirmDialog';

// ─── Print utility ───────────────────────────────────────────────
function printFaktur(data, user) {
  const items = data.items || [];
  const ppnTotal = items.reduce((s, i) => s + parseFloat(i.ppn || 0), 0);
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Faktur Pembelian - ${data.kodebeli}</title>
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
<p class="center" style="color:#888;margin:0 0 12px">FAKTUR PEMBELIAN</p>
<div class="info">
  <span>Kode Beli</span><span>${data.kodebeli}</span>
  <span>Tanggal</span><span>${String(data.tgltrans || '').slice(0, 10)}</span>
  <span>Supplier</span><span>${data.namasupplier || '-'}</span>
  <span>Lokasi</span><span>${data.namalokasi || '-'}</span>
</div>
<table><thead><tr>
  <th style="width:32px">No</th><th>Kode</th><th>Nama Barang</th>
  <th class="c" style="width:60px">Sat</th>
  <th class="r" style="width:50px">Jml</th>
  <th class="r" style="width:90px">Harga</th>
  <th class="r" style="width:80px">PPN</th>
  <th class="r" style="width:100px">Subtotal</th>
</tr></thead><tbody>
${items.map((item, i) => `<tr>
  <td class="c">${i + 1}</td>
  <td>${item.kodebarang || ''}</td>
  <td>${item.namabarang || ''}</td>
  <td class="c">${item.satuan || ''}</td>
  <td class="r">${item.jml}</td>
  <td class="r">${Number(item.harga).toLocaleString('id-ID')}</td>
  <td class="r">${Number(item.ppn || 0).toLocaleString('id-ID')}</td>
  <td class="r">${Number(item.subtotal).toLocaleString('id-ID')}</td>
</tr>`).join('')}
</tbody></table>
<div class="totals">
  <div>Total PPN: <strong>${ppnTotal.toLocaleString('id-ID')}</strong></div>
  <div class="grand">Grand Total: ${Number(data.grandtotal).toLocaleString('id-ID')}</div>
</div>
</body></html>`;
  const w = window.open('', '_blank', 'width=820,height=640');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}

// ─── Main Component ───────────────────────────────────────────────
export default function Pembelian({ isActive }) {
  const user          = useAuthStore(s => s.user);
  const openTab       = useTabStore(s => s.openTab);
  const openOrFocusTab = useTabStore(s => s.openOrFocusTab);
  const confirm = useConfirm();

  const [beli, setBeli]             = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters — tanggal default hari ini
  const [filterKode, setFilterKode]         = useState('');
  const [filterSupplier, setFilterSupplier] = useState(null);
  const [filterLokasi, setFilterLokasi]     = useState(null);
  const [tglAwal, setTglAwal]               = useState(today());
  const [tglAkhir, setTglAkhir]             = useState(today());

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showLokasiModal, setShowLokasiModal]     = useState(false);

  const loadBeli = useCallback(() => {
    const params = {};
    if (filterKode)     params.search     = filterKode;
    if (filterSupplier) params.idsupplier = filterSupplier.idsupplier;
    if (filterLokasi)   params.idlokasi   = filterLokasi.idlokasi;
    params.tglwal   = tglAwal;
    params.tglakhir = tglAkhir;
    api.get('/beli', { params }).then(r => setBeli(r.data)).catch(() => {});
  }, [filterKode, filterSupplier, filterLokasi, tglAwal, tglAkhir]);

  useEffect(() => { loadBeli(); }, [loadBeli]);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(beli, 20);
  useEffect(() => { resetPage(); }, [filterKode, filterSupplier, filterLokasi, tglAwal, tglAkhir]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadBeli();
    setTimeout(() => setRefreshing(false), 300);
  };

  const handleTambah = () => {
    openOrFocusTab({ label: 'Pembelian Baru', icon: Plus, component: PembelianForm, props: { onSuccess: loadBeli }, type: 'form_add', kodemenu: 'pembelian-add' });
  };

  const handleEdit = async (b) => {
    if (b.status === 'VOID') return toast.error('Pembelian VOID tidak dapat diedit');
    try {
      const { data } = await api.get(`/beli/${b.idbeli}`);
      openOrFocusTab({
        label: `Edit ${b.kodebeli}`,
        icon: Pencil,
        component: PembelianForm,
        props: { onSuccess: loadBeli, editData: data },
        type: 'form_edit',
        kodemenu: `pembelian-edit-${b.idbeli}`,
      });
    } catch {
      toast.error('Gagal memuat data pembelian');
    }
  };

  const handleRowClick = (b) => setSelectedId(b.idbeli === selectedId ? null : b.idbeli);

  const handleCancel = async (e, id) => {
    e.stopPropagation();
    try {
      const { data: check } = await api.get(`/beli/${id}/check-edit`);
      if (!check.canEdit) {
        if (check.reason === 'HUTANG_LUNAS') {
          return toast.error(check.message || 'Hapus pelunasan hutang terlebih dahulu');
        }
      }
    } catch {}
    const confirmed = await confirm({
      title: 'Batalkan Pembelian',
      message: 'Batalkan pembelian ini? Stok akan dikembalikan.',
      confirmText: 'Batalkan',
      cancelText: 'Batal',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await api.put(`/beli/${id}/cancel`);
      toast.success('Pembelian dibatalkan');
      if (selectedId === id) setSelectedId(null);
      loadBeli();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  const handleCetak = async () => {
    if (!selectedId) return;
    try {
      const { data } = await api.get(`/beli/${selectedId}`);
      printFaktur(data, user);
    } catch {
      toast.error('Gagal memuat data untuk cetak');
    }
  };

  const selectedRow = beli.find(b => b.idbeli === selectedId);
  const formatJenisBeli = (value) => {
    if (value === 'PEMBELIAN LUNAS') return 'BELI LUNAS';
    if (value === 'PEMBELIAN') return 'BELI';
    return value || 'BELI';
  };

  return (
    <div className="flex flex-col h-full">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Pembelian</h2>
          <p className="text-sm text-dark-300">Catat pembelian barang dari supplier</p>
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
            <Plus className="w-4 h-4" /> Pembelian Baru
          </button>
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="px-6 pb-3 shrink-0">
        <div className="bg-white rounded-2xl border border-primary-50 p-3 grid grid-cols-2 gap-3 md:grid-cols-4">

          {/* Kode Beli */}
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Kode Beli</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
              <input type="text" value={filterKode}
                onChange={e => setFilterKode(e.target.value.toUpperCase())}
                placeholder="Cari kode..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
          </div>

          {/* Supplier */}
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
                  className="px-2 py-1.5 rounded-lg border border-red-100 text-[10px] text-red-400 hover:bg-red-50 shrink-0">✕</button>
              )}
            </div>
          </div>

          {/* Lokasi */}
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Lokasi</label>
            <div className="flex gap-1.5">
              <div className="flex-1 flex items-center px-2.5 py-2 rounded-lg border border-primary-100 bg-warm-50/40 text-xs min-h-[34px] overflow-hidden">
                {filterLokasi
                  ? <span className="text-dark-500 truncate">{filterLokasi.namalokasi}</span>
                  : <span className="text-dark-300">Semua lokasi</span>
                }
              </div>
              <button onClick={() => setShowLokasiModal(true)}
                className="px-2.5 py-1.5 rounded-lg border border-primary-100 text-[10px] font-semibold text-dark-400 hover:bg-warm-50 shrink-0">
                Browse
              </button>
              {filterLokasi && (
                <button onClick={() => setFilterLokasi(null)}
                  className="px-2 py-1.5 rounded-lg border border-red-100 text-[10px] text-red-400 hover:bg-red-50 shrink-0">✕</button>
              )}
            </div>
          </div>

          {/* Tanggal */}
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Tanggal</label>
            <div className="flex items-center gap-1.5">
              <Flatpickr value={tglAwal} onChange={([d]) => setTglAwal(d.toISOString().slice(0, 10))}
                options={{ dateFormat: 'Y-m-d', locale: 'id' }}
                className="flatpickr-input flex-1 text-xs" placeholder="Dari tanggal" />
              <span className="text-[10px] text-dark-300 shrink-0">s/d</span>
              <Flatpickr value={tglAkhir} onChange={([d]) => setTglAkhir(d.toISOString().slice(0, 10))}
                options={{ dateFormat: 'Y-m-d', locale: 'id' }}
                className="flatpickr-input flex-1 text-xs" placeholder="Sampai tanggal" />
            </div>
          </div>

        </div>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          
          <div className="overflow-y-auto scrollbar-thin">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-primary-50 bg-warm-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Supplier</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Lokasi</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Jenis</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-20">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-dark-300">Tidak ada data pembelian</td></tr>
                )}
                {paginatedItems.map((b) => {
                  const isSelected = selectedId === b.idbeli;
                  return (
                    <tr key={b.idbeli}
                      onClick={() => handleRowClick(b)}
                      onDoubleClick={() => handleEdit(b)}
                      className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${
                        b.status === 'VOID'
                          ? 'bg-red-50/30 opacity-60'
                          : isSelected
                            ? 'bg-primary-50 ring-1 ring-inset ring-primary-200'
                            : 'hover:bg-warm-50/30'
                      }`}>
                      <td className="px-4 py-3 text-xs font-mono font-semibold text-dark-400">{b.kodebeli}</td>
                      <td className="px-4 py-3 text-dark-400 text-xs">{String(b.tgltrans || '').slice(0, 10)}</td>
                      <td className="px-4 py-3 text-dark-500">{b.namasupplier || '-'}</td>
                      <td className="px-4 py-3 text-dark-400 text-xs">{b.namalokasi || '-'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-accent-600">{formatRupiah(b.grandtotal)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600">
                          {formatJenisBeli(b.jenistransaksi)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {b.status === 'VOID' ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">VOID</span>
                        ) : b.statuslunas === 'LUNAS' ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">LUNAS</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">BELUM LUNAS</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {b.status !== 'VOID' && (
                          <button
                            onClick={(e) => handleCancel(e, b.idbeli)}
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

      {showSupplierModal && (
        <BrowseSupplierModal
          onSelect={s => { setFilterSupplier(s); setShowSupplierModal(false); }}
          onClose={() => setShowSupplierModal(false)}
        />
      )}
      {showLokasiModal && (
        <BrowseLokasiModal
          onSelect={l => { setFilterLokasi(l); setShowLokasiModal(false); }}
          onClose={() => setShowLokasiModal(false)}
        />
      )}
    </div>
  );
}
