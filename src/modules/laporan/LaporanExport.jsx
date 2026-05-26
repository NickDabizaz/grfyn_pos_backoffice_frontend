import { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { today, firstOfMonth } from '../../lib/utils';

const EXPORTS = [
  {
    key: 'sales-transaksi',
    label: 'Transaksi Penjualan',
    endpoint: '/laporan/export/sales-transaksi',
    filters: ['tglawal', 'tglakhir', 'search'],
  },
  {
    key: 'sales-per-barang',
    label: 'Penjualan Per Barang',
    endpoint: '/laporan/export/sales-per-barang',
    filters: ['tglawal', 'tglakhir'],
  },
  {
    key: 'pembelian',
    label: 'Pembelian',
    endpoint: '/laporan/export/pembelian',
    filters: ['tglawal', 'tglakhir'],
  },
  {
    key: 'stok',
    label: 'Stok Sekarang',
    endpoint: '/laporan/export/stok',
    filters: [],
  },
  {
    key: 'kartu-stok',
    label: 'Kartu Stok',
    endpoint: '/laporan/export/kartu-stok',
    filters: ['tglawal', 'tglakhir', 'idbarang'],
  },
];

function downloadBlob(data, filename) {
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LaporanExport() {
  const [tglawal, setTglawal] = useState(firstOfMonth());
  const [tglakhir, setTglakhir] = useState(today());
  const [search, setSearch] = useState('');
  const [idbarang, setIdbarang] = useState('');
  const [loadingKey, setLoadingKey] = useState(null);

  const handleDownload = async (exp, format) => {
    setLoadingKey(`${exp.key}-${format}`);
    try {
      const params = { format };
      if (exp.filters.includes('tglawal')) params.tglawal = tglawal;
      if (exp.filters.includes('tglakhir')) params.tglakhir = tglakhir;
      if (exp.filters.includes('search') && search) params.search = search;
      if (exp.filters.includes('idbarang') && idbarang) params.idbarang = idbarang;

      const response = await api.get(exp.endpoint, { params, responseType: 'blob' });
      const ext = format === 'excel' ? 'xlsx' : 'pdf';
      downloadBlob(response.data, `laporan-${exp.key}.${ext}`);
      toast.success(`${exp.label} berhasil diunduh`);
    } catch (err) {
      const msg = err.response?.data?.message || `Gagal download ${exp.label}`;
      toast.error(msg);
    } finally {
      setLoadingKey(null);
    }
  };

  const inp = 'w-full px-3 py-2 rounded-xl border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20';
  const lbl = 'block text-[10px] font-semibold text-dark-300 mb-1';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Export Laporan</h2>
          <p className="text-sm text-dark-300">Download laporan dalam format Excel atau PDF</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="grid grid-cols-1 gap-5 max-w-4xl">
          <div className="bg-white rounded-2xl border border-primary-50 p-4">
            <h3 className="text-sm font-bold text-dark-500 mb-3">Filter Umum</h3>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className={lbl}>Tanggal Awal</label>
                <input type="date" value={tglawal} onChange={(e) => setTglawal(e.target.value)} className={inp} />
              </div>
              <div>
                <label className={lbl}>Tanggal Akhir</label>
                <input type="date" value={tglakhir} onChange={(e) => setTglakhir(e.target.value)} className={inp} />
              </div>
              <div>
                <label className={lbl}>Pencarian <span className="font-normal">(transaksi)</span></label>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className={inp} placeholder="Nomor / nama customer..." />
              </div>
              <div>
                <label className={lbl}>ID Barang <span className="font-normal">(kartu stok)</span></label>
                <input type="number" value={idbarang} onChange={(e) => setIdbarang(e.target.value)} className={inp} placeholder="ID Barang" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXPORTS.map((exp) => (
              <div key={exp.key} className="bg-white rounded-2xl border border-primary-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-dark-500">{exp.label}</p>
                    {exp.filters.length > 0 && (
                      <p className="text-[10px] text-dark-300">Filter: {exp.filters.join(', ')}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(exp, 'excel')}
                    disabled={loadingKey === `${exp.key}-excel`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    {loadingKey === `${exp.key}-excel` ? 'Mengunduh...' : 'Excel'}
                  </button>
                  <button
                    onClick={() => handleDownload(exp, 'pdf')}
                    disabled={loadingKey === `${exp.key}-pdf`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {loadingKey === `${exp.key}-pdf` ? 'Mengunduh...' : 'PDF'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
