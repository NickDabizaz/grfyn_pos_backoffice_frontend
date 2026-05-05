import { useState, useEffect } from 'react';
import api from '../api/axios';
import { formatRupiah } from '../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import SearchableSelect from '../components/ui/SearchableSelect';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import { useTabView } from '../hooks/useTabView';
import TabContainer from '../components/ui/TabContainer';
import FormPanel from '../components/ui/FormPanel';

const EMPTY_DETAIL = { idakun: '', catatan: '', amount: '' };

export default function Kas() {
  const [kas, setKas]                         = useState([]);
  const [search, setSearch]                   = useState('');
  const [editId, setEditId]                   = useState(null);
  const [akun, setAkun]                       = useState([]);
  const [form, setForm]                       = useState({ details: [{ ...EMPTY_DETAIL }] });
  const [expandedId, setExpandedId] = useState(null);
  const [expandedDetails, setExpandedDetails] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const { activeTab, setActiveTab } = useTabView('grid');

  const load = () => {
    const params = search ? { search } : {};
    api.get('/kas', { params }).then((r) => setKas(r.data));
  };
  useEffect(() => { load(); }, [search]);

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(kas, 20);
  useEffect(() => { resetPage(); }, [search]);

  useEffect(() => { api.get('/akun').then((r) => setAkun(r.data)); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([new Promise((r) => { load(); setTimeout(r, 200); }), api.get('/akun').then((r) => setAkun(r.data))]);
    setRefreshing(false);
  };

  const totalJumlah = form.details.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

  const addDetail = () => setForm({ ...form, details: [...form.details, { ...EMPTY_DETAIL }] });
  const removeDetail = (idx) => {
    if (form.details.length === 1) return;
    setForm({ ...form, details: form.details.filter((_, i) => i !== idx) });
  };
  const updateDetail = (idx, field, value) => {
    const updated = form.details.map((d, i) => i === idx ? { ...d, [field]: value } : d);
    setForm({ ...form, details: updated });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      details: form.details.map((d) => ({
        idakun: d.idakun,
        catatan: d.catatan,
        amount: parseFloat(d.amount) || 0,
      })),
    };
    try {
      if (editId) { await api.put(`/kas/${editId}`, payload); toast.success('Kas diupdate'); }
      else { await api.post('/kas', payload); toast.success('Kas ditambah'); }
      setEditId(null);
      setForm({ details: [{ ...EMPTY_DETAIL }] });
      setActiveTab('grid');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const handleEdit = (k) => {
    setEditId(k.idkas);
    api.get(`/kas/${k.idkas}`).then((r) => {
      const details = r.data.details?.map((d) => ({
        idakun : d.idakun,
        catatan: d.catatan || '',
        amount : d.amount || '',
      })) || [{ ...EMPTY_DETAIL }];
      setForm({ details });
      setActiveTab('form');
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus kas ini?')) return;
    try { await api.delete(`/kas/${id}`); toast.success('Kas dihapus'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    try {
      const r = await api.get(`/kas/${id}`);
      setExpandedDetails(r.data.details || []);
      setExpandedId(id);
    } catch (err) { toast.error('Gagal memuat detail'); }
  };

  const handleTambah = () => {
    setEditId(null);
    setForm({ details: [{ ...EMPTY_DETAIL }] });
    setActiveTab('form');
  };

  const handleBatal = () => {
    setEditId(null);
    setForm({ details: [{ ...EMPTY_DETAIL }] });
    setActiveTab('grid');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-500">Kas</h2>
          <p className="text-sm text-dark-300">Manajemen kas masuk & keluar</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleTambah}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary-500/20 active:scale-[0.98]">
          <Plus className="w-4 h-4" /> Tambah Kas
        </button>
          <button onClick={handleRefresh} disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh halaman">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
      </div>
      </div>

      <TabContainer activeTab={activeTab} onTabChange={setActiveTab}>
        <TabContainer.Tab id="grid" label="Daftar Kas">
          <div>
            <div className="relative max-w-md mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())}
                placeholder="Cari kode kas..." className="input-upper w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>

            <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full min-w-[600px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-primary-50 bg-warm-50/50">
                      <th className="text-left    px-3 py-3 text-xs font-semibold text-dark-300">Kode Kas</th>
                      <th className="text-left    px-3 py-3 text-xs font-semibold text-dark-300">Tanggal</th>
                      <th className="text-right   px-3 py-3 text-xs font-semibold text-dark-300">Jumlah</th>
                      <th className="text-center  px-3 py-3 text-xs font-semibold text-dark-300">Status</th>
                      <th className="text-center  px-3 py-3 text-xs font-semibold text-dark-300 w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((k) => (
                      <>
                      <tr key={k.idkas} className="border-b border-primary-50/50 hover:bg-warm-50/30 transition-colors text-sm">
                        <td className="px-3 py-3 text-xs font-mono text-dark-300">{k.kodekas}</td>
                        <td className="px-3 py-3 text-dark-400">{k.tanggal?.slice(0, 10)}</td>
                        <td className="px-3 py-3 text-right font-mono font-semibold text-dark-500">{formatRupiah(k.jumlah)}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-lg ${k.status === 'MASUK' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                            {k.status || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => toggleExpand(k.idkas)} className="p-1.5 rounded-lg hover:bg-accent-50 text-dark-300 hover:text-accent-500">
                              {expandedId === k.idkas ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => handleEdit(k)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-300 hover:text-primary-500"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDelete(k.idkas)} className="p-1.5 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === k.idkas && (
                        <tr key={`d-${k.idkas}`}>
                          <td colSpan={5} className="px-4 py-3 bg-warm-50/30">
                            <div className="text-xs space-y-1">
                              <p className="font-semibold text-dark-400 mb-2">Detail Kas</p>
                              {expandedDetails.map((d) => (
                                <div key={d.idkasdtl} className="flex justify-between py-1.5 px-3 rounded-lg bg-white border border-primary-50">
                                  <div>
                                    <span className="font-medium text-dark-500">{d.namaakun || d.idakun}</span>
                                    {d.catatan && <span className="text-dark-300 ml-2">- {d.catatan}</span>}
                                  </div>
                                  <span className="font-mono font-semibold text-dark-500">{formatRupiah(d.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} setPage={setPage} />
            </div>
          </div>
        </TabContainer.Tab>

        <TabContainer.Tab id="form" label={editId ? "Edit Kas" : "Tambah Kas"}>
          <FormPanel mode={editId ? 'ubah' : 'tambah'}>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                {form.details.map((d, idx) => (
                  <div key={idx} className="flex items-end gap-2 p-3 rounded-xl bg-warm-50/50 border border-primary-50">
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-dark-400 mb-1">Akun</label>
                      <SearchableSelect
                        value={d.idakun}
                        onChange={(val) => updateDetail(idx, 'idakun', val)}
                        options={akun.map((a) => ({ value: a.idakun, label: `${a.kodeakun} - ${a.namaakun}` }))}
                        placeholder="Pilih Akun..."
                        required={false}
                      />
                    </div>
                    <div className="flex-[2]">
                      <label className="block text-[10px] font-semibold text-dark-400 mb-1">Catatan</label>
                      <input type="text" value={d.catatan} onChange={(e) => updateDetail(idx, 'catatan', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" placeholder="Catatan..." />
                    </div>
                    <div className="w-32">
                      <label className="block text-[10px] font-semibold text-dark-400 mb-1">Amount</label>
                      <input type="number" value={d.amount} onChange={(e) => updateDetail(idx, 'amount', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-right" placeholder="0" required />
                    </div>
                    <button type="button" onClick={() => removeDetail(idx)}
                      className="p-2 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500 mb-0.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button type="button" onClick={addDetail}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary-100 text-xs font-semibold text-primary-600 hover:bg-primary-50 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Tambah Baris
                </button>
                <div className="text-right">
                  <p className="text-[10px] text-dark-300">Total</p>
                  <p className="text-lg font-bold text-primary-600">{formatRupiah(totalJumlah)}</p>
                </div>
              </div>
            </form>
          </FormPanel>
        </TabContainer.Tab>
      </TabContainer>
    </div>
  );
}
