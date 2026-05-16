# Modul Pembelian (Frontend)

## Overview
Halaman transaksi pembelian: faktur beli, retur, PO, dan BPB.

## Subfolders
| Folder | Isi |
|--------|-----|
| `Pembelian/` | Pembelian.jsx + PembelianForm.jsx |
| `ReturBeli/` | ReturBeli.jsx + ReturBeliForm.jsx |
| `PurchaseOrder/` | PurchaseOrder.jsx + PurchaseOrderForm.jsx |
| `BPB/` | BPB.jsx + BPBForm.jsx |

## Patterns
- PembelianForm: pilih supplier → tambah item → hitung total otomatis
- PO form: status DRAFT → APPROVED
- BPB form: terima barang dari PO yang di-approve
- ReturBeliForm mengacu ke invoice pembelian

## Dependencies
- `../../api/axios`
- `../../lib/utils`
- `../../lib/formHelpers`
- `../../hooks/usePagination`
- `../../store/tabStore`

## Known Limitations / TODO
- Tidak ada
