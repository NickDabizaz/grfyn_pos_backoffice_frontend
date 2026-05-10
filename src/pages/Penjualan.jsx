import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { formatRupiah, today } from '../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, Printer, Pencil, Ban } from 'lucide-react';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import useTabStore from '../store/tabStore';
import PenjualanForm from './PenjualanForm';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';
import { BrowseCustomerModal, BrowseLokasiModal } from '../lib/formHelpers';

function printFaktur(data, user) {
  const items = data.items || [];
  const ppnTotal = items.reduce((s, i) => s + parseFloat(i.ppn || 0), 0);
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Faktur Penjualan - ${data.kodejual}</title>
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
<p class="center" style="color:#888;margin:0 0 12px">FAKTUR PENJUALAN</p>
<div class="info">
  <span>Kode Jual</span><span>${data.kodejual}</span>
  <span>Tanggal</span><span>${String(data.tgltrans || '').slice(0, 10)}</span>
  <span>Customer</span><span>${data.namacustomer || '-'}</span>
  <span>Status</span><span>${data.status || '-'}</span>
</div>
<table><thead><tr>
  <th style="width:32px">No</th><th>Kode</th><th>Nama Barang</th>
  <th class="c" style="width:60px">Sat</th>
  <th class="r" style="width:50px">Jml</th>
  <th class="r" style="width:90px">Harga</th>
  <th class="r" style="width:60px">Diskon</th>
  <th class="r" style="width:80px">PPN</th>
  <th class="r" style="width:100px">Subtotal</th>
</tr></thead><tbody>
${items.map((item, i) => `<tr>
  <td class="c">${i + 1}</td>
  <td>${item.kodebarang || ''}</td>
  <td>${item.namabarang || ''}</td>
  <td class="c">${item.satuan || item.satuankecil || ''}</td>
  <td class="r">${item.jml}</td>
  <td class="r">${Number(item.harga).toLocaleString('id-ID')}</td>
  <td class="r">${Number(item.diskon || 0).toLocaleString('id-ID')}</td>
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

export default function Penjualan({ isActive }) {
  const user            = useAuthStore(s => s.user);
  const openTab         = useTabStore(s => s.openTab);
  const openOrFocusTab  = useTabStore(s => s.openOrFocusTab);

  const [jual, setJual]             = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [filterKode, setFilterKode]         = useState('');
  const [filterCustomer, setFilterCustomer] = useState(null);
  const [filterLokasi, setFilterLokasi]     = useState(null);
  const [tglAwal, setTglAwal]               = useState(today());
  const [tglAkhir, setTglAkhir]             = useState(today());

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showLokasiModal, setShowLokasiModal]     = useState(false);

  const loadJual = useCallback(() => {
    const params = {};
    if (filterKode)     params.search     = filterKode;
    if (filterCustomer) params.idcustomer = filterCustomer.idcustomer;
    if (filterLokasi)   params.idlokasi   = filterLokasi.idlokasi;
    params.tglwal   = tglAwal;
    params.tglakhir = tglAkhir;
    api.get('/jual', { params }).then(r => setJual(r.data)).catch(() => {});
  }, [filterKode, filterCustomer, filterLokasi, tglAwal, tglAkhir]);

  useEffect(() => { loadJual(); }, [loadJual]);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(jual, 20);
  useEffect(() => { resetPage(); }, [filterKode, filterCustomer, filterLokasi, tglAwal, tglAkhir]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadJual();
    setTimeout(() => setRefreshing(false), 300);
  };

  const handleTambah = () => {
    openOrFocusTab({ label: 'Penjualan Baru', icon: Plus, component: PenjualanForm, props: { onSuccess: loadJual }, type: 'form_add', kodemenu: 'penjualan-add' });
  };

  const handleEdit = async (j) => {
    if (j.status === 'VOID') return toast.error('Penjualan VOID tidak dapat diedit');
    try {
      const { data: check } = await api.get(`/jual/${j.idjual}/check-edit`);
      if (!check.canEdit) {
        if (check.reason === 'PIUTANG_LUNAS') {
          return toast.error(check.message || 'Hapus pelunasan terlebih dahulu');
        }
        if (check.reason === 'HAS_RETUR') {
          return toast.error(check.message || 'Batalkan retur terlebih dahulu');
        }
      }
      const { data } = await api.get(`/jual/${j.idjual}`);
      openOrFocusTab({
        label: `Edit ${j.kodejual}`,
        icon: Pencil,
        component: PenjualanForm,
        props: { onSuccess: loadJual, editData: data },
        type: 'form_edit',
        kodemenu: `penjualan-edit-${j.idjual}`,
      });
    } catch {
      toast.error('Gagal memuat data penjualan');
    }
  };

  const handleRowClick = (j) => setSelectedId(j.idjual === selectedId ? null : j.idjual);

  const handleCancel = async (e, id) => {
    e.stopPropagation();
    try {
      const { data: check } = await api.get(`/jual/${id}/check-edit`);
      if (!check.canEdit) {
        if (check.reason === 'PIUTANG_LUNAS') {
          return toast.error(check.message || 'Hapus pelunasan terlebih dahulu');
        }
        if (check.reason === 'HAS_RETUR') {
          return toast.error(`Terdapat retur: ${check.returs?.join(', ')}. Batalkan retur terlebih dahulu.`);
        }
      }
    } catch {}
    if (!confirm('Batalkan penjualan ini? Stok akan dikembalikan.')) return;
    try {
      await api.put(`/jual/${id}/cancel`);
      toast.success('Penjualan dibatalkan');
      if (selectedId === id) setSelectedId(null);
      loadJual();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  const handleCetak = async () => {
    if (!selectedId) return;
    try {
      const { data } = await api.get(`/jual/${selectedId}`);
      printFaktur(data, user);
    } catch {
      toast.error('Gagal memuat data untuk cetak');
    }
  };

  const selectedRow = jual.find(j => j.idjual === selectedId);

  return (
    <div className="flex flex-col h-full">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Penjualan</h2>
          <p className="text-sm text-dark-300">Catat transaksi penjualan ke customer</p>
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
            <Plus className="w-4 h-4" /> Penjualan Baru
          </button>
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 pb-3 shrink-0">
        <div className="bg-white rounded-2xl border border-primary-50 p-3 grid grid-cols-2 gap-3 md:grid-cols-4">

          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Kode Jual</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
              <input type="text" value={filterKode}
                onChange={e => setFilterKode(e.target.value.toUpperCase())}
                placeholder="Cari kode..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
          </div>

          {/* Customer */}
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
                  className="px-2 py-1.5 rounded-lg border border-red-100 text-[10px] text-red-400 hover:bg-red-50 shrink-0">&times;</button>
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Lokasi</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Jenis</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-20">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-dark-300">Tidak ada data penjualan</td></tr>
                )}
                {paginatedItems.map((j) => {
                  const isSelected = selectedId === j.idjual;
                  return (
                    <tr key={j.idjual}
                      onClick={() => handleRowClick(j)}
                      onDoubleClick={() => handleEdit(j)}
                      className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${
                        j.status === 'VOID'
                          ? 'bg-red-50/30 opacity-60'
                          : isSelected
                            ? 'bg-primary-50 ring-1 ring-inset ring-primary-200'
                            : 'hover:bg-warm-50/30'
                      }`}>
                      <td className="px-4 py-3 text-xs font-mono font-semibold text-dark-400">{j.kodejual}</td>
                      <td className="px-4 py-3 text-dark-400 text-xs">{String(j.tgltrans || '').slice(0, 10)}</td>
                      <td className="px-4 py-3 text-dark-500">{j.namacustomer || '-'}</td>
                      <td className="px-4 py-3 text-dark-400 text-xs">{j.namalokasi || '-'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-accent-600">{formatRupiah(j.grandtotal)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600">{j.jenis || 'JUAL'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {j.status === 'VOID' ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">VOID</span>
                        ) : j.status === 'LUNAS' ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">LUNAS</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">{j.status}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {j.status !== 'VOID' && (
                          <button
                            onClick={(e) => handleCancel(e, j.idjual)}
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
      {showLokasiModal && (
        <BrowseLokasiModal
          onSelect={l => { setFilterLokasi(l); setShowLokasiModal(false); }}
          onClose={() => setShowLokasiModal(false)}
        />
      )}
    </div>
  );
}
