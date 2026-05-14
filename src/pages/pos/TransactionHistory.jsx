import { useState, useEffect } from 'react';
import { Search, Ban } from 'lucide-react';
import { formatRupiah } from '../../lib/utils';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';

export default function TransactionHistory({ jual, loadJual }) {
  const confirm = useConfirm();
  const [jualSearch, setJualSearch] = useState('');
  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(jual, 20);

  useEffect(() => { 
    resetPage(); 
  }, [jualSearch, resetPage]);

  // Handle local debounce for transaction search if we were querying backend,
  // but if it's already fetched, we can filter locally. 
  // The original Pos.jsx fetched the API directly: api.get('/jual', { params }) on change.
  // We debounce the backend call:
  useEffect(() => {
    const timer = setTimeout(() => {
      loadJual(jualSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [jualSearch, loadJual]);

  const handleCancel = async (id) => {
    const confirmed = await confirm({
      title: 'Batalkan Transaksi',
      message: 'Batalkan transaksi ini? Stok akan dikembalikan.',
      confirmText: 'Batalkan',
      cancelText: 'Batal',
      variant: 'danger',
    });
    if (!confirmed) return;
    try { 
      await api.put(`/jual/${id}/cancel`); 
      toast.success('Transaksi dibatalkan'); 
      loadJual(jualSearch); 
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Gagal'); 
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden animate-in">
      <div className="p-3 border-b border-primary-50">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
          <input type="text" value={jualSearch} onChange={(e) => setJualSearch(e.target.value.toUpperCase())}
            placeholder="Cari kode penjualan..." className="input-upper w-full pl-10 pr-4 py-2 rounded-xl border border-primary-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
        </div>
      </div>
      <div className="max-h-48 overflow-y-auto scrollbar-thin">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-primary-50 bg-warm-50/50">
              <th className="text-left px-3 py-2 text-[10px] font-semibold text-dark-300">Kode</th>
              <th className="text-left px-3 py-2 text-[10px] font-semibold text-dark-300">Tanggal</th>
              <th className="text-left px-3 py-2 text-[10px] font-semibold text-dark-300">Customer</th>
              <th className="text-right px-3 py-2 text-[10px] font-semibold text-dark-300">Total</th>
              <th className="text-center px-3 py-2 text-[10px] font-semibold text-dark-300">Status</th>
              <th className="text-center px-3 py-2 text-[10px] font-semibold text-dark-300 w-12">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((j) => (
              <tr key={j.idjual} className={`border-b border-primary-50/50 text-xs ${j.status === 0 ? 'bg-red-50/30 opacity-60' : 'hover:bg-warm-50/30'}`}>
                <td className="px-3 py-2 font-mono text-dark-300">{j.kodejual}</td>
                <td className="px-3 py-2 text-dark-400">{j.tgltrans?.slice(0,10)}</td>
                <td className="px-3 py-2 text-dark-500">{j.namacustomer || 'CASH'}</td>
                <td className="px-3 py-2 text-right font-semibold text-dark-500">{formatRupiah(j.grandtotal)}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg ${j.status === 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {j.status === 0 ? 'BATAL' : 'AKTIF'}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  {j.status !== 0 && (
                    <button onClick={() => handleCancel(j.idjual)} className="p-0.5 rounded hover:bg-red-50 text-dark-300 hover:text-red-500"><Ban className="w-3.5 h-3.5" /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  );
}
