import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, XCircle, Loader2 } from 'lucide-react';
import useTabStore from '../../store/tabStore';

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function formatPeriode(periodbulan) {
  if (!periodbulan) return '-';
  const [y, m] = periodbulan.split('-');
  return `${BULAN[parseInt(m) - 1]} ${y}`;
}

export default function HitungHPPDetail({ id, onSuccess, tabId }) {
  const closeTab = useTabStore((s) => s.closeTab);
  const [header, setHeader] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/hitunghpp/${id}`);
        setHeader(data);
        setItems(data.items || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Gagal load detail');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleCancel = async () => {
    if (!confirm(`Batalkan HPP ${formatPeriode(header?.periodbulan)}?`)) return;
    setCancelling(true);
    try {
      await api.put(`/hitunghpp/${id}/cancel`);
      toast.success('HPP berhasil dibatalkan');
      if (onSuccess) onSuccess();
      closeTab(tabId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal cancel');
    } finally {
      setCancelling(false);
    }
  };

  const formatRp = (n) => Number(n || 0).toLocaleString('id-ID');

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

  if (!header) return <div className="p-6 text-center text-dark-300">Data tidak ditemukan</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 pt-4 pb-2 border-b border-primary-100 shrink-0">
        <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-dark-500">{header.kodehitunghpp}</h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${header.status === 'AKTIF' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{header.status}</span>
          </div>
          <p className="text-xs text-dark-300">Periode {formatPeriode(header.periodbulan)}</p>
        </div>
        {header.status === 'AKTIF' && (
          <button onClick={handleCancel} disabled={cancelling} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50">
            {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Cancel HPP
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 gap-4 max-w-2xl mb-6">
          <div className="bg-warm-50 rounded-xl p-4">
            <p className="text-xs text-dark-300">Periode</p>
            <p className="font-semibold text-dark-500">{formatPeriode(header.periodbulan)}</p>
          </div>
          <div className="bg-warm-50 rounded-xl p-4">
            <p className="text-xs text-dark-300">Tanggal</p>
            <p className="font-semibold text-dark-500">{header.tglawal?.slice(0,10)} s/d {header.tglakhir?.slice(0,10)}</p>
          </div>
          <div className="bg-warm-50 rounded-xl p-4">
            <p className="text-xs text-dark-300">Total Pembelian</p>
            <p className="font-semibold text-dark-500">Rp {formatRp(header.totalpembelian)}</p>
          </div>
          <div className="bg-warm-50 rounded-xl p-4">
            <p className="text-xs text-dark-300">Total HPP Jual</p>
            <p className="font-semibold text-primary-600">Rp {formatRp(header.totalhppjual)}</p>
          </div>
          <div className="bg-warm-50 rounded-xl p-4">
            <p className="text-xs text-dark-300">Total Saldo Akhir</p>
            <p className="font-semibold text-dark-500">Rp {formatRp(header.totalsaldoakhir)}</p>
          </div>
          <div className="bg-warm-50 rounded-xl p-4">
            <p className="text-xs text-dark-300">User / Catatan</p>
            <p className="font-semibold text-dark-500">{header.namauser || '-'}</p>
            <p className="text-xs text-dark-300">{header.catatan || '-'}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <div className="overflow-auto max-h-[50vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-warm-50/50">
                <tr className="border-b border-primary-50">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-dark-300">Kode</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-dark-300">Nama Barang</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">SA Qty</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">Beli Qty</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">HPP/Unit</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">Jual Qty</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">HPP Jual</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">Adj Qty</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">SA Qty</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">SA Nilai</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b border-primary-50/50 hover:bg-warm-50/30">
                    <td className="px-3 py-2 font-mono text-xs text-dark-300">{item.kodebarang}</td>
                    <td className="px-3 py-2 text-dark-500 font-medium">{item.namabarang}</td>
                    <td className="px-3 py-2 text-right text-dark-400">{formatRp(item.saldoawal_qty)}</td>
                    <td className="px-3 py-2 text-right text-dark-400">{formatRp(item.pembelian_qty)}</td>
                    <td className="px-3 py-2 text-right text-dark-500 font-mono">{Number(item.hpp_per_unit).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right text-dark-400">{formatRp(item.qty_jual)}</td>
                    <td className="px-3 py-2 text-right text-dark-500 font-semibold">{formatRp(item.hpp_jual)}</td>
                    <td className="px-3 py-2 text-right text-dark-400">{formatRp(item.qty_adjust)}</td>
                    <td className="px-3 py-2 text-right text-dark-400">{formatRp(item.saldoakhir_qty)}</td>
                    <td className="px-3 py-2 text-right text-dark-400">{formatRp(item.saldoakhir_nilai)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
