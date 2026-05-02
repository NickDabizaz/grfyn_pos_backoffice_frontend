import { useState, useEffect } from 'react';
import api from '../api/axios';
import { formatRupiah } from '../lib/utils';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, X, ChevronDown, RefreshCw } from 'lucide-react';

const INIT_DTL = { idbarang: '', jml: '', satuan: '', harga: '' };
const INIT_FORM = { idbarang: '', details: [] };

export default function Resep() {
  const [resep, setResep]                       = useState([]);
  const [search, setSearch]                     = useState('');
  const [showForm, setShowForm]                 = useState(false);
  const [editId, setEditId]                     = useState(null);
  const [form, setForm]                         = useState({...INIT_FORM});
  const [barangJadi, setBarangJadi]             = useState([]);
  const [barangBaku, setBarangBaku]             = useState([]);
  const [searchBarangJadi, setSearchBarangJadi] = useState('');
  const [searchBarangBaku, setSearchBarangBaku] = useState('');
  const [showView, setShowView] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = () => {
    const params = search ? { search } : {};
    api.get('/resep', { params }).then((r) => setResep(r.data));
  };
  useEffect(() => { load(); }, [search]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => { load(); setTimeout(r, 200); });
    setRefreshing(false);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      api.get('/barang', { params: { jenis: 'BAHAN JADI', search: searchBarangJadi } }).then((r) => setBarangJadi(r.data));
    }, 200);
    return () => clearTimeout(t);
  }, [searchBarangJadi]);

  useEffect(() => {
    const t = setTimeout(() => {
      api.get('/barang', { params: { jenis: 'BAHAN BAKU', search: searchBarangBaku } }).then((r) => setBarangBaku(r.data));
    }, 200);
    return () => clearTimeout(t);
  }, [searchBarangBaku]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.idbarang) return toast.error('Pilih barang jadi');
    if (form.details.length === 0) return toast.error('Tambah minimal 1 bahan baku');
    try {
      if (editId) { await api.put(`/resep/${editId}`, form); toast.success('Resep diupdate'); }
      else { await api.post('/resep', form); toast.success('Resep ditambah'); }
      setShowForm(false); setEditId(null);
      setForm({...INIT_FORM});
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const handleEdit = async (r) => {
    try {
      const { data } = await api.get(`/resep/${r.idresep}`);
      setEditId(r.idresep);
      setForm({
        idbarang: data.idbarang,
        details: data.details.map((d) => ({ idbarang: d.idbarang, jml: d.jml, satuan: d.satuan, harga: d.harga }))
      });
      setSearchBarangJadi(data.namabarang);
      setShowForm(true);
    } catch (err) { toast.error('Gagal memuat resep'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus resep ini?')) return;
    try { await api.delete(`/resep/${id}`); toast.success('Resep dihapus'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const handleView = async (id) => {
    if (showView === id) { setShowView(null); setViewData(null); return; }
    try {
      const { data } = await api.get(`/resep/${id}`);
      setViewData(data);
      setShowView(id);
    } catch (err) { toast.error('Gagal memuat detail'); }
  };

  const addDetail = () => {
    setForm({ ...form, details: [...form.details, {...INIT_DTL}] });
  };

  const removeDetail = (idx) => {
    setForm({ ...form, details: form.details.filter((_, i) => i !== idx) });
  };

  const updateDetail = (idx, field, value) => {
    const updated = [...form.details];
    if (field === 'idbarang') {
      const b = barangBaku.find((b) => b.idbarang === parseInt(value));
      updated[idx] = { ...updated[idx], idbarang: value, satuan: b?.satuankecil || '', harga: b?.hargabeli_terbaru || '' };
    } else {
      updated[idx] = { ...updated[idx], [field]: value };
    }
    setForm({ ...form, details: updated });
  };

  const grandTotal = form.details.reduce((sum, d) => sum + (parseFloat(d.jml) || 0) * (parseFloat(d.harga) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-500">Resep</h2>
          <p className="text-sm text-dark-300">Manajemen resep / formula produk</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing}
            className={`p-2 rounded-xl border border-primary-100 text-dark-400 hover:bg-warm-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh halaman">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => { setEditId(null); setSearchBarangJadi(''); setSearchBarangBaku(''); setForm({...INIT_FORM}); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary-500/20 active:scale-[0.98]">
          <Plus className="w-4 h-4" /> Tambah Resep
        </button>
      </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())}
          placeholder="Cari resep (kode/nama barang)..." className="input-upper w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
      </div>

      <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-primary-50 bg-warm-50/50">
                <th className="text-left   px-4 py-3 text-xs font-semibold text-dark-300">Kode Resep</th>
                <th className="text-left   px-4 py-3 text-xs font-semibold text-dark-300">Barang Jadi</th>
                <th className="text-left   px-4 py-3 text-xs font-semibold text-dark-300">Kode Barang</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-24">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {resep.map((r) => (
                <>
                <tr key={r.idresep} className="border-b border-primary-50/50 hover:bg-warm-50/30 transition-colors text-sm">
                  <td className="px-4 py-3 text-xs font-mono text-dark-500 font-semibold">{r.koderesep}</td>
                  <td className="px-4 py-3 font-medium text-dark-500">{r.namabarang}</td>
                  <td className="px-4 py-3 text-xs text-dark-300">{r.kodebarang}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-lg ${r.status === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {r.status === 1 ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleView(r.idresep)} className="p-1.5 rounded-lg hover:bg-accent-50 text-dark-300 hover:text-accent-500"><ChevronDown className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-300 hover:text-primary-500"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(r.idresep)} className="p-1.5 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
                {showView === r.idresep && viewData && (
                  <tr key={`v-${r.idresep}`}>
                    <td colSpan={5} className="px-4 py-4 bg-warm-50/30">
                      <div className="text-xs space-y-2">
                        <p className="font-semibold text-dark-400">Detail Bahan Baku</p>
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-primary-50 text-dark-300">
                              <th className="text-left  py-1.5 font-semibold">Bahan Baku</th>
                              <th className="text-right py-1.5 font-semibold">Jml</th>
                              <th className="text-left  py-1.5 font-semibold">Satuan</th>
                              <th className="text-right py-1.5 font-semibold">Harga</th>
                              <th className="text-right py-1.5 font-semibold">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewData.details.map((d) => (
                              <tr key={d.idresepdtl} className="border-b border-primary-50/30">
                                <td className="py-1.5 text-dark-500">{d.namabarang}</td>
                                <td className="py-1.5 text-right text-dark-500">{d.jml}</td>
                                <td className="py-1.5 text-dark-400">{d.satuan}</td>
                                <td className="py-1.5 text-right font-mono text-dark-400">{formatRupiah(d.harga)}</td>
                                <td className="py-1.5 text-right font-mono font-semibold text-dark-500">{formatRupiah(d.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
                </>
              ))}
              {resep.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-dark-300 text-sm">Belum ada resep</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{animation: 'fadeIn 0.2s ease'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-3xl shadow-2xl animate-in max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark-500">{editId ? 'Edit' : 'Tambah'} Resep</h3>
              <button onClick={() => setShowForm(false)} className="text-dark-300 hover:text-dark-500"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Barang Jadi</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
                  <input value={searchBarangJadi} onChange={(e) => setSearchBarangJadi(e.target.value.toUpperCase())}
                    placeholder="Cari barang jadi..." className="input-upper w-full pl-9 pr-4 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                </div>
                {searchBarangJadi && (
                  <div className="mt-1 border border-primary-50 rounded-xl max-h-32 overflow-y-auto scrollbar-thin bg-white">
                    {barangJadi.map((b) => (
                      <button key={b.idbarang} type="button" onClick={() => { setForm({...form, idbarang: b.idbarang}); setSearchBarangJadi(b.namabarang); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-warm-50 ${form.idbarang === b.idbarang ? 'bg-primary-50 text-primary-600 font-semibold' : 'text-dark-400'}`}>
                        {b.kodebarang} — {b.namabarang}
                      </button>
                    ))}
                    {barangJadi.length === 0 && <p className="px-3 py-2 text-xs text-dark-300">Tidak ditemukan</p>}
                  </div>
                )}
                {form.idbarang && <p className="text-xs text-accent-600 mt-1 font-medium">{searchBarangJadi}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-dark-400">Bahan Baku</label>
                  <button type="button" onClick={addDetail}
                    className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700">
                    <Plus className="w-3 h-3" /> Tambah Bahan
                  </button>
                </div>

                {form.details.length > 0 && (
                  <div className="border border-primary-50 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-primary-50 bg-warm-50/50">
                          <th className="text-left    px-3 py-2 text-[10px] font-semibold text-dark-300">Bahan Baku</th>
                          <th className="text-right   px-3 py-2 text-[10px] font-semibold text-dark-300 w-20">Jumlah</th>
                          <th className="text-left    px-3 py-2 text-[10px] font-semibold text-dark-300 w-20">Satuan</th>
                          <th className="text-right   px-3 py-2 text-[10px] font-semibold text-dark-300 w-28">Harga</th>
                          <th className="text-right   px-3 py-2 text-[10px] font-semibold text-dark-300 w-28">Subtotal</th>
                          <th className="text-center  px-3 py-2 text-[10px] font-semibold text-dark-300 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.details.map((d, idx) => (
                          <tr key={idx} className="border-b border-primary-50/50">
                            <td className="px-3 py-2">
                              <div className="relative">
                                <input value={
                                  d.idbarang
                                    ? barangBaku.find((b) => b.idbarang === parseInt(d.idbarang))?.namabarang || ''
                                    : ''
                                }
                                onChange={(e) => {
                                  if (!e.target.value) {
                                    setSearchBarangBaku('');
                                    updateDetail(idx, 'idbarang', '');
                                    return;
                                  }
                                  setSearchBarangBaku(e.target.value.toUpperCase());
                                }}
                                placeholder="Cari bahan baku..."
                                className="input-upper w-full px-2 py-1.5 rounded-lg border border-primary-50 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20" />
                                {searchBarangBaku && !d.idbarang && (
                                  <div className="absolute top-full left-0 right-0 z-20 mt-0.5 border border-primary-50 rounded-lg max-h-24 overflow-y-auto bg-white shadow-lg">
                                    {barangBaku.map((b) => (
                                      <button key={b.idbarang} type="button" onClick={() => {
                                        updateDetail(idx, 'idbarang', b.idbarang);
                                        setSearchBarangBaku('');
                                      }}
                                      className="w-full text-left px-2 py-1.5 text-xs hover:bg-warm-50 text-dark-400">
                                        {b.namabarang}
                                      </button>
                                    ))}
                                    {barangBaku.length === 0 && <p className="px-2 py-1.5 text-[10px] text-dark-300">Tidak ditemukan</p>}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <input type="number" value={d.jml} onChange={(e) => updateDetail(idx, 'jml', e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg border border-primary-50 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary-500/20" />
                            </td>
                            <td className="px-3 py-2">
                              <input value={d.satuan} onChange={(e) => updateDetail(idx, 'satuan', e.target.value.toUpperCase())}
                                className="input-upper w-full px-2 py-1.5 rounded-lg border border-primary-50 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20" />
                            </td>
                            <td className="px-3 py-2">
                              <input type="number" value={d.harga} onChange={(e) => updateDetail(idx, 'harga', e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg border border-primary-50 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary-500/20" />
                            </td>
                            <td className="px-3 py-2 text-right text-xs font-mono font-semibold text-dark-500">
                              {formatRupiah((parseFloat(d.jml) || 0) * (parseFloat(d.harga) || 0))}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button type="button" onClick={() => removeDetail(idx)} className="p-1 rounded hover:bg-red-50 text-dark-300 hover:text-red-500"><X className="w-3 h-3" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-warm-50/30">
                          <td colSpan={4} className="px-3 py-2 text-xs font-semibold text-dark-500 text-right">Total HPP</td>
                          <td className="px-3 py-2 text-right text-xs font-bold text-primary-600 font-mono">{formatRupiah(grandTotal)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">Batal</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
