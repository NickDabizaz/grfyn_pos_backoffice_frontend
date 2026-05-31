import { useState } from 'react';
import { today, firstOfMonth } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import useTabStore from '../../store/tabStore';
import { Eye, FileBarChart, X } from 'lucide-react';
import api from '../../api/axios';
import MultiSelectModal from '../../components/ui/MultiSelectModal';
import DatePicker from '../../components/ui/DatePicker';
import LaporanResultPage from './LaporanResultPage';
import ReportExportButton from './ReportExportButton';

const config = {
  opname: { title: 'Laporan Opname Stok', endpoint: 'stock-opname', showTujuan: false },
  transfer: { title: 'Laporan Transfer Stok', endpoint: 'transfer-stok', showTujuan: true },
};

function joinIds(arr, field) {
  return (arr || []).map(it => it[field]).filter(Boolean).join(',');
}

function FilterChip({ label, items, nameField, onClear, onBrowse, emptyText }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-dark-300 mb-1">{label}</label>
      <div className="flex items-center gap-1.5 flex-wrap min-h-[34px] px-2 py-1.5 rounded-lg border border-primary-100 bg-white">
        {items.length === 0 && <span className="text-xs text-dark-300 px-1">{emptyText || 'Semua'}</span>}
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-100 text-primary-700 text-[10px] font-semibold max-w-[160px]">
            <span className="truncate">{item[nameField]}</span>
            <button onClick={() => onClear(item)} className="hover:text-red-500 shrink-0"><X className="w-2.5 h-2.5" /></button>
          </span>
        ))}
        <button onClick={onBrowse} className="text-[10px] font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 py-0.5 rounded-md shrink-0">+ Browse</button>
      </div>
    </div>
  );
}

export default function LaporanStokTransaksi({ jenis = 'opname' }) {
  const cfg = config[jenis] || config.opname;
  const [tglwal, setTglwal] = useState(firstOfMonth());
  const [tglakhir, setTglakhir] = useState(today());
  const [lokasi, setLokasi] = useState([]);
  const [lokasiTujuan, setLokasiTujuan] = useState([]);
  const [barang, setBarang] = useState([]);
  const [modal, setModal] = useState(null);
  const token = useAuthStore(s => s.token);
  const openTab = useTabStore(s => s.openTab);

  const fetchLokasi = () => api.get('/lokasi').then(r => r.data || []);
  const fetchBarang = (search) => api.get('/barang/browse-barang', search ? { params: { search } } : {}).then(r => r.data || []);

  const getReportUrl = () => {
    const params = { tglwal, tglakhir };
    if (lokasi.length) params.idlokasi = joinIds(lokasi, 'idlokasi');
    if (cfg.showTujuan && lokasiTujuan.length) params.idlokasitujuan = joinIds(lokasiTujuan, 'idlokasi');
    if (barang.length) params.idbarang = joinIds(barang, 'idbarang');
    const qs = new URLSearchParams({ format: 'html', token, ...params }).toString();
    return `/api/laporan/${cfg.endpoint}?${qs}`;
  };

  const handleGenerate = () => {
    openTab({
      label: cfg.title,
      component: LaporanResultPage,
      props: { url: getReportUrl(), label: cfg.title },
      type: 'report',
      kodemenu: null,
      icon: FileBarChart,
    });
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-5 space-y-1 border-b border-primary-50 bg-white">
        <h2 className="text-2xl font-bold text-dark-500">{cfg.title}</h2>
        <p className="text-sm text-dark-300">Filter & cetak laporan stok</p>
      </div>

      <div className="p-5 space-y-4">
        <div className="bg-white rounded-2xl border border-primary-50 p-5">
          <div className="flex gap-6">
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-dark-300 mb-1">Dari</label>
                  <DatePicker value={tglwal} onChange={setTglwal} className="w-full px-2 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-dark-300 mb-1">Sampai</label>
                  <DatePicker value={tglakhir} onChange={setTglakhir} className="w-full px-2 py-2 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20" />
                </div>
              </div>

              <FilterChip label="Lokasi" items={lokasi} nameField="namalokasi" emptyText="Semua Lokasi" onClear={l => setLokasi(prev => prev.filter(x => x.idlokasi !== l.idlokasi))} onBrowse={() => setModal('lokasi')} />
              {cfg.showTujuan && <FilterChip label="Lokasi Tujuan" items={lokasiTujuan} nameField="namalokasi" emptyText="Semua Tujuan" onClear={l => setLokasiTujuan(prev => prev.filter(x => x.idlokasi !== l.idlokasi))} onBrowse={() => setModal('tujuan')} />}
              <FilterChip label="Barang" items={barang} nameField="namabarang" emptyText="Semua Barang" onClear={b => setBarang(prev => prev.filter(x => x.idbarang !== b.idbarang))} onBrowse={() => setModal('barang')} />
            </div>

            <div className="w-96 shrink-0 space-y-4">
              <div className="flex justify-end gap-2">
                <ReportExportButton url={getReportUrl()} token={token} />
                <button onClick={handleGenerate} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold">
                  <Eye className="w-4 h-4" /> Cetak Laporan
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-dark-500 mb-3">Jenis Laporan</h3>
                <div className="grid grid-cols-1 gap-2">
                  <button className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-left leading-tight bg-primary-500 text-white shadow-sm">
                    {cfg.title}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-primary-50 p-12 text-center">
          <FileBarChart className="w-16 h-16 text-dark-200 mx-auto mb-4" />
          <p className="text-dark-300 text-sm">Pilih filter lalu klik <strong>Cetak Laporan</strong></p>
        </div>
      </div>

      {(modal === 'lokasi' || modal === 'tujuan') && (
        <MultiSelectModal
          title={modal === 'tujuan' ? 'Pilih Lokasi Tujuan' : 'Pilih Lokasi'}
          fetchItems={fetchLokasi}
          initialSelected={modal === 'tujuan' ? lokasiTujuan : lokasi}
          onConfirm={(items) => { modal === 'tujuan' ? setLokasiTujuan(items) : setLokasi(items); setModal(null); }}
          onClose={() => setModal(null)}
          idField="idlokasi"
          labelField="namalokasi"
          subField="kodelokasi"
          searchPlaceholder="Cari lokasi..."
        />
      )}
      {modal === 'barang' && (
        <MultiSelectModal
          title="Pilih Barang"
          fetchItems={fetchBarang}
          initialSelected={barang}
          onConfirm={(items) => { setBarang(items); setModal(null); }}
          onClose={() => setModal(null)}
          idField="idbarang"
          labelField="namabarang"
          subField="kodebarang"
          searchPlaceholder="Cari barang..."
        />
      )}
    </div>
  );
}
