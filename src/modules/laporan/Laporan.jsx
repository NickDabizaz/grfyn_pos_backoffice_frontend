import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import useTabStore from '../../store/tabStore';
import { formatRupiah, today, firstOfMonth } from '../../lib/utils';
import { Eye, Printer, FileBarChart, Package, Users, Building2, ShoppingBag, X } from 'lucide-react';
import MultiSelectModal from '../../components/ui/MultiSelectModal';
import DatePicker from '../../components/ui/DatePicker';
import LaporanResultPage from './LaporanResultPage';
import ReportExportButton from './ReportExportButton';

const reportUrl = (type, token, params = {}) => {
  const qs = new URLSearchParams({ format: 'html', token, ...params }).toString();
  return `/api/laporan/${type}?${qs}`;
};

function joinIds(arr, field) {
  if (!arr || !arr.length) return '';
  return arr.map((it) => it[field]).filter(Boolean).join(',');
}

function FilterChip({ label, items, nameField, onClear, onBrowse, emptyText }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-dark-300 mb-1">{label}</label>
      <div className="flex items-center gap-1.5 flex-wrap min-h-[34px] px-2 py-1.5 rounded-lg border border-primary-100 bg-white">
        {items.length === 0 && (
          <span className="text-xs text-dark-300 px-1">{emptyText || 'Semua'}</span>
        )}
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-100 text-primary-700 text-[10px] font-semibold max-w-[160px]"
          >
            <span className="truncate">{item[nameField]}</span>
            <button onClick={() => onClear(item)} className="hover:text-red-500 shrink-0">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        <button
          onClick={onBrowse}
          className="text-[10px] font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 py-0.5 rounded-md shrink-0"
        >
          + Browse
        </button>
      </div>
    </div>
  );
}

