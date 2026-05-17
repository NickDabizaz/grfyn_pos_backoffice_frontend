import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, Printer, CheckCircle, XCircle } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import useTabStore from '../../../store/tabStore';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';
import SaldoAwalStokForm from './SaldoAwalStokForm';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { useAuthStore } from '../../../store/authStore';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const num = (value) => Number(value || 0).toLocaleString('id-ID');

function printFakturSaldoStok(data, user) {
  const rows = data?.items || [];
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Faktur Saldo Awal Stok - ${esc(data?.kodesaldostok)}</title>
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
  .sign{display:grid;grid-template-columns:1fr 1fr;gap:80px;margin-top:42px;text-align:center}
  .line{border-top:1px solid #222;margin-top:54px;padding-top:5px}
  @media print{body{margin:0}}
</style></head><body>
<div class="head">
  <div>
    <h1>${esc(user?.namatenant || 'GRFYN POS')}</h1>
    <div class="muted">${esc(user?.tenant_alamat || user?.alamat || '')}</div>
    <div class="muted">${esc(user?.tenant_hp || user?.hp || '')}</div>
  </div>
  <div>
    <h2>FAKTUR SALDO AWAL STOK</h2>
    <div class="muted">${esc(data?.kodesaldostok)}</div>
  </div>
</div>
<div class="info">
  <div class="label">Kode</div><div>${esc(data?.kodesaldostok)}</div>
  <div class="label">Tanggal</div><div>${esc(String(data?.tgltrans || '').slice(0, 10))}</div>
  <div class="label">Lokasi</div><div>${esc(data?.namalokasi || '-')}</div>
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
  <td class="r">${num(item.jml ?? item.qty)}</td>
</tr>`).join('')}
</tbody></table>
<div class="sign"><div><div>Dibuat Oleh</div><div class="line">${esc(user?.namauser || user?.username || '')}</div></div><div><div>Disetujui Oleh</div><div class="line">&nbsp;</div></div></div>
</body></html>`;
  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

const STATUS_BADGE = {
  DRAFT: 'bg-amber-50 text-amber-600 border-amber-100',
  APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  CANCELLED: 'bg-red-50 text-red-500 border-red-100',
};

export default function SaldoAwalStok({ isActive }) {
  const user = useAuthStore(s => s.user);
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const openOrFocusTab = useTabStore((s) => s.openOrFocusTab);
  const confirm = useConfirm();
  const { access } = useMenuAccess('stok.saldoawal');
  const canTambah = canAccess(access, 'tambah');
  const canUbah = canAccess(access, 'ubah');

  const load = useCallback(async () => {
    const { data: res } = await api.get('/stok/saldostok');
    setData(res);
  }, []);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(data, 20);
  useEffect(() => { resetPage(); }, [search]);
  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const handleTambah = () => { openOrFocusTab({ label: 'Saldo Awal Baru', icon: Plus, component: SaldoAwalStokForm, props: { onSuccess: load }, type: 'form_add', kodemenu: 'saldoawal-add' }); };

  const handleEdit = async (row) => {
    if (!canAccess(access, 'ubah')) return toast.error('Tidak memiliki akses ubah');
    try {
      const { data } = await api.get(`/stok/saldostok/${row.idsaldostok}`);
      openOrFocusTab({
        label: `Edit ${data.kodesaldostok}`,
        icon: Plus,
        component: SaldoAwalStokForm,
        props: { onSuccess: load, editData: data },
        type: 'form_edit',
        kodemenu: `saldoawal-edit-${data.idsaldostok}`,
      });
    } catch {
      toast.error('Gagal memuat saldo awal stok');
    }
  };

  const handleRowClick = (row) => {
    setSelectedId(row.idsaldostok);
  };

  const handleApprove = async (e, id) => {
    e.stopPropagation();
    if (!canAccess(access, 'approve')) return toast.error('Tidak memiliki akses approve');
    const ok = await confirm({ title: 'Approve Saldo Awal', message: 'Approve saldo awal stok ini?', confirmText: 'Approve', cancelText: 'Batal', variant: 'primary' });
    if (!ok) return;
    try {
      await api.put(`/stok/saldoawal/${id}/approve`);
      toast.success('Saldo awal stok diapprove');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal approve');
    }
  };

  const handleUnapprove = async (e, id) => {
    e.stopPropagation();
    if (!canAccess(access, 'batalapprove')) return toast.error('Tidak memiliki akses batal approve');
    const ok = await confirm({ title: 'Batal Approve Saldo Awal', message: 'Kembalikan saldo awal stok ini ke DRAFT? Kartu stok saldo awal akan dihapus.', confirmText: 'Batal Approve', cancelText: 'Tutup', variant: 'danger' });
    if (!ok) return;
    try {
      await api.put(`/stok/saldoawal/${id}/unapprove`);
      toast.success('Approve saldo awal stok dibatalkan');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal batal approve');
    }
  };

  const handleBatal = async (e, id) => {
    e.stopPropagation();
    if (!canAccess(access, 'bataltransaksi')) return toast.error('Tidak memiliki akses batal transaksi');
    const ok = await confirm({ title: 'Batalkan Saldo Awal', message: 'Batalkan saldo awal stok DRAFT ini?', confirmText: 'Batalkan', cancelText: 'Tutup', variant: 'danger' });
    if (!ok) return;
    try {
      await api.put(`/stok/saldoawal/${id}/batal`);
      toast.success('Saldo awal stok dibatalkan');
      if (selectedId === id) setSelectedId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan');
    }
  };

  const handleCetak = async () => {
    if (!selectedId) return;
    if (!canAccess(access, 'cetak')) return toast.error('Tidak memiliki akses cetak');
    try {
      const { data } = await api.get(`/stok/saldostok/${selectedId}`);
      printFakturSaldoStok(data, user);
    } catch {
      toast.error('Gagal memuat faktur saldo stok');
    }
  };

  const selectedRow = data.find(s => s.idsaldostok === selectedId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div><h2 className="text-xl font-bold text-dark-500">Saldo Awal Stok</h2><p className="text-sm text-dark-300">Input saldo awal stok per barang</p></div>
        <div className="flex items-center gap-2">
          {selectedRow && selectedRow.status !== 'CANCELLED' && canAccess(access, 'cetak') && (
            <button onClick={handleCetak} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-50 border border-primary-200 text-primary-600 text-sm font-semibold hover:bg-primary-100">
              <Printer className="w-4 h-4" /> Cetak
            </button>
          )}
          {canTambah && <button onClick={handleTambah} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold"><Plus className="w-4 h-4" /> Saldo Awal Baru</button>}
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <div className="overflow-y-auto scrollbar-thin">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-primary-50 bg-warm-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th><th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th><th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Lokasi</th><th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Catatan</th><th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th><th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-44">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((s) => (
                  <tr key={s.idsaldostok}
                    onClick={() => handleRowClick(s)}
                    onDoubleClick={() => handleEdit(s)}
                    className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${selectedId === s.idsaldostok ? 'bg-warm-100 ring-1 ring-inset ring-warm-200' : 'hover:bg-warm-50/30'}`}>
                    <td className="px-4 py-3 text-xs font-mono text-dark-300">{s.kodesaldostok}</td><td className="px-4 py-3 text-dark-400">{s.tgltrans?.slice(0,10)}</td><td className="px-4 py-3 text-dark-400">{s.namalokasi || '-'}</td><td className="px-4 py-3 text-dark-400">{s.catatan || '-'}</td><td className="px-4 py-3 text-center"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGE[s.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>{s.status}</span></td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {s.status === 'APPROVED' && canAccess(access, 'batalapprove') && (
                          <button onClick={(e) => handleUnapprove(e, s.idsaldostok)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100">
                            <XCircle className="w-3 h-3" /> Batal Approve
                          </button>
                        )}
                        {s.status === 'DRAFT' && canAccess(access, 'approve') && (
                          <button onClick={(e) => handleApprove(e, s.idsaldostok)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                        )}
                        {s.status === 'DRAFT' && canAccess(access, 'bataltransaksi') && (
                          <button onClick={(e) => handleBatal(e, s.idsaldostok)} className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-red-50 text-red-500 hover:bg-red-100">Batal</button>
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
