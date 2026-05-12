import { useState } from 'react';
import { ShoppingCart, User, Minus, Plus, Trash2, CreditCard } from 'lucide-react';
import { formatRupiah } from '../../lib/utils';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { DEFAULT_PPN } from '../../lib/constants';

export default function CartSidebar({ customers, usePpn, setShowPayment, cartCalculations }) {
  const [showCustomer, setShowCustomer] = useState(false);
  const { items, customer, updateQty, removeItem, setCustomer, priceLevel, setPriceLevel } = useCartStore();
  const user = useAuthStore((s) => s.user);

  const { subtotal, ppnTotal, grandTotal } = cartCalculations;

  return (
    <div className="w-[420px] bg-white rounded-2xl border border-primary-50 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-dark-500 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary-500" /> Keranjang
        </h3>
        <div className="flex items-center gap-1.5">
          {/* Price level toggle */}
          <div className="flex rounded-lg overflow-hidden border border-primary-100 text-[10px] font-bold">
            <button
              onClick={() => setPriceLevel('ECERAN')}
              className={`px-2 py-1 transition-colors ${priceLevel === 'ECERAN' ? 'bg-primary-500 text-white' : 'text-dark-400 hover:bg-warm-50'}`}
            >
              Eceran
            </button>
            <button
              onClick={() => setPriceLevel('GROSIR')}
              className={`px-2 py-1 transition-colors ${priceLevel === 'GROSIR' ? 'bg-amber-500 text-white' : 'text-dark-400 hover:bg-warm-50'}`}
            >
              Grosir
            </button>
          </div>
          <button onClick={() => setShowCustomer(!showCustomer)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-warm-50 hover:bg-warm-100 text-dark-400 transition-colors">
            <User className="w-3.5 h-3.5" /> {customer?.namacustomer || 'CASH'}
          </button>
        </div>
      </div>

      {showCustomer && (
        <div className="mb-3 bg-warm-50 rounded-xl p-3 border border-warm-100 max-h-32 overflow-y-auto scrollbar-thin">
          {customers.map((c) => (
            <button key={c.idcustomer} onClick={() => {
                setCustomer(c);
                setShowCustomer(false);
                // Auto-switch price level based on customer type if available
                if (c.tipe_harga) setPriceLevel(c.tipe_harga === 'GROSIR' ? 'GROSIR' : 'ECERAN');
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs mb-1 ${customer?.idcustomer === c.idcustomer ? 'bg-primary-100 text-primary-700 font-semibold' : 'hover:bg-white text-dark-400'}`}>
              {c.namacustomer} ({c.kodecustomer})
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1.5">
        {items.map((item) => {
          const ppnRate = usePpn ? (user?.ppn || DEFAULT_PPN) : 0;
          const basePrice = item.harga * item.jml;
          const diskon = item.diskon ? Math.round((basePrice * item.diskon) / 100) : 0;
          const itemPpn = Math.round((basePrice * ppnRate) / 100);
          const itemTotal = basePrice + itemPpn - diskon;

          return (
            <div key={item.idbarang} className="flex items-center gap-2 p-2.5 rounded-xl bg-warm-50/50 hover:bg-warm-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-dark-500 truncate">{item.namabarang}</p>
                <p className="text-[10px] text-dark-300">{formatRupiah(item.harga)} x {item.jml} {item.satuankecil}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item.idbarang, item.jml - 1)} className="w-6 h-6 rounded-lg bg-primary-50 hover:bg-primary-100 flex items-center justify-center text-primary-600"><Minus className="w-3 h-3" /></button>
                <input
                  id={`qty-input-${item.idbarang}`}
                  type="number"
                  min="1"
                  value={item.jml}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= 1) updateQty(item.idbarang, v);
                  }}
                  className="text-xs font-bold text-dark-500 w-10 text-center border border-primary-100 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-400 py-0.5"
                />
                <button onClick={() => updateQty(item.idbarang, item.jml + 1)} className="w-6 h-6 rounded-lg bg-primary-50 hover:bg-primary-100 flex items-center justify-center text-primary-600"><Plus className="w-3 h-3" /></button>
              </div>
              <p className="text-xs font-bold text-dark-500 w-20 text-right">{formatRupiah(itemTotal)}</p>
              <button onClick={() => removeItem(item.idbarang)} className="text-dark-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          );
        })}
      </div>

      <div className="border-t border-primary-100 pt-4 mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-dark-300">Subtotal</span>
          <span className="font-semibold text-dark-500">{formatRupiah(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-dark-300">PPN {usePpn ? `(${user?.ppn || DEFAULT_PPN}%)` : '(Nonaktif)'}</span>
          <span className="font-semibold text-dark-500">{formatRupiah(ppnTotal)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span className="text-dark-500">Total</span>
          <span className="text-primary-600">{formatRupiah(grandTotal)}</span>
        </div>
        <button onClick={() => setShowPayment(true)} disabled={items.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-primary-500/20 active:scale-[0.98]">
          <CreditCard className="w-4 h-4" /> Bayar Sekarang [F12]
        </button>
      </div>
    </div>
  );
}
