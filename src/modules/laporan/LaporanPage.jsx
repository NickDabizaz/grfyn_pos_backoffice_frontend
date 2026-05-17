import { useState } from 'react';
import { Eye, FileBarChart, X } from 'lucide-react';
import { today, firstOfMonth } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import useTabStore from '../../store/tabStore';
import api from '../../api/axios';
import MultiSelectModal from '../../components/ui/MultiSelectModal';
import AdvancedFilter from '../../components/ui/AdvancedFilter';
import LaporanResultPage from './LaporanResultPage';
import laporanConfig from './laporanConfig';

const reportUrl = (endpoint, token, params = {}) => {
  const qs = new URLSearchParams({ format: 'html', token, ...params }).toString();
  return `/api/laporan/${endpoint}?${qs}`;
};

function FilterChip({ label, items, nameField, onClear, onBrowse }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-dark-300 mb-1">{label}</label>
      <div className="flex items-center gap-1.5 flex-wrap min-h-[34px] px-2 py-1.5 rounded-lg border border-primary-100 bg-white">
        {items.length === 0 && (
          <span className="text-xs text-dark-300 px-1">Semua</span>
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

export default function LaporanPage({ kodemenu }) {
  const config = laporanConfig[kodemenu];
  const [selectedJenis, setSelectedJenis] = useState(config?.jenis?.[0]?.endpoint || '');
  const [tglwal, setTglwal]     = useState(firstOfMonth());
  const [tglakhir, setTglakhir] = useState(today());
  const [filterLokasi, setFilterLokasi] = useState([]);
  const [advancedFilters, setAdvancedFilters] = useState([]);
  const [showLokasiModal, setShowLokasiModal] = useState(false);

  const token   = useAuthStore((s) => s.token);
  const openTab = useTabStore((s) => s.openTab);

  if (!config) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-dark-300 text-sm">Konfigurasi laporan tidak ditemukan untuk: {kodemenu}</p>
      </div>
    );
  }

  const fetchLokasi = () => api.get('/lokasi').then((r) => r.data || []);

  const handleGenerate = () => {
    const jenis = config.jenis.find((j) => j.endpoint === selectedJenis) || config.jenis[0];
    const params = { tglwal, tglakhir };
    if (filterLokasi.length) {
      params.idlokasi = filterLokasi.map((l) => l.idlokasi).join(',');
    }
    if (advancedFilters.length) {
      params.filters = JSON.stringify(advancedFilters);
    }

    openTab({
      label    : jenis.label,
      component: LaporanResultPage,
      props    : { url: reportUrl(jenis.endpoint, token, params), label: jenis.label },
      type     : 'report',
      kodemenu : null,
      icon     : FileBarChart,
    });
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-5 space-y-1 border-b border-primary-50 bg-white">
        <h2 className="text-2xl font-bold text-dark-500">{config.title}</h2>
        <p className="text-sm text-dark-300">Filter &amp; cetak laporan</p>
      </div>

      <div className="p-5">
        <div className="bg-white rounded-2xl border border-primary-50 p-5">
          <div className="flex gap-6">
            {/* ── Kiri: Filter ─────────────────────────────────────────── */}
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-dark-300 mb-1">Dari</label>
                  <input
                    type="date"
                    value={tglwal}
                    onChange={(e) => setTglwal(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-dark-300 mb-1">Sampai</label>
                  <input
                    type="date"
                    value={tglakhir}
                    onChange={(e) => setTglakhir(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              <FilterChip
                label="Lokasi"
                items={filterLokasi}
                nameField="namalokasi"
                onClear={(l) => setFilterLokasi((prev) => prev.filter((x) => x.idlokasi !== l.idlokasi))}
                onBrowse={() => setShowLokasiModal(true)}
              />

              <AdvancedFilter
                filterSide={config.filterSide}
                onChange={setAdvancedFilters}
              />
            </div>

            {/* ── Kanan: Jenis Laporan + Cetak ─────────────────────────── */}
            <div className="w-96 shrink-0 space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-all"
                >
                  <Eye className="w-4 h-4" /> Cetak Laporan
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-dark-500 mb-3">Jenis Laporan</h3>
                <div className="grid grid-cols-1 gap-2">
                  {config.jenis.map((j) => (
                    <button
                      key={j.endpoint}
                      onClick={() => setSelectedJenis(j.endpoint)}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-left leading-tight transition-all ${
                        selectedJenis === j.endpoint
                          ? 'bg-primary-500 text-white shadow-sm'
                          : 'bg-warm-50 text-dark-400 hover:bg-warm-100'
                      }`}
                    >
                      {j.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLokasiModal && (
        <MultiSelectModal
          title="Pilih Lokasi"
          fetchItems={fetchLokasi}
          initialSelected={filterLokasi}
          onConfirm={(items) => { setFilterLokasi(items); setShowLokasiModal(false); }}
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
