import { lazy } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, Warehouse,
  ReceiptText, Coins, FileBarChart, Settings, UserCog, MapPin,
  Calculator, Undo2, Wallet, ClipboardList, CreditCard,
  Tag, Layers, Star, AlertTriangle, Cpu, PiggyBank,
  CalendarOff, Clock, ScanBarcode, Webhook, Globe,
  Download,
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
const Subscription       = lazy(() => import('../modules/subscription/Subscription'));
const Karyawan           = lazy(() => import('../modules/hr/Karyawan/Karyawan'));
const Absensi            = lazy(() => import('../modules/hr/Absensi/Absensi'));
const Payroll            = lazy(() => import('../modules/hr/Payroll/Payroll'));
const LaporanPage        = lazy(() => import('../modules/laporan/LaporanPage'));
const LaporanStokSekarang  = lazy(() => import('../modules/laporan/LaporanStokSekarang'));
const LaporanStokKartuStok = lazy(() => import('../modules/laporan/LaporanStokKartuStok'));
const LaporanStokTransaksi = lazy(() => import('../modules/laporan/LaporanStokTransaksi'));
const LaporanAkuntansi     = lazy(() => import('../modules/laporan/LaporanAkuntansi'));

// ── New feature pages ─────────────────────────────────────────────────────────
const Diskon             = lazy(() => import('../modules/penjualan/Diskon/Diskon'));
const HargaLevel         = lazy(() => import('../modules/master/HargaLevel/HargaLevel'));
const Poin               = lazy(() => import('../modules/master/Poin/Poin'));
const AlertStokMin       = lazy(() => import('../modules/stok/AlertStokMin/AlertStokMin'));
const BatchLot           = lazy(() => import('../modules/stok/BatchLot/BatchLot'));
const AsetTetap          = lazy(() => import('../modules/aset/AsetTetap'));
const Anggaran           = lazy(() => import('../modules/keuangan/Anggaran/Anggaran'));
const Cuti               = lazy(() => import('../modules/hr/Cuti/Cuti'));
const Lembur             = lazy(() => import('../modules/hr/Lembur/Lembur'));
const WebhookPage        = lazy(() => import('../modules/setting/Webhook/Webhook'));
const LaporanExport      = lazy(() => import('../modules/laporan/LaporanExport'));

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
  'master.promo'    : { component: Diskon,   label: 'Promo',    icon: Tag },

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

  // Laporan Akuntansi
  'laporan.akuntansi.jurnal'   : { component: LaporanAkuntansi, label: 'Jurnal Transaksi', icon: FileBarChart, props: { type: 'jurnal' } },
  'laporan.akuntansi.bukubesar': { component: LaporanAkuntansi, label: 'Buku Besar',       icon: FileBarChart, props: { type: 'buku-besar' } },
  'laporan.akuntansi.neraca'   : { component: LaporanAkuntansi, label: 'Neraca',           icon: FileBarChart, props: { type: 'neraca' } },

  // New features
  'penjualan.diskon'  : { component: Diskon,       label: 'Promo',                icon: Tag },
  'master.hargalevel' : { component: HargaLevel,   label: 'Level Harga',          icon: Layers },
  'master.poin'       : { component: Poin,         label: 'Poin Member',          icon: Star },
  'stok.alertstok'    : { component: AlertStokMin, label: 'Alert Stok Minimum',   icon: AlertTriangle },
  'stok.batchlot'     : { component: BatchLot,     label: 'Batch / Lot',          icon: ScanBarcode },
  'aset.tetap'        : { component: AsetTetap,    label: 'Aset Tetap',           icon: Cpu },
  'keuangan.anggaran' : { component: Anggaran,     label: 'Anggaran',             icon: PiggyBank },
  'sdm.cuti'          : { component: Cuti,         label: 'Cuti',                 icon: CalendarOff },
  'sdm.lembur'        : { component: Lembur,       label: 'Lembur',               icon: Clock },
  'setting.webhook'   : { component: WebhookPage,  label: 'Webhook',              icon: Globe },
  'laporan.export'    : { component: LaporanExport,label: 'Export Laporan',       icon: Download },

  // Setting
  'setting': { component: Setting, label: 'Setting Perusahaan', icon: Settings },
  'subscription': { component: Subscription, label: 'Subscription', icon: CreditCard },
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
