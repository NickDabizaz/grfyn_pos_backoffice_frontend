import { lazy } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, ShoppingBag, Warehouse,
  ReceiptText, Coins, FileBarChart, Settings, UserCog, MapPin,
  ClipboardList, Calculator, Undo2, Repeat, Wallet, Factory,
} from 'lucide-react';

// ── Lazy-loaded page components ───────────────────────────────────────────────
// Each component is only bundled/loaded when its tab is first opened.
const Dashboard          = lazy(() => import('../modules/dashboard/Dashboard'));
const PosLayout          = lazy(() => import('../modules/pos/PosLayout'));
const Barang             = lazy(() => import('../modules/master/Barang/Barang'));
const Supplier           = lazy(() => import('../modules/master/Supplier/Supplier'));
const Customer           = lazy(() => import('../modules/master/Customer/Customer'));
const Akun               = lazy(() => import('../modules/master/Akun/Akun'));
const User               = lazy(() => import('../modules/master/User/User'));
const Lokasi             = lazy(() => import('../modules/master/Lokasi/Lokasi'));
const Pembelian          = lazy(() => import('../modules/pembelian/Pembelian/Pembelian'));
const PurchaseOrder      = lazy(() => import('../modules/pembelian/PurchaseOrder/PurchaseOrder'));
const BPB                = lazy(() => import('../modules/pembelian/BPB/BPB'));
const Penjualan          = lazy(() => import('../modules/penjualan/Penjualan/Penjualan'));
const ReturJual          = lazy(() => import('../modules/penjualan/ReturJual/ReturJual'));
const ReturBeli          = lazy(() => import('../modules/pembelian/ReturBeli/ReturBeli'));
const TukarBarang        = lazy(() => import('../modules/penjualan/TukarBarang/TukarBarang'));
const Kas                = lazy(() => import('../modules/keuangan/Kas/Kas'));
const SaldoAwalStok      = lazy(() => import('../modules/stok/SaldoAwalStok/SaldoAwalStok'));
const PenyesuaianStok    = lazy(() => import('../modules/stok/PenyesuaianStok/PenyesuaianStok'));
const HitungHPP          = lazy(() => import('../modules/stok/HitungHPP/HitungHPP'));
const TransferStok       = lazy(() => import('../modules/stok/TransferStok/TransferStok'));
const StockOpname        = lazy(() => import('../modules/stok/StockOpname/StockOpname'));
const PelunasanPiutang   = lazy(() => import('../modules/keuangan/PelunasanPiutang/PelunasanPiutang'));
const PelunasanHutang    = lazy(() => import('../modules/keuangan/PelunasanHutang/PelunasanHutang'));
const Produksi           = lazy(() => import('../modules/stok/Produksi/Produksi'));
const Karyawan           = lazy(() => import('../modules/hr/Karyawan/Karyawan'));
const Absensi            = lazy(() => import('../modules/hr/Absensi/Absensi'));
const Payroll            = lazy(() => import('../modules/hr/Payroll/Payroll'));
const LaporanPenjualan   = lazy(() => import('../modules/laporan/LaporanPenjualan'));
const LaporanPembelian   = lazy(() => import('../modules/laporan/LaporanPembelian'));
const LaporanBarang      = lazy(() => import('../modules/laporan/LaporanBarang'));
const LaporanStokSekarang = lazy(() => import('../modules/laporan/LaporanStokSekarang'));
const LaporanStokKartuStok = lazy(() => import('../modules/laporan/LaporanStokKartuStok'));
const Setting            = lazy(() => import('../modules/pos/Setting'));

const KartuStokPlaceholder = () => (
  <div className="p-6">
    <h2 className="text-lg font-bold text-dark-500 mb-4">Kartu Stok</h2>
    <p className="text-dark-300 text-sm">Halaman Kartu Stok akan diimplementasikan.</p>
  </div>
);

