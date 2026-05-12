import { useState } from 'react';
import { X, Printer, WifiOff } from 'lucide-react';
import { formatRupiah, today } from '../../lib/utils';
import api from '../../api/axios';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { enqueueTransaction } from '../../lib/offlineDb';
import toast from 'react-hot-toast';
import { DEFAULT_PPN } from '../../lib/constants';

export default function PaymentModal({ setShowPayment, usePpn, setUsePpn, loadJual, cartCalculations }) {
  const [bayar, setBayar] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { items, customer, clearCart } = useCartStore();
  const user = useAuthStore((s) => s.user);

  const { grandTotal } = cartCalculations;

  const handlePay = async () => {
    const amount = parseFloat(bayar);
    if (isNaN(amount) || amount < grandTotal) {
      toast.error('Jumlah bayar kurang');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        idcustomer: customer?.idcustomer || 1,
        idkasir   : user?.iduser,
        grandtotal: grandTotal,
        bayar     : amount,
        kembali   : amount - grandTotal,
        useppn    : usePpn,
        items     : items.map((item) => ({
          idbarang: item.idbarang,
          jml     : item.jml,
          harga   : item.hargajual_terbaru || item.harga,
          diskon  : item.diskon || 0,
        })),
      };

      if (!navigator.onLine) {
        await enqueueTransaction(payload);
        toast.success('Mode offline: transaksi disimpan & akan dikirim otomatis saat online', { icon: '📶', duration: 5000 });
        setShowPayment(false); setBayar(''); clearCart();
        return;
      }

      await api.post('/jual', payload);
      toast.success('Transaksi berhasil!');
      
      // Fix Token Exfiltration: Use Axios to fetch blob and create Object URL
      try {
        const response = await api.get(`/laporan/sales-transaksi?format=html&tglwal=${today()}&tglakhir=${today()}`, {
          responseType: 'blob'
        });
        const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'text/html' }));
        window.open(blobUrl, '_blank');
      } catch (printErr) {
        toast.error('Gagal mencetak struk, tapi transaksi berhasil.');
      }

      setShowPayment(false); 
      setBayar(''); 
      clearCart(); 
      loadJual();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Transaksi gagal'); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{animation: 'fadeIn 0.2s ease'}}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-dark-500">Pembayaran</h3>
          <button onClick={() => { setShowPayment(false); setBayar(''); }} className="text-dark-300 hover:text-dark-500"><X className="w-5 h-5" /></button>
        </div>
        <div className="text-center mb-6">
          <p className="text-sm text-dark-300">Total Tagihan</p>
          <p className="text-3xl font-bold text-primary-600 mt-1">{formatRupiah(grandTotal)}</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-warm-50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={usePpn} onChange={(e) => setUsePpn(e.target.checked)}
                className="w-4 h-4 rounded accent-primary-500" disabled={isLoading} />
              <span className="text-xs font-semibold text-dark-400">Pakai PPN ({user?.ppn || DEFAULT_PPN}%)</span>
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark-400 mb-1">Jumlah Bayar</label>
            <input type="number" value={bayar} onChange={(e) => setBayar(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-dark-500 text-lg font-bold text-center placeholder-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
              placeholder="0" autoFocus onKeyDown={(e) => e.key === 'Enter' && bayar && !isLoading && handlePay()} disabled={isLoading} />
          </div>
          {bayar && parseFloat(bayar) >= grandTotal && (
            <div className="text-center py-3 rounded-xl bg-accent-50">
              <p className="text-xs text-accent-600">Kembalian</p>
              <p className="text-xl font-bold text-accent-600">{formatRupiah(parseFloat(bayar) - grandTotal)}</p>
            </div>
          )}
          <button onClick={handlePay} disabled={!bayar || parseFloat(bayar) < grandTotal || isLoading}
            className="w-full py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold text-sm transition-all disabled:opacity-50">
            {isLoading ? (
              <span className="animate-pulse">Memproses...</span>
            ) : (
              <><Printer className="w-4 h-4 inline mr-2" /> Bayar & Cetak</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
