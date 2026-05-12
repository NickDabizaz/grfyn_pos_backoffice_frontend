# Rencana Pembaruan (Update Plan) POS & ERP Frontend

## Ringkasan
Dokumen ini berisi rencana taktis untuk pembaruan, optimasi, dan penambahan fitur pada aplikasi Grfyn POS & ERP Frontend. Rencana ini dibagi menjadi dua fase utama: **Fase 1 (Optimasi Performa & Kualitas Kode)** dan **Fase 2 (Penambahan Fitur UX & Bisnis)**.

---

## Fase 1: Optimasi Performa & Kualitas Kode (High Priority)
Fase ini berfokus pada perbaikan arsitektur dasar agar aplikasi lebih ringan, cepat, dan terhindar dari *memory leak*.

- [x] **1.1 Migrasi ke TanStack Query (React Query)**
  - **Berkas Terkait:** `useCrudApi.js`, `main.jsx`
  - **Tindakan:** Menginstall `@tanstack/react-query`. Membungkus app dengan `QueryClientProvider` (staleTime 5 menit, gcTime 10 menit). Menambahkan `useQueryData()` dan `useMutateData()` ke `useCrudApi.js` sebagai hooks baru di atas fungsi imperatif lama — backward-compatible.
  - **Tujuan:** Caching otomatis aktif; tab Grid ↔ Form tidak re-fetch hingga cache stale.

- [x] **1.2 Optimasi Render Katalog Produk (Stok Map O(1))**
  - **Berkas Terkait:** `PosLayout.jsx`
  - **Tindakan:** Mengganti `stockData.find()` di dalam `getStock()` dengan `useMemo` yang membangun hash-map `{ idbarang: stok }` sekali saat `stockData` berubah. Lookup menjadi O(1).
  - **Tujuan:** Bottleneck render katalog ratusan/ribuan produk dieliminasi.

- [x] **1.3 Perbaikan Logika Barcode Scanner (Bypass Debounce)**
  - **Berkas Terkait:** `hooks/useBarcodeScanner.js`, `ProductCatalog.jsx`
  - **Tindakan:** Membuat hook `useBarcodeScanner` yang mendeteksi kecepatan keystroke (<30ms = scanner). Scanner input di-flush ke callback tanpa melewati debounce 300ms. `ProductCatalog` langsung fetch & add item ke keranjang.
  - **Tujuan:** Scan barcode instan, tidak terhalang debounce pencarian.

- [x] **1.4 Manajemen Memori Tab (Anti-Memory Leak)**
  - **Berkas Terkait:** `tabStore.js`, `TabContent.jsx`, `TabBar.jsx`, `pageRegistry.jsx`
  - **Tindakan:** Semua komponen halaman di-`React.lazy()` di `pageRegistry.jsx`. `TabContent` dibungkus `<Suspense>` dengan skeleton loader. `tabStore` melacak `showMemoryWarning` — aktif saat tab ≥ 15. Banner peringatan tampil di `TabBar`.
  - **Tujuan:** Bundle split per halaman; peringatan mencegah crash browser akibat tab berlebihan.

- [x] **1.5 Penanganan Token & Sesi (Silent Refresh)**
  - **Berkas Terkait:** `api/axios.js`, `store/authModalStore.js`, `components/ui/LoginOverlay.jsx`, `layouts/MainLayout.jsx`
  - **Tindakan:** Interceptor 401 tidak lagi redirect ke `/login`. Alih-alih, ia memanggil `authModalStore.show()` yang memunculkan `LoginOverlay` — form login floating di atas workspace aktif.
  - **Tujuan:** Data pekerjaan kasir/admin tidak hilang saat sesi habis.

---

## Fase 2: Penambahan Fitur Bisnis & UX Kasir
Fase ini berfokus pada kemudahan operasional (kecepatan transaksi) dan keandalan sistem dalam berbagai kondisi toko.

