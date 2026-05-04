import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Printer, Package } from 'lucide-react';

export default function LaporanMasterBarang() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/barang?limit=500').then((r) => {
      setData(r.data.data || r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-500">Laporan Master Barang</h2>
          <p className="text-sm text-dark-300">Daftar seluruh barang</p>
        </div>
        <button onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-all">
          <Printer className="w-4 h-4" /> Cetak
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary-50 bg-warm-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">No</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama Barang</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Satuan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Jenis</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Harga Jual</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Harga Beli</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Stok Min</th>
            </tr>
          </thead>
          <tbody>
            {data.map((b, i) => (
              <tr key={b.idbarang} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                <td className="px-4 py-3 text-dark-400">{i + 1}</td>
                <td className="px-4 py-3 text-xs font-mono text-dark-300">{b.kodebarang}</td>
                <td className="px-4 py-3 font-medium text-dark-500">{b.namabarang}</td>
                <td className="px-4 py-3 text-dark-400">{b.satuankecil || '-'}</td>
                <td className="px-4 py-3 text-dark-400">{b.jenisbarang || '-'}</td>
                <td className="px-4 py-3 text-right">{b.hargajual?.toLocaleString('id-ID') || 0}</td>
                <td className="px-4 py-3 text-right">{b.hargabeli?.toLocaleString('id-ID') || 0}</td>
                <td className="px-4 py-3 text-center">{b.stokmin || 0}</td>
              </tr>
            ))}
            {data.length === 0 && !loading && (
              <tr><td colSpan="8" className="px-4 py-8 text-center text-sm text-dark-300">Tidak ada data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
