import { useEffect, useState } from 'react';
import { FileBarChart, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { firstOfMonth, formatRupiah, today } from '../../lib/utils';
import MultiSelectModal from '../../components/ui/MultiSelectModal';
import DatePicker from '../../components/ui/DatePicker';

const MONTHS = [
  ['1', 'Januari'], ['2', 'Februari'], ['3', 'Maret'], ['4', 'April'],
  ['5', 'Mei'], ['6', 'Juni'], ['7', 'Juli'], ['8', 'Agustus'],
  ['9', 'September'], ['10', 'Oktober'], ['11', 'November'], ['12', 'Desember'],
];

function AkunFilter({ akun, setAkun }) {
  const [show, setShow] = useState(false);
  const fetchAkun = () => api.get('/akun').then(r => r.data || []);

  return (
    <div>
      <label className="block text-[10px] font-semibold text-dark-300 mb-1">Akun</label>
      <div className="flex items-center gap-1.5 flex-wrap min-h-[38px] px-2 py-1.5 rounded-lg border border-primary-100 bg-white">
        {akun.length === 0 && <span className="text-xs text-dark-300 px-1">Semua</span>}
        {akun.map((item) => (
          <span key={item.idakun} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-100 text-primary-700 text-[10px] font-semibold max-w-[180px]">
            <span className="truncate">{item.kodeakun} - {item.namaakun}</span>
            <button onClick={() => setAkun(akun.filter(a => a.idakun !== item.idakun))} className="hover:text-red-500">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        <button onClick={() => setShow(true)} className="text-[10px] font-semibold text-primary-600 hover:bg-primary-50 px-2 py-0.5 rounded-md">+ Browse</button>
      </div>
      {show && (
        <MultiSelectModal
          title="Pilih Akun"
          fetchItems={fetchAkun}
          initialSelected={akun}
          onConfirm={(items) => { setAkun(items); setShow(false); }}
          onClose={() => setShow(false)}
          idField="idakun"
          labelField="namaakun"
          subField="kodeakun"
          searchPlaceholder="Cari akun..."
        />
      )}
    </div>
  );
}

export default function LaporanAkuntansi({ type = 'jurnal' }) {
  const [tglwal, setTglwal] = useState(firstOfMonth());
  const [tglakhir, setTglakhir] = useState(today());
  const [bulan, setBulan] = useState(String(new Date().getMonth() + 1));
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [kodetrans, setKodetrans] = useState('');
  const [akun, setAkun] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const title = type === 'buku-besar' ? 'Buku Besar' : type === 'neraca' ? 'Neraca' : 'Jurnal Transaksi';
  const isNeraca = type === 'neraca';

  const load = async () => {
    setLoading(true);
    try {
      const params = isNeraca ? { bulan, tahun } : { tglwal, tglakhir };
      if (kodetrans.trim()) params.kodetrans = kodetrans.trim().toUpperCase();
      if (akun.length) params.idakun = akun.map(a => a.idakun).join(',');
      const { data: res } = await api.get(`/laporan-akuntansi/${type}`, { params });
      setData(res);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat laporan akuntansi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [type]);

  return (
    <div className="h-full overflow-auto">
      <div className="p-5 space-y-1 border-b border-primary-50 bg-white">
        <h2 className="text-2xl font-bold text-dark-500">{title}</h2>
        <p className="text-sm text-dark-300">Laporan akuntansi dari jurnal transaksi</p>
      </div>

      <div className="p-5 space-y-4">
        <div className="bg-white rounded-2xl border border-primary-50 p-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            {isNeraca ? (
              <>
                <div>
                  <label className="block text-[10px] font-semibold text-dark-300 mb-1">Bulan</label>
                  <select value={bulan} onChange={(e) => setBulan(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-primary-100 text-xs">
                    {MONTHS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-dark-300 mb-1">Tahun</label>
                  <input type="number" value={tahun} onChange={(e) => setTahun(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-primary-100 text-xs" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] font-semibold text-dark-300 mb-1">Tanggal Awal</label>
                  <DatePicker value={tglwal} onChange={setTglwal} className="w-full px-3 py-2 rounded-lg border border-primary-100 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-dark-300 mb-1">Tanggal Akhir</label>
                  <DatePicker value={tglakhir} onChange={setTglakhir} className="w-full px-3 py-2 rounded-lg border border-primary-100 text-xs" />
                </div>
              </>
            )}
            <div>
              <label className="block text-[10px] font-semibold text-dark-300 mb-1">Kode Transaksi</label>
              <input value={kodetrans} onChange={(e) => setKodetrans(e.target.value.toUpperCase())} placeholder="Semua" className="w-full px-3 py-2 rounded-lg border border-primary-100 text-xs input-upper" />
            </div>
            <AkunFilter akun={akun} setAkun={setAkun} />
            <button onClick={load} disabled={loading} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold disabled:opacity-50">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileBarChart className="w-4 h-4" />} Tampilkan
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          {type === 'jurnal' && <JurnalTable data={data || []} />}
          {type === 'buku-besar' && <BukuBesarTable data={data || []} />}
          {type === 'neraca' && <NeracaTable data={data} />}
        </div>
      </div>
    </div>
  );
}

function Empty({ colSpan }) {
  return <tr><td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-dark-300">Tidak ada data</td></tr>;
}

function JurnalTable({ data }) {
  return (
    <table className="w-full min-w-[860px]">
      <thead><tr className="border-b border-primary-50 bg-warm-50/50"><th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Transaksi</th><th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Tanggal</th><th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Akun</th><th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Debet</th><th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Kredit</th></tr></thead>
      <tbody>{data.length === 0 ? <Empty colSpan={5} /> : data.flatMap(g => [
        <tr key={`${g.kodetrans}-head`} className="bg-primary-50/30"><td className="px-4 py-2 text-xs font-mono font-bold text-dark-500">{g.kodetrans}</td><td className="px-4 py-2 text-xs text-dark-400">{g.tgltrans}</td><td className="px-4 py-2 text-xs text-dark-300">{g.jenis}</td><td className="px-4 py-2 text-right text-xs font-bold">{formatRupiah(g.total_debet)}</td><td className="px-4 py-2 text-right text-xs font-bold">{formatRupiah(g.total_kredit)}</td></tr>,
        ...g.lines.map((line) => <tr key={line.idjurnal} className="border-b border-primary-50/50 text-sm"><td className="px-4 py-2"></td><td className="px-4 py-2"></td><td className="px-4 py-2"><span className="font-mono text-xs text-dark-300">{line.kodeakun}</span> {line.namaakun}</td><td className="px-4 py-2 text-right font-mono text-xs">{line.debet ? formatRupiah(line.debet) : '-'}</td><td className="px-4 py-2 text-right font-mono text-xs">{line.kredit ? formatRupiah(line.kredit) : '-'}</td></tr>),
      ])}</tbody>
    </table>
  );
}

function BukuBesarTable({ data }) {
  return (
    <div className="divide-y divide-primary-50">
      {data.length === 0 ? <div className="py-12 text-center text-sm text-dark-300">Tidak ada data</div> : data.map(akun => (
        <div key={akun.idakun} className="p-4">
          <div className="flex items-center justify-between mb-2"><div><h3 className="text-sm font-bold text-dark-500">{akun.kodeakun} - {akun.namaakun}</h3><p className="text-xs text-dark-300">{akun.jenisak} / saldo normal {akun.saldo_normal}</p></div><div className="text-right"><p className="text-[10px] text-dark-300">Saldo Akhir</p><p className="text-sm font-bold font-mono text-accent-600">{formatRupiah(akun.saldo_akhir)}</p></div></div>
          <table className="w-full text-sm"><thead><tr className="bg-warm-50/50"><th className="text-left px-3 py-2 text-xs text-dark-300">Tanggal</th><th className="text-left px-3 py-2 text-xs text-dark-300">Kode</th><th className="text-right px-3 py-2 text-xs text-dark-300">Debet</th><th className="text-right px-3 py-2 text-xs text-dark-300">Kredit</th><th className="text-right px-3 py-2 text-xs text-dark-300">Saldo</th></tr></thead><tbody>
            <tr><td colSpan={4} className="px-3 py-2 text-xs font-semibold text-dark-300">Saldo Awal</td><td className="px-3 py-2 text-right text-xs font-mono">{formatRupiah(akun.saldo_awal)}</td></tr>
            {akun.entries.map(e => <tr key={e.idjurnal} className="border-t border-primary-50/50"><td className="px-3 py-2 text-xs">{e.tgltrans}</td><td className="px-3 py-2 text-xs font-mono">{e.kodetrans}</td><td className="px-3 py-2 text-right text-xs font-mono">{e.debet ? formatRupiah(e.debet) : '-'}</td><td className="px-3 py-2 text-right text-xs font-mono">{e.kredit ? formatRupiah(e.kredit) : '-'}</td><td className="px-3 py-2 text-right text-xs font-mono">{formatRupiah(e.saldo)}</td></tr>)}
          </tbody></table>
        </div>
      ))}
    </div>
  );
}

function NeracaTable({ data }) {
  const rows = data?.akun || [];
  return (
    <table className="w-full min-w-[920px]">
      <thead><tr className="border-b border-primary-50 bg-warm-50/50"><th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th><th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Akun</th><th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Jenis</th><th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Saldo Awal</th><th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Mutasi Debet</th><th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Mutasi Kredit</th><th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Saldo Akhir</th></tr></thead>
      <tbody>{rows.length === 0 ? <Empty colSpan={7} /> : rows.map(row => <tr key={row.idakun} className="border-b border-primary-50/50 text-sm"><td className="px-4 py-3 text-xs font-mono text-dark-300">{row.kodeakun}</td><td className="px-4 py-3 font-medium text-dark-500">{row.namaakun}</td><td className="px-4 py-3 text-xs text-dark-300">{row.jenisak}</td><td className="px-4 py-3 text-right text-xs font-mono">{formatRupiah(row.saldo_awal)}</td><td className="px-4 py-3 text-right text-xs font-mono">{formatRupiah(row.mutasi_debet)}</td><td className="px-4 py-3 text-right text-xs font-mono">{formatRupiah(row.mutasi_kredit)}</td><td className="px-4 py-3 text-right text-xs font-mono font-bold text-accent-600">{formatRupiah(row.saldo_akhir)}</td></tr>)}</tbody>
    </table>
  );
}