export default function Laporan() {
  const token = useAuthStore((s) => s.token);
  const openTab = useTabStore((s) => s.openTab);

  const [category, setCategory] = useState('penjualan');
  const [subType, setSubType] = useState('transaksi');

  const [tglwal, setTglwal] = useState(today());
  const [tglakhir, setTglakhir] = useState(today());

  const [filterCustomers, setFilterCustomers] = useState([]);
  const [filterSuppliers, setFilterSuppliers] = useState([]);
  const [filterLokasis, setFilterLokasis] = useState([]);
  const [filterBarangs, setFilterBarangs] = useState([]);

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showLokasiModal, setShowLokasiModal] = useState(false);
  const [showBarangModal, setShowBarangModal] = useState(false);

  const [masterData, setMasterData] = useState([]);
  const [masterLoading, setMasterLoading] = useState(false);
  const [masterType, setMasterType] = useState('barang');

  const categories = [
    { key: 'master', label: 'Master', icon: Package },
    { key: 'penjualan', label: 'Penjualan', icon: FileBarChart },
    { key: 'pembelian', label: 'Pembelian', icon: ShoppingBag },
  ];

  const penjualanTypes = [
    { key: 'transaksi', label: 'Laporan Penjualan', url: 'sales-transaksi' },
    { key: 'percustomer', label: 'Laporan Penjualan Per Customer', url: 'sales-per-customer' },
    { key: 'perlokasi', label: 'Laporan Penjualan Per Lokasi', url: 'sales-per-lokasi' },
    { key: 'perbarang', label: 'Laporan Penjualan Per Barang', url: 'sales-per-barang' },
    { key: 'rekap', label: 'Laporan Penjualan Rekap', url: 'rekap-sales' },
  ];

  const pembelianTypes = [
    { key: 'transaksi', label: 'Laporan Pembelian', url: 'pembelian' },
    { key: 'persupplier', label: 'Laporan Pembelian Per Supplier', url: 'pembelian-per-supplier' },
    { key: 'perlokasi', label: 'Laporan Pembelian Per Lokasi', url: 'pembelian-per-lokasi' },
    { key: 'perbarang', label: 'Laporan Pembelian Per Barang', url: 'pembelian-per-barang' },
    { key: 'rekap', label: 'Laporan Pembelian Rekap', url: 'pembelian-rekap' },
  ];

  const masterTypes = [
    { key: 'barang', label: 'Barang', icon: Package },
    { key: 'customer', label: 'Customer', icon: Users },
    { key: 'supplier', label: 'Supplier', icon: Building2 },
  ];

  useEffect(() => {
    if (category === 'master') {
      loadMasterData(masterType);
    }
  }, [category, masterType]);

  const loadMasterData = (type) => {
    setMasterLoading(true);
    let endpoint = type === 'barang' ? '/barang?limit=500' : `/${type}`;
    api
      .get(endpoint)
      .then((r) => {
        setMasterData(Array.isArray(r.data) ? r.data : r.data.data || []);
        setMasterLoading(false);
      })
      .catch(() => setMasterLoading(false));
  };

  const getReportParams = () => {
    const params = { tglwal, tglakhir };
    if (filterCustomers.length) params.kodecustomer = joinIds(filterCustomers, 'kodecustomer');
    if (filterSuppliers.length) params.idsupplier = joinIds(filterSuppliers, 'idsupplier');
    if (filterLokasis.length) params.namalokasi = joinIds(filterLokasis, 'namalokasi');
    if (filterBarangs.length) params.idbarang = joinIds(filterBarangs, 'idbarang');
    return params;
  };

  const getReportUrl = () => {
    const params = getReportParams();
    if (category === 'penjualan') {
      const t = penjualanTypes.find((p) => p.key === subType);
      return { url: t?.url, params };
    }
    if (category === 'pembelian') {
      const t = pembelianTypes.find((p) => p.key === subType);
      return { url: t?.url, params };
    }
    return null;
  };

  const openInNewTab = (label, url) => {
    openTab({
      label,
      component: LaporanResultPage,
      props: { url, label },
      type: 'report',
      kodemenu: null,
    });
  };

  const handleTampilkan = () => {
    const r = getReportUrl();
    if (!r) return;
    const label =
      category === 'penjualan'
        ? penjualanTypes.find((p) => p.key === subType)?.label || 'Laporan'
        : pembelianTypes.find((p) => p.key === subType)?.label || 'Laporan';
    openInNewTab(label, reportUrl(r.url, token, r.params));
  };

  const handlePrintMaster = () => {
    const label = masterTypes.find((m) => m.key === masterType)?.label || 'Master';
    openTab({
      label: `Laporan Master ${label}`,
      component: LaporanResultPage,
      props: {
        url: null,
        label: `Laporan Master ${label}`,
        data: masterData,
        type: masterType,
        onPrint: () => window.print(),
      },
      type: 'report',
      kodemenu: null,
    });
  };

  const fetchCustomers = (search) =>
    api.get('/customer', search ? { params: { search } } : {}).then((r) => r.data || []);

  const fetchSuppliers = (search) =>
    api.get('/supplier', search ? { params: { search } } : {}).then((r) => r.data || []);

  const fetchLokasis = () =>
    api.get('/lokasi').then((r) => r.data || []);

  const fetchBarangs = (search) =>
    api.get('/barang/browse-barang', search ? { params: { search } } : {}).then((r) => r.data || []);

  const showMasterReport = category === 'master';

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-4 pb-2 shrink-0">
        <h2 className="text-xl font-bold text-dark-500">Laporan</h2>
        <p className="text-sm text-dark-300">Filter & cetak laporan</p>
      </div>

      <div className="flex-1 overflow-auto p-6 pt-2">
        <div className="space-y-4">
          {/* Category Tabs */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => {
                  setCategory(c.key);
                  if (c.key === 'master') setMasterType('barang');
                  else if (c.key === 'penjualan') setSubType('transaksi');
                  else setSubType('transaksi');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  category === c.key
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-warm-50 text-dark-400 hover:bg-warm-100'
                }`}
              >
                <c.icon className="w-4 h-4" /> {c.label}
              </button>
            ))}
          </div>

          {/* Master Report Section */}
          {showMasterReport && (
            <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
              <div className="p-4 border-b border-primary-50 flex items-center justify-between">
                <div className="flex gap-2">
                  {masterTypes.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setMasterType(m.key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        masterType === m.key
                          ? 'bg-primary-500 text-white shadow-sm'
                          : 'bg-warm-50 text-dark-400 hover:bg-warm-100'
                      }`}
                    >
                      <m.icon className="w-3.5 h-3.5" /> {m.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handlePrintMaster}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 border border-primary-200 text-primary-600 text-sm font-semibold hover:bg-primary-100 transition-colors"
                >
                  <Printer className="w-4 h-4" /> Cetak
                </button>
              </div>
              <div className="overflow-y-auto scrollbar-thin" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                {masterLoading ? (
                  <div className="p-8 text-center text-sm text-dark-300">Memuat...</div>
                ) : masterType === 'barang' ? (
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
                      </tr>
                    </thead>
                    <tbody>
                      {masterData.map((b, i) => (
                        <tr key={b.idbarang || i} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                          <td className="px-4 py-3 text-dark-400">{i + 1}</td>
                          <td className="px-4 py-3 text-xs font-mono text-dark-300">{b.kodebarang}</td>
                          <td className="px-4 py-3 font-medium text-dark-500">{b.namabarang}</td>
                          <td className="px-4 py-3 text-dark-400">{b.satuankecil || '-'}</td>
                          <td className="px-4 py-3 text-dark-400">{b.jenisbarang || '-'}</td>
                          <td className="px-4 py-3 text-right">{formatRupiah(b.hargajual)}</td>
                          <td className="px-4 py-3 text-right">{formatRupiah(b.hargabeli)}</td>
                        </tr>
                      ))}
                      {masterData.length === 0 && (
                        <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-dark-300">Tidak ada data</td></tr>
                      )}
                    </tbody>
                  </table>
                ) : masterType === 'customer' ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-primary-50 bg-warm-50/50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">No</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama Customer</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Alamat</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">No. HP</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masterData.map((c, i) => (
                        <tr key={c.idcustomer || i} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                          <td className="px-4 py-3 text-dark-400">{i + 1}</td>
                          <td className="px-4 py-3 text-xs font-mono text-dark-300">{c.kodecustomer}</td>
                          <td className="px-4 py-3 font-medium text-dark-500">{c.namacustomer}</td>
                          <td className="px-4 py-3 text-dark-400">{c.alamat || '-'}</td>
                          <td className="px-4 py-3 text-dark-400">{c.hp || '-'}</td>
                          <td className="px-4 py-3 text-dark-400">{c.email || '-'}</td>
                        </tr>
                      ))}
                      {masterData.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-dark-300">Tidak ada data</td></tr>
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-primary-50 bg-warm-50/50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">No</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama Supplier</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Alamat</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">No. HP</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masterData.map((s, i) => (
                        <tr key={s.idsupplier || i} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                          <td className="px-4 py-3 text-dark-400">{i + 1}</td>
                          <td className="px-4 py-3 text-xs font-mono text-dark-300">{s.kodesupplier}</td>
                          <td className="px-4 py-3 font-medium text-dark-500">{s.namasupplier}</td>
                          <td className="px-4 py-3 text-dark-400">{s.alamat || '-'}</td>
                          <td className="px-4 py-3 text-dark-400">{s.hp || '-'}</td>
                          <td className="px-4 py-3 text-dark-400">{s.email || '-'}</td>
                        </tr>
                      ))}
                      {masterData.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-dark-300">Tidak ada data</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Penjualan & Pembelian Report Section */}
          {!showMasterReport && (
            <>
              {/* Sub-Type Tabs */}
              <div className="flex gap-2 flex-wrap">
                {(category === 'penjualan' ? penjualanTypes : pembelianTypes).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setSubType(t.key)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      subType === t.key
                        ? 'bg-accent-50 border border-accent-200 text-accent-700'
                        : 'bg-warm-50 text-dark-400 hover:bg-warm-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Filter Bar */}
              <div className="bg-white rounded-2xl border border-primary-50 p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {/* Tanggal */}
                  <div>
                    <label className="block text-[10px] font-semibold text-dark-300 mb-1">Tanggal Awal</label>
                    <DatePicker
                      value={tglwal}
                      onChange={setTglwal}
                      className="w-full px-2 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-dark-300 mb-1">Tanggal Akhir</label>
                    <DatePicker
                      value={tglakhir}
                      onChange={setTglakhir}
                      className="w-full px-2 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20"
                    />
                  </div>

                  {/* Customer (Penjualan only) */}
                  {category === 'penjualan' && (
                    <FilterChip
                      label="Customer"
                      items={filterCustomers}
                      nameField="namacustomer"
                      emptyText="Semua"
                      onClear={(c) => setFilterCustomers((prev) => prev.filter((x) => x.idcustomer !== c.idcustomer))}
                      onBrowse={() => setShowCustomerModal(true)}
                    />
                  )}

                  {/* Supplier (Pembelian only) */}
                  {category === 'pembelian' && (
                    <FilterChip
                      label="Supplier"
                      items={filterSuppliers}
                      nameField="namasupplier"
                      emptyText="Semua"
                      onClear={(s) => setFilterSuppliers((prev) => prev.filter((x) => x.idsupplier !== s.idsupplier))}
                      onBrowse={() => setShowSupplierModal(true)}
                    />
                  )}

                  {/* Lokasi */}
                  <FilterChip
                    label="Lokasi"
                    items={filterLokasis}
                    nameField="namalokasi"
                    emptyText="Semua"
                    onClear={(l) => setFilterLokasis((prev) => prev.filter((x) => x.idlokasi !== l.idlokasi))}
                    onBrowse={() => setShowLokasiModal(true)}
                  />

                  {/* Barang (for per-barang reports) */}
                  {subType === 'perbarang' && (
                    <div className="col-span-2">
                      <FilterChip
                        label="Barang"
                        items={filterBarangs}
                        nameField="namabarang"
                        emptyText="Semua barang"
                        onClear={(b) => setFilterBarangs((prev) => prev.filter((x) => x.idbarang !== b.idbarang))}
                        onBrowse={() => setShowBarangModal(true)}
                      />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTampilkan}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold transition-all"
                  >
                    <Eye className="w-4 h-4" /> Cetak Laporan
                  </button>
                  <ReportExportButton
                    url={(() => {
                      const report = getReportUrl();
                      return report ? reportUrl(report.url, token, report.params) : '';
                    })()}
                    token={token}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCustomerModal && (
        <MultiSelectModal
          title="Pilih Customer"
          fetchItems={fetchCustomers}
          initialSelected={filterCustomers}
          onConfirm={(items) => {
            setFilterCustomers(items);
            setShowCustomerModal(false);
          }}
          onClose={() => setShowCustomerModal(false)}
          idField="idcustomer"
          labelField="namacustomer"
          subField="kodecustomer"
          searchPlaceholder="Cari customer..."
        />
      )}
      {showSupplierModal && (
        <MultiSelectModal
          title="Pilih Supplier"
          fetchItems={fetchSuppliers}
          initialSelected={filterSuppliers}
          onConfirm={(items) => {
            setFilterSuppliers(items);
            setShowSupplierModal(false);
          }}
          onClose={() => setShowSupplierModal(false)}
          idField="idsupplier"
          labelField="namasupplier"
          subField="kodesupplier"
          searchPlaceholder="Cari supplier..."
        />
      )}
      {showLokasiModal && (
        <MultiSelectModal
          title="Pilih Lokasi"
          fetchItems={fetchLokasis}
          initialSelected={filterLokasis}
          onConfirm={(items) => {
            setFilterLokasis(items);
            setShowLokasiModal(false);
          }}
          onClose={() => setShowLokasiModal(false)}
          idField="idlokasi"
          labelField="namalokasi"
          subField="kodelokasi"
          searchPlaceholder="Cari lokasi..."
        />
      )}
      {showBarangModal && (
        <MultiSelectModal
          title="Pilih Barang"
          fetchItems={fetchBarangs}
          initialSelected={filterBarangs}
          onConfirm={(items) => {
            setFilterBarangs(items);
            setShowBarangModal(false);
          }}
          onClose={() => setShowBarangModal(false)}
          idField="idbarang"
          labelField="namabarang"
          subField="kodebarang"
          searchPlaceholder="Cari kode / nama barang..."
        />
      )}
    </div>
  );
}
