import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

let holdIdCounter = 0;

export const useCartStore = create(
  devtools((set, get) => ({
    // ── Active cart ──────────────────────────────────────────────────────────
    items   : [],
    customer: null,

    addItem: (item) => set((state) => {
      // Resolve price according to active price level
      const resolvedHarga = state.priceLevel === 'GROSIR'
        ? parseFloat(item.hargajual_grosir || item.hargajual_terbaru || item.harga || 0)
        : parseFloat(item.hargajual_terbaru || item.harga || 0);

      const enriched = { ...item, harga: resolvedHarga };
      const existing  = state.items.find((i) => i.idbarang === item.idbarang);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.idbarang === item.idbarang ? { ...i, jml: i.jml + 1, harga: resolvedHarga } : i
          ),
        };
      }
      return { items: [...state.items, { ...enriched, jml: 1 }] };
    }, false, 'cart/addItem'),

    removeItem: (idbarang) => set((state) => ({
      items: state.items.filter((i) => i.idbarang !== idbarang),
    }), false, 'cart/removeItem'),

    updateQty: (idbarang, jml) => set((state) => ({
      items: state.items.map((i) =>
        i.idbarang === idbarang ? { ...i, jml: Math.max(1, jml) } : i
      ),
    }), false, 'cart/updateQty'),

    setCustomer: (customer) => set({ customer }, false, 'cart/setCustomer'),

    clearCart: () => set({ items: [], customer: null }, false, 'cart/clearCart'),

    // ── Price Level ─────────────────────────────────────────────────────────
    // 'ECERAN' = retail price (hargajual_terbaru)
    // 'GROSIR'  = wholesale price (hargajual_grosir if present, else discounted)
    priceLevel: 'ECERAN',
    setPriceLevel: (level) => set({ priceLevel: level }, false, 'cart/setPriceLevel'),

    // ── Hold / Recall ────────────────────────────────────────────────────────
    heldCarts: [],

    holdCart: (label = '') => set((state) => {
      if (state.items.length === 0) return {};
      const held = {
        id      : ++holdIdCounter,
        label   : label || `Tahan #${holdIdCounter}`,
        items   : state.items,
        customer: state.customer,
        heldAt  : new Date().toISOString(),
      };
      return {
        heldCarts: [...state.heldCarts, held],
        items    : [],
        customer : null,
      };
    }, false, 'cart/holdCart'),

    recallCart: (id) => {
      const held = get().heldCarts.find((h) => h.id === id);
      if (!held) return;
      set((state) => ({
        items    : held.items,
        customer : held.customer,
        heldCarts: state.heldCarts.filter((h) => h.id !== id),
      }), false, 'cart/recallCart');
    },

    deleteHeld: (id) => set((state) => ({
      heldCarts: state.heldCarts.filter((h) => h.id !== id),
    }), false, 'cart/deleteHeld'),
  }))
);
