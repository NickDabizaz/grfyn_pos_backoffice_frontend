import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/axios';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { RefreshCw, PauseCircle } from 'lucide-react';
import TransactionHistory from './TransactionHistory';
import ProductCatalog from './ProductCatalog';
import CartSidebar from './CartSidebar';
import PaymentModal from './PaymentModal';
import HoldRecallModal from './HoldRecallModal';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { DEFAULT_PPN } from '../../lib/constants';

export default function PosLayout() {
  useOfflineSync();

  const [allProducts, setAllProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [jual, setJual] = useState([]);
  
  const [showJualList, setShowJualList]   = useState(false);
  const [showPayment, setShowPayment]     = useState(false);
  const [showHoldRecall, setShowHoldRecall] = useState(false);

  const heldCarts = useCartStore((s) => s.heldCarts);
  
  const [usePpn, setUsePpn] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stockData, setStockData] = useState([]);
  
  const { items, clearCart } = useCartStore();
  const user = useAuthStore((s) => s.user);

  const loadProducts = useCallback(async (searchQuery = '') => {
    const url = searchQuery ? `/barang?search=${encodeURIComponent(searchQuery)}` : '/barang';
    const r = await api.get(url);
    setAllProducts(r.data);
    return r.data;
  }, []);

  const loadCustomers = useCallback(() => {
    api.get('/customer').then((r) => setCustomers(r.data));
  }, []);

  const loadStock = useCallback(() => {
    api.get('/stok/saldostok').then((r) => setStockData(r.data));
  }, []);

  const loadJual = useCallback((searchQuery = '') => {
    const params = searchQuery ? { search: searchQuery } : {};
    api.get('/jual', { params }).then((r) => setJual(r.data));
  }, []);

  useEffect(() => {
    loadProducts();
    loadCustomers();
    loadStock();
    loadJual();
  }, [loadProducts, loadCustomers, loadStock, loadJual]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProducts(), loadCustomers(), loadStock(), loadJual()]);
    setRefreshing(false);
  };

  // O(1) hash-map rebuild only when stockData changes
  const stockMap = useMemo(() => {
    const m = {};
    stockData.forEach((s) => { m[s.idbarang] = s.stok; });
    return m;
  }, [stockData]);

  const getStock = useCallback((idbarang) => stockMap[idbarang] ?? 0, [stockMap]);

  // Kalkulasi total dengan useMemo dan presisi float (Math.round)
  const cartCalculations = useMemo(() => {
    let grandTotal = 0;
    let subtotal = 0;
    let ppnTotal = 0;
    
    const ppnRate = usePpn ? (user?.ppn || DEFAULT_PPN) : 0;

    items.forEach((item) => {
      const basePrice = item.harga * item.jml;
      const diskon = item.diskon ? Math.round((basePrice * item.diskon) / 100) : 0;
      const itemPpn = Math.round((basePrice * ppnRate) / 100);
      
      subtotal += basePrice;
      ppnTotal += itemPpn;
      grandTotal += (basePrice + itemPpn - diskon);
    });

    return { subtotal, ppnTotal, grandTotal };
  }, [items, usePpn, user?.ppn]);

  // ── Shortcut Keyboard Global Kasir ──────────────────────────────────────
  // F1 : fokus input pencarian
  // F2 : edit qty barang terakhir di keranjang
  // F4 : buka laci kasir (trigger via BrowserPrint / ESC/POS pulse)
  // F12 / Space : buka modal pembayaran
  // Escape : tutup modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if a modal input is focused to avoid swallowing typed chars
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) &&
          e.key !== 'F1' && e.key !== 'F2' && e.key !== 'F4' && e.key !== 'F12') return;

      if (e.key === 'F1') {
        e.preventDefault();
        document.getElementById('pos-search-input')?.focus();
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (items.length > 0) {
          const last = items[items.length - 1];
          const input = document.getElementById(`qty-input-${last.idbarang}`);
          input?.select();
          input?.focus();
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        // Send cash-drawer open pulse via ESC/POS (requires compatible receipt printer)
        try {
          const esc = '\x1B\x40';        // ESC @ — init printer
          const pulse = '\x1B\x70\x00\x19\xFA'; // ESC p 0 25 250 — pulse drawer
          const blob = new Blob([esc + pulse], { type: 'application/octet-stream' });
          window.open(URL.createObjectURL(blob), '_blank');
        } catch { /* hardware not present — silently ignore */ }
      } else if (e.key === 'F12') {
        e.preventDefault();
        if (items.length > 0) setShowPayment(true);
      } else if (e.key === 'Escape') {
        setShowPayment(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items]);

  return (
    <div className="space-y-4 mt-4 ms-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-500">POS / Kasir</h2>
          <p className="text-sm text-dark-300">Transaksi penjualan</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHoldRecall(true)}
            className="relative flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-200 text-sm font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
            title="Tahan / Panggil Transaksi"
          >
            <PauseCircle className="w-4 h-4" /> Tahan/Panggil
            {heldCarts.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {heldCarts.length}
              </span>
            )}
          </button>
          <button onClick={() => { setShowJualList(!showJualList); if (!showJualList) loadJual(); }}
            className="px-4 py-2 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50 transition-colors">
            {showJualList ? 'Sembunyikan' : 'Riwayat'} Transaksi
          </button>
          <button onClick={handleRefresh} disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh halaman">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {showJualList && (
        <TransactionHistory 
          jual={jual} 
          loadJual={loadJual} 
        />
      )}

      <div className="flex gap-4 h-[calc(100vh-10rem)]">
        <ProductCatalog 
          allProducts={allProducts} 
          getStock={getStock} 
          loadProducts={loadProducts}
        />
        <CartSidebar 
          customers={customers} 
          usePpn={usePpn} 
          setShowPayment={setShowPayment}
          cartCalculations={cartCalculations}
        />
      </div>

      {showPayment && (
        <PaymentModal
          setShowPayment={setShowPayment}
          usePpn={usePpn}
          setUsePpn={setUsePpn}
          loadJual={loadJual}
          cartCalculations={cartCalculations}
        />
      )}

      {showHoldRecall && (
        <HoldRecallModal onClose={() => setShowHoldRecall(false)} />
      )}
    </div>
  );
}
