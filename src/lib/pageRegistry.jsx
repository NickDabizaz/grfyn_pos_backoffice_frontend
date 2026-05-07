import { LayoutDashboard, ShoppingCart, Package, ShoppingBag, Warehouse, ReceiptText, Coins, FileBarChart, Settings, UserCog, MapPin, ClipboardList, Calculator } from 'lucide-react';

import Dashboard from '../pages/Dashboard';
import Pos from '../pages/Pos';
import Barang from '../pages/Barang';
import Supplier from '../pages/Supplier';
import Customer from '../pages/Customer';
import Akun from '../pages/Akun';
import User from '../pages/User';
import Lokasi from '../pages/Lokasi';
import Pembelian from '../pages/Pembelian';
import Penjualan from '../pages/Penjualan';
import Kas from '../pages/Kas';
import Setting from '../pages/Setting';
import SaldoAwalStok from '../pages/stok/SaldoAwalStok';
import PenyesuaianStok from '../pages/stok/PenyesuaianStok';
import HitungHPP from '../pages/stok/HitungHPP';
import LaporanPenjualan from '../pages/laporan/LaporanPenjualan';
import LaporanPembelian from '../pages/laporan/LaporanPembelian';
import LaporanMasterBarang from '../pages/laporan/LaporanMasterBarang';
import LaporanStokSekarang from '../pages/laporan/LaporanStokSekarang';
import LaporanStokKartuStok from '../pages/laporan/LaporanStokKartuStok';

const registry = {
  'dashboard': {
    component: Dashboard,
    label    : 'Dashboard',
    icon     : LayoutDashboard,
    closable : false,
  },
  'pos': {
    component: Pos,
    label    : 'POS',
    icon     : ShoppingCart,
  },
  'master.barang': {
    component: Barang,
    label    : 'Barang',
    icon     : Package,
  },
  'master.supplier': {
    component: Supplier,
    label    : 'Supplier',
  },
  'master.customer': {
    component: Customer,
    label    : 'Customer',
  },
  'master.akun': {
    component: Akun,
    label    : 'Akun',
  },
  'master.user': {
    component: User,
    label    : 'User',
    icon     : UserCog,
  },
  'master.lokasi': {
    component: Lokasi,
    label    : 'Lokasi',
    icon     : MapPin,
  },
  'pembelian': {
    component: Pembelian,
    label    : 'Pembelian',
    icon     : ShoppingBag,
  },
  'penjualan': {
    component: Penjualan,
    label    : 'Penjualan',
    icon     : ReceiptText,
  },
  'stok.saldoawal': {
    component: SaldoAwalStok,
    label    : 'Saldo Awal Stok',
  },
  'stok.penyesuaian': {
    component: PenyesuaianStok,
    label    : 'Penyesuaian Stok',
  },
  'stok.hitunghpp': {
    component: HitungHPP,
    label    : 'Hitung HPP',
    icon     : Calculator,
  },
  'stok.kartustok': {
    component: () => (
      <div className = "p-6">
      <h2  className = "text-lg font-bold text-dark-500 mb-4">Kartu Stok</h2>
      <p   className = "text-dark-300 text-sm">Halaman Kartu Stok akan diimplementasikan.</p>
      </div>
    ),
    label: 'Kartu Stok',
    icon : ClipboardList,
  },
  'kas': {
    component: Kas,
    label    : 'Kas',
    icon     : Coins,
  },
  'laporan.penjualan': {
    component: LaporanPenjualan,
    label    : 'Laporan Penjualan',
  },
  'laporan.pembelian': {
    component: LaporanPembelian,
    label    : 'Laporan Pembelian',
  },
  'laporan.barang': {
    component: LaporanMasterBarang,
    label    : 'Laporan Barang',
  },
  'laporan.stoksekarang': {
    component: LaporanStokSekarang,
    label    : 'Stok Sekarang',
  },
  'laporan.kartustok': {
    component: LaporanStokKartuStok,
    label    : 'Kartu Stok',
  },
  'setting': {
    component: Setting,
    label    : 'Setting',
    icon     : Settings,
  },
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
