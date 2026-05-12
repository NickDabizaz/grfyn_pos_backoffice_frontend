# Rencana Pembaruan (Update Plan) POS & ERP Frontend

## Ringkasan
Dokumen ini berisi rencana taktis untuk pembaruan, optimasi, dan penambahan fitur pada aplikasi Grfyn POS & ERP Frontend. Rencana ini dibagi menjadi dua fase utama: **Fase 1 (Optimasi Performa & Kualitas Kode)** dan **Fase 2 (Penambahan Fitur UX & Bisnis)**.

---

## Fase 1: Optimasi Performa & Kualitas Kode (High Priority)
Fase ini berfokus pada perbaikan arsitektur dasar agar aplikasi lebih ringan, cepat, dan terhindar dari *memory leak*.

- [ ] **1.1 Migrasi ke TanStack Query (React Query)**
  - **Berkas Terkait:** `useCrudApi.js`, Komponen Data Grid/Form.
  - **Tindakan:** Mengganti custom hook fetcher berbasis `useState` dengan TanStack Query.
  - **Tujuan:** Mengimplementasikan *caching* otomatis, mencegah re-fetching data yang sama saat user berpindah antar tab (Grid <-> Form), dan membuat perpindahan tab terasa instan.

- [ ] **1.2 Optimasi Render Katalog Produk (Stok Map O(1))**
  - **Berkas Terkait:** `ProductCatalog.jsx`
  - **Tindakan:** Mengubah pengambilan data stok (`getStock(p.idbarang)`) di dalam loop render `.map()` yang memakan waktu (jika datanya besar) menjadi struktur *Hash Map* atau objek kamus.
  - **Tujuan:** Menghilangkan *bottleneck* performa saat me-render ratusan/ribuan produk.

- [ ] **1.3 Perbaikan Logika Barcode Scanner (Bypass Debounce)**
  - **Berkas Terkait:** `ProductCatalog.jsx` (Handler `onKeyDown`).
  - **Tindakan:** Membuat custom hook `useBarcodeScanner` yang mengidentifikasi kecepatan input (biasanya <30ms antar huruf) untuk membedakan antara input ketikan manusia dan input dari alat scanner.
  - **Tujuan:** Memastikan item otomatis masuk keranjang dengan presisi tinggi saat di-scan tanpa terhalang *debounce* 300ms dari kolom pencarian.

- [ ] **1.4 Manajemen Memori Tab (Anti-Memory Leak)**
  - **Berkas Terkait:** `tabStore.js`, `TabContainer.jsx`
  - **Tindakan:** Menerapkan strategi *Lazy Loading* (`React.lazy`) untuk form/komponen berat di dalam tab. Menambahkan fitur *auto-close* peringatan jika jumlah tab terbuka melebihi kapasitas memori yang disarankan (misal: > 15 tab).
  - **Tujuan:** Mencegah *browser crash* jika kasir membuka banyak menu seharian.

- [ ] **1.5 Penanganan Token & Sesi (Silent Refresh)**
  - **Berkas Terkait:** `api/axios.js`
  - **Tindakan:** Memodifikasi respon *interceptor* `401 Unauthorized`. Jangan langsung men-tendang (*redirect*) user ke `/login` yang mereset state tab. Buat logika untuk mencoba `Refresh Token` di latar belakang, atau tampilkan *modal login overlay* di atas tab aktif.
  - **Tujuan:** Menyelamatkan data pekerjaan kasir/admin yang belum di-save saat sesi habis.

---

## Fase 2: Penambahan Fitur Bisnis & UX Kasir
Fase ini berfokus pada kemudahan operasional (kecepatan transaksi) dan keandalan sistem dalam berbagai kondisi toko.

- [ ] **2.1 Global Keyboard Shortcuts (Hotkeys Kasir)**
  - **Tindakan:** Mengimplementasikan library (seperti `react-hotkeys-hook`) untuk meminimalkan penggunaan mouse.
  - **Mapping Usulan:**
    - `F1`: Fokus input pencarian/scan barang.
    - `F2`: Ubah Qty barang terakhir di keranjang.
    - `F4`: Buka laci kasir manual.
    - `Space / F12`: Lanjutkan ke Modal Pembayaran (*Checkout*).
  - **Tujuan:** Mempercepat antrian kasir dengan pengalaman transaksi *keyboard-only*.

- [ ] **2.2 Fitur "Hold / Suspend" Transaksi (Simpan Bon)**
  - **Tindakan:** Menambahkan tombol "Tahan" (Hold) dan "Panggil" (Recall) Transaksi.
  - **Tujuan:** Jika pelanggan A lupa bawa dompet atau mau ambil barang lagi, kasir bisa menyimpan keranjang pelanggan A sementara waktu dan melayani pelanggan B di belakangnya, lalu memanggil kembali data pelanggan A nantinya.

- [ ] **2.3 Offline Tolerance (PWA & Background Sync)**
  - **Tindakan:** Mengubah aplikasi menjadi PWA dan menggunakan `IndexedDB` (bisa lewat `idb` atau `Dexie`). 
  - **Tujuan:** Transaksi kasir tidak akan gagal/hilang meskipun koneksi internet atau LAN server mati mendadak. Transaksi disimpan di browser dan otomatis dikirim (sinkronisasi) saat online kembali.

- [ ] **2.4 Audio Feedback (Scanner Suara)**
  - **Tindakan:** Menambahkan *event trigger* untuk memutar file audio MP3/WAV ringan berukuran kecil (Beep).
  - **Tujuan:** Beep sukses jika scan berhasil, Buzzer error jika scan gagal/stok habis. Memudahkan kasir agar tidak harus melihat layar setiap kali memindai barang.

- [ ] **2.5 Persistensi Workspace ERP (Tab Recovery)**
  - **Tindakan:** Menambahkan *middleware* `persist` dari Zustand pada file `tabStore.js`.
  - **Tujuan:** Jika browser tidak sengaja tertutup atau ter-refresh, semua tab (Master Barang, Laporan, dll) yang sebelumnya terbuka akan kembali utuh.

- [ ] **2.6 Varian Level Harga Pelanggan (Grosir/VIP)**
  - **Tindakan:** Menambahkan logika pemilih tipe harga di komponen produk/keranjang.
  - **Tujuan:** Mendukung model bisnis yang membedakan harga eceran dan harga grosir secara otomatis berdasarkan pelanggan yang dipilih.

---

## Status Progres
> Gunakan file ini sebagai panduan atau *checklist* harian di repositori (contoh: diunggah ke Github Project/Trello/Notion). Centang `[x]` saat tugas telah selesai.
