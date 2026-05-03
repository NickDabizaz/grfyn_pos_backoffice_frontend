import { useState, useEffect, Fragment } from 'react';
import api from '../api/axios';
import { formatRupiah, formatDate } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Search, Plus, ClipboardList, RotateCcw, Package, ArrowDown, ArrowUp, X, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import SearchableSelect from '../components/ui/SearchableSelect';

export default function Stok() {
  const [tab, setTab] = useState('kartu');
  const user = useAuthStore((s) => s.user);

  // Kartu Stok
  const [kartu, setKartu] = useState([]);
  const [ksSearch, setKsSearch] = useState('');
  const [ksJenis, setKsJenis] = useState('');

  // Penyesuaian
  const [penyesuaian, setPenyesuaian] = useState([]);
  const [showAdjForm, setShowAdjForm] = useState(false);
  const [adjCart, setAdjCart] = useState([]);
  const [adjSearch, setAdjSearch] = useState('');
  const [adjAllBarang, setAdjAllBarang] = useState([]);
  const [adjBarang, setAdjBarang] = useState([]);
  const [adjKeterangan, setAdjKeterangan] = useState('');
  const [adjPage, setAdjPage] = useState(1);
  const PAGE_SIZE = 12;

  // Saldo Stok
  const [saldo, setSaldo] = useState([]);
  const [saldoExpanded, setSaldoExpanded] = useState(null);
  const [saldoDetails, setSaldoDetails] = useState({});

  // Saldo Awal
  const [showSaldoAwal, setShowSaldoAwal] = useState(false);
  const [saCart, setSaCart] = useState([]);
  const [saSearch, setSaSearch] = useState('');
  const [saAllBarang, setSaAllBarang] = useState([]);
  const [saBarang, setSaBarang] = useState([]);
  const [saKeterangan, setSaKeterangan] = useState('');
  const [saPage, setSaPage] = useState(1);
  const [saStockData, setSaStockData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = () => {
    loadKartu();
    api.get('/stok/penyesuaian').then((r) => setPenyesuaian(r.data));
    api.get('/stok/saldostok-list').then((r) => setSaldo(r.data));
  };
  useEffect(() => { loadAll(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => { loadAll(); setTimeout(r, 300); });
    setRefreshing(false);
  };

  const loadKartu = () => {
    const params = {};
    if (ksSearch) params.idbarang = ksSearch;
    if (ksJenis) params.jenis = ksJenis;
    api.get('/stok/kartustok', { params }).then((r) => setKartu(r.data));
  };

  // ======= PENYESUAIAN =======
  const openAdjForm = async () => {
    setShowAdjForm(true);
    setAdjCart([]);
    setAdjSearch('');
    setAdjKeterangan('');
    const [barangRes] = await Promise.all([
      api.get('/barang')
    ]);
    setAdjAllBarang(barangRes.data);
    setAdjPage(1);
  };

  useEffect(() => {
    if (!adjSearch) {
      if (showAdjForm) {
        api.get('/barang').then((r) => { setAdjAllBarang(r.data); setAdjPage(1); });
      }
      return;
    }
    const t = setTimeout(() => {
      api.get(`/barang?search=${encodeURIComponent(adjSearch)}`).then((r) => { setAdjAllBarang(r.data); setAdjPage(1); });
    }, 300);
    return () => clearTimeout(t);
  }, [adjSearch, showAdjForm]);

  useEffect(() => {
    const start = (adjPage - 1) * PAGE_SIZE;
    setAdjBarang(adjAllBarang.slice(start, start + PAGE_SIZE));
  }, [adjAllBarang, adjPage]);

  const totalAdjPages = Math.ceil(adjAllBarang.length / PAGE_SIZE);

  const addAdjItem = async (b) => {
    const exists = adjCart.find((c) => c.idbarang === b.idbarang);
    if (exists) return toast.error('Barang sudah ada di daftar');
    try {
      const { data } = await api.get(`/stok/getstok/${b.idbarang}`);
      const stokProgram = parseInt(data.stok) || 0;
      setAdjCart([...adjCart, { ...b, stokProgram, jml: 0 }]);
    } catch {
      setAdjCart([...adjCart, { ...b, stokProgram: 0, jml: 0 }]);
    }
  };

  const handlePenyesuaian = async () => {
    const validItems = adjCart.filter((a) => a.jml >= 0);
    if (!validItems.length) return toast.error('Tidak ada item');
    try {
      const payload = {
        idkasir: user?.iduser,
        keterangan: adjKeterangan,
        items: validItems.map((a) => ({
          idbarang: a.idbarang,
          jml: a.jml,
          keterangan: `Fisik: ${a.jml}, Program: ${a.stokProgram}`,
        })),
      };
      await api.post('/stok/penyesuaian', payload);
      toast.success('Penyesuaian stok berhasil');
      setShowAdjForm(false);
      setAdjCart([]);
      setAdjKeterangan('');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  // ======= SALDO AWAL =======
  const openSaForm = async () => {
    setShowSaldoAwal(true);
    setSaCart([]);
    setSaSearch('');
    setSaKeterangan('');
    const [barangRes, stokRes] = await Promise.all([
      api.get('/barang'),
      api.get('/stok/saldostok')
    ]);
    setSaAllBarang(barangRes.data);
    setSaStockData(stokRes.data);
    setSaPage(1);
  };

  useEffect(() => {
    if (!saSearch) {
      if (showSaldoAwal) {
        api.get('/barang').then((r) => { setSaAllBarang(r.data); setSaPage(1); });
      }
      return;
    }
    const t = setTimeout(() => {
      api.get(`/barang?search=${encodeURIComponent(saSearch)}`).then((r) => {
        setSaAllBarang(r.data);
        setSaPage(1);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [saSearch, showSaldoAwal]);

  useEffect(() => {
    const start = (saPage - 1) * PAGE_SIZE;
    setSaBarang(saAllBarang.slice(start, start + PAGE_SIZE));
  }, [saAllBarang, saPage]);

  const totalSaPages = Math.ceil(saAllBarang.length / PAGE_SIZE);

  const getSaStock = (idbarang) => {
    const s = saStockData.find((s) => s.idbarang === idbarang);
    return s ? s.stok : 0;
  };

  const addSaItem = (b) => {
    const exists = saCart.find((c) => c.idbarang === b.idbarang);
    if (exists) return toast.error('Barang sudah ada di daftar');
    setSaCart([...saCart, { ...b, jml: 0 }]);
  };

  const handleSaldoAwal = async () => {
    const validItems = saCart.filter((a) => a.jml > 0);
    if (!validItems.length) return toast.error('Minimal 1 item dengan jumlah > 0');
    try {
      const payload = {
        idkasir: user?.iduser,
        keterangan: saKeterangan || 'SALDO AWAL STOK',
        items: validItems.map((a) => ({ idbarang: a.idbarang, jml: parseInt(a.jml) || 0 })),
      };
      await api.post('/stok/saldoawal', payload);
      toast.success('Saldo awal stok berhasil disimpan');
      setShowSaldoAwal(false);
      setSaCart([]);
      setSaKeterangan('');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  const toggleSaldoDetail = async (idsaldostok) => {
    if (saldoExpanded === idsaldostok) {
      setSaldoExpanded(null);
      return;
    }
    if (!saldoDetails[idsaldostok]) {
      try {
        const { data } = await api.get(`/stok/saldostok/${idsaldostok}`);
        setSaldoDetails((prev) => ({ ...prev, [idsaldostok]: data }));
      } catch {
        toast.error('Gagal memuat detail saldo stok');
        return;
      }
    }
    setSaldoExpanded(idsaldostok);
  };

  const tabs = [
    { key: 'kartu', label: 'Kartu Stok', icon: ClipboardList },
    { key: 'saldo', label: 'Saldo Stok', icon: Package },
    { key: 'penyesuaian', label: 'Penyesuaian', icon: RotateCcw },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-500">Stok</h2>
          <p className="text-sm text-dark-300">Manajemen stok & inventori</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className={`p-2 rounded-xl border border-primary-100 text-dark-400 hover:bg-warm-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
          title="Refresh halaman">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex bg-white rounded-2xl p-1 border border-primary-50 w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-primary-500 text-white shadow-sm' : 'text-dark-400 hover:text-dark-600'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Kartu Stok */}
      {tab === 'kartu' && (
        <div className="space-y-4">
          <div className="flex gap-3 bg-white rounded-2xl p-4 border border-primary-50">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
              <input value={ksSearch} onChange={(e) => setKsSearch(e.target.value.toUpperCase())}
                placeholder="ID Barang..." className="input-upper w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
            <div className="w-48">
              <SearchableSelect
                value={ksJenis}
                onChange={setKsJenis}
                options={[{ value: '', label: 'Semua Jenis' }, { value: 'M', label: 'Masuk' }, { value: 'K', label: 'Keluar' }]}
                placeholder="Semua Jenis"
              />
            </div>
            <button onClick={loadKartu} className="px-6 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600">
              Filter
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-50 bg-warm-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode Trans</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Barang</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Jenis</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Jml</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {kartu.map((k) => (
                  <tr key={k.idkartustok} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                    <td className="px-4 py-3 text-xs text-dark-300">{formatDate(k.tgltrans)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-dark-300">{k.kodetrans}</td>
                    <td className="px-4 py-3 text-dark-500">{k.namabarang || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        k.jenis === 'M' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {k.jenis === 'M' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                        {k.jenis === 'M' ? 'MASUK' : 'KELUAR'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-dark-500">{k.jml}</td>
                    <td className="px-4 py-3 text-xs text-dark-300">{k.keterangan || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Saldo Stok */}
      {tab === 'saldo' && (
        <div className="space-y-4">
          <button onClick={openSaForm}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" /> Tambah Saldo Awal
          </button>
          <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-50 bg-warm-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Keterangan</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Item</th>
                </tr>
              </thead>
              <tbody>
                {saldo.map((s) => (
                  <Fragment key={s.idsaldostok}>
                    <tr
                      onClick={() => toggleSaldoDetail(s.idsaldostok)}
                      className={`border-b border-primary-50/50 text-sm cursor-pointer transition-colors ${
                        saldoExpanded === s.idsaldostok ? 'bg-warm-50' : 'hover:bg-warm-50/30'
                      }`}
                    >
                      <td className="px-4 py-3 text-xs font-mono text-dark-300">{s.kodesaldostok}</td>
                      <td className="px-4 py-3 text-dark-400">{formatDate(s.tgltrans)}</td>
                      <td className="px-4 py-3 text-dark-500">{s.keterangan || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-50 text-primary-600 text-[10px] font-bold">
                          {saldoDetails[s.idsaldostok]?.length ?? '-'}
                        </span>
                      </td>
                    </tr>
                    {saldoExpanded === s.idsaldostok && (
                      <tr className="border-b border-primary-50/50">
                        <td colSpan={4} className="px-4 py-3 bg-warm-50/30">
                          {!saldoDetails[s.idsaldostok] ? (
                            <div className="text-sm text-dark-300 py-2">Memuat detail...</div>
                          ) : saldoDetails[s.idsaldostok].length === 0 ? (
                            <div className="text-sm text-dark-300 py-2">Tidak ada item</div>
                          ) : (
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-primary-100">
                                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-dark-300 uppercase">Kode Barang</th>
                                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-dark-300 uppercase">Nama Barang</th>
                                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-dark-300 uppercase">Satuan</th>
                                  <th className="text-right px-3 py-2 text-[10px] font-semibold text-dark-300 uppercase">Jumlah</th>
                                </tr>
                              </thead>
                              <tbody>
                                {saldoDetails[s.idsaldostok].map((d) => (
                                  <tr key={d.idsaldostokdtl || d.idbarang} className="border-b border-primary-50/50 text-xs">
                                    <td className="px-3 py-2 font-mono text-dark-300">{d.kodebarang || '-'}</td>
                                    <td className="px-3 py-2 text-dark-500">{d.namabarang || '-'}</td>
                                    <td className="px-3 py-2 text-dark-400">{d.satuankecil || '-'}</td>
                                    <td className="px-3 py-2 text-right font-bold text-dark-500">{d.jml}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Penyesuaian */}
      {tab === 'penyesuaian' && (
        <div className="space-y-4">
          <button onClick={openAdjForm}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" /> Penyesuaian Baru
          </button>

          <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-50 bg-warm-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kasir</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {penyesuaian.map((p) => (
                  <tr key={p.idpenyesuaianstok} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                    <td className="px-4 py-3 text-xs font-mono text-dark-300">{p.kodepenyesuaianstok}</td>
                    <td className="px-4 py-3 text-dark-400">{formatDate(p.tgltrans)}</td>
                    <td className="px-4 py-3 text-dark-500">{p.kasir || '-'}</td>
                    <td className="px-4 py-3 text-xs text-dark-300">{p.keterangan || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAMBAH SALDO AWAL (Full Screen) ==================== */}
      {showSaldoAwal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{animation: 'fadeIn 0.2s ease'}}>
          <div className="bg-white rounded-3xl p-4 w-full h-[calc(100vh-2rem)] shadow-2xl flex flex-col animate-in">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-dark-500 flex items-center gap-2"><Package className="w-5 h-5 text-accent-500" /> Tambah Saldo Awal Stok</h3>
              <button onClick={() => { setShowSaldoAwal(false); setSaCart([]); setSaKeterangan(''); }} className="text-dark-300 hover:text-dark-500"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex gap-4 flex-1 overflow-hidden">
              <div className="flex-1 bg-white rounded-2xl border border-primary-50 p-4 flex flex-col">
                <div className="mb-3 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
                    <input value={saSearch} onChange={(e) => { const v = e.target.value.toUpperCase(); setSaSearch(v); }}
                      placeholder="Cari barang... (ketik kode atau nama)" className="input-upper w-full pl-10 pr-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-sm placeholder-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300" autoFocus />
                  </div>
                  {!saSearch && (
                    <p className="text-[10px] text-dark-300">Menampilkan semua barang. Gunakan pencarian untuk filter.</p>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin">
                  <div className="grid grid-cols-4 gap-2">
                    {saBarang.map((p) => {
                      const stok = getSaStock(p.idbarang);
                      const isInCart = saCart.find(c => c.idbarang === p.idbarang);
                      return (
                        <button key={p.idbarang} onClick={() => addSaItem(p)}
                          disabled={isInCart}
                          className={`text-left p-3 rounded-xl border transition-all group ${
                            isInCart ? 'border-accent-300 bg-accent-50/50 opacity-50 cursor-not-allowed' : 'border-primary-50 bg-warm-50/50 hover:bg-primary-50 hover:border-primary-200'
                          }`}>
                          <p className="text-xs font-semibold text-dark-500 truncate">{p.namabarang}</p>
                          <p className="text-[10px] text-dark-300">{p.kodebarang}</p>
                          <p className="text-xs font-bold text-accent-600 mt-1">{formatRupiah(p.hargabeli_terbaru)}</p>
                          <p className="text-[9px] text-dark-200">{p.satuankecil}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className={`text-[9px] font-semibold ${stok <= 0 ? 'text-red-500' : 'text-dark-300'}`}>Stok: {stok}</span>
                            <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${p.jenis === 'BAHAN BAKU' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{p.jenis}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {totalSaPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4 pb-2">
                      <button onClick={() => setSaPage(Math.max(1, saPage - 1))} disabled={saPage <= 1}
                        className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                      <span className="text-xs text-dark-400 px-2">{saPage} / {totalSaPages}</span>
                      <button onClick={() => setSaPage(Math.min(totalSaPages, saPage + 1))} disabled={saPage >= totalSaPages}
                        className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-[420px] bg-white rounded-2xl border border-primary-50 p-4 flex flex-col">
                <h3 className="text-sm font-bold text-dark-500 mb-2 flex items-center gap-2"><Package className="w-4 h-4 text-accent-500" /> Item Saldo Awal ({saCart.length})</h3>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-dark-400 mb-1">Keterangan</label>
                  <input value={saKeterangan} onChange={(e) => setSaKeterangan(e.target.value.toUpperCase())}
                    placeholder="Contoh: SALDO AWAL TAHUN 2026" className="input-upper w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm" />
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1.5">
                  {saCart.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-warm-50/50 hover:bg-warm-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-dark-500 truncate">{a.namabarang}</p>
                        <p className="text-[10px] text-dark-300">{a.kodebarang} | {a.satuankecil || '-'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-dark-400">Jml:</span>
                        <input type="number" value={a.jml} onChange={(e) => {
                          const newCart = [...saCart];
                          newCart[i].jml = parseInt(e.target.value) || 0;
                          setSaCart(newCart);
                        }} className="w-20 px-2 py-1.5 rounded-lg border border-primary-100 text-sm text-center" min="0" />
                      </div>
                      <button onClick={() => setSaCart(saCart.filter((_, j) => j !== i))}
                        className="text-dark-300 hover:text-red-500 text-xs p-1">Hapus</button>
                    </div>
                  ))}
                  {saCart.length === 0 && (
                    <div className="text-center py-12 text-dark-300 text-sm">Pilih barang dari panel kiri</div>
                  )}
                </div>

                <div className="border-t border-primary-100 pt-4 mt-4">
                  <button onClick={handleSaldoAwal} disabled={saCart.length === 0}
                    className="w-full py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold text-sm disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-accent-500/20 active:scale-[0.98]">
                    Simpan Saldo Awal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PENYESUAIAN STOK (Full Screen) ==================== */}
      {showAdjForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{animation: 'fadeIn 0.2s ease'}}>
          <div className="bg-white rounded-3xl p-4 w-full h-[calc(100vh-2rem)] shadow-2xl flex flex-col animate-in">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-dark-500 flex items-center gap-2"><RotateCcw className="w-5 h-5 text-amber-500" /> Penyesuaian Stok</h3>
              <button onClick={() => { setShowAdjForm(false); setAdjCart([]); setAdjKeterangan(''); }} className="text-dark-300 hover:text-dark-500"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex gap-4 flex-1 overflow-hidden">
              <div className="flex-1 bg-white rounded-2xl border border-primary-50 p-4 flex flex-col">
                <div className="mb-3 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
                    <input value={adjSearch} onChange={(e) => { const v = e.target.value.toUpperCase(); setAdjSearch(v); }}
                      placeholder="Cari barang... (ketik kode atau nama)" className="input-upper w-full pl-10 pr-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-sm placeholder-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300" autoFocus />
                  </div>
                  {!adjSearch && (
                    <p className="text-[10px] text-dark-300">Menampilkan semua barang. Gunakan pencarian untuk filter.</p>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin">
                  <div className="grid grid-cols-4 gap-2">
                    {adjBarang.map((p) => {
                      const isInCart = adjCart.find(c => c.idbarang === p.idbarang);
                      return (
                        <button key={p.idbarang} onClick={() => addAdjItem(p)}
                          disabled={isInCart}
                          className={`text-left p-3 rounded-xl border transition-all group ${
                            isInCart ? 'border-amber-300 bg-amber-50/50 opacity-50 cursor-not-allowed' : 'border-primary-50 bg-warm-50/50 hover:bg-amber-50 hover:border-amber-200'
                          }`}>
                          <p className="text-xs font-semibold text-dark-500 truncate">{p.namabarang}</p>
                          <p className="text-[10px] text-dark-300">{p.kodebarang}</p>
                          <p className="text-xs font-bold text-amber-600 mt-1">{formatRupiah(p.hargabeli_terbaru)}</p>
                          <p className="text-[9px] text-dark-200">{p.satuankecil}</p>
                          <span className={`text-[9px] font-semibold px-1 py-0.5 rounded mt-1 inline-block ${p.jenis === 'BAHAN BAKU' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{p.jenis}</span>
                        </button>
                      );
                    })}
                  </div>
                  {totalAdjPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4 pb-2">
                      <button onClick={() => setAdjPage(Math.max(1, adjPage - 1))} disabled={adjPage <= 1}
                        className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                      <span className="text-xs text-dark-400 px-2">{adjPage} / {totalAdjPages}</span>
                      <button onClick={() => setAdjPage(Math.min(totalAdjPages, adjPage + 1))} disabled={adjPage >= totalAdjPages}
                        className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-[420px] bg-white rounded-2xl border border-primary-50 p-4 flex flex-col">
                <h3 className="text-sm font-bold text-dark-500 mb-2 flex items-center gap-2"><RotateCcw className="w-4 h-4 text-amber-500" /> Item Penyesuaian ({adjCart.length})</h3>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-dark-400 mb-1">Keterangan</label>
                  <input value={adjKeterangan} onChange={(e) => setAdjKeterangan(e.target.value.toUpperCase())}
                    placeholder="Alasan penyesuaian..." className="input-upper w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm" />
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1.5">
                  {adjCart.map((a, i) => {
                    const selisih = a.stokProgram - a.jml;
                    return (
                      <div key={i} className="p-2.5 rounded-xl bg-warm-50/50 space-y-1.5">
                        <p className="text-xs font-semibold text-dark-500 truncate">{a.namabarang}</p>
                        <div className="flex items-center gap-2 text-[10px] text-dark-400">
                          <span>Program: <span className="font-bold text-dark-500">{a.stokProgram}</span></span>
                          <span>|</span>
                          <span>Selisih: <span className={`font-bold ${selisih === 0 ? 'text-emerald-500' : selisih > 0 ? 'text-red-500' : 'text-blue-500'}`}>{selisih > 0 ? '+' : ''}{selisih}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-dark-400">Fisik:</span>
                          <input type="number" value={a.jml} onChange={(e) => {
                            const newCart = [...adjCart];
                            newCart[i].jml = parseInt(e.target.value) || 0;
                            setAdjCart(newCart);
                          }} className="w-24 px-2 py-1.5 rounded-lg border border-primary-100 text-sm text-center" min="0" />
                          <button onClick={() => setAdjCart(adjCart.filter((_, j) => j !== i))}
                            className="ml-auto text-dark-300 hover:text-red-500 text-xs p-1">Hapus</button>
                        </div>
                      </div>
                    );
                  })}
                  {adjCart.length === 0 && (
                    <div className="text-center py-12 text-dark-300 text-sm">Pilih barang dari panel kiri</div>
                  )}
                </div>

                <div className="border-t border-primary-100 pt-4 mt-4">
                  <button onClick={handlePenyesuaian} disabled={adjCart.length === 0}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.98]">
                    Simpan Penyesuaian
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
