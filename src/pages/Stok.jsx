import { useState, useEffect } from 'react';
import api from '../api/axios';
import { formatRupiah, formatDate } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Search, Plus, ClipboardList, RotateCcw, Package, ArrowDown, ArrowUp, X, RefreshCw } from 'lucide-react';
import SearchableSelect from '../components/ui/SearchableSelect';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';

export default function Stok() {
  const [tab, setTab] = useState('kartu');
  const user = useAuthStore((s) => s.user);

  // Kartu Stok
  const [kartu, setKartu] = useState([]);
  const [ksSearch, setKsSearch] = useState('');
  const [ksJenis, setKsJenis] = useState('');

  // Penyesuaian
  const [penyesuaian, setPenyesuaian] = useState([]);
  const [pnSearch, setPnSearch] = useState('');
  const [showAdjForm, setShowAdjForm] = useState(false);
  const [adjCart, setAdjCart] = useState([]);
  const [adjSearch, setAdjSearch] = useState('');
  const [adjBarang, setAdjBarang] = useState([]);
  const [adjKeterangan, setAdjKeterangan] = useState('');

  // Saldo Stok
  const [saldo, setSaldo] = useState([]);
  const [slSearch, setSlSearch] = useState('');

  // Closing
  const [closing, setClosing] = useState([]);
  const [clsJenis, setClsJenis] = useState('harian');
  const [clsTgl, setClsTgl] = useState(new Date().toISOString().slice(0, 10));
  const [clSearch, setClSearch] = useState('');

  // Saldo Awal
  const [showSaldoAwal, setShowSaldoAwal] = useState(false);
  const [saCart, setSaCart] = useState([]);
  const [saSearch, setSaSearch] = useState('');
  const [saBarang, setSaBarang] = useState([]);
  const [saKeterangan, setSaKeterangan] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = () => {
    loadKartu();
    loadPenyesuaian();
    api.get('/stok/saldostok').then((r) => setSaldo(r.data));
    loadClosing();
  };
  useEffect(() => { loadAll(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => { loadAll(); setTimeout(r, 300); });
    setRefreshing(false);
  };

  const loadKartu = () => {
    const params = {};
    if (ksSearch) params.search = ksSearch;
    if (ksJenis) params.jenis = ksJenis;
    api.get('/stok/kartustok', { params }).then((r) => setKartu(r.data));
  };

  const loadPenyesuaian = () => {
    const params = {};
    if (pnSearch) params.search = pnSearch;
    api.get('/stok/penyesuaian', { params }).then((r) => setPenyesuaian(r.data));
  };

  const loadClosing = () => {
    const params = {};
    if (clSearch) params.search = clSearch;
    api.get('/stok/closing', { params }).then((r) => setClosing(r.data));
  };

  const filteredSaldo = slSearch
    ? saldo.filter(s => s.kodebarang?.toLowerCase().includes(slSearch.toLowerCase()) || s.namabarang?.toLowerCase().includes(slSearch.toLowerCase()))
    : saldo;

  const ksPag = usePagination(kartu, 20);
  const slPag = usePagination(filteredSaldo, 20);
  const pnPag = usePagination(penyesuaian, 20);
  const clPag = usePagination(closing, 20);

  useEffect(() => { ksPag.resetPage(); }, [ksSearch, ksJenis]);
  useEffect(() => { slPag.resetPage(); }, [slSearch]);
  useEffect(() => { pnPag.resetPage(); }, [pnSearch]);
  useEffect(() => { clPag.resetPage(); }, [clSearch]);

  const searchAdj = (term) => {
    const q = term || adjSearch;
    if (!q) return;
    api.get(`/barang?search=${encodeURIComponent(q)}`).then((r) => setAdjBarang(r.data));
  };

  const addAdjItem = (b) => {
    api.get('/stok/saldostok').then((r) => {
      const item = r.data.find((s) => s.idbarang === b.idbarang);
      const stokProgram = item ? parseInt(item.stok) : 0;
      setAdjCart([...adjCart, { ...b, stokProgram, jml: stokProgram }]);
    });
  };

  const handlePenyesuaian = async () => {
    if (!adjCart.length) return toast.error('Tidak ada item');
    try {
      const payload = {
        idkasir: user?.iduser,
        keterangan: adjKeterangan,
        items: adjCart.map((a) => ({
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
      api.get('/stok/penyesuaian').then((r) => setPenyesuaian(r.data));
      api.get('/stok/saldostok').then((r) => setSaldo(r.data));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  // Saldo Awal
  const searchSaBarang = (term) => {
    const q = term || saSearch;
    if (!q) return;
    api.get(`/barang?search=${encodeURIComponent(q)}`).then((r) => setSaBarang(r.data));
  };

  const addSaItem = (b) => {
    const exists = saCart.find((c) => c.idbarang === b.idbarang);
    if (exists) return toast.error('Barang sudah ada di daftar');
    setSaCart([...saCart, { ...b, jml: 0 }]);
    setSaSearch('');
    setSaBarang([]);
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

  const handleClosing = async () => {
    try {
      const periode = clsJenis === 'HARIAN' ? clsTgl : clsBulan;
      await api.post('/stok/closing', { jenis: clsJenis, periode });
      toast.success(`Closing ${clsJenis} berhasil`);
      api.get('/stok/closing').then((r) => setClosing(r.data));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  const handleCancelClosing = async (id, kode) => {
    if (!window.confirm(`Yakin membatalkan closing ${kode}?`)) return;
    try {
      await api.put(`/stok/closing/${id}/cancel`);
      toast.success('Closing dibatalkan');
      api.get('/stok/closing').then((r) => setClosing(r.data));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan');
    }
  };

  const tabs = [
    { key: 'kartu', label: 'Kartu Stok', icon: ClipboardList },
    { key: 'saldo', label: 'Saldo Stok', icon: Package },
    { key: 'penyesuaian', label: 'Penyesuaian', icon: RotateCcw },
    { key: 'closing', label: 'Closing', icon: ClipboardList },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-500">Stok</h2>
          <p className="text-sm text-dark-300">Manajemen stok & inventori</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
          title="Refresh halaman">
          <RefreshCw className="w-4 h-4" /> Refresh
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
                placeholder="Cari kode transaksi..." className="input-upper w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
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
                {ksPag.paginatedItems.map((k) => (
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
            <Pagination page={ksPag.page} totalPages={ksPag.totalPages} setPage={ksPag.setPage} />
          </div>
        </div>
      )}

      {/* Saldo Stok */}
      {tab === 'saldo' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSaldoAwal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-all">
              <Plus className="w-4 h-4" /> Tambah Saldo Awal
            </button>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
              <input value={slSearch} onChange={(e) => setSlSearch(e.target.value.toUpperCase())}
                placeholder="Cari kode/nama barang..." className="input-upper w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary-50 bg-warm-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama Barang</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Satuan</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Stok Min</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Stok</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {slPag.paginatedItems.map((s) => (
                <tr key={s.idbarang} className={`border-b border-primary-50/50 text-sm ${(s.stok || 0) <= (s.stokmin || 0) ? 'bg-red-50/30' : 'hover:bg-warm-50/30'}`}>
                  <td className="px-4 py-3 text-xs font-mono text-dark-300">{s.kodebarang}</td>
                  <td className="px-4 py-3 font-medium text-dark-500">{s.namabarang}</td>
                  <td className="px-4 py-3 text-dark-400">{s.satuankecil || '-'}</td>
                  <td className="px-4 py-3 text-center text-dark-400">{s.stokmin || 0}</td>
                  <td className="px-4 py-3 text-center font-bold">{s.stok || 0}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                      (s.stok || 0) <= (s.stokmin || 0) ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {(s.stok || 0) <= (s.stokmin || 0) ? 'MENIPIS' : 'AMAN'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={slPag.page} totalPages={slPag.totalPages} setPage={slPag.setPage} />
          </div>
        </div>
      )}

      {/* Penyesuaian */}
      {tab === 'penyesuaian' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowAdjForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all">
              <Plus className="w-4 h-4" /> Penyesuaian Baru
            </button>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
              <input value={pnSearch} onChange={(e) => setPnSearch(e.target.value.toUpperCase())}
                placeholder="Cari kode penyesuaian..." className="input-upper w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
          </div>

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
                {pnPag.paginatedItems.map((p) => (
                  <tr key={p.idpenyesuaianstok} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                    <td className="px-4 py-3 text-xs font-mono text-dark-300">{p.kodepenyesuaianstok}</td>
                    <td className="px-4 py-3 text-dark-400">{formatDate(p.tgltrans)}</td>
                    <td className="px-4 py-3 text-dark-500">{p.kasir || '-'}</td>
                    <td className="px-4 py-3 text-xs text-dark-300">{p.keterangan || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={pnPag.page} totalPages={pnPag.totalPages} setPage={pnPag.setPage} />
          </div>

          {showAdjForm && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{animation: 'fadeIn 0.2s ease'}}>
              <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-thin shadow-2xl animate-in">
                <h3 className="text-lg font-bold text-dark-500 mb-4">Penyesuaian Stok</h3>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-dark-400 mb-1">Keterangan</label>
                  <input value={adjKeterangan} onChange={(e) => setAdjKeterangan(e.target.value.toUpperCase())}
                    placeholder="Alasan penyesuaian..." className="input-upper w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm" />
                </div>
                <div className="flex gap-2 mb-4">
                  <input value={adjSearch} onChange={(e) => { const v = e.target.value.toUpperCase(); setAdjSearch(v); searchAdj(v); }}
                    placeholder="Cari barang..." className="input-upper flex-1 px-3 py-2.5 rounded-xl border border-primary-100 text-sm" />
                  <button onClick={() => searchAdj(adjSearch)} className="px-4 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold">Cari</button>
                </div>
                {adjBarang.map((b) => (
                  <button key={b.idbarang} onClick={() => addAdjItem(b)}
                    className="w-full text-left p-2 mb-1 rounded-lg bg-warm-50 hover:bg-primary-50 text-sm text-dark-500">
                    {b.namabarang} ({b.kodebarang})
                  </button>
                ))}
                <div className="space-y-2 mt-4">
                  {adjCart.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-warm-50">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-dark-500">{a.namabarang}</p>
                        <p className="text-xs text-dark-300">Program: {a.stokProgram} | Selisih: {a.stokProgram - a.jml}</p>
                      </div>
                      <input type="number" value={a.jml} onChange={(e) => {
                        const newCart = [...adjCart];
                        newCart[i].jml = parseInt(e.target.value) || 0;
                        setAdjCart(newCart);
                      }} className="w-24 px-2 py-1.5 rounded-lg border border-primary-100 text-sm text-center" />
                      <button onClick={() => setAdjCart(adjCart.filter((_, j) => j !== i))}
                        className="text-dark-300 hover:text-red-500 text-xs">Hapus</button>
                    </div>
                  ))}
                </div>
                <button onClick={handlePenyesuaian} disabled={adjCart.length === 0}
                  className="w-full mt-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm disabled:opacity-50 transition-all">
                  Simpan Penyesuaian
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Closing */}
      {tab === 'closing' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-primary-50">
            <h3 className="text-sm font-bold text-dark-500 mb-3">Closing Baru</h3>
            <div className="flex items-end gap-4">
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Jenis</label>
                <SearchableSelect
                  value={clsJenis}
                  onChange={setClsJenis}
                  options={[{ value: 'harian', label: 'Harian' }, { value: 'bulanan', label: 'Bulanan' }]}
                  className="w-40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Tanggal Closing</label>
                <input type="date" value={clsTgl} onChange={(e) => setClsTgl(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-primary-100 text-sm" />
              </div>
              <button onClick={handleClosing}
                className="px-6 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-all">
                Proses Closing
              </button>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
            <input value={clSearch} onChange={(e) => setClSearch(e.target.value.toUpperCase())}
              placeholder="Cari kode closing..." className="input-upper w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>

          <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-50 bg-warm-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Jenis</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {clPag.paginatedItems.map((c) => (
                  <tr key={c.idclosing} className="border-b border-primary-50/50 text-sm">
                    <td className="px-4 py-3 text-xs font-mono text-dark-300">{c.kodeclosing}</td>
                    <td className="px-4 py-3 text-dark-400">
                      {c.jenis === 'HARIAN' ? formatDate(c.periode_start) : (c.periode_start || '').slice(0, 7)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                        c.jenis === 'HARIAN' ? 'bg-sky-50 text-sky-600' : 'bg-violet-50 text-violet-600'
                      }`}>
                        {c.jenis}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.status === 1 ? (
                        <span className="text-emerald-600 text-xs font-bold">Aktif</span>
                      ) : (
                        <span className="text-red-500 text-xs font-bold">Dibatalkan</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.status === 1 && (
                        <button onClick={() => handleCancelClosing(c.idclosing, c.kodeclosing)}
                          className="text-xs text-red-500 hover:text-red-600 font-semibold">
                          Batalkan
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {closing.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-dark-300 text-sm">Belum ada closing</td>
                  </tr>
                )}
              </tbody>
            </table>
            <Pagination page={clPag.page} totalPages={clPag.totalPages} setPage={clPag.setPage} />
          </div>
        </div>
      )}

      {/* Saldo Awal Modal */}
      {showSaldoAwal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{animation: 'fadeIn 0.2s ease'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-thin shadow-2xl animate-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark-500">Tambah Saldo Awal Stok</h3>
              <button onClick={() => { setShowSaldoAwal(false); setSaCart([]); setSaKeterangan(''); }} className="text-dark-300 hover:text-dark-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-dark-400 mb-1">Keterangan</label>
              <input value={saKeterangan} onChange={(e) => setSaKeterangan(e.target.value.toUpperCase())}
                placeholder="Contoh: SALDO AWAL TAHUN 2026" className="input-upper w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm" />
            </div>
            <div className="flex gap-2 mb-4">
              <input value={saSearch} onChange={(e) => { const v = e.target.value.toUpperCase(); setSaSearch(v); searchSaBarang(v); }}
                placeholder="Cari barang..." className="input-upper flex-1 px-3 py-2.5 rounded-xl border border-primary-100 text-sm" />
              <button onClick={() => searchSaBarang(saSearch)} className="px-4 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold">Cari</button>
            </div>
            {saBarang.map((b) => (
              <button key={b.idbarang} onClick={() => addSaItem(b)}
                className="w-full text-left p-2 mb-1 rounded-lg bg-warm-50 hover:bg-primary-50 text-sm text-dark-500">
                {b.namabarang} ({b.kodebarang})
              </button>
            ))}
            <div className="space-y-2 mt-4">
              {saCart.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-warm-50">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-dark-500">{a.namabarang}</p>
                    <p className="text-xs text-dark-300">{a.kodebarang} | {a.satuankecil || '-'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-dark-400">Jml:</span>
                    <input type="number" value={a.jml} onChange={(e) => {
                      const newCart = [...saCart];
                      newCart[i].jml = parseInt(e.target.value) || 0;
                      setSaCart(newCart);
                    }} className="w-24 px-2 py-1.5 rounded-lg border border-primary-100 text-sm text-center" />
                  </div>
                  <button onClick={() => setSaCart(saCart.filter((_, j) => j !== i))}
                    className="text-dark-300 hover:text-red-500 text-xs">Hapus</button>
                </div>
              ))}
            </div>
            <button onClick={handleSaldoAwal} disabled={saCart.length === 0}
              className="w-full mt-4 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold text-sm disabled:opacity-50 transition-all">
              Simpan Saldo Awal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
