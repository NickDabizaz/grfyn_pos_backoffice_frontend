import { useState } from 'react';
import { formatDate, today, firstOfMonth } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { FileBarChart, Eye } from 'lucide-react';

const reportUrl = (type, token, params = {}) => {
  const qs = new URLSearchParams({ format: 'html', token, ...params }).toString();
  return `/api/laporan/${type}?${qs}`;
};

export default function Laporan() {
  const [tab, setTab]               = useState('sales-transaksi');
  const [tglwal, setTglwal]         = useState(firstOfMonth());
  const [tglakhir, setTglakhir]     = useState(today());
  const [idbarang, setIdbarang]     = useState('');
  const [idcustomer, setIdcustomer] = useState('');
  const [idsupplier, setIdsupplier] = useState('');
  const [url, setUrl]               = useState('');
  const token                       = useAuthStore((s) => s.token);

  const generateUrl = () => {
    const params = { tglwal, tglakhir };
    if (tab === 'sales-transaksi' || tab === 'sales-per-barang') { if (idbarang) params.idbarang = idbarang; }
    if (tab === 'sales-per-customer' || tab === 'sales-transaksi') { if (idcustomer) params.idcustomer = idcustomer; }
    if (tab === 'pembelian' && idsupplier) params.idsupplier = idsupplier;
    setUrl(reportUrl(tab, token, params));
  };

  const reports = [
    { key: 'sales-transaksi',     label: 'Sales Transaksi' },
    { key: 'sales-per-customer',  label: 'Sales Per Customer' },
    { key: 'sales-per-barang',    label: 'Sales Per Barang' },
    { key: 'pembelian',           label: 'Pembelian' },
    { key: 'stok',                label: 'Laporan Stok' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-dark-500">Laporan</h2>
        <p className="text-sm text-dark-300">Generate & cetak laporan</p>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-primary-50 space-y-4">
        <div className="flex flex-wrap gap-2">
          {reports.map((r) => (
            <button key={r.key} onClick={() => { setTab(r.key); setUrl(''); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === r.key ? 'bg-primary-500 text-white shadow-sm' : 'bg-warm-50 text-dark-400 hover:bg-warm-100'}`}>
              {r.label}
            </button>
          ))}
        </div>

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
          {(tab === 'sales-transaksi' || tab === 'sales-per-customer') && (
            <div>
              <label className="block text-[10px] font-semibold text-dark-300 mb-1">ID Customer</label>
              <input value={idcustomer} onChange={(e) => setIdcustomer(e.target.value)}
                placeholder="Opsional" className="px-3 py-2 rounded-xl border border-primary-100 text-sm w-28" />
            </div>
          )}
          {(tab === 'sales-transaksi' || tab === 'sales-per-barang') && (
            <div>
              <label className="block text-[10px] font-semibold text-dark-300 mb-1">ID Barang</label>
              <input value={idbarang} onChange={(e) => setIdbarang(e.target.value)}
                placeholder="Opsional" className="px-3 py-2 rounded-xl border border-primary-100 text-sm w-28" />
            </div>
          )}
          {tab === 'pembelian' && (
            <div>
              <label className="block text-[10px] font-semibold text-dark-300 mb-1">ID Supplier</label>
              <input value={idsupplier} onChange={(e) => setIdsupplier(e.target.value)}
                placeholder="Opsional" className="px-3 py-2 rounded-xl border border-primary-100 text-sm w-28" />
            </div>
          )}
          <button onClick={generateUrl}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-all h-fit">
            <Eye className="w-4 h-4" /> Tampilkan
          </button>
        </div>
      </div>

      {url ? (
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden animate-in" style={{ minHeight: '70vh' }}>
          <iframe src={url} className="w-full border-0" style={{ minHeight: '70vh', height: 'calc(100vh - 300px)' }} title="Laporan" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-primary-50 p-12 text-center animate-in">
          <FileBarChart className="w-16 h-16 text-dark-200 mx-auto mb-4" />
          <p className="text-dark-300 text-sm">Pilih jenis laporan dan filter, lalu klik <strong>Tampilkan</strong></p>
        </div>
      )}
    </div>
  );
}
