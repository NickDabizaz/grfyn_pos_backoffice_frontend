import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { formatRupiah } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Plus, Search, ShoppingBag, X, Trash2, Ban, Download, FileText, Upload } from 'lucide-react';

const downloadFile = (url, filename) => {
  api.get(url, { responseType: 'blob' }).then((r) => {
    const blob = new Blob([r.data], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  });
};

const handleImport = (url, onSuccess) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post(url, formData);
      toast.success(`Import selesai: ${data.success} berhasil, ${data.errors} gagal`);
      onSuccess();
    } catch (err) { toast.error(err.response?.data?.message || 'Import gagal'); }
  };
  input.click();
};

export default function Pembelian() {
  const [beli, setBeli] = useState([]);
  const [barang, setBarang] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [cart, setCart] = useState([]);
  const [supplier, setSupplier] = useState(null);
  const [searchCart, setSearchCart] = useState('');
  const user = useAuthStore((s) => s.user);

  const loadBeli = useCallback(() => { api.get('/beli').then((r) => setBeli(r.data)); }, []);
  useEffect(() => { loadBeli(); api.get('/supplier').then((r) => setSuppliers(r.data)); }, [loadBeli]);

  useEffect(() => {
    if (!searchCart) { setBarang([]); return; }
    const t = setTimeout(() => {
      api.get(`/barang?search=${encodeURIComponent(searchCart)}`).then((r) => setBarang(r.data));
    }, 300);
    return () => clearTimeout(t);
  }, [searchCart]);

  const addToCart = (p) => {
    const exists = cart.find((c) => c.idbarang === p.idbarang);
    if (exists) { setCart(cart.map((c) => c.idbarang === p.idbarang ? { ...c, jml: c.jml + 1 } : c)); }
    else { setCart([...cart, { ...p, jml: 1, harga: parseFloat(p.hargabeli_terbaru || 0) }]); }
    setSearchCart(''); setBarang([]);
  };

  const grandTotal = cart.reduce((sum, c) => sum + (c.harga * c.jml) + ((c.harga * c.jml * (user?.ppn || 11)) / 100), 0);

  const handleSubmit = async () => {
    if (!cart.length) return toast.error('Keranjang kosong');
    try {
      const payload = {
        idsupplier: supplier?.idsupplier || 1, idkasir: user?.iduser, grandtotal: grandTotal, bayar: grandTotal,
        items: cart.map((c) => ({ idbarang: c.idbarang, jml: c.jml, harga: c.harga })),
      };
      await api.post('/beli', payload);
      toast.success('Pembelian berhasil!'); setShowForm(false); setCart([]); setSupplier(null); loadBeli();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Batalkan pembelian ini? Stok akan dikembalikan.')) return;
    try { await api.put(`/beli/${id}/cancel`); toast.success('Pembelian dibatalkan'); loadBeli(); }
    catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-500">Pembelian</h2>
          <p className="text-sm text-dark-300">Catat pembelian barang dari supplier</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-accent-500/20 active:scale-[0.98]">
            <Plus className="w-4 h-4" /> Pembelian Baru
          </button>
          <button onClick={() => downloadFile('/impor/beli/export', 'beli-export.csv')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => downloadFile('/impor/beli/template', 'beli-template.csv')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors">
            <FileText className="w-3.5 h-3.5" /> Template
          </button>
          <button onClick={() => handleImport('/impor/beli/import', loadBeli)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors">
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-primary-50 bg-warm-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Supplier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kasir</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Total</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-16">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {beli.map((b) => (
                <tr key={b.idbeli} className={`border-b border-primary-50/50 text-sm ${b.status === 0 ? 'bg-red-50/30 opacity-60' : 'hover:bg-warm-50/30'}`}>
                  <td className="px-4 py-3 text-xs font-mono text-dark-300">{b.kodebeli}</td>
                  <td className="px-4 py-3 text-dark-400">{b.tgltrans?.slice(0,10)}</td>
                  <td className="px-4 py-3 text-dark-500">{b.namasupplier || '-'}</td>
                  <td className="px-4 py-3 text-dark-400">{b.kasir || '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-accent-600">{formatRupiah(b.grandtotal)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${b.status === 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {b.status === 0 ? 'BATAL' : 'AKTIF'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {b.status !== 0 && (
                      <button onClick={() => handleCancel(b.idbeli)} className="p-1 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500"><Ban className="w-3.5 h-3.5" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{animation: 'fadeIn 0.2s ease'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto scrollbar-thin shadow-2xl animate-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark-500 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-accent-500" /> Pembelian Baru</h3>
              <button onClick={() => setShowForm(false)} className="text-dark-300 hover:text-dark-500"><X className="w-5 h-5" /></button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-dark-400 mb-1">Supplier</label>
              <select onChange={(e) => { const s = suppliers.find((s) => s.idsupplier === parseInt(e.target.value)); setSupplier(s); }}
                className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm input-upper" value={supplier?.idsupplier || ''}>
                <option value="">PILIH SUPPLIER</option>
                {suppliers.map((s) => <option key={s.idsupplier} value={s.idsupplier}>{s.namasupplier}</option>)}
              </select>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
              <input value={searchCart} onChange={(e) => setSearchCart(e.target.value.toUpperCase())}
                placeholder="Cari barang..." className="input-upper w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>

            {barang.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-4 max-h-40 overflow-y-auto scrollbar-thin">
                {barang.map((b) => (
                  <button key={b.idbarang} onClick={() => addToCart(b)}
                    className="text-left p-2.5 rounded-xl border border-primary-50 bg-warm-50/50 hover:bg-primary-50 text-xs">
                    <p className="font-semibold text-dark-500 truncate">{b.namabarang}</p>
                    <p className="text-dark-300">{formatRupiah(b.hargabeli_terbaru)}</p>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2 mb-4">
              {cart.map((c) => (
                <div key={c.idbarang} className="flex items-center gap-3 p-3 rounded-xl bg-warm-50/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark-500">{c.namabarang}</p>
                    <p className="text-xs text-dark-300">{c.satuankecil}</p>
                  </div>
                  <input type="number" value={c.jml} onChange={(e) => setCart(cart.map((i) => i.idbarang === c.idbarang ? {...i, jml: parseInt(e.target.value) || 1} : i))}
                    className="w-20 px-2 py-1.5 rounded-lg border border-primary-100 text-sm text-center" />
                  <input type="number" value={c.harga} onChange={(e) => setCart(cart.map((i) => i.idbarang === c.idbarang ? {...i, harga: parseFloat(e.target.value) || 0} : i))}
                    className="w-32 px-2 py-1.5 rounded-lg border border-primary-100 text-sm text-right" />
                  <p className="text-sm font-semibold text-dark-500 w-32 text-right">{formatRupiah(c.harga * c.jml)}</p>
                  <button onClick={() => setCart(cart.filter((i) => i.idbarang !== c.idbarang))} className="text-dark-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>

            <div className="border-t border-primary-100 pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-dark-300">Total Pembelian ({cart.length} item)</p>
                <p className="text-xl font-bold text-accent-600">{formatRupiah(grandTotal)}</p>
              </div>
              <button onClick={handleSubmit} disabled={cart.length === 0}
                className="px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold text-sm disabled:opacity-50 transition-all">
                Simpan Pembelian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
