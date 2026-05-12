import { useState } from 'react';
import { PauseCircle, PlayCircle, Trash2, X } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { formatRupiah } from '../../lib/utils';

export default function HoldRecallModal({ onClose }) {
  const { heldCarts, holdCart, recallCart, deleteHeld, items } = useCartStore();
  const [label, setLabel] = useState('');

  const handleHold = () => {
    if (items.length === 0) return;
    holdCart(label.trim() || undefined);
    setLabel('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-dark-500 flex items-center gap-2">
            <PauseCircle className="w-5 h-5 text-primary-500" /> Tahan / Panggil Transaksi
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-warm-100 text-dark-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hold current cart */}
        {items.length > 0 && (
          <div className="mb-5 p-4 bg-warm-50 rounded-xl border border-warm-100">
            <p className="text-xs font-semibold text-dark-400 mb-2">Tahan keranjang aktif ({items.length} item)</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Label (opsional, misal: nama pelanggan)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-primary-100 bg-white focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
              <button
                onClick={handleHold}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold"
              >
                <PauseCircle className="w-3.5 h-3.5" /> Tahan
              </button>
            </div>
          </div>
        )}

        {/* Held carts list */}
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {heldCarts.length === 0 ? (
            <p className="text-xs text-dark-300 text-center py-4">Tidak ada transaksi yang ditahan.</p>
          ) : (
            heldCarts.map((held) => (
              <div key={held.id} className="flex items-center justify-between p-3 rounded-xl bg-warm-50 border border-warm-100">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-dark-500 truncate">{held.label}</p>
                  <p className="text-[10px] text-dark-300">
                    {held.items.length} item &middot;{' '}
                    {formatRupiah(held.items.reduce((s, i) => s + i.harga * i.jml, 0))}
                    {held.customer ? ` · ${held.customer.namacustomer}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 ml-3 shrink-0">
                  <button
                    onClick={() => { recallCart(held.id); onClose(); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold"
                  >
                    <PlayCircle className="w-3 h-3" /> Panggil
                  </button>
                  <button
                    onClick={() => deleteHeld(held.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
