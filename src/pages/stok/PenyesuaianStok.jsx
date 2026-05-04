import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { Plus, X, Search, Calendar } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function PenyesuaianStok() {
  const user = useAuthStore((s) => s.user);
  const [list, setList] = useState([]);
  const [detail, setDetail] = useState(null);
  const [detailItems, setDetailItems] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [tgl, setTgl] = useState(new Date().toISOString().slice(0, 10));
  const [keterangan, setKeterangan] = useState('');
  const [adjSearch, setAdjSearch] = useState('');
  const [adjBarang, setAdjBarang] = useState([]);
  const [adjCart, setAdjCart] = useState([]);

  const loadList = () => {
    api.get('/stok/penyesuaian').then((r) => setList(r.data));
  };

  useEffect(() => { loadList(); }, []);

  const openDetail = async (item) => {
    setDetail(item);
    try {
      const r = await api.get(`/stok/penyesuaian/${item.idpenyesuaianstok}`);
      setDetailItems(r.data);
    } catch {
      toast.error('Gagal memuat detail');
      setDetailItems([]);
    }
  };

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
      setAdjSearch('');
      setAdjBarang([]);
    });
  };

  const handleSubmit = async () => {
    if (!adjCart.length) return toast.error('Tidak ada item');
    try {
      const payload = {
        idkasir: user?.iduser,
        tgltrans: tgl,
        keterangan: keterangan,
        items: adjCart.map((a) => ({
          idbarang: a.idbarang,
          jml: a.jml,
          keterangan: `Fisik: ${a.jml}, Program: ${a.stokProgram}`,
        })),
      };
      await api.post('/stok/penyesuaian', payload);
      toast.success('Penyesuaian stok berhasil');
      setShowForm(false);
      setAdjCart([]);
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
          <h2 className="text-2xl font-bold text-dark-500">Penyesuaian Stok / Opname Stok</h2>
          <p className="text-sm text-dark-300">Daftar transaksi penyesuaian stok</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all">
          <Plus className="w-4 h-4" /> Penyesuaian Baru
        </button>
      </div>

      {/* List Header */}
      <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary-50 bg-warm-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kasir</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Keterangan</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.idpenyesuaianstok} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                <td className="px-4 py-3 text-xs font-mono text-dark-300">{p.kodepenyesuaianstok}</td>
                <td className="px-4 py-3 text-dark-400">{formatDate(p.tgltrans)}</td>
                <td className="px-4 py-3 text-dark-500">{p.kasir || '-'}</td>
                <td className="px-4 py-3 text-xs text-dark-300">{p.keterangan || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => openDetail(p)}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                    Lihat Detail
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-dark-300">Belum ada data penyesuaian</td></tr>
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
                <h3 className="text-lg font-bold text-dark-500">Detail Penyesuaian Stok</h3>
                <p className="text-xs text-dark-300">{detail.kodepenyesuaianstok} &bull; {formatDate(detail.tgltrans)}</p>
              </div>
              <button onClick={() => { setDetail(null); setDetailItems([]); }} className="text-dark-300 hover:text-dark-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-warm-50 rounded-xl p-3 mb-4 text-xs text-dark-400">
              {detail.keterangan || 'Tanpa keterangan'}
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-50 bg-warm-50/50">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-dark-300">Barang</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-dark-300">Satuan</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">Jml Fisik</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">Selisih</th>
                </tr>
              </thead>
              <tbody>
                {detailItems.map((d) => (
                  <tr key={d.idpenyesuaianstokdtl} className="border-b border-primary-50/50 text-sm">
                    <td className="px-3 py-2 text-dark-500">{d.namabarang}</td>
                    <td className="px-3 py-2 text-dark-400">{d.satuankecil || '-'}</td>
                    <td className="px-3 py-2 text-right font-bold">{d.jml}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={`text-xs font-bold ${d.selisih > 0 ? 'text-red-600' : d.selisih < 0 ? 'text-emerald-600' : 'text-dark-400'}`}>
                        {d.selisih > 0 ? `+${d.selisih}` : d.selisih}
                      </span>
                    </td>
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
              <h3 className="text-lg font-bold text-dark-500">Penyesuaian Stok Baru</h3>
              <button onClick={() => { setShowForm(false); setAdjCart([]); setKeterangan(''); }} className="text-dark-300 hover:text-dark-500"><X className="w-5 h-5" /></button>
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
                  placeholder="Alasan penyesuaian..." className="input-upper w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm" />
              </div>
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
            <button onClick={handleSubmit} disabled={adjCart.length === 0}
              className="w-full mt-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm disabled:opacity-50 transition-all">
              Simpan Penyesuaian
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
