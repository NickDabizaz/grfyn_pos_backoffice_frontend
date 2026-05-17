import { lazy } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, Warehouse,
  ReceiptText, Coins, FileBarChart, Settings, UserCog, MapPin,
  Calculator, Undo2, Wallet, ClipboardList,
} from 'lucide-react';

// ── Lazy-loaded page components ───────────────────────────────────────────────
const Dashboard          = lazy(() => import('../modules/dashboard/Dashboard'));
const Barang             = lazy(() => import('../modules/master/Barang/Barang'));
const Supplier           = lazy(() => import('../modules/master/Supplier/Supplier'));
const Customer           = lazy(() => import('../modules/master/Customer/Customer'));
const Akun               = lazy(() => import('../modules/master/Akun/Akun'));
const User               = lazy(() => import('../modules/master/User/User'));
const Lokasi             = lazy(() => import('../modules/master/Lokasi/Lokasi'));
const Pembelian          = lazy(() => import('../modules/pembelian/Pembelian/Pembelian'));
const PurchaseOrder      = lazy(() => import('../modules/pembelian/PurchaseOrder/PurchaseOrder'));
const BPB                = lazy(() => import('../modules/pembelian/BPB/BPB'));
const ReturBeli          = lazy(() => import('../modules/pembelian/ReturBeli/ReturBeli'));
const Penjualan          = lazy(() => import('../modules/penjualan/Penjualan/Penjualan'));
const ReturJual          = lazy(() => import('../modules/penjualan/ReturJual/ReturJual'));
const SalesOrder         = lazy(() => import('../modules/penjualan/SalesOrder/SalesOrder'));
const BPK                = lazy(() => import('../modules/penjualan/BPK/BPK'));
const Kas                = lazy(() => import('../modules/keuangan/Kas/Kas'));
const SaldoAwalStok      = lazy(() => import('../modules/stok/SaldoAwalStok/SaldoAwalStok'));
const HitungHPP          = lazy(() => import('../modules/stok/HitungHPP/HitungHPP'));
const TransferStok       = lazy(() => import('../modules/stok/TransferStok/TransferStok'));
const StockOpname        = lazy(() => import('../modules/stok/StockOpname/StockOpname'));
const PelunasanPiutang   = lazy(() => import('../modules/keuangan/PelunasanPiutang/PelunasanPiutang'));
const PelunasanHutang    = lazy(() => import('../modules/keuangan/PelunasanHutang/PelunasanHutang'));
const Setting            = lazy(() => import('../modules/pos/Setting/Setting'));
const Karyawan           = lazy(() => import('../modules/hr/Karyawan/Karyawan'));
const Absensi            = lazy(() => import('../modules/hr/Absensi/Absensi'));
const Payroll            = lazy(() => import('../modules/hr/Payroll/Payroll'));
const LaporanPage        = lazy(() => import('../modules/laporan/LaporanPage'));
const LaporanStokSekarang  = lazy(() => import('../modules/laporan/LaporanStokSekarang'));
const LaporanStokKartuStok = lazy(() => import('../modules/laporan/LaporanStokKartuStok'));
const LaporanStokTransaksi = lazy(() => import('../modules/laporan/LaporanStokTransaksi'));

