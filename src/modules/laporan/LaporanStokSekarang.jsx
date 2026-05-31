import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import useTabStore from '../../store/tabStore';
import { useMenuAccess, canAccess } from '../../hooks/useMenuAccess';
import { Printer, Package, RefreshCw, X } from 'lucide-react';
import MultiSelectModal from '../../components/ui/MultiSelectModal';
import LaporanResultPage from './LaporanResultPage';
import ReportExportButton from './ReportExportButton';

const reportUrl = (token, params = {}) => {
  const qs = new URLSearchParams({ format: 'html', token, ...params }).toString();
  return `/api/laporan/stok?${qs}`;
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

export default function LaporanStokSekarang() {
  const { access } = useMenuAccess('laporan.stok.sekarang');
  const canTambah = canAccess(access, 'tambah');
  const canUbah = canAccess(access, 'ubah');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ totalBarang: 0, totalStok: 0 });

  const token = useAuthStore((s) => s.token);
  const lokasi = useAuthStore((s) => s.lokasi);
  const openTab = useTabStore((s) => s.openTab);

  const load = () => {
    setLoading(true);
    api
      .get('/laporan/stok')
      .then((r) => {
        setData(r.data.data || []);
        setSummary({
          totalBarang: r.data.totalBarang || 0,
          totalStok: r.data.totalStok || 0,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCetak = () => {
    const params = lokasi?.idlokasi ? { idlokasi: lokasi.idlokasi } : {};
    openTab({
      label: 'Laporan Stok Sekarang',
      component: LaporanResultPage,
      props: { url: reportUrl(token, params), token, label: 'Laporan Stok Sekarang' },
      type: 'report',
      kodemenu: null,
    });
  };

  const currentReportUrl = reportUrl(token, lokasi?.idlokasi ? { idlokasi: lokasi.idlokasi } : {});

  return (
    <div className="space-y-4 mt-4 ms-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-500">Laporan Stok Sekarang</h2>
          <p className="text-sm text-dark-300">Filter & cetak laporan stok</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-dark-500 text-sm font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <ReportExportButton url={currentReportUrl} token={token} />
          <button
            onClick={handleCetak}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-all"
          >
            <Printer className="w-4 h-4" /> Cetak Laporan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-primary-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-dark-300 font-medium">Total Barang</p>
              <p className="text-xl font-bold text-dark-500">{summary.totalBarang}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-primary-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <p className="text-xs text-dark-300 font-medium">Total Stok</p>
              <p className="text-xl font-bold text-dark-500">{summary.totalStok.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary-50 bg-warm-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">No</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama Barang</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Satuan</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Stok</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Stok Min</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => {
              const stok = parseInt(item.stok) || 0;
              const stokMin = parseInt(item.stokmin) || 0;
              const isLow = stok <= stokMin;

              return (
                <tr key={item.idbarang} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                  <td className="px-4 py-3 text-dark-400">{i + 1}</td>
                  <td className="px-4 py-3 text-xs font-mono text-dark-300">{item.kodebarang}</td>
                  <td className="px-4 py-3 font-medium text-dark-500">{item.namabarang}</td>
                  <td className="px-4 py-3 text-dark-400">{item.satuan || '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-dark-500">
                    {stok.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-right text-dark-400">{stokMin.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-center">
                    {isLow ? (
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        Rendah
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        Aman
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-sm text-dark-300">
                  Tidak ada data
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-sm text-dark-300">
                  Memuat data...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
