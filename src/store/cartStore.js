import { create } from 'zustand';

export const useCartStore = create((set) => ({
  items: [],
  customer: null,
  addItem: (item) => set((state) => {
    const existing = state.items.find((i) => i.idbarang === item.idbarang);
    if (existing) {
      return {
        items: state.items.map((i) =>
          i.idbarang === item.idbarang ? { ...i, jml: i.jml + 1 } : i
        ),
      };
    }
    return { items: [...state.items, { ...item, jml: 1 }] };
  }),
  removeItem: (idbarang) => set((state) => ({
    items: state.items.filter((i) => i.idbarang !== idbarang),
  })),
  updateQty: (idbarang, jml) => set((state) => ({
    items: state.items.map((i) =>
      i.idbarang === idbarang ? { ...i, jml: Math.max(1, jml) } : i
    ),
  })),
  setCustomer: (customer) => set({ customer }),
  clearCart: () => set({ items: [], customer: null }),
}));
