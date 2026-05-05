import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
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

// Stok submenu pages
import SaldoAwalStok from './pages/stok/SaldoAwalStok';
import PenyesuaianStok from './pages/stok/PenyesuaianStok';

// Laporan submenu pages
import LaporanPenjualan from './pages/laporan/LaporanPenjualan';
import LaporanPembelian from './pages/laporan/LaporanPembelian';
import LaporanMasterBarang from './pages/laporan/LaporanMasterBarang';
import LaporanStokSekarang from './pages/laporan/LaporanStokSekarang';
import LaporanStokKartuStok from './pages/laporan/LaporanStokKartuStok';

import { useAuthStore } from './store/authStore';
import { ConfirmProvider } from './components/ui/ConfirmDialog';

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <ConfirmProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '13px' }
        }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/pos" element={<ProtectedRoute><Pos /></ProtectedRoute>} />
          <Route path="/master/barang" element={<ProtectedRoute><Barang /></ProtectedRoute>} />
          <Route path="/master/supplier" element={<ProtectedRoute><Supplier /></ProtectedRoute>} />
          <Route path="/master/customer" element={<ProtectedRoute><Customer /></ProtectedRoute>} />
          <Route path="/pembelian" element={<ProtectedRoute><Pembelian /></ProtectedRoute>} />
          <Route path="/penjualan" element={<ProtectedRoute><Penjualan /></ProtectedRoute>} />
          <Route path="/setting" element={<ProtectedRoute><Setting /></ProtectedRoute>} />
          <Route path="/kas" element={<ProtectedRoute><Kas /></ProtectedRoute>} />
          <Route path="/master/akun" element={<ProtectedRoute><Akun /></ProtectedRoute>} />

          {/* Stok submenu */}
          <Route path="/stok" element={<ProtectedRoute><Navigate to="/stok/saldoawal" replace /></ProtectedRoute>} />
          <Route path="/stok/saldoawal" element={<ProtectedRoute><SaldoAwalStok /></ProtectedRoute>} />
          <Route path="/stok/penyesuaian" element={<ProtectedRoute><PenyesuaianStok /></ProtectedRoute>} />

          {/* Laporan submenu */}
          <Route path="/laporan" element={<ProtectedRoute><Navigate to="/laporan/penjualan" replace /></ProtectedRoute>} />
          <Route path="/laporan/penjualan" element={<ProtectedRoute><LaporanPenjualan /></ProtectedRoute>} />
          <Route path="/laporan/pembelian" element={<ProtectedRoute><LaporanPembelian /></ProtectedRoute>} />
          <Route path="/laporan/master/barang" element={<ProtectedRoute><LaporanMasterBarang /></ProtectedRoute>} />
          <Route path="/laporan/stok/sekarang" element={<ProtectedRoute><LaporanStokSekarang /></ProtectedRoute>} />
          <Route path="/laporan/stok/kartustok" element={<ProtectedRoute><LaporanStokKartuStok /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfirmProvider>
  );
}
