import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import useTabStore from '../../../store/tabStore';

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function pctColor(pct) {
  if (pct >= 100) return 'text-red-600';
  if (pct >= 80) return 'text-orange-600';
  return 'text-emerald-600';
}

export default function AnggaranRealisasi({ id, nama, tabId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const closeTab = useTabStore((s) => s.closeTab);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/anggaran/${id}/realisasi`);
      setData(Array.isArray(res) ? res : []);
    } catch { toast.error('Gagal memuat realisasi'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.post(`/anggaran/${id}/sync-realisasi`);
      toast.success('Realisasi berhasil disinkronkan dari jurnal');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal sinkronisasi');
    } finally { setSyncing(false); }
  };

  const groupedByAkun = data.reduce((acc, item) => {
    const key = item.idakun;
    if (!acc[key]) acc[key] = { namaakun: item.namaakun, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 pt-4 pb-2 border-b border-primary-50 shrink-0">
        <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-warm-50 text-dark-400">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-dark-500">Realisasi Anggaran</h2>
          <p className="text-xs text-dark-300">{nama}</p>
        </div>
        <button onClick={handleSync} disabled={syncing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent-50 text-accent-700 text-xs font-semibold hover:bg-accent-100 disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> Sync Realisasi
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <p className="text-sm text-dark-300 text-center py-10">Memuat...</p>
        ) : Object.keys(groupedByAkun).length === 0 ? (
          <p className="text-sm text-dark-300 text-center py-10">Belum ada data realisasi</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedByAkun).map(([idakun, { namaakun, items }]) => {
              const totalAnggaran = items.reduce((s, it) => s + Number(it.nilai_anggaran || 0), 0);
              const totalRealisasi = items.reduce((s, it) => s + Number(it.nilai_realisasi || 0), 0);
              const totalVariance = totalAnggaran - totalRealisasi;
              return (
                <div key={idakun} className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-warm-50/50 border-b border-primary-50">
                    <span className="text-sm font-bold text-dark-500">{namaakun}</span>
                    <div className="flex gap-4 text-xs">
                      <span className="text-dark-400">Anggaran: <strong>Rp {totalAnggaran.toLocaleString('id-ID')}</strong></span>
                      <span className="text-dark-400">Realisasi: <strong>Rp {totalRealisasi.toLocaleString('id-ID')}</strong></span>
                      <span className={totalVariance >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                        Selisih: <strong>{totalVariance >= 0 ? '+' : ''}Rp {totalVariance.toLocaleString('id-ID')}</strong>
                      </span>
                    </div>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-primary-50">
                        <th className="text-left px-4 py-2 text-xs font-semibold text-dark-300">Bulan</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-dark-300">Anggaran</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-dark-300">Realisasi</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-dark-300">Variance</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-dark-300">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.sort((a, b) => a.bulan - b.bulan).map((it) => (
                        <tr key={it.bulan} className="border-b border-primary-50/50 text-sm hover:bg-warm-50/30">
                          <td className="px-4 py-2 text-dark-400 text-xs">{MONTHS[it.bulan - 1]}</td>
                          <td className="px-4 py-2 text-right text-dark-400 text-xs">{Number(it.nilai_anggaran || 0).toLocaleString('id-ID')}</td>
                          <td className="px-4 py-2 text-right text-dark-500 font-semibold text-xs">{Number(it.nilai_realisasi || 0).toLocaleString('id-ID')}</td>
                          <td className={`px-4 py-2 text-right text-xs font-semibold ${Number(it.variance || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {Number(it.variance || 0) >= 0 ? '+' : ''}{Number(it.variance || 0).toLocaleString('id-ID')}
                          </td>
                          <td className={`px-4 py-2 text-right text-xs font-bold ${pctColor(Number(it.persentase || 0))}`}>
                            {Number(it.persentase || 0).toFixed(0)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
