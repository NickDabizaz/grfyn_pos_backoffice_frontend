import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './layouts/MainLayout';
import POSLayout from './layouts/POSLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Pos from './pages/Pos';
import Barang from './pages/Barang';
import Customer from './pages/Customer';
import Supplier from './pages/Supplier';
import Pembelian from './pages/Pembelian';
import Penjualan from './pages/Penjualan';
import Setting from './pages/Setting';
import Kas from './pages/Kas';
import Akun from './pages/Akun';
import User from './pages/User';
import Lokasi from './pages/Lokasi';

import SaldoAwalStok from './pages/stok/SaldoAwalStok';
import PenyesuaianStok from './pages/stok/PenyesuaianStok';
import HitungHPP from './pages/stok/HitungHPP';

import LaporanPenjualan from './pages/laporan/LaporanPenjualan';
import LaporanPembelian from './pages/laporan/LaporanPembelian';
import LaporanMasterBarang from './pages/laporan/LaporanMasterBarang';
import LaporanStokSekarang from './pages/laporan/LaporanStokSekarang';
import LaporanStokKartuStok from './pages/laporan/LaporanStokKartuStok';

import { ConfirmProvider } from './components/ui/ConfirmDialog';

export default function App() {
  return (
    <ConfirmProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '13px' }
        }} />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Main Layout (sidebar + tab system) */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/master/barang" element={<Barang />} />
            <Route path="/master/supplier" element={<Supplier />} />
            <Route path="/master/customer" element={<Customer />} />
            <Route path="/master/akun" element={<Akun />} />
            <Route path="/master/user" element={<User />} />
            <Route path="/master/lokasi" element={<Lokasi />} />
            <Route path="/pembelian" element={<Pembelian />} />
            <Route path="/penjualan" element={<Penjualan />} />
            <Route path="/setting" element={<Setting />} />
            <Route path="/kas" element={<Kas />} />
            <Route path="/stok" element={<Navigate to="/stok/saldoawal" replace />} />
            <Route path="/stok/saldoawal" element={<SaldoAwalStok />} />
            <Route path="/stok/penyesuaian" element={<PenyesuaianStok />} />
            <Route path="/stok/hitunghpp" element={<HitungHPP />} />
            <Route path="/laporan" element={<Navigate to="/laporan/penjualan" replace />} />
            <Route path="/laporan/penjualan" element={<LaporanPenjualan />} />
            <Route path="/laporan/pembelian" element={<LaporanPembelian />} />
            <Route path="/laporan/master/barang" element={<LaporanMasterBarang />} />
            <Route path="/laporan/stok/sekarang" element={<LaporanStokSekarang />} />
            <Route path="/laporan/stok/kartustok" element={<LaporanStokKartuStok />} />
          </Route>

          {/* POS Layout (standalone full-screen) */}
          <Route element={<POSLayout />}>
            <Route path="/pos" element={<Pos />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfirmProvider>
  );
}
