import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../api/axios';
import { useAuthStore } from '../../../store/authStore';
import { formatRupiah, today } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, Printer, Pencil, CheckCircle, XCircle } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import useTabStore from '../../../store/tabStore';
import PenjualanForm from './PenjualanForm';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';
import { BrowseCustomerModal, BrowseLokasiModal } from '../../../lib/formHelpers';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { printFakturA4 } from '../../../lib/fakturPrint';
import { canAccess, useMenuAccess } from '../../../hooks/useMenuAccess';

function toDateInputValue(value) {
  if (!value) return today();
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return today();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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

export default function Penjualan({ isActive }) {
  const user           = useAuthStore(s => s.user);
  const openOrFocusTab = useTabStore(s => s.openOrFocusTab);
  const requestRefresh = useTabStore(s => s.requestRefresh);
  const refreshToken   = useTabStore(s => s.refreshTokens?.['penjualan.transaksi'] || s.refreshTokens?.['penjualan']);
  const confirm        = useConfirm();
  const lastRowClickRef = useRef({ id: null, at: 0 });
  const editRequestRef = useRef(null);
  const { access } = useMenuAccess('penjualan.transaksi');

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

  useEffect(() => { loadJual(); }, [loadJual, refreshToken]);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(jual, 20);
  useEffect(() => { resetPage(); }, [filterKode, filterCustomer, filterLokasi, tglAwal, tglAkhir]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadJual();
    setTimeout(() => setRefreshing(false), 300);
  };

  const handleTambah = () => {
    if (!canAccess(access, 'tambah')) return toast.error('Tidak memiliki akses tambah');
    openOrFocusTab({ label: 'Penjualan Baru', icon: Plus, component: PenjualanForm, props: { onSuccess: loadJual }, type: 'form_add', kodemenu: 'penjualan-add' });
  };

  const handleEdit = async (j) => {
    if (!canAccess(access, 'ubah')) return toast.error('Tidak memiliki akses ubah');
    if (editRequestRef.current === j.idjual) return;
    editRequestRef.current = j.idjual;
    try {
      const { data } = await api.get(`/jual/${j.idjual}`);
      openOrFocusTab({
        label: `Edit ${j.kodejual}`,
        icon: Pencil,
        component: PenjualanForm,
        props: { onSuccess: loadJual, editData: data },
        type: 'form_edit',
        kodemenu: `penjualan-edit-${j.idjual}`,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat data penjualan', {
        id: `jual-detail-${j.idjual}`,
      });
    } finally {
      editRequestRef.current = null;
    }
  };

  const handleApprove = async () => {
    if (!canAccess(access, 'approve')) return toast.error('Tidak memiliki akses approve');
    const confirmed = await confirm({
      title: 'Approve Penjualan',
      message: 'Approve Penjualan ini?',
      confirmText: 'Approve',
      cancelText: 'Batal',
      variant: 'primary',
    });
    if (!confirmed) return;
    try {
      await api.put(`/jual/${selectedRow.idjual}/approve`);
      toast.success('Penjualan diapprove');
      loadJual();
      requestRefresh('penjualan.bpk');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal approve');
    }
  };

  const handleRowClick = (j) => {
    const now = Date.now();
    const last = lastRowClickRef.current;
    if (last.id === j.idjual && now - last.at < 400) {
      lastRowClickRef.current = { id: null, at: 0 };
      handleEdit(j);
      return;
    }
    lastRowClickRef.current = { id: j.idjual, at: now };
    setSelectedId(j.idjual === selectedId ? null : j.idjual);
  };

  const handleBatalTransaksi = async () => {
    if (!canAccess(access, 'bataltransaksi')) return toast.error('Tidak memiliki akses batal transaksi');
    const confirmed = await confirm({
      title: 'Batalkan Penjualan',
      message: 'Batalkan penjualan DRAFT ini?',
      confirmText: 'Batalkan',
      cancelText: 'Batal',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await api.put(`/jual/${selectedRow.idjual}/cancel`);
      toast.success('Penjualan dibatalkan');
      if (selectedId === selectedRow.idjual) setSelectedId(null);
      loadJual();
      requestRefresh('penjualan.bpk');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  const handleUnapprove = async () => {
    if (!canAccess(access, 'batalapprove')) return toast.error('Tidak memiliki akses batal approve');
    try {
      const { data: check } = await api.get(`/jual/${selectedRow.idjual}/check-edit`);
      if (!check.canEdit) {
        return toast.error(check.message || 'Hapus pelunasan piutang terlebih dahulu');
      }
    } catch {}
    const confirmed = await confirm({
      title: 'Batal Approve Penjualan',
      message: 'Batal approve akan menghapus kartu stok penjualan dan mengembalikan transaksi ke DRAFT.',
      confirmText: 'Batal Approve',
      cancelText: 'Tutup',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await api.put(`/jual/${selectedRow.idjual}/unapprove`);
      toast.success('Approve penjualan dibatalkan');
      loadJual();
      requestRefresh('penjualan.bpk');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal batal approve');
    }
  };

  const handleCetak = async () => {
    if (!selectedId) return;
    if (!canAccess(access, 'cetak')) return toast.error('Tidak memiliki akses cetak');
    try {
      const { data } = await api.get(`/jual/${selectedId}`);
      printFakturA4({
        title: 'FAKTUR PENJUALAN',
        codeLabel: 'Kode Jual',
        code: data.kodejual,
        partnerLabel: 'Customer',
        partner: data.namacustomer,
        data,
        user,
      });
    } catch {
      toast.error('Gagal memuat data untuk cetak');
    }
  };

  const selectedRow = jual.find(j => j.idjual === selectedId);
  const formatJenisJual = (value) => {
    if (value === 'PENJUALAN LUNAS') return 'JUAL LUNAS';
    if (value === 'PENJUALAN') return 'JUAL';
    return value || 'JUAL';
  };

  return (
    <div className="flex flex-col h-full">

      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Penjualan</h2>
          <p className="text-sm text-dark-300">Catat penjualan barang ke customer</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedRow && selectedRow.status !== 'CANCELLED' && canAccess(access, 'cetak') && (
            <button onClick={handleCetak}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-50 border border-primary-200 text-primary-600 text-sm font-semibold hover:bg-primary-100 transition-colors">
              <Printer className="w-4 h-4" /> Cetak
            </button>
          )}
          {selectedRow && selectedRow.status === 'DRAFT' && canAccess(access, 'approve') && (
            <button onClick={handleApprove}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm font-semibold hover:bg-emerald-100 transition-colors">
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
          )}
          {selectedRow && selectedRow.status === 'APPROVED' && canAccess(access, 'batalapprove') && (
            <button onClick={handleUnapprove}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 text-sm font-semibold hover:bg-amber-100 transition-colors">
              <XCircle className="w-4 h-4" /> Batal Approve
            </button>
          )}
          {selectedRow && selectedRow.status === 'DRAFT' && canAccess(access, 'bataltransaksi') && (
            <button onClick={handleBatalTransaksi}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors">
              Batal Transaksi
            </button>
          )}
          {canAccess(access, 'tambah') && <button onClick={handleTambah}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold">
            <Plus className="w-4 h-4" /> Penjualan Baru
          </button>}
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

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
                  className="px-2 py-1.5 rounded-lg border border-red-100 text-[10px] text-red-400 hover:bg-red-50 shrink-0">✕</button>
              )}
            </div>
          </div>

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

          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Tanggal</label>
            <div className="flex items-center gap-1.5">
              <Flatpickr value={tglAwal} onChange={([d]) => setTglAwal(toDateInputValue(d))}
                options={{ dateFormat: 'Y-m-d', locale: 'id' }}
                className="flatpickr-input flex-1 text-xs" placeholder="Dari tanggal" />
              <span className="text-[10px] text-dark-300 shrink-0">s/d</span>
              <Flatpickr value={tglAkhir} onChange={([d]) => setTglAkhir(toDateInputValue(d))}
                options={{ dateFormat: 'Y-m-d', locale: 'id' }}
                className="flatpickr-input flex-1 text-xs" placeholder="Sampai tanggal" />
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Lokasi</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Jenis</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-dark-300">Tidak ada data penjualan</td></tr>
                )}
                {paginatedItems.map((j) => {
                  const isSelected = selectedId === j.idjual;
                  return (
                    <tr key={j.idjual}
                      onClick={() => handleRowClick(j)}
                      className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${
                        j.status === 'CANCELLED'
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
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600">
                          {formatJenisJual(j.jenistransaksi)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {j.status === 'CANCELLED' ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">CANCELLED</span>
                        ) : j.status === 'CONFIRMED' ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">CONFIRMED</span>
                        ) : j.status === 'APPROVED' ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">APPROVED</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">DRAFT</span>
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
