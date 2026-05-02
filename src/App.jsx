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
import Stok from './pages/Stok';
import Laporan from './pages/Laporan';
import Setting from './pages/Setting';
import Resep from './pages/Resep';
import Kas from './pages/Kas';
import Akun from './pages/Akun';
import { useAuthStore } from './store/authStore';

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
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
        <Route path="/stok" element={<ProtectedRoute><Stok /></ProtectedRoute>} />
        <Route path="/laporan" element={<ProtectedRoute><Laporan /></ProtectedRoute>} />
        <Route path="/setting" element={<ProtectedRoute><Setting /></ProtectedRoute>} />
        <Route path="/resep" element={<ProtectedRoute><Resep /></ProtectedRoute>} />
        <Route path="/kas" element={<ProtectedRoute><Kas /></ProtectedRoute>} />
        <Route path="/master/akun" element={<ProtectedRoute><Akun /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
