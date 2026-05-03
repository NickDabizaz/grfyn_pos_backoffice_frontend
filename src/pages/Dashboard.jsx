import { useEffect, useState } from 'react';
import api from '../api/axios';
import { formatRupiah } from '../lib/utils';
import { TrendingUp, ShoppingCart, DollarSign, AlertTriangle, ArrowUpRight, Star, ArrowDownRight, RefreshCw, X } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [chart, setChart] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [lowStockList, setLowStockList] = useState([]);
  const [loadingLowStock, setLoadingLowStock] = useState(false);

  const loadDashboard = () => {
    api.get('/dashboard/summary').then((r) => setData(r.data)).catch(() => {});
    api.get('/dashboard/chart?days=7').then((r) => setChart(r.data)).catch(() => {});
  };

  useEffect(() => { loadDashboard(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => { loadDashboard(); setTimeout(r, 300); });
    setRefreshing(false);
  };

  const openLowStockModal = async () => {
    setShowLowStockModal(true);
    setLoadingLowStock(true);
    try {
      const { data: rows } = await api.get('/dashboard/low-stock');
      setLowStockList(rows || []);
    } catch {
      setLowStockList([]);
    } finally {
      setLoadingLowStock(false);
    }
  };

  const cards = [
    { label: 'Transaksi Hari Ini',  value: data?.total_transaksi || 0,      icon: ShoppingCart,   color: 'bg-primary-500' },
    { label: 'Total Penjualan',     value: formatRupiah(data?.total_sales), icon: DollarSign,     color: 'bg-accent-500' },
    { label: 'Laba Kotor',          value: formatRupiah(data?.laba_kotor),  icon: TrendingUp,     color: 'bg-emerald-500' },
    { label: 'Stok Menipis',        value: data?.low_stock?.length || 0,    icon: AlertTriangle,  color: 'bg-amber-500', onClick: openLowStockModal },
  ];

  const maxChartVal = Math.max(...chart.map((c) => parseFloat(c.total || 0)), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-500">Dashboard</h2>
          <p className="text-sm text-dark-300 mt-0.5">Ringkasan bisnis hari ini</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className={`p-2 rounded-xl border border-primary-100 text-dark-400 hover:bg-warm-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
          title="Refresh halaman">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div
            key={i}
            onClick={card.onClick}
            className={`bg-white rounded-2xl p-5 border border-primary-50 card-hover animate-in stagger-${i + 1} ${card.onClick ? 'cursor-pointer' : ''}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              {i === 0 && <span className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg"><ArrowUpRight className="w-3 h-3" /></span>}
            </div>
            <p className="text-xs text-dark-300 mb-1">{card.label}</p>
            <p className="text-lg font-bold text-dark-500">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-2xl p-5 border border-primary-50 card-hover animate-in stagger-2">
          <h3 className="text-sm font-semibold text-dark-500 mb-4">Penjualan 7 Hari Terakhir</h3>
          <div className="flex items-end gap-2 h-48">
            {chart.length > 0 ? chart.map((d, i) => {
              const h = (parseFloat(d.total || 0) / maxChartVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-semibold text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity">{formatRupiah(d.total)}</span>
                  <div className="w-full bg-primary-500 rounded-t-lg hover:bg-primary-600 transition-all cursor-pointer relative" style={{ height: `${Math.max(h, 4)}%` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-600/20 to-transparent rounded-t-lg" />
                  </div>
                  <span className="text-[10px] text-dark-300">{d.tgltrans?.slice(5) || '-'}</span>
                </div>
              );
            }) : <p className="text-dark-300 text-sm">Belum ada data penjualan</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-primary-50 card-hover animate-in stagger-3">
            <h3 className="text-sm font-semibold text-dark-500 mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-warm-500" /> Top Produk</h3>
            <div className="space-y-2.5">
              {data?.top_products?.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-dark-400 truncate max-w-[140px]">{p.namabarang}</span>
                  <span className="text-dark-500 font-semibold">{p.total_jml} pcs</span>
                </div>
              ))}
              {(!data?.top_products || data.top_products.length === 0) && <p className="text-xs text-dark-200">Belum ada data</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-primary-50 card-hover animate-in stagger-4">
            <h3 className="text-sm font-semibold text-dark-500 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> Stok Menipis</h3>
            <div className="space-y-2.5">
              {data?.low_stock?.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-dark-400 truncate max-w-[120px]">{s.namabarang}</span>
                  <span className="text-red-500 font-semibold flex items-center gap-1"><ArrowDownRight className="w-3 h-3" /> {s.stok || 0}</span>
                </div>
              ))}
              {(!data?.low_stock || data.low_stock.length === 0) && <p className="text-xs text-emerald-500 font-medium">Semua stok aman</p>}
            </div>
          </div>
        </div>
      </div>

      {showLowStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowLowStockModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-primary-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-dark-500">Daftar Stok Menipis</h3>
                  <p className="text-[11px] text-dark-300">Barang dengan stok di bawah atau sama dengan batas minimum</p>
                </div>
              </div>
              <button onClick={() => setShowLowStockModal(false)} className="p-1.5 rounded-lg hover:bg-warm-50 text-dark-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-0 overflow-auto flex-1">
              {loadingLowStock ? (
                <div className="p-8 text-center text-dark-300 text-sm">Memuat data...</div>
              ) : lowStockList.length === 0 ? (
                <div className="p-8 text-center text-emerald-500 text-sm font-medium">Semua stok aman</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-warm-50 sticky top-0">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-dark-300">Kode</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-dark-300">Nama Barang</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-dark-300">Satuan</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-dark-300">Stok Min</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-dark-300">Stok Sekarang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-50">
                    {lowStockList.map((s) => (
                      <tr key={s.idbarang} className="hover:bg-warm-50/50 transition-colors">
                        <td className="px-5 py-3 text-dark-400">{s.kodebarang}</td>
                        <td className="px-5 py-3 text-dark-500 font-medium">{s.namabarang}</td>
                        <td className="px-5 py-3 text-dark-400">{s.satuankecil || '-'}</td>
                        <td className="px-5 py-3 text-right text-dark-400">{s.stokmin}</td>
                        <td className={`px-5 py-3 text-right font-bold ${parseFloat(s.stok || 0) < 0 ? 'text-red-500' : 'text-amber-600'}`}>{s.stok || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 border-t border-primary-50 flex justify-between items-center">
              <span className="text-xs text-dark-300">Total: <span className="font-bold text-dark-500">{lowStockList.length}</span> barang</span>
              <button onClick={() => setShowLowStockModal(false)} className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold transition-all">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
