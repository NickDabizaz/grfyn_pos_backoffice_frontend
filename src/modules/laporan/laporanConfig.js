/**
 * Config registry untuk LaporanPage.
 * Setiap entry dikunci per kodemenu leaf laporan.
 *
 * filterSide: 'penjualan' | 'pembelian' | null
 *   → menentukan opsi filter gabungan (AdvancedFilter) yang ditampilkan
 *
 * jenis: array of { label, endpoint }
 *   → tombol-tombol "Jenis Laporan" di halaman konfigurasi
 *   → endpoint adalah path relatif: /api/laporan/{endpoint}
 */

const laporanConfig = {
  // ── Laporan Pembelian ──────────────────────────────────────────────────────
  'laporan.pembelian.po': {
    title     : 'Laporan Purchase Order',
    filterSide: 'pembelian',
    jenis     : [
      { label: 'Laporan Purchase Order', endpoint: 'purchase-order' },
    ],
  },
  'laporan.pembelian.bpb': {
    title     : 'Laporan Bukti Penerimaan Barang',
    filterSide: 'pembelian',
    jenis     : [
      { label: 'Laporan BPB', endpoint: 'bpb' },
    ],
  },
  'laporan.pembelian.transaksi': {
    title     : 'Laporan Pembelian',
    filterSide: 'pembelian',
    jenis     : [
      { label: 'Laporan Pembelian',             endpoint: 'pembelian' },
      { label: 'Laporan Pembelian per Supplier', endpoint: 'pembelian-per-supplier' },
      { label: 'Laporan Pembelian per Lokasi',   endpoint: 'pembelian-per-lokasi' },
      { label: 'Laporan Pembelian per Barang',   endpoint: 'pembelian-per-barang' },
    ],
  },
  'laporan.pembelian.retur': {
    title     : 'Laporan Retur Pembelian',
    filterSide: 'pembelian',
    jenis     : [
      { label: 'Laporan Retur Pembelian', endpoint: 'retur-beli' },
    ],
  },

  // ── Laporan Penjualan ──────────────────────────────────────────────────────
  'laporan.penjualan.so': {
    title     : 'Laporan Sales Order',
    filterSide: 'penjualan',
    jenis     : [
      { label: 'Laporan Sales Order', endpoint: 'sales-order' },
    ],
  },
  'laporan.penjualan.bpk': {
    title     : 'Laporan Bukti Pengeluaran Barang',
    filterSide: 'penjualan',
    jenis     : [
      { label: 'Laporan BPK', endpoint: 'bpk' },
    ],
  },
  'laporan.penjualan.transaksi': {
    title     : 'Laporan Penjualan',
    filterSide: 'penjualan',
    jenis     : [
      { label: 'Laporan Penjualan',              endpoint: 'sales-transaksi' },
      { label: 'Laporan Penjualan per Customer', endpoint: 'sales-per-customer' },
      { label: 'Laporan Penjualan per Lokasi',   endpoint: 'sales-per-lokasi' },
      { label: 'Laporan Penjualan per Barang',   endpoint: 'sales-per-barang' },
    ],
  },
  'laporan.penjualan.retur': {
    title     : 'Laporan Retur Penjualan',
    filterSide: 'penjualan',
    jenis     : [
      { label: 'Laporan Retur Penjualan', endpoint: 'retur-jual' },
    ],
  },
};

export default laporanConfig;
