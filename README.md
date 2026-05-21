# Grfyn POS Backoffice

Backoffice web untuk mengelola operasional Grfyn POS secara terpusat. Aplikasi ini digunakan untuk administrasi toko, master data, transaksi, stok, laporan, keuangan, dan pengaturan tenant.

## Demo Public

Aplikasi demo dapat diakses melalui:

**Backoffice:** http://erp.grfyn.my.id/

Gunakan akun berikut untuk mencoba demo public:

| Field | Value |
| --- | --- |
| Email | `demo@grfyn.id` |
| Password | `pass123` |

## Fitur Utama

- Dashboard ringkasan operasional.
- Master data barang, customer, supplier, lokasi, akun, dan user.
- Transaksi pembelian dan penjualan.
- Manajemen stok, termasuk saldo awal, transfer stok, stock opname, dan hitung HPP.
- Modul keuangan untuk pelunasan hutang dan piutang.
- Modul HR untuk data karyawan, absensi, dan payroll.
- Laporan operasional dan akuntansi.
- Pengaturan toko dan konfigurasi POS.

## Tech Stack

- React
- Vite
- Tailwind CSS
- Zustand
- Axios
- React Router
- TanStack Query
- Lucide React

## Persyaratan

- Node.js versi LTS
- npm
- Backend API Grfyn POS sudah berjalan dan dapat diakses dari konfigurasi environment frontend

## Instalasi

```bash
npm install
cp .env-example .env
```

Sesuaikan nilai pada file `.env` dengan URL backend API yang digunakan.

## Menjalankan Development Server

```bash
npm run dev
```

## Build Production

```bash
npm run build
```

Output build akan tersedia di folder `dist`.

## Struktur Project

```text
src/
  api/          Konfigurasi client API
  components/   Komponen UI reusable
  hooks/        Custom React hooks
  layouts/      Layout utama aplikasi
  lib/          Helper dan registry
  modules/      Modul fitur backoffice
  store/        State management
```

## Modul Aplikasi

```text
auth
dashboard
hr
keuangan
laporan
master
pembelian
penjualan
pos
stok
```

## Script

| Command | Keterangan |
| --- | --- |
| `npm run dev` | Menjalankan aplikasi untuk development |
| `npm run build` | Membuat build production |
| `npm run preview` | Preview hasil build production |

## Lisensi

Project ini merupakan bagian dari ekosistem Grfyn POS.
