import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { Plus, X, Search, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function SaldoAwalStok() {
  const user = useAuthStore((s) => s.user);
  const [list, setList] = useState([]);
  const [detail, setDetail] = useState(null);
  const [detailItems, setDetailItems] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [tgl, setTgl] = useState(new Date().toISOString().slice(0, 10));
  const [keterangan, setKeterangan] = useState('');
  const [saSearch, setSaSearch] = useState('');
  const [saBarang, setSaBarang] = useState([]);
  const [saCart, setSaCart] = useState([]);

  const loadList = () => {
    api.get('/stok/saldostok-list').then((r) => {
      // Hanya tampilkan saldo awal (kode diawali SA-)
      setList(r.data.filter((x) => x.kodesaldostok?.startsWith('SA-')));
    });
  };

  useEffect(() => { loadList(); }, []);

  const openDetail = async (item) => {
    setDetail(item);
    try {
      const r = await api.get(`/stok/saldostok/${item.idsaldostok}`);
      setDetailItems(r.data);
    } catch {
      toast.error('Gagal memuat detail');
      setDetailItems([]);
    }
  };

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

  const handleSubmit = async () => {
    const validItems = saCart.filter((a) => a.jml > 0);
    if (!validItems.length) return toast.error('Minimal 1 item dengan jumlah > 0');
    try {
      const payload = {
        idkasir: user?.iduser,
        tgltrans: tgl,
        keterangan: keterangan || 'SALDO AWAL STOK',
        items: validItems.map((a) => ({ idbarang: a.idbarang, jml: parseInt(a.jml) || 0 })),
      };
      await api.post('/stok/saldoawal', payload);
      toast.success('Saldo awal stok berhasil disimpan');
      setShowForm(false);
      setSaCart([]);
      setKeterangan('');
      setTgl(new Date().toISOString().slice(0, 10));
      loadList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-500">Saldo Awal Stok</h2>
          <p className="text-sm text-dark-300">Daftar transaksi saldo awal stok</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-all">
          <Plus className="w-4 h-4" /> Saldo Awal Baru
        </button>
      </div>

      {/* List Header */}
      <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary-50 bg-warm-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Keterangan</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.idsaldostok} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                <td className="px-4 py-3 text-xs font-mono text-dark-300">{s.kodesaldostok}</td>
                <td className="px-4 py-3 text-dark-400">{formatDate(s.tgltrans)}</td>
                <td className="px-4 py-3 text-dark-500">{s.keterangan || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => openDetail(s)}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                    Lihat Detail
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan="4" className="px-4 py-8 text-center text-sm text-dark-300">Belum ada data saldo awal</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{animation: 'fadeIn 0.2s ease'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-thin shadow-2xl animate-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-dark-500">Detail Saldo Awal</h3>
                <p className="text-xs text-dark-300">{detail.kodesaldostok} &bull; {formatDate(detail.tgltrans)}</p>
              </div>
              <button onClick={() => { setDetail(null); setDetailItems([]); }} className="text-dark-300 hover:text-dark-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-warm-50 rounded-xl p-3 mb-4 text-xs text-dark-400">
              {detail.keterangan || 'Tanpa keterangan'}
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-50 bg-warm-50/50">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-dark-300">Kode Barang</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-dark-300">Nama Barang</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-dark-300">Satuan</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {detailItems.map((d) => (
                  <tr key={d.idsaldostokdtl} className="border-b border-primary-50/50 text-sm">
                    <td className="px-3 py-2 text-xs font-mono text-dark-300">{d.kodebarang}</td>
                    <td className="px-3 py-2 text-dark-500">{d.namabarang}</td>
                    <td className="px-3 py-2 text-dark-400">{d.satuankecil || '-'}</td>
                    <td className="px-3 py-2 text-right font-bold">{d.jml}</td>
                  </tr>
                ))}
                {detailItems.length === 0 && (
                  <tr><td colSpan="4" className="px-3 py-4 text-center text-xs text-dark-300">Tidak ada detail</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{animation: 'fadeIn 0.2s ease'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin shadow-2xl animate-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark-500">Tambah Saldo Awal Stok</h3>
              <button onClick={() => { setShowForm(false); setSaCart([]); setKeterangan(''); }} className="text-dark-300 hover:text-dark-500"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Tanggal</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
                  <input type="date" value={tgl} onChange={(e) => setTgl(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-primary-100 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Keterangan</label>
                <input value={keterangan} onChange={(e) => setKeterangan(e.target.value.toUpperCase())}
                  placeholder="Contoh: SALDO AWAL TAHUN 2026" className="input-upper w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm" />
              </div>
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
            <button onClick={handleSubmit} disabled={saCart.length === 0}
              className="w-full mt-4 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold text-sm disabled:opacity-50 transition-all">
              Simpan Saldo Awal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