const registry = {
  'dashboard': {
    component: Dashboard,
    label    : 'Dashboard',
    icon     : LayoutDashboard,
    closable : false,
  },
  'pos': { component: PosLayout, label: 'POS', icon: ShoppingCart },
  'master.barang'   : { component: Barang,    label: 'Barang',    icon: Package },
  'master.supplier' : { component: Supplier,  label: 'Supplier' },
  'master.customer' : { component: Customer,  label: 'Customer' },
  'master.akun'     : { component: Akun,      label: 'Akun' },
  'master.user'     : { component: User,      label: 'User',     icon: UserCog },
  'master.lokasi'   : { component: Lokasi,    label: 'Lokasi',   icon: MapPin },
  'pembelian'       : { component: Pembelian, label: 'Pembelian', icon: ShoppingBag },
  'pembelian.transaksi': { component: Pembelian, label: 'Pembelian', icon: ShoppingBag },
  'pembelian.po'    : { component: PurchaseOrder, label: 'Purchase Order (PO)', icon: ShoppingBag },
  'pembelian.bpb'   : { component: BPB, label: 'Bukti Penerimaan Barang (BPB)', icon: ShoppingBag },
  'pembelian.retur' : { component: ReturBeli, label: 'Retur Pembelian', icon: Undo2 },
  'penjualan'       : { component: Penjualan, label: 'Penjualan', icon: ReceiptText },
  'penjualan.transaksi'  : { component: Penjualan,  label: 'Transaksi Jual',   icon: ReceiptText },
  'penjualan.retur'      : { component: ReturJual,  label: 'Retur Penjualan',  icon: Undo2 },
  'penjualan.tukarbarang': { component: TukarBarang, label: 'Tukar Barang',    icon: Repeat },
  'stok.saldoawal'   : { component: SaldoAwalStok,   label: 'Saldo Awal Stok' },
  'stok.penyesuaian' : { component: PenyesuaianStok, label: 'Penyesuaian Stok' },
  'stok.hitunghpp'   : { component: HitungHPP,       label: 'Hitung HPP',   icon: Calculator },
  'stok.transferstok': { component: TransferStok,    label: 'Transfer Stok' },
  'stok.stockopname' : { component: StockOpname,     label: 'Stock Opname' },
  'stok.produksi'    : { component: Produksi,        label: 'Produksi',     icon: Factory },
  'stok.kartustok'   : { component: KartuStokPlaceholder, label: 'Kartu Stok', icon: ClipboardList },
  'kas'              : { component: Kas, label: 'Kas', icon: Coins },
  'keuangan.kas'     : { component: Kas, label: 'Kas', icon: Coins },
  'keuangan.pelunasanpiutang': { component: PelunasanPiutang, label: 'Pelunasan Piutang', icon: Wallet },
  'keuangan.pelunasanhutang' : { component: PelunasanHutang,  label: 'Pelunasan Hutang',  icon: Wallet },
  'laporan.penjualan'   : { component: LaporanPenjualan,    label: 'Laporan Penjualan' },
  'laporan.pembelian'   : { component: LaporanPembelian,    label: 'Laporan Pembelian' },
  'laporan.barang'      : { component: LaporanBarang,       label: 'Laporan Barang' },
  'laporan.stoksekarang': { component: LaporanStokSekarang, label: 'Stok Sekarang' },
  'laporan.kartustok'   : { component: LaporanStokKartuStok, label: 'Kartu Stok' },
  'laporan.neracasaldo' : { component: LaporanPenjualan,    label: 'Neraca Saldo' },
  'laporan.labarugi'    : { component: LaporanPenjualan,    label: 'Laba Rugi' },
  'laporan.neraca'      : { component: LaporanPenjualan,    label: 'Neraca' },
  'laporan.bukubesar'   : { component: LaporanPenjualan,    label: 'Buku Besar' },
  'laporan.closing'     : { component: LaporanPenjualan,    label: 'Closing Periode' },
  'sdm'                 : { component: Karyawan, label: 'HR' },
  'sdm.karyawan'        : { component: Karyawan, label: 'Data Karyawan' },
  'sdm.absensi'         : { component: Absensi, label: 'Absensi' },
  'sdm.payroll'         : { component: Payroll, label: 'Payroll' },
  'setting'             : { component: Setting, label: 'Setting', icon: Settings },
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
  });
}

export const DASHBOARD_KODE = 'dashboard';
