import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { formatRupiah, today } from '../lib/utils';
import toast from 'react-hot-toast';
import { Search, Plus, Minus, Trash2, ShoppingCart, User, CreditCard, Printer, X, Ban, Download, FileText, Upload, RefreshCw } from 'lucide-react';

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

export default function Penjualan() {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [jual, setJual] = useState([]);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showJualList, setShowJualList] = useState(false);
  const [bayar, setBayar] = useState('');
  const [usePpn, setUsePpn] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { items, customer, addItem, removeItem, updateQty, setCustomer, clearCart } = useCartStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => { api.get('/customer').then((r) => setCustomers(r.data)); }, []);

  useEffect(() => {
    if (!search) { setProducts([]); return; }
    const t = setTimeout(() => {
      api.get(`/barang?search=${encodeURIComponent(search)}`).then((r) => setProducts(r.data));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const loadJual = useCallback(() => {
    api.get('/jual').then((r) => setJual(r.data));
  }, []);
  useEffect(() => { loadJual(); }, [loadJual]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([api.get('/customer').then((r) => setCustomers(r.data)), loadJual()]);
    setRefreshing(false);
  };

  const grandTotal = items.reduce((sum, item) => {
    const ppn = usePpn ? (item.harga * item.jml * (user?.ppn || 11)) / 100 : 0;
    const diskon = item.diskon ? (item.harga * item.jml * item.diskon) / 100 : 0;
    return sum + (item.harga * item.jml) + ppn - diskon;
  }, 0);

  const handlePay = async () => {
    const amount = parseFloat(bayar);
    if (isNaN(amount) || amount < grandTotal) return toast.error('Jumlah bayar kurang');
    try {
      const payload = {
        idcustomer: customer?.idcustomer || 1, idkasir: user?.iduser, grandtotal: grandTotal, bayar: amount, kembali: amount - grandTotal,
        useppn: usePpn,
        items: items.map((item) => ({ idbarang: item.idbarang, jml: item.jml, harga: item.hargajual_terbaru || item.harga, diskon: item.diskon || 0 })),
      };
      await api.post('/jual', payload);
      toast.success('Transaksi berhasil!');
      setShowPayment(false); setBayar(''); clearCart(); loadJual();
      window.open(`/api/laporan/sales-transaksi?format=html&tglwal=${today()}&tglakhir=${today()}&token=${localStorage.getItem('grfyn_token')}`, '_blank');
    } catch (err) { toast.error(err.response?.data?.message || 'Transaksi gagal'); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Batalkan transaksi ini? Stok akan dikembalikan.')) return;
    try { await api.put(`/jual/${id}/cancel`); toast.success('Transaksi dibatalkan'); loadJual(); }
    catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-500">Penjualan</h2>
          <p className="text-sm text-dark-300">POS Back Office</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing}
            className={`p-2 rounded-xl border border-primary-100 text-dark-400 hover:bg-warm-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh halaman">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => { setShowJualList(!showJualList); loadJual(); }}
            className="px-4 py-2 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50 transition-colors">
            {showJualList ? 'Sembunyikan' : 'Riwayat'} Transaksi
          </button>
          <button onClick={() => downloadFile('/impor/jual/export', 'jual-export.csv')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => downloadFile('/impor/jual/template', 'jual-template.csv')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors">
            <FileText className="w-3.5 h-3.5" /> Template
          </button>
          <button onClick={() => handleImport('/impor/jual/import', loadJual)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors">
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
        </div>
      </div>

      {showJualList && (
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden animate-in">
          <div className="max-h-48 overflow-y-auto scrollbar-thin">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-primary-50 bg-warm-50/50">
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-dark-300">Kode</th>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-dark-300">Tanggal</th>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-dark-300">Customer</th>
                  <th className="text-right px-3 py-2 text-[10px] font-semibold text-dark-300">Total</th>
                  <th className="text-center px-3 py-2 text-[10px] font-semibold text-dark-300">Status</th>
                  <th className="text-center px-3 py-2 text-[10px] font-semibold text-dark-300 w-12">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {jual.map((j) => (
                  <tr key={j.idjual} className={`border-b border-primary-50/50 text-xs ${j.status === 0 ? 'bg-red-50/30 opacity-60' : 'hover:bg-warm-50/30'}`}>
                    <td className="px-3 py-2 font-mono text-dark-300">{j.kodejual}</td>
                    <td className="px-3 py-2 text-dark-400">{j.tgltrans?.slice(0,10)}</td>
                    <td className="px-3 py-2 text-dark-500">{j.namacustomer || 'CASH'}</td>
                    <td className="px-3 py-2 text-right font-semibold text-dark-500">{formatRupiah(j.grandtotal)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg ${j.status === 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {j.status === 0 ? 'BATAL' : 'AKTIF'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {j.status !== 0 && (
                        <button onClick={() => handleCancel(j.idjual)} className="p-0.5 rounded hover:bg-red-50 text-dark-300 hover:text-red-500"><Ban className="w-3.5 h-3.5" /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex gap-4 h-[calc(100vh-10rem)]">
        <div className="flex-1 bg-white rounded-2xl border border-primary-50 p-4 flex flex-col">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
            <input type="text" value={search}
              onChange={(e) => setSearch(e.target.value.toUpperCase())}
              placeholder="Cari barang... (ketik kode atau nama)"
              className="input-upper w-full pl-10 pr-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-sm placeholder-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
              autoFocus />
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="grid grid-cols-4 gap-2">
              {products.map((p) => (
                <button key={p.idbarang} onClick={() => addItem({ ...p, harga: parseFloat(p.hargajual_terbaru || 0) })}
                  className="text-left p-3 rounded-xl border border-primary-50 bg-warm-50/50 hover:bg-primary-50 hover:border-primary-200 transition-all group">
                  <p className="text-xs font-semibold text-dark-500 truncate">{p.namabarang}</p>
                  <p className="text-[10px] text-dark-300">{p.kodebarang}</p>
                  <p className="text-xs font-bold text-primary-600 mt-1">{formatRupiah(p.hargajual_terbaru)}</p>
                  <p className="text-[9px] text-dark-200">{p.satuankecil}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-[420px] bg-white rounded-2xl border border-primary-50 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-dark-500 flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-primary-500" /> Keranjang</h3>
            <button onClick={() => setShowCustomer(!showCustomer)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-warm-50 hover:bg-warm-100 text-dark-400 transition-colors">
              <User className="w-3.5 h-3.5" /> {customer?.namacustomer || 'CASH'}
            </button>
          </div>

          {showCustomer && (
            <div className="mb-3 bg-warm-50 rounded-xl p-3 border border-warm-100 max-h-32 overflow-y-auto scrollbar-thin">
              {customers.map((c) => (
                <button key={c.idcustomer} onClick={() => { setCustomer(c); setShowCustomer(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs mb-1 ${customer?.idcustomer === c.idcustomer ? 'bg-primary-100 text-primary-700 font-semibold' : 'hover:bg-white text-dark-400'}`}>
                  {c.namacustomer} ({c.kodecustomer})
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1.5">
            {items.map((item) => {
              const ppn = usePpn ? (item.harga * item.jml * (user?.ppn || 11)) / 100 : 0;
              const diskon = item.diskon ? (item.harga * item.jml * item.diskon) / 100 : 0;
              const subtotal = (item.harga * item.jml) + ppn - diskon;
              return (
                <div key={item.idbarang} className="flex items-center gap-2 p-2.5 rounded-xl bg-warm-50/50 hover:bg-warm-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-dark-500 truncate">{item.namabarang}</p>
                    <p className="text-[10px] text-dark-300">{formatRupiah(item.harga)} x {item.jml} {item.satuankecil}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.idbarang, item.jml - 1)} className="w-6 h-6 rounded-lg bg-primary-50 hover:bg-primary-100 flex items-center justify-center text-primary-600"><Minus className="w-3 h-3" /></button>
                    <span className="text-xs font-bold text-dark-500 w-6 text-center">{item.jml}</span>
                    <button onClick={() => updateQty(item.idbarang, item.jml + 1)} className="w-6 h-6 rounded-lg bg-primary-50 hover:bg-primary-100 flex items-center justify-center text-primary-600"><Plus className="w-3 h-3" /></button>
                  </div>
                  <p className="text-xs font-bold text-dark-500 w-20 text-right">{formatRupiah(subtotal)}</p>
                  <button onClick={() => removeItem(item.idbarang)} className="text-dark-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              );
            })}
          </div>

          <div className="border-t border-primary-100 pt-4 mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-dark-300">Subtotal</span>
              <span className="font-semibold text-dark-500">{formatRupiah(items.reduce((s, i) => s + i.harga * i.jml, 0))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-300">PPN {usePpn ? `(${user?.ppn || 11}%)` : '(Nonaktif)'}</span>
              <span className="font-semibold text-dark-500">{formatRupiah(usePpn ? items.reduce((s, i) => s + (i.harga * i.jml * (user?.ppn || 11)) / 100, 0) : 0)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span className="text-dark-500">Total</span>
              <span className="text-primary-600">{formatRupiah(grandTotal)}</span>
            </div>
            <button onClick={() => setShowPayment(true)} disabled={items.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-primary-500/20 active:scale-[0.98]">
              <CreditCard className="w-4 h-4" /> Bayar Sekarang
            </button>
          </div>
        </div>
      </div>

      {showPayment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{animation: 'fadeIn 0.2s ease'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark-500">Pembayaran</h3>
              <button onClick={() => { setShowPayment(false); setBayar(''); }} className="text-dark-300 hover:text-dark-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="text-center mb-6">
              <p className="text-sm text-dark-300">Total Tagihan</p>
              <p className="text-3xl font-bold text-primary-600 mt-1">{formatRupiah(grandTotal)}</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-warm-50">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={usePpn} onChange={(e) => setUsePpn(e.target.checked)}
                    className="w-4 h-4 rounded accent-primary-500" />
                  <span className="text-xs font-semibold text-dark-400">Pakai PPN ({user?.ppn || 11}%)</span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Jumlah Bayar</label>
                <input type="number" value={bayar} onChange={(e) => setBayar(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-dark-500 text-lg font-bold text-center placeholder-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                  placeholder="0" autoFocus onKeyDown={(e) => e.key === 'Enter' && bayar && handlePay()} />
              </div>
              {bayar && parseFloat(bayar) >= grandTotal && (
                <div className="text-center py-3 rounded-xl bg-accent-50">
                  <p className="text-xs text-accent-600">Kembalian</p>
                  <p className="text-xl font-bold text-accent-600">{formatRupiah(parseFloat(bayar) - grandTotal)}</p>
                </div>
              )}
              <button onClick={handlePay} disabled={!bayar || parseFloat(bayar) < grandTotal}
                className="w-full py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold text-sm transition-all disabled:opacity-50">
                <Printer className="w-4 h-4 inline mr-2" /> Bayar & Cetak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
