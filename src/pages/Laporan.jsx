import { useState, useEffect } from 'react';
import { formatDate, today, firstOfMonth } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { FileBarChart, Eye } from 'lucide-react';
import SearchableSelect from '../components/ui/SearchableSelect';
import MultiSelect from '../components/ui/MultiSelect';
import api from '../api/axios';

const reportUrl = (type, token, params = {}) => {
  const qs = new URLSearchParams();
  qs.append('format', 'html');
  qs.append('token', token);
  Object.entries(params).forEach(([key, val]) => {
    if (Array.isArray(val)) {
      val.forEach((v) => qs.append(key, v));
    } else if (val !== '' && val !== undefined && val !== null) {
      qs.append(key, val);
    }
  });
  return `/api/laporan/${type}?${qs.toString()}`;
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

  // Browse lists
  const [customers, setCustomers] = useState([]);
  const [barangs, setBarangs]     = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    api.get('/customer').then((r) => setCustomers(r.data));
    api.get('/barang').then((r) => setBarangs(r.data));
    api.get('/supplier').then((r) => setSuppliers(r.data));
  }, []);

  const isNotEmpty = (v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== '' && v !== undefined && v !== null;
  };

  const generateUrl = () => {
    const params = { tglwal, tglakhir };
    if ((tab === 'sales-transaksi' || tab === 'sales-per-barang' || tab === 'stok' || tab === 'kartu-stok') && isNotEmpty(idbarang)) {
      params.idbarang = idbarang;
    }
    if ((tab === 'sales-per-customer' || tab === 'sales-transaksi') && isNotEmpty(idcustomer)) {
      params.idcustomer = idcustomer;
    }
    if (tab === 'pembelian' && isNotEmpty(idsupplier)) params.idsupplier = idsupplier;
    setUrl(reportUrl(tab, token, params));
  };

  const handleTabChange = (key) => {
    setTab(key);
    setUrl('');
    setIdbarang(key === 'stok' || key === 'kartu-stok' ? [] : '');
    setIdcustomer('');
    setIdsupplier('');
  };

  const reports = [
    { key: 'sales-transaksi',     label: 'Sales Transaksi' },
    { key: 'sales-per-customer',  label: 'Sales Per Customer' },
    { key: 'sales-per-barang',    label: 'Sales Per Barang' },
    { key: 'pembelian',           label: 'Pembelian' },
    { key: 'stok',                label: 'Laporan Stok' },
    { key: 'kartu-stok',          label: 'Kartu Stok' },
  ];

  const customerOpts = customers.map((c) => ({ value: c.idcustomer, label: `${c.kodecustomer} | ${c.namacustomer}` }));
  const barangOpts   = barangs.map((b) => ({ value: b.idbarang, label: `${b.kodebarang} | ${b.namabarang}` }));
  const supplierOpts = suppliers.map((s) => ({ value: s.idsupplier, label: `${s.kodesupplier || ''} | ${s.namasupplier}` }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-dark-500">Laporan</h2>
        <p className="text-sm text-dark-300">Generate & cetak laporan</p>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-primary-50 space-y-4">
        <div className="flex flex-wrap gap-2">
          {reports.map((r) => (
            <button key={r.key} onClick={() => handleTabChange(r.key)}
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
            <div className="w-64">
              <label className="block text-[10px] font-semibold text-dark-300 mb-1">Customer</label>
              <SearchableSelect
                value={idcustomer}
                onChange={setIdcustomer}
                options={customerOpts}
                placeholder="Pilih customer..."
              />
            </div>
          )}

          {(tab === 'sales-transaksi' || tab === 'sales-per-barang') && (
            <div className="w-64">
              <label className="block text-[10px] font-semibold text-dark-300 mb-1">Barang</label>
              <SearchableSelect
                value={idbarang}
                onChange={setIdbarang}
                options={barangOpts}
                placeholder="Pilih barang..."
              />
            </div>
          )}

          {(tab === 'stok' || tab === 'kartu-stok') && (
            <div className="w-64">
              <label className="block text-[10px] font-semibold text-dark-300 mb-1">Barang</label>
              <MultiSelect
                value={Array.isArray(idbarang) ? idbarang : []}
                onChange={setIdbarang}
                options={barangOpts}
                placeholder="Pilih barang..."
              />
            </div>
          )}

          {tab === 'pembelian' && (
            <div className="w-64">
              <label className="block text-[10px] font-semibold text-dark-300 mb-1">Supplier</label>
              <SearchableSelect
                value={idsupplier}
                onChange={setIdsupplier}
                options={supplierOpts}
                placeholder="Pilih supplier..."
              />
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
