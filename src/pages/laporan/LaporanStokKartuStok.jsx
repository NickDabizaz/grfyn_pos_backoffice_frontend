import { useState } from 'react';
import { today, firstOfMonth } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { Search, Eye, FileBarChart } from 'lucide-react';

const reportUrl = (type, token, params = {}) => {
  const qs = new URLSearchParams({ format: 'html', token, ...params }).toString();
  return `/api/laporan/${type}?${qs}`;
};

export default function LaporanStokKartuStok() {
  const [tglwal, setTglwal] = useState(firstOfMonth());
  const [tglakhir, setTglakhir] = useState(today());
  const [idbarang, setIdbarang] = useState('');
  const [url, setUrl] = useState('');
  const token = useAuthStore((s) => s.token);

  const generateUrl = () => {
    const params = { tglwal, tglakhir };
    if (idbarang) params.idbarang = idbarang;
    setUrl(reportUrl('kartu-stok', token, params));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-dark-500">Laporan Kartu Stok</h2>
        <p className="text-sm text-dark-300">Generate laporan pergerakan stok barang</p>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-primary-50 space-y-4">
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Dari</label>
            <input type="date" value={tglwal} onChange={(e) => setTglwal(e.target.value)}
              className="px-3 py-2 rounded-xl border border-primary-100 text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Sampai</label>
            <input type="date" value={tglakhir} onChange={(e) => setTglakhir(e.target.value)}
              className="px-3 py-2 rounded-xl border border-primary-100 text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">ID Barang</label>
            <input value={idbarang} onChange={(e) => setIdbarang(e.target.value)}
              placeholder="Opsional" className="px-3 py-2 rounded-xl border border-primary-100 text-sm w-28" />
          </div>
          <button onClick={generateUrl}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-all h-fit">
            <Eye className="w-4 h-4" /> Tampilkan
          </button>
        </div>
      </div>

      {url ? (
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden animate-in" style={{ minHeight: '70vh' }}>
          <iframe src={url} className="w-full border-0" style={{ minHeight: '70vh', height: 'calc(100vh - 300px)' }} title="Laporan Kartu Stok" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-primary-50 p-12 text-center animate-in">
          <FileBarChart className="w-16 h-16 text-dark-200 mx-auto mb-4" />
          <p className="text-dark-300 text-sm">Pilih filter tanggal, lalu klik <strong>Tampilkan</strong></p>
        </div>
      )}
    </div>
  );
}
