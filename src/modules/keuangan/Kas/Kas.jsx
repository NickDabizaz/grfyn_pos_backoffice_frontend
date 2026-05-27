import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, Eye, CheckCircle, XCircle, Pencil, Trash2 } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import useTabStore from '../../../store/tabStore';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import KasForm from './KasForm';

export default function Kas({ isActive }) {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const openTab = useTabStore((s) => s.openTab);
  const confirm = useConfirm();
  const lastRowClickRef = useRef({ id: null, at: 0 });

  const { access } = useMenuAccess('keuangan.kas');
  const canTambah = canAccess(access, 'tambah');
  const canUbah = canAccess(access, 'ubah');

  const load = useCallback(async () => {
    const params = search ? { search } : {};
    const { data: res } = await api.get('/kas', { params });
    setData(res);
  }, [search]);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(data, 20);
  useEffect(() => { resetPage(); }, [search]);
  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleTambah = () => {
    openTab({ label: 'Kas', icon: Plus, component: KasForm, props: { mode: 'add', onSuccess: load }, type: 'form_add' });
  };

  const handleEdit = async (k) => {
    if (!k) return;
    if (!canUbah) return toast.error('Tidak memiliki akses ubah');
    try {
      const { data } = await api.get(`/kas/${k.idkas}`);
      openTab({ label: `Edit ${k.kodekas}`, icon: Pencil, component: KasForm, props: { mode: 'edit', id: k.idkas, data, onSuccess: load }, type: 'form_edit' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat kas');
    }
  };

  const handleDetail = (k) => {
    if (!k) return;
    openTab({ label: `Kas: ${k.kodekas}`, component: KasDetail, props: { idkas: k.idkas, kodekas: k.kodekas }, type: 'list' });
  };

  const handleRowClick = (k) => {
    const now = Date.now();
    const last = lastRowClickRef.current;
    if (last.id === k.idkas && now - last.at < 400) {
      lastRowClickRef.current = { id: null, at: 0 };
      handleDetail(k);
      return;
    }
    lastRowClickRef.current = { id: k.idkas, at: now };
    setSelectedId(k.idkas === selectedId ? null : k.idkas);
  };

  const handleAction = async (type) => {
    if (!selectedRow) return;
    const map = {
      approve:   { url: 'approve',   title: 'Approve Kas',         msg: 'Approve transaksi kas ini?',                    ok: 'Approve',       access: 'approve' },
      unapprove: { url: 'unapprove', title: 'Batal Approve Kas',   msg: 'Kembalikan transaksi kas ini ke DRAFT?',         ok: 'Batal Approve', access: 'batalapprove' },
      cancel:    { url: 'cancel',    title: 'Batalkan Kas',        msg: 'Batalkan transaksi kas DRAFT ini?',              ok: 'Batalkan',      access: 'bataltransaksi' },
    }[type];
    if (!canAccess(access, map.access)) return toast.error(`Tidak memiliki akses ${map.ok.toLowerCase()}`);
    const ok = await confirm({ title: map.title, message: map.msg, confirmText: map.ok, cancelText: 'Tutup', variant: type === 'approve' ? 'primary' : 'danger' });
    if (!ok) return;
    try {
      await api.put(`/kas/${selectedRow.idkas}/${map.url}`);
      toast.success(`${map.ok} berhasil`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal proses kas');
    }
  };

  const handleDelete = async () => {
    if (!selectedRow) return;
    if (!canUbah) return toast.error('Tidak memiliki akses hapus');
    const ok = await confirm({ title: 'Hapus Kas', message: 'Hapus permanen transaksi kas ini?', confirmText: 'Hapus', cancelText: 'Tutup', variant: 'danger' });
    if (!ok) return;
    try {
      await api.delete(`/kas/${selectedRow.idkas}`);
      toast.success('Kas berhasil dihapus');
      setSelectedId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus kas');
    }
  };

  const selectedRow = data.find(r => r.idkas === selectedId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div><h2 className="text-xl font-bold text-dark-500">Kas</h2><p className="text-sm text-dark-300">Jurnal kas masuk / keluar</p></div>
        <div className="flex items-center gap-2">
          {canTambah && (
            <button onClick={handleTambah} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold"><Plus className="w-4 h-4" /> Transaksi Kas</button>
          )}
          {selectedRow && (
            <button onClick={() => handleDetail(selectedRow)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50"><Eye className="w-4 h-4" /> Detail</button>
          )}
          {selectedRow?.status === 'DRAFT' && canUbah && (
            <button onClick={() => handleEdit(selectedRow)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-sm font-semibold hover:bg-blue-100"><Pencil className="w-4 h-4" /> Edit</button>
          )}
          {selectedRow?.status === 'DRAFT' && canAccess(access, 'approve') && (
            <button onClick={() => handleAction('approve')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm font-semibold hover:bg-emerald-100"><CheckCircle className="w-4 h-4" /> Approve</button>
          )}
          {selectedRow?.status === 'APPROVED' && canAccess(access, 'batalapprove') && (
            <button onClick={() => handleAction('unapprove')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 text-sm font-semibold hover:bg-amber-100"><XCircle className="w-4 h-4" /> Batal Approve</button>
          )}
          {selectedRow?.status === 'DRAFT' && canAccess(access, 'bataltransaksi') && (
            <button onClick={() => handleAction('cancel')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 text-sm font-semibold hover:bg-orange-100">Batal</button>
          )}
          {selectedRow && selectedRow.status !== 'APPROVED' && canUbah && (
            <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-100"><Trash2 className="w-4 h-4" /> Hapus</button>
          )}
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="relative max-w-md mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())}
            placeholder="Cari kode kas..." className="input-upper w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <div className="overflow-y-auto scrollbar-thin">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-primary-50 bg-warm-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((k) => (
                  <tr key={k.idkas}
                    onClick={() => handleRowClick(k)}
                    onDoubleClick={() => handleDetail(k)}
                    className={`border-b border-primary-50/50 text-sm cursor-pointer select-none transition-colors ${
                      selectedId === k.idkas ? 'bg-primary-50 ring-1 ring-inset ring-primary-200' : 'hover:bg-warm-50/30'
                    }`}>
                    <td className="px-4 py-3 text-xs font-mono text-dark-300">{k.kodekas}</td>
                    <td className="px-4 py-3 text-dark-400">{k.tgltrans?.slice(0,10)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${k.status === 'CANCELLED' ? 'bg-red-50 text-red-600' : k.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{k.status}</span>
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

function KasDetail({ idkas, kodekas, tabId, tabState, updateTabState }) {
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    api.get(`/kas/${idkas}`).then(({ data }) => setDetail(data)).catch(() => {});
  }, [idkas]);

  if (!detail) return <div className="p-6 text-sm text-dark-300">Memuat...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-4 pb-2 border-b border-primary-50 shrink-0">
        <h2 className="text-lg font-bold text-dark-500">Detail Kas: {detail.kodekas}</h2>
        <p className="text-xs text-dark-300">Tanggal: {detail.tgltrans?.slice(0,10)}</p>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-primary-50 bg-warm-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode Akun</th><th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama Akun</th><th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Catatan</th><th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Amount</th>
            </tr></thead>
            <tbody>
              {detail.details?.map((d, i) => (
                <tr key={i} className="border-b border-primary-50/50 text-sm">
                  <td className="px-4 py-3 text-xs font-mono text-dark-300">{d.kodeakun}</td><td className="px-4 py-3 text-dark-500">{d.namaakun}</td><td className="px-4 py-3 text-dark-400">{d.catatan || '-'}</td><td className="px-4 py-3 text-right font-semibold text-dark-500">{Number(d.amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