const registry = {
  'dashboard': {
    component: Dashboard,
    label    : 'Dashboard',
    icon     : LayoutDashboard,
    closable : false,
  },

  // Master
  'master.user'     : { component: User,     label: 'User',     icon: UserCog },
  'master.barang'   : { component: Barang,   label: 'Barang',   icon: Package },
  'master.customer' : { component: Customer, label: 'Customer' },
  'master.supplier' : { component: Supplier, label: 'Supplier' },
  'master.lokasi'   : { component: Lokasi,   label: 'Lokasi',   icon: MapPin },
  'master.akun'     : { component: Akun,     label: 'Akun' },

  // Pembelian
  'pembelian.po'       : { component: PurchaseOrder, label: 'Purchase Order (PO)',           icon: ShoppingBag },
  'pembelian.bpb'      : { component: BPB,           label: 'Bukti Penerimaan Barang (BPB)', icon: ShoppingBag },
  'pembelian.transaksi': { component: Pembelian,     label: 'Pembelian',                     icon: ShoppingBag },
  'pembelian.retur'    : { component: ReturBeli,     label: 'Retur Pembelian',               icon: Undo2 },

  // Penjualan
  'penjualan.so'       : { component: SalesOrder, label: 'Sales Order (SO)',               icon: ReceiptText },
  'penjualan.bpk'      : { component: BPK,        label: 'Bukti Pengeluaran Barang (BPK)', icon: ReceiptText },
  'penjualan.transaksi': { component: Penjualan,  label: 'Penjualan',                      icon: ReceiptText },
  'penjualan.retur'    : { component: ReturJual,  label: 'Retur Penjualan',                icon: Undo2 },

  // Stok
  'stok.saldoawal'   : { component: SaldoAwalStok, label: 'Saldo Stok' },
  'stok.stockopname' : { component: StockOpname,   label: 'Opname Stok' },
  'stok.transferstok': { component: TransferStok,  label: 'Transfer' },
  'stok.hitunghpp'   : { component: HitungHPP,     label: 'Hitung HPP', icon: Calculator },

  // Keuangan
  'keuangan.kas'             : { component: Kas,             label: 'Kas',              icon: Coins },
  'keuangan.pelunasanhutang' : { component: PelunasanHutang, label: 'Pelunasan Hutang', icon: Wallet },
  'keuangan.pelunasanpiutang': { component: PelunasanPiutang,label: 'Pelunasan Piutang',icon: Wallet },

  // HR
  'sdm.karyawan': { component: Karyawan, label: 'Data Karyawan' },
  'sdm.absensi' : { component: Absensi,  label: 'Absensi' },
  'sdm.payroll' : { component: Payroll,  label: 'Gaji' },

  // Laporan Pembelian leaves
  'laporan.pembelian.po'       : { component: LaporanPage, label: 'Laporan Purchase Order',           icon: FileBarChart },
  'laporan.pembelian.bpb'      : { component: LaporanPage, label: 'Laporan Bukti Penerimaan Barang',  icon: FileBarChart },
  'laporan.pembelian.transaksi': { component: LaporanPage, label: 'Laporan Pembelian',                icon: FileBarChart },
  'laporan.pembelian.retur'    : { component: LaporanPage, label: 'Laporan Retur Pembelian',          icon: FileBarChart },

  // Laporan Penjualan leaves
  'laporan.penjualan.so'       : { component: LaporanPage, label: 'Laporan Sales Order',              icon: FileBarChart },
  'laporan.penjualan.bpk'      : { component: LaporanPage, label: 'Laporan Bukti Pengeluaran Barang', icon: FileBarChart },
  'laporan.penjualan.transaksi': { component: LaporanPage, label: 'Laporan Penjualan',                icon: FileBarChart },
  'laporan.penjualan.retur'    : { component: LaporanPage, label: 'Laporan Retur Penjualan',          icon: FileBarChart },

  // Laporan Stok
  'laporan.stok.sekarang' : { component: LaporanStokSekarang,  label: 'Stok Sekarang', icon: FileBarChart },
  'laporan.stok.kartustok': { component: LaporanStokKartuStok, label: 'Kartu Stok',   icon: ClipboardList },
  'laporan.stok.opname'   : { component: LaporanStokTransaksi, label: 'Opname Stok',  icon: ClipboardList, props: { jenis: 'opname' } },
  'laporan.stok.transfer' : { component: LaporanStokTransaksi, label: 'Transfer Stok', icon: ClipboardList, props: { jenis: 'transfer' } },

  // Setting
  'setting': { component: Setting, label: 'Setting Perusahaan', icon: Settings },
};

export function getPage(kodemenu) {
  return registry[kodemenu] || null;
}

export function openPageFromSidebar(kodemenu, openOrFocus) {
  const page = getPage(kodemenu);
  if (!page) return null;

  return openOrFocus({
    kodemenu,
    label    : page.label,
    icon     : page.icon || null,
    component: page.component,
    type     : 'list',
    closable : page.closable !== false,
    props    : { kodemenu, ...(page.props || {}) },
  });
}

export const DASHBOARD_KODE = 'dashboard';
