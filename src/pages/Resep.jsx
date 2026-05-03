import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { formatRupiah, formatDate, today } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { useConfirm } from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { Plus, Trash2, Search, X, ChevronDown, RefreshCw, Beaker, Factory, ChevronLeft, ChevronRight, Settings, Layers, ArrowUpRight } from 'lucide-react';

const INIT_DTL = { idbarang: '', jml: '1', satuan: '', harga: '' };
const INIT_PRODUKSI = { idbarang: '', tgltrans: today(), qtyhasil: '', satuanhasil: '', biayatk: '', biayaoverhead: '', keterangan: '', details: [] };

// ===== REUSABLE: SearchBrowse =====
function SearchBrowse({ items, value, onChange, placeholder, renderItem, emptyText }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = items.find((i) => String(i.idbarang) === String(value));
  const filtered = search
    ? items.filter((item) => {
        const text = `${item.namabarang || ''} ${item.kodebarang || ''}`;
        return text.toUpperCase().includes(search.toUpperCase());
      }).slice(0, 20)
    : items.slice(0, 20);

  return (
    <div ref={ref} className="relative">
      <input
        value={selected ? (selected.namabarang || '') : search}
        onChange={(e) => { setSearch(e.target.value.toUpperCase()); if (value) onChange(''); setOpen(true); }}
        onFocus={() => { if (!value) setOpen(true); }}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />
      {selected && (
        <button type="button" onClick={() => { onChange(''); setSearch(''); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-300 hover:text-red-500"><X className="w-4 h-4" /></button>
      )}
      {open && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 border border-primary-50 rounded-xl max-h-48 overflow-y-auto bg-white shadow-xl">
          {filtered.length > 0 ? filtered.map((item) => (
            <button key={item.idbarang} type="button" onClick={() => { onChange(item.idbarang); setSearch(''); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-warm-50 border-b border-primary-50/30 last:border-0 text-dark-500">
              {renderItem ? renderItem(item) : `${item.kodebarang} — ${item.namabarang}`}
            </button>
          )) : <p className="px-3 py-3 text-xs text-dark-300">{emptyText || 'Tidak ditemukan'}</p>}
        </div>
      )}
    </div>
  );
}

// ===== UNIT CONVERSION =====
// hargabeli_terbaru = harga per satuanbesar
// konversi1 = besar → sedang (e.g. 10)
// konversi2 = sedang → kecil (e.g. 24)
function getConvertedPrice(barang, selectedSatuan) {
  const basePrice = parseFloat(barang?.hargabeli_terbaru) || 0;
  const besarKeSedang = parseInt(barang?.konversi1) || 1;
  const sedangKeKecil = parseInt(barang?.konversi2) || 1;
  if (selectedSatuan === barang?.satuanbesar) return basePrice;
  if (selectedSatuan === barang?.satuansedang) return basePrice / besarKeSedang;
  if (selectedSatuan === barang?.satuankecil) return basePrice / (besarKeSedang * sedangKeKecil);
  return basePrice;
}

function getSatuanOpts(barang) {
  const opts = [];
  if (barang?.satuanbesar) opts.push(barang.satuanbesar);
  if (barang?.satuansedang) opts.push(barang.satuansedang);
  if (barang?.satuankecil) opts.push(barang.satuankecil);
  return [...new Set(opts)];
}

export default function Resep() {
  const confirm = useConfirm();
  const user = useAuthStore((s) => s.user);

  // --- State ---
  const [showForm, setShowForm] = useState(false);
  const [prodForm, setProdForm] = useState({ ...INIT_PRODUKSI });
  const [bahanBaku, setBahanBaku] = useState([]);
  const [bahanSearch, setBahanSearch] = useState('');
  const [bahanPage, setBahanPage] = useState(1);
  const PAGE_SIZE = 12;
  const [resep, setResep] = useState([]);
  const [produksi, setProduksi] = useState([]);
  const [prodView, setProdView] = useState(null);
  const [prodViewData, setProdViewData] = useState(null);
  const [showResepModal, setShowResepModal] = useState(false);
  const [resepForm, setResepForm] = useState({ idbarang: '', hasiljml: '', hasilsatuan: '', details: [] });
  const [resepEditId, setResepEditId] = useState(null);
  const [resepView, setResepView] = useState(null);
  const [resepViewData, setResepViewData] = useState(null);
  const [semuaBarang, setSemuaBarang] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadResep = useCallback(() => api.get('/resep').then((r) => setResep(r.data)), []);
  const loadProduksi = useCallback(() => api.get('/produksi').then((r) => setProduksi(r.data)), []);
  const loadBahanBaku = useCallback(() => {
    const params = { jenis: 'BAHAN BAKU' };
    if (bahanSearch) params.search = bahanSearch;
    api.get('/barang', { params }).then((r) => { setBahanBaku(r.data); setBahanPage(1); });
  }, [bahanSearch]);

  useEffect(() => { loadResep(); loadProduksi(); }, [loadResep, loadProduksi]);
  useEffect(() => { loadBahanBaku(); }, [loadBahanBaku]);
  useEffect(() => { api.get('/barang').then((r) => setSemuaBarang(r.data)); }, []);

  const start = (bahanPage - 1) * PAGE_SIZE;
  const pagedBahan = bahanBaku.slice(start, start + PAGE_SIZE);
  const totalPages = Math.ceil(bahanBaku.length / PAGE_SIZE);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadResep(), loadProduksi(), loadBahanBaku()]);
    setRefreshing(false);
  };

  const selectedBarangJadi = semuaBarang.find((b) => String(b.idbarang) === String(prodForm.idbarang));

  // ===== PRODUKSI =====
  const openAddProduksi = () => {
    setProdForm({ ...INIT_PRODUKSI, tgltrans: today() });
    setShowForm(true);
  };

  const checkResepForBarang = async (idbarang) => {
    try { const { data } = await api.get(`/resep/by-barang/${idbarang}`); return data; } catch { return null; }
  };

  // Add bahan: same bahan + same satuan = merge qty. Different satuan = new row.
  const addBahanToForm = async (b) => {
    if (!showForm) { setProdForm({ ...INIT_PRODUKSI, idbarang: '', tgltrans: today(), details: [] }); setShowForm(true); }

    const defSatuan = b.satuanbesar || b.satuansedang || b.satuankecil || '';
    const defHarga = b.hargabeli_terbaru || 0;

    // Check if same bahan + same satuan exists → merge
    const sameIdx = prodForm.details.findIndex((d) => parseInt(d.idbarang) === parseInt(b.idbarang) && d.satuan === defSatuan);
    if (sameIdx >= 0) {
      const updated = [...prodForm.details];
      const currentQty = parseFloat(updated[sameIdx].jml) || 0;
      updated[sameIdx] = { ...updated[sameIdx], jml: String(currentQty + 1) };
      setProdForm({ ...prodForm, details: updated });
      return;
    }

    // Different satuan or new → add row
    const resepBahan = await checkResepForBarang(b.idbarang);
    setProdForm({
      ...prodForm,
      details: [...prodForm.details, {
        idbarang: b.idbarang, jml: '1', satuan: defSatuan, harga: String(defHarga),
        _nama: b.namabarang, _kode: b.kodebarang,
        _satuanOpts: getSatuanOpts(b), _barangData: b,
        _adaResep: !!resepBahan, _resepData: resepBahan,
      }],
    });
  };

  const expandResepBahan = async (idx) => {
    const item = prodForm.details[idx];
    if (!item._resepData) return;
    const subItems = item._resepData.details.map((d) => {
      const b = bahanBaku.find((x) => parseInt(x.idbarang) === parseInt(d.idbarang)) || {};
      const defSatuan = b.satuanbesar || b.satuansedang || b.satuankecil || '';
      const defHarga = b.hargabeli_terbaru || 0;
      return {
        idbarang: d.idbarang, jml: d.jml, satuan: defSatuan, harga: String(defHarga),
        _nama: d.namabarang, _kode: d.kodebarang,
        _satuanOpts: getSatuanOpts(b), _barangData: b,
        _adaResep: false, _resepData: null,
        _parentId: item.idbarang, _parentNama: item._nama,
      };
    });
    const updated = [...prodForm.details];
    updated.splice(idx, 1, ...subItems);
    setProdForm({ ...prodForm, details: updated });
    toast.success(`${item._nama} → ${subItems.length} sub-bahan`);
  };

  const updateProdDetail = (idx, field, value) => {
    const updated = [...prodForm.details];
    if (field === 'satuan') {
      const b = updated[idx]._barangData;
      const convertedHarga = getConvertedPrice(b, value);
      const newSatuan = value;
      const sameIdx = prodForm.details.findIndex((d, i) => i !== idx && parseInt(d.idbarang) === parseInt(updated[idx].idbarang) && d.satuan === newSatuan);
      if (sameIdx >= 0) {
        // Merge: add qty to existing row, remove this row
        const qtyThis = parseFloat(updated[idx].jml) || 0;
        const qtyOther = parseFloat(updated[sameIdx].jml) || 0;
        updated[sameIdx] = { ...updated[sameIdx], jml: String(qtyThis + qtyOther) };
        updated.splice(idx, 1);
        setProdForm({ ...prodForm, details: updated });
        return;
      }
      updated[idx] = { ...updated[idx], satuan: newSatuan, harga: String(convertedHarga) };
    } else {
      updated[idx] = { ...updated[idx], [field]: value };
    }
    setProdForm({ ...prodForm, details: updated });
  };

  const removeProdDetail = (idx) => setProdForm({ ...prodForm, details: prodForm.details.filter((_, i) => i !== idx) });

  const handleSaveProduksi = async (e) => {
    e.preventDefault();
    if (!prodForm.idbarang) return toast.error('Pilih barang jadi');
    if (prodForm.details.length === 0) return toast.error('Belum ada bahan');
    if (!prodForm.qtyhasil || parseFloat(prodForm.qtyhasil) <= 0) return toast.error('Jumlah hasil > 0');
    const payload = {
      idresep: prodForm.idresep || null, idbarang: prodForm.idbarang, tgltrans: prodForm.tgltrans,
      qtyhasil: prodForm.qtyhasil, satuanhasil: prodForm.satuanhasil,
      biayatk: parseFloat(prodForm.biayatk) || 0, biayaoverhead: parseFloat(prodForm.biayaoverhead) || 0,
      keterangan: prodForm.keterangan, iduser: user?.iduser,
      details: prodForm.details.map((d) => ({ idbarang: d.idbarang, jml: d.jml, satuan: d.satuan, harga: d.harga })),
    };
    try {
      await api.post('/produksi', payload);
      toast.success('Produksi berhasil');
      setShowForm(false); setProdForm({ ...INIT_PRODUKSI, tgltrans: today() });
      loadProduksi();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const handleDeleteProduksi = async (id) => {
    if (!(await confirm({ message: 'Hapus produksi? Stok dikembalikan.' }))) return;
    try { await api.delete(`/produksi/${id}`); toast.success('Dihapus'); loadProduksi(); } catch { toast.error('Gagal'); }
  };

  const handleViewProduksi = async (id) => {
    if (prodView === id) { setProdView(null); setProdViewData(null); return; }
    try { const { data } = await api.get(`/produksi/${id}`); setProdViewData(data); setProdView(id); } catch { toast.error('Gagal'); }
  };

  // Calc
  const subBahan = prodForm.details.reduce((s, d) => s + (parseFloat(d.jml) || 0) * (parseFloat(d.harga) || 0), 0);
  const biayaTK = parseFloat(prodForm.biayatk) || 0;
  const biayaOH = parseFloat(prodForm.biayaoverhead) || 0;
  const prodTotalHPP = subBahan + biayaTK + biayaOH;
  const prodHppPerUnit = parseFloat(prodForm.qtyhasil) > 0 ? prodTotalHPP / parseFloat(prodForm.qtyhasil) : 0;

  // ===== RESEP MODAL =====
  const openAddResep = () => { setResepEditId(null); setResepForm({ idbarang: '', hasiljml: '', hasilsatuan: '', details: [] }); setShowResepModal(true); };
  const handleEditResep = async (r) => {
    try {
      const { data } = await api.get(`/resep/${r.idresep}`);
      setResepEditId(r.idresep);
      setResepForm({ idbarang: data.idbarang, hasiljml: data.hasiljml || '', hasilsatuan: data.hasilsatuan || '', details: data.details.map((d) => ({ idbarang: d.idbarang, jml: d.jml, satuan: d.satuan, harga: d.harga })) });
      setShowResepModal(true);
    } catch { toast.error('Gagal'); }
  };
  const handleDeleteResep = async (id) => { if (!(await confirm({ message: 'Hapus resep?' }))) return; try { await api.delete(`/resep/${id}`); toast.success('Dihapus'); loadResep(); } catch { toast.error('Gagal'); } };
  const handleViewResep = async (id) => { if (resepView === id) { setResepView(null); setResepViewData(null); return; } try { const { data } = await api.get(`/resep/${id}`); setResepViewData(data); setResepView(id); } catch { toast.error('Gagal'); } };
  const handleSaveResep = async (e) => {
    e.preventDefault();
    if (!resepForm.idbarang) return toast.error('Pilih barang');
    try {
      if (resepEditId) { await api.put(`/resep/${resepEditId}`, resepForm); toast.success('Resep diupdate'); }
      else { await api.post('/resep', resepForm); toast.success('Resep ditambah'); }
      setShowResepModal(false); loadResep();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };
  const addRcpDetail = () => setResepForm({ ...resepForm, details: [...resepForm.details, { ...INIT_DTL }] });
  const removeRcpDetail = (idx) => setResepForm({ ...resepForm, details: resepForm.details.filter((_, i) => i !== idx) });
  const updateRcpDetail = (idx, field, value) => {
    const updated = [...resepForm.details];
    if (field === 'idbarang') {
      const b = semuaBarang.find((b) => b.idbarang === parseInt(value));
      const defSatuan = b?.satuanbesar || b?.satuansedang || b?.satuankecil || '';
      updated[idx] = { ...updated[idx], idbarang: value, satuan: defSatuan, harga: String(b?.hargabeli_terbaru || 0) };
    } else updated[idx] = { ...updated[idx], [field]: value };
    setResepForm({ ...resepForm, details: updated });
  };

  // ===== RENDER =====
  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Perhitungan Resep</h2>
          <p className="text-xs text-dark-300">Catat produksi & hitung HPP</p>
        </div>
        <div className="flex items-center gap-2">
          {!showForm && (
            <button onClick={() => setShowResepModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50">
              <Settings className="w-3.5 h-3.5" /> Resep
            </button>
          )}
          <button onClick={handleRefresh} disabled={refreshing} className={`p-2 rounded-xl border border-primary-100 text-dark-400 hover:bg-warm-50 ${refreshing ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {!showForm && (
            <button onClick={openAddProduksi} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold">
              <Plus className="w-3.5 h-3.5" /> Produksi Baru
            </button>
          )}
          {showForm && (
            <button onClick={() => { setShowForm(false); setProdForm({ ...INIT_PRODUKSI, tgltrans: today() }); }}
              className="px-4 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50">
              Tutup Form
            </button>
          )}
        </div>
      </div>

      {/* HISTORY TABLE - always visible */}
      <div className="bg-white rounded-xl border border-primary-50 overflow-hidden mb-3 flex-shrink-0">
        <div>
          <table className="w-full">
            <thead className="sticky top-0 bg-warm-50/80">
              <tr className="border-b border-primary-50">
                <th className="text-left px-3 py-2 text-[10px] font-semibold text-dark-300">Kode</th>
                <th className="text-left px-3 py-2 text-[10px] font-semibold text-dark-300">Tgl</th>
                <th className="text-left px-3 py-2 text-[10px] font-semibold text-dark-300">Barang</th>
                <th className="text-right px-3 py-2 text-[10px] font-semibold text-dark-300">Hasil</th>
                <th className="text-right px-3 py-2 text-[10px] font-semibold text-dark-300">Total HPP</th>
                <th className="text-right px-3 py-2 text-[10px] font-semibold text-dark-300">HPP/Unit</th>
                <th className="text-center px-3 py-2 text-[10px] font-semibold text-dark-300 w-12">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {produksi.map((p) => (
                <>
                <tr key={p.idproduksi} className="border-b border-primary-50/30 text-xs hover:bg-warm-50/30">
                  <td className="px-3 py-1.5 font-mono text-dark-400">{p.kodeproduksi}</td>
                  <td className="px-3 py-1.5 text-dark-400">{formatDate(p.tgltrans)}</td>
                  <td className="px-3 py-1.5 font-medium text-dark-500">{p.namabarang}</td>
                  <td className="px-3 py-1.5 text-right text-dark-500">{p.qtyhasil} {p.satuanhasil}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-dark-400">{formatRupiah(p.totalhpp)}</td>
                  <td className="px-3 py-1.5 text-right font-bold font-mono text-accent-600">{formatRupiah(p.hppperunit)}</td>
                  <td className="px-3 py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleViewProduksi(p.idproduksi)} className={`p-0.5 text-dark-300 hover:text-accent-500 transition-transform ${prodView === p.idproduksi ? 'rotate-180' : ''}`}><ChevronDown className="w-3 h-3" /></button>
                      <button onClick={() => handleDeleteProduksi(p.idproduksi)} className="p-0.5 text-dark-300 hover:text-red-500"><Trash2 className="w-2.5 h-2.5" /></button>
                    </div>
                  </td>
                </tr>
                {prodView === p.idproduksi && prodViewData && (
                  <tr key={`detail-${p.idproduksi}`}>
                    <td colSpan={7} className="bg-warm-50/50 p-0">
                      <div className="p-3">
                        <p className="text-[10px] font-bold text-dark-500 mb-2">Detail Bahan Baku</p>
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-primary-100">
                              <th className="text-left py-1 text-[9px] font-semibold text-dark-400">Bahan</th>
                              <th className="text-right py-1 text-[9px] font-semibold text-dark-400 w-16">Jml</th>
                              <th className="text-center py-1 text-[9px] font-semibold text-dark-400 w-20">Satuan</th>
                              <th className="text-right py-1 text-[9px] font-semibold text-dark-400 w-24">Harga</th>
                              <th className="text-right py-1 text-[9px] font-semibold text-dark-400 w-24">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prodViewData.details && prodViewData.details.map((d, idx) => (
                              <tr key={idx} className="border-b border-primary-50/30">
                                <td className="py-1 text-[10px] text-dark-500">
                                  <span className={d._parentNama ? 'pl-3 text-dark-400' : ''}>{d._parentNama ? `↳ ${d.namabarang}` : d.namabarang}</span>
                                </td>
                                <td className="py-1 text-[10px] text-right text-dark-500">{d.jml}</td>
                                <td className="py-1 text-[10px] text-center text-dark-400">{d.satuan}</td>
                                <td className="py-1 text-[10px] text-right font-mono text-dark-400">{formatRupiah(d.harga)}</td>
                                <td className="py-1 text-[10px] text-right font-mono font-semibold text-dark-500">{formatRupiah(d.subtotal)}</td>
                              </tr>
                            ))}
                            {(!prodViewData.details || prodViewData.details.length === 0) && (
                              <tr><td colSpan={5} className="py-2 text-center text-[10px] text-dark-300">Tidak ada detail bahan</td></tr>
                            )}
                          </tbody>
                          <tfoot>
                            <tr className="bg-warm-50/30">
                              <td colSpan={4} className="text-right py-1.5 text-[10px] font-bold text-dark-500">Total</td>
                              <td className="text-right py-1.5 text-[10px] font-bold text-primary-600 font-mono">{formatRupiah(prodViewData.totalhpp)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
                </>
              ))}
              {produksi.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-dark-300 text-xs">Belum ada catatan produksi. Klik "Produksi Baru" untuk mulai.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* MAIN CONTENT */}
      {!showForm ? (
        // Show summary cards or info when no form
        <div className="flex-1 flex items-center justify-center text-dark-300 text-xs">
          {produksi.length > 0 ? (
            <div className="text-center">
              <Factory className="w-8 h-8 text-primary-200 mx-auto mb-2" />
              <p className="text-dark-400 text-sm font-medium">Riwayat produksi di atas</p>
              <p className="text-dark-300 text-xs mt-1">Klik "Produksi Baru" untuk catat produksi baru</p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex gap-3 flex-1 min-h-0">
          {/* LEFT: BAHAN */}
          <div className="w-[340px] bg-white rounded-xl border border-primary-50 flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-primary-50">
              <h3 className="text-xs font-bold text-dark-500 mb-2 flex items-center gap-1.5">
                <Beaker className="w-3.5 h-3.5 text-primary-500" /> Bahan Baku
              </h3>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
                <input value={bahanSearch} onChange={(e) => setBahanSearch(e.target.value.toUpperCase())}
                  placeholder="Cari bahan..." className="input-upper w-full pl-8 pr-3 py-2 rounded-lg border border-primary-100 bg-warm-50 text-xs" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-2 gap-1.5">
                {pagedBahan.map((b) => (
                  <button key={b.idbarang} onClick={() => addBahanToForm(b)}
                    className="text-left p-2.5 rounded-lg border border-primary-50 bg-warm-50/50 hover:bg-primary-50 hover:border-primary-200 transition-all">
                    <p className="text-[11px] font-semibold text-dark-500 truncate">{b.namabarang}</p>
                    <p className="text-[9px] text-dark-300">{b.kodebarang}</p>
                    <p className="text-[11px] font-bold text-primary-600 mt-0.5">
                      {formatRupiah(b.hargabeli_terbaru)}
                      <span className="text-[8px] text-dark-400 font-normal"> / {b.satuanbesar || b.satuansedang || b.satuankecil}</span>
                    </p>
                    <p className="text-[8px] text-dark-400 mt-0.5">{[b.satuanbesar, b.satuansedang, b.satuankecil].filter(Boolean).join(' / ') || '-'}</p>
                  </button>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <button onClick={() => setBahanPage(Math.max(1, bahanPage - 1))} disabled={bahanPage <= 1} className="p-1 rounded hover:bg-primary-50 text-dark-400 disabled:opacity-30"><ChevronLeft className="w-3.5 h-3.5" /></button>
                  <span className="text-[10px] text-dark-400">{bahanPage}/{totalPages}</span>
                  <button onClick={() => setBahanPage(Math.min(totalPages, bahanPage + 1))} disabled={bahanPage >= totalPages} className="p-1 rounded hover:bg-primary-50 text-dark-400 disabled:opacity-30"><ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
              )}
              {bahanBaku.length === 0 && <p className="text-center text-dark-300 text-xs py-8">Tidak ada bahan</p>}
            </div>
          </div>

          {/* RIGHT: FORM */}
          <div className="flex-1 bg-white rounded-xl border border-primary-50 flex flex-col min-w-0">
            <div className="flex items-center justify-between p-3 border-b border-primary-50">
              <h3 className="text-xs font-bold text-dark-500 flex items-center gap-1.5">
                <Factory className="w-3.5 h-3.5 text-accent-500" /> Form Produksi
              </h3>
            </div>

            <form onSubmit={handleSaveProduksi} className="flex flex-col flex-1 min-h-0">
              {/* HEADER FIELDS */}
              <div className="p-3 space-y-2 border-b border-primary-50 flex-shrink-0">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-4">
                    <label className="block text-[10px] font-semibold text-dark-400 mb-0.5">Barang Jadi</label>
                    <SearchBrowse items={semuaBarang.filter((b) => b.jenis === 'BAHAN JADI')} value={prodForm.idbarang}
                      onChange={(v) => {
                        const b = semuaBarang.find((x) => String(x.idbarang) === String(v));
                        setProdForm({ ...prodForm, idbarang: v, satuanhasil: b?.satuanbesar || b?.satuansedang || b?.satuankecil || '' });
                      }}
                      placeholder="Pilih barang jadi..."
                      renderItem={(item) => `${item.kodebarang} — ${item.namabarang}`}
                      emptyText="Belum ada barang jadi" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-semibold text-dark-400 mb-0.5">Tgl</label>
                    <input type="date" value={prodForm.tgltrans} onChange={(e) => setProdForm({ ...prodForm, tgltrans: e.target.value })}
                      className="w-full px-2 py-2 rounded-lg border border-primary-100 text-xs" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-semibold text-dark-400 mb-0.5">Hasil</label>
                    <input inputMode="numeric" value={prodForm.qtyhasil} onChange={(e) => { if (/^\d*\.?\d*$/.test(e.target.value)) setProdForm({ ...prodForm, qtyhasil: e.target.value }); }}
                      placeholder="0" className="w-full px-2 py-2 rounded-lg border border-primary-100 text-xs text-right" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-semibold text-dark-400 mb-0.5">Satuan</label>
                    {selectedBarangJadi && getSatuanOpts(selectedBarangJadi).length > 0 ? (
                      <select value={prodForm.satuanhasil} onChange={(e) => setProdForm({ ...prodForm, satuanhasil: e.target.value })}
                        className="w-full px-2 py-2 rounded-lg border border-primary-100 text-xs bg-white">
                        {getSatuanOpts(selectedBarangJadi).map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input value={prodForm.satuanhasil} onChange={(e) => setProdForm({ ...prodForm, satuanhasil: e.target.value.toUpperCase() })}
                        placeholder="PCS" className="input-upper w-full px-2 py-2 rounded-lg border border-primary-100 text-xs" />
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-semibold text-dark-400 mb-0.5">Batch</label>
                    <input value={prodForm.keterangan} onChange={(e) => setProdForm({ ...prodForm, keterangan: e.target.value.toUpperCase() })}
                      placeholder="B1" className="input-upper w-full px-2 py-2 rounded-lg border border-primary-100 text-xs" />
                  </div>
                </div>
                {selectedBarangJadi && <p className="text-[10px] text-accent-600 font-medium">→ {selectedBarangJadi.namabarang}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-dark-400 mb-0.5">🧑‍🍳 Biaya TK</label>
                    <input inputMode="numeric" value={prodForm.biayatk} onChange={(e) => { if (/^\d*\.?\d*$/.test(e.target.value)) setProdForm({ ...prodForm, biayatk: e.target.value }); }}
                      placeholder="0" className="w-full px-2 py-2 rounded-lg border border-primary-100 text-xs text-right" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-dark-400 mb-0.5">⚡ Biaya Overhead</label>
                    <input inputMode="numeric" value={prodForm.biayaoverhead} onChange={(e) => { if (/^\d*\.?\d*$/.test(e.target.value)) setProdForm({ ...prodForm, biayaoverhead: e.target.value }); }}
                      placeholder="0" className="w-full px-2 py-2 rounded-lg border border-primary-100 text-xs text-right" />
                  </div>
                </div>
              </div>

              {/* BAHAN TABLE */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {prodForm.details.length > 0 ? (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-primary-50">
                        <th className="text-left py-2 px-3 text-[9px] font-semibold text-dark-300">Bahan</th>
                        <th className="text-right py-2 px-2 text-[9px] font-semibold text-dark-300 w-16">Jml</th>
                        <th className="text-center py-2 px-1 text-[9px] font-semibold text-dark-300 w-20">Satuan</th>
                        <th className="text-right py-2 px-2 text-[9px] font-semibold text-dark-300 w-24">Harga</th>
                        <th className="text-right py-2 px-2 text-[9px] font-semibold text-dark-300 w-24">Subtotal</th>
                        <th className="w-6"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {prodForm.details.map((d, idx) => {
                        const dispNama = d._parentNama ? `↳ ${d._nama}` : d._nama;
                        return (
                          <tr key={idx} className={`border-b border-primary-50/30 ${d._parentNama ? 'bg-warm-50/40' : ''}`}>
                            <td className="py-1.5 px-3">
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] font-medium text-dark-500 truncate">{dispNama}</span>
                                {d._adaResep && !d._parentNama && (
                                  <button type="button" onClick={() => expandResepBahan(idx)}
                                    className="flex-shrink-0 px-1 py-0.5 rounded bg-accent-50 text-accent-600 text-[8px] font-bold hover:bg-accent-100">
                                    <Layers className="w-2.5 h-2.5 inline" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-1.5 px-2">
                              <input inputMode="numeric" value={d.jml} onChange={(e) => { if (/^\d*\.?\d*$/.test(e.target.value)) updateProdDetail(idx, 'jml', e.target.value); }}
                                className="w-full px-1.5 py-1 rounded border border-primary-50 text-[11px] text-right" />
                            </td>
                            <td className="py-1.5 px-1">
                              {d._satuanOpts?.length > 0 ? (
                                <select value={d.satuan} onChange={(e) => updateProdDetail(idx, 'satuan', e.target.value)}
                                  className="w-full px-1 py-1 rounded border border-primary-50 text-[11px] bg-white">
                                  {d._satuanOpts.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                              ) : (
                                <input value={d.satuan} onChange={(e) => updateProdDetail(idx, 'satuan', e.target.value.toUpperCase())}
                                  className="input-upper w-full px-1.5 py-1 rounded border border-primary-50 text-[11px]" />
                              )}
                            </td>
                            <td className="py-1.5 px-2">
                              <input inputMode="numeric" value={d.harga} onChange={(e) => { if (/^\d*\.?\d*$/.test(e.target.value)) updateProdDetail(idx, 'harga', e.target.value); }}
                                className="w-full px-1.5 py-1 rounded border border-primary-50 text-[11px] text-right" />
                            </td>
                            <td className="py-1.5 px-2 text-right text-[11px] font-semibold font-mono text-dark-500">
                              {formatRupiah((parseFloat(d.jml) || 0) * (parseFloat(d.harga) || 0))}
                            </td>
                            <td className="py-1.5 text-center">
                              <button type="button" onClick={() => removeProdDetail(idx)} className="text-dark-300 hover:text-red-500"><X className="w-3 h-3" /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex items-center justify-center h-full text-dark-300 text-xs">Klik bahan dari kiri</div>
                )}
              </div>

              {/* FOOTER */}
              <div className="border-t border-primary-100 p-3 space-y-2 flex-shrink-0 bg-warm-50/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-dark-400">Total Bahan:</span>
                  <span className="font-semibold text-dark-500">{formatRupiah(subBahan)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-dark-400">
                  <span>+ TK: {formatRupiah(biayaTK)} + OH: {formatRupiah(biayaOH)}</span>
                  <span className="text-xs font-bold text-primary-600">{formatRupiah(prodTotalHPP)}</span>
                </div>
                {prodForm.qtyhasil > 0 && (
                  <>
                    <div className="flex items-center justify-between text-xs bg-accent-50/60 rounded-lg px-3 py-2">
                      <span className="font-bold text-dark-500">HPP / {prodForm.satuanhasil || 'Unit'}</span>
                      <span className="text-base font-extrabold text-accent-600">{formatRupiah(prodHppPerUnit)}</span>
                    </div>
                    <div className="bg-emerald-50/60 rounded-lg px-3 py-2">
                      <p className="text-[10px] font-semibold text-dark-500 mb-1.5 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3 text-emerald-600" /> Harga Jual Rekomendasi:
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { pct: 25, mult: 1.25 },
                          { pct: 35, mult: 1.35 },
                          { pct: 50, mult: 1.5 },
                        ].map(({ pct, mult }) => {
                          const hargaJual = prodHppPerUnit * mult;
                          const untung = prodHppPerUnit * (mult - 1);
                          return (
                            <div key={pct} className="bg-white rounded-lg px-2 py-1.5 border border-emerald-200 text-center">
                              <p className="text-[9px] font-bold text-emerald-700">Margin {pct}%</p>
                              <p className="text-[11px] font-extrabold text-emerald-800">{formatRupiah(hargaJual)}</p>
                              <p className="text-[8px] text-emerald-600">Untung {formatRupiah(untung)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => { setShowForm(false); setProdForm({ ...INIT_PRODUKSI, tgltrans: today() }); }}
                    className="flex-1 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50">Batal</button>
                  <button type="submit" className="flex-1 py-2 rounded-xl bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600"
                    disabled={prodForm.details.length === 0 || !prodForm.qtyhasil}>
                    Simpan Produksi
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESEP MODAL */}
      {showResepModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-dark-500 flex items-center gap-2">
                <Beaker className="w-4 h-4 text-primary-500" /> Kelola Resep
              </h3>
              <button onClick={() => { setShowResepModal(false); setResepView(null); }} className="text-dark-300 hover:text-dark-500"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-dark-300 mb-3">Resep = template formula. Bisa untuk Barang Jadi ATAU Bahan Baku (misal: resep Adonan).</p>

            <div className="space-y-1.5 mb-3 max-h-40 overflow-y-auto">
              {resep.map((r) => (
                <div key={r.idresep} className="border border-primary-50 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-warm-50/30">
                    <div>
                      <span className="text-[10px] font-mono font-semibold text-dark-500">{r.koderesep}</span>
                      <span className="text-xs text-dark-500 ml-2">{r.namabarang}</span>
                      {r.hasiljml > 0 && <span className="text-[9px] text-dark-400 ml-1">→ {r.hasiljml} {r.hasilsatuan || ''}</span>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleViewResep(r.idresep)} className="p-0.5 text-dark-300 hover:text-accent-500"><ChevronDown className="w-3 h-3" /></button>
                      <button onClick={() => handleEditResep(r)} className="p-0.5 text-dark-300 hover:text-primary-500 text-[10px] font-bold">✎</button>
                      <button onClick={() => handleDeleteResep(r.idresep)} className="p-0.5 text-dark-300 hover:text-red-500"><Trash2 className="w-2.5 h-2.5" /></button>
                    </div>
                  </div>
                  {resepView === r.idresep && resepViewData && (
                    <div className="px-3 py-1.5 bg-warm-50/50 text-[10px] space-y-0.5">
                      {resepViewData.details.map((d) => (
                        <div key={d.idresepdtl} className="flex justify-between text-dark-400">
                          <span>{d.namabarang}</span>
                          <span>{d.jml} {d.satuan} × {formatRupiah(d.harga)} = <span className="font-semibold text-dark-500">{formatRupiah(d.subtotal)}</span></span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-primary-100 pt-3">
              <h4 className="text-sm font-bold text-dark-500 mb-2">{resepEditId ? 'Edit Resep' : 'Tambah Resep'}</h4>
              <form onSubmit={handleSaveResep} className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-semibold text-dark-400 mb-0.5">Barang (Jadi / Baku)</label>
                    <SearchBrowse items={semuaBarang} value={resepForm.idbarang}
                      onChange={(v) => setResepForm({ ...resepForm, idbarang: v })}
                      placeholder="Cari barang..."
                      renderItem={(item) => `${item.kodebarang} — ${item.namabarang} (${item.jenis})`}
                      emptyText="Belum ada barang" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-dark-400 mb-0.5">Hasil</label>
                      <input inputMode="numeric" value={resepForm.hasiljml} onChange={(e) => { if (/^\d*\.?\d*$/.test(e.target.value)) setResepForm({ ...resepForm, hasiljml: e.target.value }); }}
                        placeholder="0" className="w-full px-2 py-2 rounded-lg border border-primary-100 text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-dark-400 mb-0.5">Satuan</label>
                      <input value={resepForm.hasilsatuan} onChange={(e) => setResepForm({ ...resepForm, hasilsatuan: e.target.value.toUpperCase() })}
                        placeholder="PCS" className="input-upper w-full px-2 py-2 rounded-lg border border-primary-100 text-xs" />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-semibold text-dark-400">Bahan Baku</label>
                    <button type="button" onClick={addRcpDetail} className="text-[10px] font-semibold text-primary-600 hover:text-primary-700">+ Tambah</button>
                  </div>
                  {resepForm.details.map((d, idx) => (
                    <div key={idx} className="flex gap-1.5 mb-1.5 items-center">
                      <div className="flex-1">
                        <SearchBrowse items={bahanBaku} value={d.idbarang}
                          onChange={(v) => updateRcpDetail(idx, 'idbarang', v)}
                          placeholder="Cari bahan..."
                          renderItem={(item) => `${item.kodebarang} — ${item.namabarang}`}
                          emptyText="Belum ada bahan baku" />
                      </div>
                      <input inputMode="numeric" value={d.jml} onChange={(e) => { if (/^\d*\.?\d*$/.test(e.target.value)) updateRcpDetail(idx, 'jml', e.target.value); }}
                        placeholder="Jml" className="w-14 px-1.5 py-1.5 rounded-lg border border-primary-50 text-xs text-right" />
                      <input value={d.satuan} onChange={(e) => updateRcpDetail(idx, 'satuan', e.target.value.toUpperCase())}
                        placeholder="Stn" className="w-12 px-1.5 py-1.5 rounded-lg border border-primary-50 text-xs input-upper" />
                      <input inputMode="numeric" value={d.harga} onChange={(e) => { if (/^\d*\.?\d*$/.test(e.target.value)) updateRcpDetail(idx, 'harga', e.target.value); }}
                        placeholder="Hrg" className="w-20 px-1.5 py-1.5 rounded-lg border border-primary-50 text-xs text-right" />
                      <button type="button" onClick={() => removeRcpDetail(idx)} className="text-dark-300 hover:text-red-500"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => { setShowResepModal(false); setResepView(null); }}
                    className="flex-1 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50">Tutup</button>
                  <button type="submit" className="flex-1 py-2 rounded-xl bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600">
                    {resepEditId ? 'Update' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
