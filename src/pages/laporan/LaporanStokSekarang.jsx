import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Eye, FileBarChart } from 'lucide-react';

const reportUrl = (type, token, params = {}) => {
  const qs = new URLSearchParams({ format: 'html', token, ...params }).toString();
  return `/api/laporan/${type}?${qs}`;
};

export default function LaporanStokSekarang() {
  const [tgl, setTgl] = useState('');
  const [url, setUrl] = useState('');
  const token = useAuthStore((s) => s.token);

  const generateUrl = () => {
    const params = {};
    if (tgl) params.tgl = tgl;
    setUrl(reportUrl('stok', token, params));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-dark-500">Laporan Stok Sekarang</h2>
        <p className="text-sm text-dark-300">Generate laporan posisi stok barang</p>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-primary-50 space-y-4">
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Per Tanggal (opsional)</label>
            <input type="date" value={tgl} onChange={(e) => setTgl(e.target.value)}
              className="px-3 py-2 rounded-xl border border-primary-100 text-sm" />
          </div>
          <button onClick={generateUrl}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-all h-fit">
            <Eye className="w-4 h-4" /> Tampilkan
          </button>
        </div>
      </div>

      {url ? (
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden animate-in" style={{ minHeight: '70vh' }}>
          <iframe src={url} className="w-full border-0" style={{ minHeight: '70vh', height: 'calc(100vh - 300px)' }} title="Laporan Stok" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-primary-50 p-12 text-center animate-in">
          <FileBarChart className="w-16 h-16 text-dark-200 mx-auto mb-4" />
          <p className="text-dark-300 text-sm">Pilih tanggal (opsional), lalu klik <strong>Tampilkan</strong></p>
        </div>
      )}
    </div>
  );
}
