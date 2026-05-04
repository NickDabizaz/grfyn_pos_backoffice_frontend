import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { RefreshCw } from 'lucide-react';

export default function StokSekarang() {
  const [saldo, setSaldo] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSaldo = () => {
    api.get('/stok/saldostok').then((r) => setSaldo(r.data));
  };

  useEffect(() => { loadSaldo(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => { loadSaldo(); setTimeout(r, 300); });
    setRefreshing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-500">Stok Sekarang</h2>
          <p className="text-sm text-dark-300">Lihat stok barang saat ini</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className={`p-2 rounded-xl border border-primary-100 text-dark-400 hover:bg-warm-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
          title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
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
            {saldo.map((s) => (
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
      </div>
    </div>
  );
}
