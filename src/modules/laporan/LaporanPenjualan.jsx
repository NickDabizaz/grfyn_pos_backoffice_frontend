import { useState } from 'react';
import { today, firstOfMonth } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import useTabStore from '../../store/tabStore';
import { useMenuAccess, canAccess } from '../../hooks/useMenuAccess';
import { Eye, FileBarChart, X } from 'lucide-react';
import api from '../../api/axios';
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

export default function LaporanPenjualan() {
  const { access } = useMenuAccess('laporan.penjualan');
  const canTambah = canAccess(access, 'tambah');
  const canUbah = canAccess(access, 'ubah');

  const [tab, setTab] = useState('sales-transaksi');
  const [tglwal, setTglwal] = useState(firstOfMonth());
  const [tglakhir, setTglakhir] = useState(today());
  const [filterCustomers, setFilterCustomers] = useState([]);
  const [filterLokasis, setFilterLokasis] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showLokasiModal, setShowLokasiModal] = useState(false);

  const token = useAuthStore((s) => s.token);
  const lokasi = useAuthStore((s) => s.lokasi);
  const openTab = useTabStore((s) => s.openTab);

  const reports = [
    { key: 'sales-transaksi', label: 'Sales Transaksi' },
    { key: 'sales-per-customer', label: 'Sales Per Customer' },
    { key: 'sales-per-barang', label: 'Sales Per Barang' },
    { key: 'sales-per-lokasi', label: 'Sales Per Lokasi' },
  ];

  const fetchCustomers = (search) =>
    api.get('/customer', search ? { params: { search } } : {}).then((r) => r.data || []);

  const fetchLokasis = () =>
    api.get('/lokasi').then((r) => r.data || []);

  const getReportTarget = () => {
    const params = { tglwal, tglakhir };
    if (lokasi?.idlokasi) params.idlokasi = lokasi.idlokasi;
    if (filterCustomers.length) params.kodecustomer = joinIds(filterCustomers, 'kodecustomer');
    if (filterLokasis.length) params.namalokasi = joinIds(filterLokasis, 'namalokasi');
    const label = reports.find((r) => r.key === tab)?.label || 'Laporan Penjualan';
    return { label, url: reportUrl(tab, token, params) };
  };

  const handleGenerate = () => {
    const { label, url } = getReportTarget();
    openTab({
      label,
      component: LaporanResultPage,
      props: { url, label },
      type: 'report',
      kodemenu: null,
    });
  };

  return (
    <div className="space-y-4 mt-4 ms-4">
      <div>
        <h2 className="text-2xl font-bold text-dark-500">Laporan Penjualan</h2>
        <p className="text-sm text-dark-300">Filter & cetak laporan penjualan</p>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-primary-50 space-y-4">
        <div className="flex flex-wrap gap-2">
          {reports.map((r) => (
            <button
              key={r.key}
              onClick={() => setTab(r.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === r.key
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-warm-50 text-dark-400 hover:bg-warm-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Dari</label>
            <DatePicker
              value={tglwal}
              onChange={setTglwal}
              className="w-full px-2 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-dark-300 mb-1">Sampai</label>
            <DatePicker
              value={tglakhir}
              onChange={setTglakhir}
              className="w-full px-2 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20"
            />
          </div>

          <FilterChip
            label="Customer"
            items={filterCustomers}
            nameField="namacustomer"
            emptyText="Semua"
            onClear={(c) => setFilterCustomers((prev) => prev.filter((x) => x.idcustomer !== c.idcustomer))}
            onBrowse={() => setShowCustomerModal(true)}
          />

          <FilterChip
            label="Lokasi"
            items={filterLokasis}
            nameField="namalokasi"
            emptyText="Semua"
            onClear={(l) => setFilterLokasis((prev) => prev.filter((x) => x.idlokasi !== l.idlokasi))}
            onBrowse={() => setShowLokasiModal(true)}
          />
        </div>

        <div className="flex gap-2">
          <ReportExportButton url={getReportTarget().url} token={token} />
          <button onClick={handleGenerate} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold transition-all h-fit">
            <Eye className="w-4 h-4" /> Cetak Laporan
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-primary-50 p-12 text-center animate-in">
        <FileBarChart className="w-16 h-16 text-dark-200 mx-auto mb-4" />
        <p className="text-dark-300 text-sm">
          Pilih jenis laporan dan filter, lalu klik <strong>Cetak Laporan</strong>
        </p>
      </div>

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
    </div>
  );
}
