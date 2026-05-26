import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { AlertTriangle, RefreshCw, Package } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';

export default function AlertStokMin() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/stok/alert-stok-min');
      setData(Array.isArray(res) ? res : []);
    } catch {
      toast.error('Gagal memuat data stok kritis');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { page, setPage, totalPages, paginatedItems } = usePagination(data, 20);

  const deficit = (item) => Math.max(0, Number(item.stokmin || 0) - Number(item.stok_sekarang || 0));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Alert Stok Minimum</h2>
          <p className="text-sm text-dark-300">Daftar barang yang stoknya di bawah batas minimum</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {data.length > 0 && (
        <div className="px-6 pb-3 shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-700">{data.length} barang stok kritis</p>
              <p className="text-xs text-red-500">Segera lakukan pembelian atau penambahan stok</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-primary-50 bg-warm-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama Barang</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Satuan</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Stok Min</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Stok Sekarang</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Kekurangan</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-dark-300">Memuat...</td></tr>
              )}
              {!loading && paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Package className="w-6 h-6 text-emerald-500" />
                      </div>
                      <p className="text-sm font-semibold text-dark-500">Semua stok aman</p>
                      <p className="text-xs text-dark-300">Tidak ada barang di bawah stok minimum</p>
                    </div>
                  </td>
                </tr>
              )}
              {paginatedItems.map((item) => {
                const stok = Number(item.stok_sekarang || 0);
                const stokmin = Number(item.stokmin || 0);
                const def = deficit(item);
                return (
                  <tr key={item.idbarang} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                    <td className="px-4 py-3 text-xs font-mono text-dark-300">{item.kodebarang}</td>
                    <td className="px-4 py-3 font-medium text-dark-500">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        {item.namabarang}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-xs">{item.satuankecil || '-'}</td>
                    <td className="px-4 py-3 text-right text-dark-400">{stokmin.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">{stok.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                        -{def.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        Kritis
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
      </div>
    </div>
  );
}
