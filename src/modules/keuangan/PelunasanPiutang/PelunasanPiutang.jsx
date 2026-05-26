import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../api/axios';
import { useAuthStore } from '../../../store/authStore';
import { formatRupiah, today, toDateInputValue } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Printer, CheckCircle, XCircle } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import useTabStore from '../../../store/tabStore';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import PelunasanPiutangForm from './PelunasanPiutangForm';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';

const STATUS_BADGE = {
  DRAFT: 'bg-amber-50 text-amber-600 border-amber-100',
  APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  CANCELLED: 'bg-red-50 text-red-500 border-red-100',
};

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

function printFaktur(data, user) {
  const rows = data?.details || [];
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Faktur Pelunasan Piutang - ${esc(data?.kodepelunasan)}</title>
<style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#222;font-size:11px;margin:0}.head{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #222;padding-bottom:12px}h1{font-size:18px;margin:0 0 4px}h2{font-size:15px;margin:0;text-align:right}.muted{color:#666}.info{display:grid;grid-template-columns:120px 1fr 120px 1fr;gap:5px 10px;margin:16px 0 12px}.label{font-weight:700;color:#444}table{width:100%;border-collapse:collapse;margin-top:8px}th{border:1px solid #333;background:#f2f2f2;padding:6px;text-align:left;font-size:10px}td{border:1px solid #bbb;padding:6px;vertical-align:top}.c{text-align:center}.r{text-align:right}.sign{display:grid;grid-template-columns:1fr 1fr;gap:80px;margin-top:42px;text-align:center}.line{border-top:1px solid #222;margin-top:54px;padding-top:5px}</style></head><body>
<div class="head"><div><h1>${esc(user?.namatenant || 'GRFYN POS')}</h1><div class="muted">${esc(user?.tenant_alamat || user?.alamat || '')}</div></div><div><h2>FAKTUR PELUNASAN PIUTANG</h2><div class="muted">${esc(data?.kodepelunasan)}</div></div></div>
<div class="info"><div class="label">Customer</div><div>${esc(data?.namacustomer || '-')}</div><div class="label">Tanggal</div><div>${esc(String(data?.tgltrans || '').slice(0, 10))}</div><div class="label">Metode</div><div>${esc(data?.metodbayar || '-')}</div><div class="label">Status</div><div>${esc(data?.status || '-')}</div><div class="label">Catatan</div><div>${esc(data?.catatan || '-')}</div></div>
<table><thead><tr><th class="c" style="width:36px">No</th><th>Kode Transaksi</th><th class="r" style="width:150px">Jumlah Bayar</th></tr></thead><tbody>
${rows.map((r, i) => `<tr><td class="c">${i + 1}</td><td>${esc(r.kodetrans)}</td><td class="r">${formatRupiah(r.amount)}</td></tr>`).join('')}
</tbody><tfoot><tr><td colspan="2" class="r"><b>Total</b></td><td class="r"><b>${formatRupiah(data?.total_amount)}</b></td></tr></tfoot></table>
<div class="sign"><div><div>Dibuat Oleh</div><div class="line">${esc(user?.namauser || user?.username || '')}</div></div><div><div>Disetujui Oleh</div><div class="line">&nbsp;</div></div></div></body></html>`;
  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

export default function PelunasanPiutang() {
  const user = useAuthStore(s => s.user);
  const openOrFocusTab = useTabStore(s => s.openOrFocusTab);
  const confirm = useConfirm();
  const lastRowClickRef = useRef({ id: null, at: 0 });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [tglAwal, setTglAwal] = useState(today());
  const [tglAkhir, setTglAkhir] = useState(today());
  const [selectedId, setSelectedId] = useState(null);

  const { access } = useMenuAccess('keuangan.pelunasanpiutang');
  const canTambah = canAccess(access, 'tambah');

  const loadData = useCallback(() => {
    setLoading(true);
    const params = { tglwal: tglAwal, tglakhir: tglAkhir };
    if (selectedCustomer) params.idcustomer = selectedCustomer;
    api.get('/pelunasanpiutang', { params }).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [selectedCustomer, tglAwal, tglAkhir]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { api.get('/customer').then(r => setCustomers(r.data)).catch(() => {}); }, []);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(data, 20);
  useEffect(() => { resetPage(); }, [selectedCustomer, tglAwal, tglAkhir]);

  const openForm = (editData = null) => {
    openOrFocusTab({
      label: editData ? `Edit ${editData.kodepelunasan}` : 'Pelunasan Piutang Baru',
      icon: Plus,
      component: PelunasanPiutangForm,
      props: { onSuccess: loadData, editData },
      type: editData ? 'form_edit' : 'form_add',
      kodemenu: editData ? `pelunasanpiutang-edit-${editData.idpelunasan}` : 'pelunasanpiutang-add',
    });
  };

  const handleEdit = async (row) => {
    if (!canAccess(access, 'ubah')) return toast.error('Tidak memiliki akses ubah');
    try {
      const { data } = await api.get(`/pelunasanpiutang/${row.idpelunasan}`);
      openForm(data);
    } catch {
      toast.error('Gagal memuat pelunasan piutang');
    }
  };

  const handleRowClick = (row) => {
    const now = Date.now();
    const last = lastRowClickRef.current;
    if (last.id === row.idpelunasan && now - last.at < 400) {
      lastRowClickRef.current = { id: null, at: 0 };
      handleEdit(row);
      return;
    }
    lastRowClickRef.current = { id: row.idpelunasan, at: now };
    setSelectedId(row.idpelunasan === selectedId ? null : row.idpelunasan);
  };

  const action = async (e, row, type) => {
    e.stopPropagation();
    const map = {
      approve: { url: 'approve', title: 'Approve Pelunasan Piutang', msg: 'Approve pelunasan piutang ini?', ok: 'Approve', access: 'approve' },
      unapprove: { url: 'unapprove', title: 'Batal Approve Pelunasan Piutang', msg: 'Kembalikan pelunasan piutang ini ke DRAFT?', ok: 'Batal Approve', access: 'batalapprove' },
      batal: { url: 'batal', title: 'Batalkan Pelunasan Piutang', msg: 'Batalkan pelunasan piutang DRAFT ini?', ok: 'Batalkan', access: 'bataltransaksi' },
    }[type];
    if (!canAccess(access, map.access)) return toast.error(`Tidak memiliki akses ${map.ok.toLowerCase()}`);
    const ok = await confirm({ title: map.title, message: map.msg, confirmText: map.ok, cancelText: 'Tutup', variant: type === 'approve' ? 'primary' : 'danger' });
    if (!ok) return;
    try {
      await api.put(`/pelunasanpiutang/${row.idpelunasan}/${map.url}`);
      toast.success(`${map.ok} berhasil`);
      if (type === 'batal' && selectedId === row.idpelunasan) setSelectedId(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal proses transaksi');
    }
  };

  const handleCetak = async () => {
    if (!selectedId) return;
    if (!canAccess(access, 'cetak')) return toast.error('Tidak memiliki akses cetak');
    const { data } = await api.get(`/pelunasanpiutang/${selectedId}`);
    printFaktur(data, user);
  };

  const selectedRow = data.find(row => row.idpelunasan === selectedId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div><h2 className="text-xl font-bold text-dark-500">Pelunasan Piutang</h2><p className="text-sm text-dark-300">Kelola pelunasan piutang customer</p></div>
        <div className="flex items-center gap-2">
          {selectedRow && selectedRow.status !== 'CANCELLED' && canAccess(access, 'cetak') && (
            <button onClick={handleCetak} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-50 border border-primary-200 text-primary-600 text-sm font-semibold hover:bg-primary-100"><Printer className="w-4 h-4" /> Cetak</button>
          )}
          {canTambah && <button onClick={() => openForm()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold"><Plus className="w-4 h-4" /> Pelunasan Baru</button>}
          <button onClick={loadData} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      <div className="px-6 pb-3 shrink-0">
        <div className="bg-white rounded-2xl border border-primary-50 p-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          <div><label className="block text-[10px] font-semibold text-dark-300 mb-1">Customer</label><select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20"><option value="">Semua Customer</option>{customers.map(c => <option key={c.idcustomer} value={c.idcustomer}>{c.namacustomer}</option>)}</select></div>
          <div><label className="block text-[10px] font-semibold text-dark-300 mb-1">Tanggal Awal</label><Flatpickr value={tglAwal} onChange={([d]) => setTglAwal(toDateInputValue(d))} options={{ dateFormat: 'Y-m-d', locale: 'id' }} className="flatpickr-input w-full text-xs" /></div>
          <div><label className="block text-[10px] font-semibold text-dark-300 mb-1">Tanggal Akhir</label><Flatpickr value={tglAkhir} onChange={([d]) => setTglAkhir(toDateInputValue(d))} options={{ dateFormat: 'Y-m-d', locale: 'id' }} className="flatpickr-input w-full text-xs" /></div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <table className="w-full">
            <thead className="sticky top-0 z-10"><tr className="border-b border-primary-50 bg-warm-50/50"><th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th><th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th><th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Customer</th><th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Total</th><th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Metode</th><th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th><th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-44">Aksi</th></tr></thead>
            <tbody>
              {paginatedItems.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-dark-300">Tidak ada data</td></tr>}
              {paginatedItems.map(pp => {
                const isSelected = selectedId === pp.idpelunasan;
                return (
                  <tr key={pp.idpelunasan}
                    onClick={() => handleRowClick(pp)}
                    onDoubleClick={() => handleEdit(pp)}
                    className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${
                      pp.status === 'CANCELLED'
                        ? 'bg-red-50/30 opacity-60'
                        : isSelected
                          ? 'bg-primary-50 ring-1 ring-inset ring-primary-200'
                          : 'hover:bg-warm-50/30'
                    }`}>
                    <td className="px-4 py-3 text-xs font-mono font-semibold text-dark-400">{pp.kodepelunasan}</td>
                    <td className="px-4 py-3 text-dark-400 text-xs">{String(pp.tgltrans || '').slice(0, 10)}</td>
                    <td className="px-4 py-3 text-dark-500">{pp.namacustomer || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-accent-600">{formatRupiah(pp.total_amount)}</td>
                    <td className="px-4 py-3 text-center"><span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600">{pp.metodbayar}</span></td>
                    <td className="px-4 py-3 text-center"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGE[pp.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>{pp.status}</span></td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {pp.status === 'APPROVED' && canAccess(access, 'batalapprove') && <button onClick={(e) => action(e, pp, 'unapprove')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"><XCircle className="w-3 h-3" /> Batal Approve</button>}
                        {pp.status === 'DRAFT' && canAccess(access, 'approve') && <button onClick={(e) => action(e, pp, 'approve')} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"><CheckCircle className="w-3 h-3" /> Approve</button>}
                        {pp.status === 'DRAFT' && canAccess(access, 'bataltransaksi') && <button onClick={(e) => action(e, pp, 'batal')} className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition-colors">Batal</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
      </div>
    </div>
  );
}
