import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatRupiah } from '../../lib/utils';
import { useCartStore } from '../../store/cartStore';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { useAudioFeedback } from '../../hooks/useAudioFeedback';
import toast from 'react-hot-toast';

const PAGE_SIZE = 12;

export default function ProductCatalog({ allProducts, getStock, loadProducts }) {
  const [search, setSearch]     = useState('');
  const [prodPage, setProdPage] = useState(1);
  const [products, setProducts] = useState([]);
  const inputRef                = useRef(null);

  const { addItem, items }    = useCartStore();
  const { beepSuccess, beepError } = useAudioFeedback();

  // ── Debounced search (human typing) ──────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(search);
      setProdPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, loadProducts]);

  useEffect(() => {
    const start = (prodPage - 1) * PAGE_SIZE;
    setProducts(allProducts.slice(start, start + PAGE_SIZE));
  }, [allProducts, prodPage]);

  const totalProdPages = Math.ceil(allProducts.length / PAGE_SIZE) || 1;

  const handleAddItem = useCallback((product) => {
    const stok           = getStock(product.idbarang);
    const cartItem       = items.find(i => i.idbarang === product.idbarang);
    const currentCartQty = cartItem ? cartItem.jml : 0;

    if (stok - currentCartQty <= 0) {
      toast.error(`Stok ${product.namabarang} tidak mencukupi!`);
      beepError();
      return;
    }

    addItem({ ...product, harga: parseFloat(product.hargajual_terbaru || 0) });
    beepSuccess();
  }, [getStock, items, addItem, beepSuccess, beepError]);

  // ── Barcode scanner: immediate fetch + add bypassing the 300ms debounce ──
  const handleScan = useCallback(async (barcode) => {
    const results = await loadProducts(barcode);
    if (results && results.length === 1) {
      handleAddItem(results[0]);
      setSearch('');
      if (inputRef.current) inputRef.current.value = '';
    } else {
      toast.error('Barcode tidak ditemukan atau hasil lebih dari 1');
      beepError();
    }
  }, [loadProducts, handleAddItem, beepError]);

  useBarcodeScanner(handleScan);

  // ── Manual Enter key: add if single result ────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && allProducts.length === 1) {
      handleAddItem(allProducts[0]);
      setSearch('');
    }
  };

  return (
    <div className="flex-1 bg-white rounded-2xl border border-primary-50 p-4 flex flex-col">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
        <input
          id="pos-search-input"
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          placeholder="Cari barang... (ketik kode/nama atau scan barcode) [F1]"
          className="input-upper w-full pl-10 pr-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-sm placeholder-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
          autoFocus
        />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="grid grid-cols-4 gap-2">
          {products.map((p) => {
            const stok = getStock(p.idbarang);
            return (
              <button
                key={p.idbarang}
                onClick={() => handleAddItem(p)}
                className="text-left p-3 rounded-xl border border-primary-50 bg-warm-50/50 hover:bg-primary-50 hover:border-primary-200 transition-all group"
              >
                <p className="text-xs font-semibold text-dark-500 truncate">{p.namabarang}</p>
                <p className="text-[10px] text-dark-300">{p.kodebarang}</p>
                <p className="text-xs font-bold text-primary-600 mt-1">{formatRupiah(p.hargajual_terbaru)}</p>
                <p className="text-[9px] text-dark-200">{p.satuankecil}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[9px] font-semibold ${stok <= 0 ? 'text-red-500' : 'text-dark-300'}`}>
                    Stok: {stok}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        {totalProdPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 pb-2">
            <button
              onClick={() => setProdPage(Math.max(1, prodPage - 1))}
              disabled={prodPage <= 1}
              className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-dark-400 px-2">{prodPage} / {totalProdPages}</span>
            <button
              onClick={() => setProdPage(Math.min(totalProdPages, prodPage + 1))}
              disabled={prodPage >= totalProdPages}
              className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
