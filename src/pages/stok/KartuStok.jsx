import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { formatDate } from '../../lib/utils';
import { Search, ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';
import SearchableSelect from '../../components/ui/SearchableSelect';

export default function KartuStok() {
  const [kartu, setKartu] = useState([]);
  const [ksSearch, setKsSearch] = useState('');
  const [ksJenis, setKsJenis] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadKartu = () => {
    const params = {};
    if (ksSearch) params.idbarang = ksSearch;
    if (ksJenis) params.jenis = ksJenis;
    api.get('/stok/kartustok', { params }).then((r) => setKartu(r.data));
  };

  useEffect(() => { loadKartu(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => { loadKartu(); setTimeout(r, 300); });
    setRefreshing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-500">Kartu Stok</h2>
          <p className="text-sm text-dark-300">Riwayat pergerakan stok barang</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className={`p-2 rounded-xl border border-primary-100 text-dark-400 hover:bg-warm-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
          title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

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
  );
}
