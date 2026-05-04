import { useState, useEffect } from 'react';
import api from '../api/axios';
import { formatRupiah, formatDate } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Calculator, Plus, RefreshCw, Trash2, X, ChevronLeft, Package, ArrowRight, Calendar } from 'lucide-react';

export default function Hpp() {
  const [list, setList] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [periode, setPeriode] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const user = useAuthStore((s) => s.user);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/hpp');
      setList(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setTimeout(() => setRefreshing(false), 300);
  };

  const handleCreate = async () => {
    try {
      const r = await api.post('/hpp', { periode_bulan: periode, iduser: user?.iduser });
      toast.success(r.data.message || 'Hitung HPP berhasil');
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat Hitung HPP');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus Hitung HPP ini?')) return;
    try {
      await api.delete(`/hpp/${id}`);
      toast.success('Hitung HPP dihapus');
      if (detail?.idhitunghpp === id) setDetail(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus');
    }
  };

  const openDetail = async (id) => {
    setLoading(true);
    try {
      const r = await api.get(`/hpp/${id}`);
      setDetail(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat detail');
    } finally {
      setLoading(false);
    }
  };

  if (detail) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setDetail(null)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-primary-100 text-dark-400 hover:bg-warm-50 text-sm font-medium transition-all">
            <ChevronLeft className="w-4 h-4" /> Kembali
          </button>
          <div>
            <h2 className="text-xl font-bold text-dark-500">Detail Hitung HPP</h2>
            <p className="text-sm text-dark-300">{detail.kodehitunghpp} · Periode {detail.periode_bulan}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-primary-50">
            <p className="text-xs text-dark-300 mb-1">Periode Dari</p>
            <p className="text-sm font-bold text-dark-500">{formatDate(detail.periode_dari)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-primary-50">
            <p className="text-xs text-dark-300 mb-1">Periode Sampai</p>
            <p className="text-sm font-bold text-dark-500">{formatDate(detail.periode_sampai)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-primary-50">
            <p className="text-xs text-dark-300 mb-1">Dibuat Oleh</p>
            <p className="text-sm font-bold text-dark-500">{detail.pembuat || '-'}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-primary-50 bg-warm-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300 sticky left-0 bg-warm-50/50">Barang</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Saldo Awal Qty</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Saldo Awal HPP</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Pembelian Qty</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Pembelian Total</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Produksi Qty</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Produksi Total</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Penyesuaian</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Penjualan Qty</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">HPP Penjualan</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Saldo Akhir Qty</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Saldo Akhir HPP</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">HPP/Unit</th>
                </tr>
              </thead>
              <tbody>
                {detail.details?.map((d) => (
                  <tr key={d.idhitunghppdtl} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                    <td className="px-4 py-3 sticky left-0 bg-white">
                      <p className="font-medium text-dark-500">{d.namabarang}</p>
                      <p className="text-[10px] text-dark-300 font-mono">{d.kodebarang}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-dark-400">{d.saldo_awal_qty}</td>
                    <td className="px-4 py-3 text-right text-dark-400">{formatRupiah(d.saldo_awal_hpp)}</td>
                    <td className="px-4 py-3 text-right text-dark-400">{d.pembelian_qty}</td>
                    <td className="px-4 py-3 text-right text-dark-400">{formatRupiah(d.pembelian_total)}</td>
                    <td className="px-4 py-3 text-right text-dark-400">{d.produksi_qty}</td>
                    <td className="px-4 py-3 text-right text-dark-400">{formatRupiah(d.produksi_total)}</td>
                    <td className="px-4 py-3 text-right text-dark-400">{d.penyesuaian_qty}</td>
                    <td className="px-4 py-3 text-right text-dark-400">{d.penjualan_qty}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-500">{formatRupiah(d.penjualan_hpp)}</td>
                    <td className="px-4 py-3 text-right font-bold text-dark-500">{d.saldo_akhir_qty}</td>
                    <td className="px-4 py-3 text-right font-bold text-dark-500">{formatRupiah(d.saldo_akhir_hpp)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatRupiah(d.hpp_per_unit)}</td>
                  </tr>
                ))}
                {(!detail.details || detail.details.length === 0) && (
                  <tr>
                    <td colSpan={13} className="px-4 py-8 text-center text-dark-300 text-sm">Tidak ada data detail</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-500">Hitung HPP</h2>
          <p className="text-sm text-dark-300">Perhitungan Harga Pokok Penjualan per bulan</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing}
            className={`p-2 rounded-xl border border-primary-100 text-dark-400 hover:bg-warm-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh halaman">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" /> Hitung HPP Baru
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
        <Calculator className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">Ketentuan Hitung HPP:</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li>Hitung HPP dilakukan per bulan (bulanan).</li>
            <li>1 bulan hanya boleh 1 kali Hitung HPP.</li>
            <li>Jika bulan sebelumnya ada transaksi tetapi belum Hitung HPP, maka bulan ini tidak bisa dihitung sebelum bulan sebelumnya diselesaikan.</li>
            <li>Periode hitung mengacu dari tanggal terakhir Hitung HPP sampai akhir bulan yang dipilih.</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary-50 bg-warm-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Periode</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Periode Dari</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Periode Sampai</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Dibuat</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Oleh</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((h) => (
              <tr key={h.idhitunghpp} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm cursor-pointer"
                onClick={() => openDetail(h.idhitunghpp)}>
                <td className="px-4 py-3 text-xs font-mono text-dark-300">{h.kodehitunghpp}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-lg bg-primary-50 text-primary-600 text-[10px] font-bold">{h.periode_bulan}</span>
                </td>
                <td className="px-4 py-3 text-dark-400">{formatDate(h.periode_dari)}</td>
                <td className="px-4 py-3 text-dark-400">{formatDate(h.periode_sampai)}</td>
                <td className="px-4 py-3 text-dark-400">{formatDate(h.tgltrans)}</td>
                <td className="px-4 py-3 text-dark-500">{h.pembuat || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(h.idhitunghpp); }}
                    className="p-1.5 rounded-lg text-dark-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Hapus">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-dark-300 text-sm">Belum ada Hitung HPP</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{animation: 'fadeIn 0.2s ease'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-dark-500 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary-500" /> Hitung HPP Baru
              </h3>
              <button onClick={() => setShowForm(false)} className="text-dark-300 hover:text-dark-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Periode Bulan</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
                  <input type="month" value={periode} onChange={(e) => setPeriode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                </div>
                <p className="text-[10px] text-dark-300 mt-1">Format: Tahun-Bulan (contoh: 2026-01)</p>
              </div>

              <div className="bg-warm-50 rounded-xl p-3 text-xs text-dark-400 space-y-1">
                <p className="font-semibold text-dark-500">Ringkasan Validasi:</p>
                <p>• Sistem akan mengecek apakah periode ini sudah pernah dihitung.</p>
                <p>• Sistem akan mengecek apakah periode sebelumnya sudah dihitung (jika ada transaksi).</p>
                <p>• Periode dari otomatis mengikuti tanggal terakhir Hitung HPP.</p>
              </div>

              <button onClick={handleCreate}
                className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2">
                <Calculator className="w-4 h-4" /> Proses Hitung HPP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