- [x] **2.1 Global Keyboard Shortcuts (Hotkeys Kasir)**
  - **Berkas Terkait:** `PosLayout.jsx`, `CartSidebar.jsx`
  - **Mapping Implementasi:**
    - `F1`: Fokus input pencarian/scan barang.
    - `F2`: Fokus input qty barang terakhir di keranjang (field `<input id="qty-input-{id}">`).
    - `F4`: Kirim pulse ESC/POS ke printer untuk membuka laci kasir.
    - `F12`: Buka Modal Pembayaran.
    - `Escape`: Tutup modal.
  - **Tujuan:** Kasir bisa bertransaksi sepenuhnya via keyboard.

- [x] **2.2 Fitur "Hold / Suspend" Transaksi (Simpan Bon)**
  - **Berkas Terkait:** `store/cartStore.js`, `pages/pos/HoldRecallModal.jsx`, `PosLayout.jsx`
  - **Tindakan:** `cartStore` memiliki `heldCarts[]`, `holdCart(label)`, `recallCart(id)`, `deleteHeld(id)`. Tombol "Tahan/Panggil" dengan badge counter di header POS. Modal menampilkan daftar keranjang yang ditahan beserta total dan label.
  - **Tujuan:** Kasir dapat menangani beberapa pelanggan secara bergantian.

- [x] **2.3 Offline Tolerance (PWA & Background Sync)**
  - **Berkas Terkait:** `vite.config.js`, `lib/offlineDb.js`, `hooks/useOfflineSync.js`, `PaymentModal.jsx`, `PosLayout.jsx`
  - **Tindakan:** Mengaktifkan `vite-plugin-pwa` dengan Workbox (NetworkFirst untuk endpoint baca). Skema Dexie `outbox` menyimpan transaksi pending. `PaymentModal` memeriksa `navigator.onLine`; jika offline, enqueue transaksi. `useOfflineSync` mendengar event `online` dan flush outbox otomatis.
  - **Tujuan:** Transaksi tidak gagal/hilang saat koneksi putus.

- [x] **2.4 Audio Feedback (Scanner Suara)**
  - **Berkas Terkait:** `hooks/useAudioFeedback.js`, `ProductCatalog.jsx`
  - **Tindakan:** Hook `useAudioFeedback` menggunakan Web Audio API (tanpa file audio eksternal). `beepSuccess()` = nada pendek 1200 Hz, `beepError()` = dua buzz rendah 220 Hz. Dipanggil di `ProductCatalog` saat item berhasil/gagal ditambahkan.
  - **Tujuan:** Umpan balik audio instan — kasir tidak perlu melihat layar setiap scan.

- [x] **2.5 Persistensi Workspace ERP (Tab Recovery)**
  - **Berkas Terkait:** `store/tabStore.js`
  - **Tindakan:** Menambahkan middleware `persist` dari Zustand dengan `sessionStorage`. Hanya data ringan (kodemenu, label, state) yang disimpan — komponen React tidak diserialisasi. Pada hydration, `onRehydrateStorage` me-re-attach komponen dari `pageRegistry`.
  - **Tujuan:** Tab terbuka kembali utuh setelah browser refresh.

- [x] **2.6 Varian Level Harga Pelanggan (Grosir/VIP)**
  - **Berkas Terkait:** `store/cartStore.js`, `pages/pos/CartSidebar.jsx`
  - **Tindakan:** `cartStore` memiliki `priceLevel` (ECERAN/GROSIR) dan `setPriceLevel`. `addItem` menggunakan `hargajual_grosir` saat level GROSIR, fallback ke `hargajual_terbaru`. `CartSidebar` menampilkan toggle Eceran/Grosir; saat pelanggan dipilih, level otomatis disesuaikan jika `customer.tipe_harga` tersedia.
  - **Tujuan:** Mendukung harga eceran dan grosir secara otomatis per pelanggan.

---

## Status Progres
> Semua item Fase 1 dan Fase 2 telah selesai diimplementasikan pada branch `claude/plan-refactor-I0IhK`.
