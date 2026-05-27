import { useState, useEffect } from 'react';
import { today, firstOfMonth } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import useTabStore from '../../store/tabStore';
import { useMenuAccess, canAccess } from '../../hooks/useMenuAccess';
import { Eye, FileBarChart, X } from 'lucide-react';
import api from '../../api/axios';
import MultiSelectModal from '../../components/ui/MultiSelectModal';
import LaporanResultPage from './LaporanResultPage';

const reportUrl = (token, params = {}) => {
  const qs = new URLSearchParams({ format: 'html', token, ...params }).toString();
  return `/api/laporan/kartu-stok?${qs}`;
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
            <span className="truncate">{item[nameField] || item}</span>
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

export default function LaporanStokKartuStok() {
  const { access } = useMenuAccess('laporan.stok.kartustok');
  const canTambah = canAccess(access, 'tambah');
  const canUbah = canAccess(access, 'ubah');

  const [tglwal, setTglwal] = useState(firstOfMonth());
  const [tglakhir, setTglakhir] = useState(today());
  const [filterLokasi, setFilterLokasi] = useState([]);
  const [filterBarangs, setFilterBarangs] = useState([]);
  const [filterJenis, setFilterJenis] = useState([]);
  const [showLokasiModal, setShowLokasiModal] = useState(false);
  const [showBarangModal, setShowBarangModal] = useState(false);
  const [showJenisModal, setShowJenisModal] = useState(false);

  const token = useAuthStore((s) => s.token);
  const openTab = useTabStore((s) => s.openTab);

  const fetchBarangs = (search) =>
    api.get('/barang/browse-barang', search ? { params: { search } } : {}).then((r) => r.data || []);
  const fetchLokasi = () => api.get('/lokasi').then((r) => r.data || []);

  const fetchJenis = () =>
    api.get('/laporan/jenistransaksi-kartustok').then((r) => (r.data || []).map(j => ({ id: j, nama: j })));

  const handleGenerate = () => {
    const params = { tglwal, tglakhir };
    if (filterLokasi.length) params.idlokasi = joinIds(filterLokasi, 'idlokasi');
    if (filterBarangs.length) params.idbarang = joinIds(filterBarangs, 'idbarang');
    if (filterJenis.length) params.jenistransaksi = filterJenis.map(j => j.id).join(',');
    
    openTab({
      label: 'Laporan Kartu Stok',
      component: LaporanResultPage,
      props: { url: reportUrl(token, params), token, label: 'Laporan Kartu Stok' },
      type: 'report',
      kodemenu: null,
    });
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-5 space-y-1 border-b border-primary-50 bg-white">
        <h2 className="text-2xl font-bold text-dark-500">Laporan Kartu Stok</h2>
        <p className="text-sm text-dark-300">Filter & cetak laporan kartu stok</p>
      </div>

      <div className="p-5 space-y-4">
        <div className="bg-white rounded-2xl border border-primary-50 p-5">
          <div className="flex gap-6">
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-dark-300 mb-1">Dari</label>
                  <input type="date" value={tglwal} onChange={(e) => setTglwal(e.target.value)} className="w-full px-2 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-dark-300 mb-1">Sampai</label>
                  <input type="date" value={tglakhir} onChange={(e) => setTglakhir(e.target.value)} className="w-full px-2 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20" />
                </div>
              </div>

              <FilterChip label="Lokasi" items={filterLokasi} nameField="namalokasi" emptyText="Semua" onClear={(l) => setFilterLokasi((prev) => prev.filter((x) => x.idlokasi !== l.idlokasi))} onBrowse={() => setShowLokasiModal(true)} />
              <FilterChip label="Barang" items={filterBarangs} nameField="namabarang" emptyText="Semua Barang" onClear={(b) => setFilterBarangs((prev) => prev.filter((x) => x.idbarang !== b.idbarang))} onBrowse={() => setShowBarangModal(true)} />
              <FilterChip label="Jenis Transaksi" items={filterJenis} nameField="nama" emptyText="Semua Jenis" onClear={(j) => setFilterJenis((prev) => prev.filter((x) => x.id !== j.id))} onBrowse={() => setShowJenisModal(true)} />
            </div>

            <div className="w-96 shrink-0 space-y-4">
              <div className="flex justify-end">
                <button onClick={handleGenerate} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-all">
                  <Eye className="w-4 h-4" /> Cetak Laporan
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-dark-500 mb-3">Jenis Laporan</h3>
                <div className="grid grid-cols-1 gap-2">
                  <button className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-left leading-tight bg-primary-500 text-white shadow-sm">
                    Laporan Kartu Stok
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-primary-50 p-12 text-center animate-in">
          <FileBarChart className="w-16 h-16 text-dark-200 mx-auto mb-4" />
          <p className="text-dark-300 text-sm">Pilih filter tanggal, lokasi, barang, dan jenis transaksi, lalu klik <strong>Cetak Laporan</strong></p>
        </div>
      </div>

      {showLokasiModal && (
        <MultiSelectModal
          title="Pilih Lokasi"
          fetchItems={fetchLokasi}
          initialSelected={filterLokasi}
          onConfirm={(items) => {
            setFilterLokasi(items);
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
          searchPlaceholder="Cari barang..."
        />
      )}

      {showJenisModal && (
        <MultiSelectModal
          title="Pilih Jenis Transaksi"
          fetchItems={fetchJenis}
          initialSelected={filterJenis}
          onConfirm={(items) => {
            setFilterJenis(items);
            setShowJenisModal(false);
          }}
          onClose={() => setShowJenisModal(false)}
          idField="id"
          labelField="nama"
          searchPlaceholder="Cari jenis..."
        />
      )}
    </div>
  );
}
