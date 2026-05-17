import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import { today, toDateInputValue } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, Printer, CheckCircle, XCircle } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import useTabStore from '../../../store/tabStore';
import TransferStokForm from './TransferStokForm';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';
import { useAuthStore } from '../../../store/authStore';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';

const STATUS_BADGE = {
  DRAFT:  'bg-amber-50 text-amber-600 border-amber-100',
  APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  CANCELLED: 'bg-red-50 text-red-400 border-red-100',
};

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const num = (value) => Number(value || 0).toLocaleString('id-ID');

function printFakturTransferStok(data, user) {
  const rows = data?.items || [];
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Faktur Transfer Stok - ${esc(data?.kodetransferstok)}</title>
<style>
  @page{size:A4;margin:14mm}
  *{box-sizing:border-box}
  body{font-family:Arial,sans-serif;color:#222;font-size:11px;margin:0}
  .head{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #222;padding-bottom:12px}
  h1{font-size:18px;margin:0 0 4px;letter-spacing:.4px}
  h2{font-size:15px;margin:0;text-align:right}
  .muted{color:#666}
  .info{display:grid;grid-template-columns:120px 1fr 120px 1fr;gap:5px 10px;margin:16px 0 12px}
  .label{font-weight:700;color:#444}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th{border:1px solid #333;background:#f2f2f2;padding:6px;text-align:left;font-size:10px}
  td{border:1px solid #bbb;padding:6px;vertical-align:top}
  .c{text-align:center}.r{text-align:right}
  .sign{display:grid;grid-template-columns:1fr 1fr 1fr;gap:50px;margin-top:42px;text-align:center}
  .line{border-top:1px solid #222;margin-top:54px;padding-top:5px}
</style></head><body>
<div class="head">
  <div>
    <h1>${esc(user?.namatenant || 'GRFYN POS')}</h1>
    <div class="muted">${esc(user?.tenant_alamat || user?.alamat || '')}</div>
    <div class="muted">${esc(user?.tenant_hp || user?.hp || '')}</div>
  </div>
  <div>
    <h2>FAKTUR TRANSFER STOK</h2>
    <div class="muted">${esc(data?.kodetransferstok)}</div>
  </div>
</div>
<div class="info">
  <div class="label">Kode</div><div>${esc(data?.kodetransferstok)}</div>
  <div class="label">Tanggal</div><div>${esc(String(data?.tgltrans || '').slice(0, 10))}</div>
  <div class="label">Lokasi Asal</div><div>${esc(data?.namalokasi || '-')}</div>
  <div class="label">Lokasi Tujuan</div><div>${esc(data?.namalokasitujuan || '-')}</div>
  <div class="label">Status</div><div>${esc(data?.status || '-')}</div>
  <div class="label">Catatan</div><div>${esc(data?.catatan || '-')}</div>
</div>
<table><thead><tr>
  <th class="c" style="width:34px">No</th>
  <th style="width:92px">Kode</th>
  <th>Nama Barang</th>
  <th class="c" style="width:60px">Satuan</th>
  <th class="r" style="width:80px">Jumlah</th>
</tr></thead><tbody>
${rows.map((item, i) => `<tr>
  <td class="c">${i + 1}</td>
  <td>${esc(item.kodebarang || '')}</td>
  <td>${esc(item.namabarang || '')}</td>
  <td class="c">${esc(item.satuan || item.satuankecil || '')}</td>
  <td class="r">${num(item.jml)}</td>
</tr>`).join('')}
</tbody></table>
<div class="sign"><div><div>Dibuat Oleh</div><div class="line">${esc(user?.namauser || user?.username || '')}</div></div><div><div>Dikirim Oleh</div><div class="line">&nbsp;</div></div><div><div>Diterima Oleh</div><div class="line">&nbsp;</div></div></div>
</body></html>`;
  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

export default function TransferStok() {
  const user = useAuthStore(s => s.user);
  const openOrFocusTab = useTabStore(s => s.openOrFocusTab);
  const confirm = useConfirm();
  const { access } = useMenuAccess('stok.transferstok');
  const canTambah = canAccess(access, 'tambah');

  const [list, setList]             = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterKode, setFilterKode] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [tglAwal, setTglAwal]   = useState(today());
  const [tglAkhir, setTglAkhir] = useState(today());

  const loadData = useCallback(() => {
    const params = { tglwal: tglAwal, tglakhir: tglAkhir };
    if (filterKode) params.search = filterKode;
    if (filterStatus) params.status = filterStatus;
    api.get('/transfer-stok', { params }).then(r => setList(r.data)).catch(() => {});
  }, [filterKode, filterStatus, tglAwal, tglAkhir]);

  useEffect(() => { loadData(); }, [loadData]);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(list, 20);
  useEffect(() => { resetPage(); }, [filterKode, filterStatus, tglAwal, tglAkhir]);

  const handleRefresh = () => { setRefreshing(true); loadData(); setTimeout(() => setRefreshing(false), 300); };

  const handleTambah = () => {
    openOrFocusTab({ label: 'Transfer Stok Baru', icon: Plus, component: TransferStokForm, props: { onSuccess: loadData }, type: 'form_add', kodemenu: 'transferstok-add' });
  };

  const handleEdit = async (row) => {
    if (!canAccess(access, 'ubah')) return toast.error('Tidak memiliki akses ubah');
    try {
      const { data } = await api.get(`/transfer-stok/${row.idtransferstok}`);
      openOrFocusTab({
        label: `Edit ${data.kodetransferstok}`,
        icon: Plus,
        component: TransferStokForm,
        props: { onSuccess: loadData, editData: data },
        type: 'form_edit',
        kodemenu: `transferstok-edit-${data.idtransferstok}`,
      });
    } catch {
      toast.error('Gagal memuat transfer stok');
    }
  };

  const handleApprove = async (e, id) => {
    e.stopPropagation();
    if (!canAccess(access, 'approve')) return toast.error('Tidak memiliki akses approve');
    const ok = await confirm({ title: 'Approve Transfer Stok', message: 'Approve transfer stok ini? Stok lokasi asal berkurang dan lokasi tujuan bertambah.', confirmText: 'Approve', cancelText: 'Batal', variant: 'primary' });
    if (!ok) return;
    try {
      await api.put(`/transfer-stok/${id}/approve`);
      toast.success('Transfer stok diapprove');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal approve');
    }
  };

  const handleUnapprove = async (e, id) => {
    e.stopPropagation();
    if (!canAccess(access, 'batalapprove')) return toast.error('Tidak memiliki akses batal approve');
    const ok = await confirm({ title: 'Batal Approve Transfer', message: 'Kembalikan transfer stok ini ke DRAFT? Mutasi kartu stok transfer akan dihapus.', confirmText: 'Batal Approve', cancelText: 'Tutup', variant: 'danger' });
    if (!ok) return;
    try {
      await api.put(`/transfer-stok/${id}/unapprove`);
      toast.success('Approve transfer stok dibatalkan');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal batal approve');
    }
  };

  const handleBatal = async (e, id) => {
    e.stopPropagation();
    if (!canAccess(access, 'bataltransaksi')) return toast.error('Tidak memiliki akses batal transaksi');
    const ok = await confirm({ title: 'Batalkan Transfer Stok', message: 'Batalkan transfer stok DRAFT ini?', confirmText: 'Batalkan', cancelText: 'Tutup', variant: 'danger' });
    if (!ok) return;
    try {
      await api.put(`/transfer-stok/${id}/batal`);
      toast.success('Transfer stok dibatalkan');
      if (selectedId === id) setSelectedId(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan');
    }
  };

  const handleCetak = async () => {
    if (!selectedId) return;
    if (!canAccess(access, 'cetak')) return toast.error('Tidak memiliki akses cetak');
    try {
      const { data } = await api.get(`/transfer-stok/${selectedId}`);
      printFakturTransferStok(data, user);
    } catch {
      toast.error('Gagal memuat faktur transfer stok');
    }
  };

  const selectedRow = list.find(ts => ts.idtransferstok === selectedId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Transfer Stok</h2>
          <p className="text-sm text-dark-300">Pindahkan stok antar lokasi</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedRow && selectedRow.status !== 'CANCELLED' && canAccess(access, 'cetak') && (
            <button onClick={handleCetak}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-50 border border-primary-200 text-primary-600 text-sm font-semibold hover:bg-primary-100">
              <Printer className="w-4 h-4" /> Cetak
            </button>
          )}
          {canTambah && <button onClick={handleTambah}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold">
            <Plus className="w-4 h-4" /> Transfer Baru
          </button>}
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-6 pb-3 shrink-0">
        <div className="bg-white rounded-2xl border border-primary-50 p-3 grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Kode Transfer</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
              <input type="text" value={filterKode} onChange={e => setFilterKode(e.target.value.toUpperCase())} placeholder="Cari kode..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20">
              <option value="">Semua Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="APPROVED">APPROVED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Tanggal</label>
            <div className="flex items-center gap-1.5">
              <Flatpickr value={tglAwal} onChange={([d]) => setTglAwal(toDateInputValue(d))} options={{ dateFormat: 'Y-m-d', locale: 'id' }} className="flatpickr-input flex-1 text-xs" placeholder="Dari" />
              <span className="text-[10px] text-dark-300 shrink-0">s/d</span>
              <Flatpickr value={tglAkhir} onChange={([d]) => setTglAkhir(toDateInputValue(d))} options={{ dateFormat: 'Y-m-d', locale: 'id' }} className="flatpickr-input flex-1 text-xs" placeholder="Sampai" />
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Lokasi Asal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Lokasi Tujuan</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-44">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-dark-300">Tidak ada data transfer stok</td></tr>
                )}
                {paginatedItems.map((ts) => (
                  <tr key={ts.idtransferstok}
                    onClick={() => setSelectedId(ts.idtransferstok)}
                    onDoubleClick={() => handleEdit(ts)}
                    className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${selectedId === ts.idtransferstok ? 'bg-warm-100 ring-1 ring-inset ring-warm-200' : 'hover:bg-warm-50/30'}`}>
                    <td className="px-4 py-3 text-xs font-mono font-semibold text-dark-400">{ts.kodetransferstok}</td>
                    <td className="px-4 py-3 text-dark-400 text-xs">{String(ts.tgltrans || '').slice(0, 10)}</td>
                    <td className="px-4 py-3 text-dark-500">{ts.namalokasi || '-'}</td>
                    <td className="px-4 py-3 text-dark-500">{ts.namalokasitujuan || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGE[ts.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>{ts.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {ts.status === 'APPROVED' && canAccess(access, 'batalapprove') && (
                          <button onClick={(e) => handleUnapprove(e, ts.idtransferstok)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100">
                            <XCircle className="w-3 h-3" /> Batal Approve
                          </button>
                        )}
                        {ts.status === 'DRAFT' && (
                          <>
                            {canAccess(access, 'approve') && (
                              <button onClick={(e) => handleApprove(e, ts.idtransferstok)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                                <CheckCircle className="w-3 h-3" /> Approve
                              </button>
                            )}
                            {canAccess(access, 'bataltransaksi') && (
                              <button onClick={(e) => handleBatal(e, ts.idtransferstok)} className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-red-50 text-red-500 hover:bg-red-100">Batal</button>
                            )}
                          </>
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
      </div>
    </div>
  );
}
