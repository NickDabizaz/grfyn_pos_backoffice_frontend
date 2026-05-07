import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, AlertTriangle, X, Loader2 } from 'lucide-react';
import useTabStore from '../../store/tabStore';

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function HitungHPPForm({ onSuccess, tabId }) {
  const closeTab = useTabStore((s) => s.closeTab);
  const [step, setStep] = useState(1);
  const [periodbulan, setPeriodbulan] = useState('');
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [bulan, setBulan] = useState('');
  const [validation, setValidation] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [catatan, setCatatan] = useState('');

  useEffect(() => {
    async function fetchLatest() {
      try {
        const { data } = await api.get('/hitunghpp', { params: { status: 'AKTIF' } });
        if (data.length > 0) {
          const latest = data[0].periodbulan;
          const [y, m] = latest.split('-');
          const nextM = parseInt(m) + 1;
          if (nextM > 12) {
            setTahun(String(parseInt(y) + 1));
            setBulan('01');
          } else {
            setTahun(y);
            setBulan(String(nextM).padStart(2, '0'));
          }
        } else {
          const now = new Date();
          setTahun(String(now.getFullYear()));
          setBulan(String(now.getMonth() + 1).padStart(2, '0'));
        }
      } catch (_) {}
    }
    fetchLatest();
  }, []);

  const handleCheck = async () => {
    if (!tahun || !bulan) return toast.error('Pilih periode');
    const pb = `${tahun}-${bulan}`;
    setPeriodbulan(pb);
    setLoading(true);
    try {
      const { data } = await api.get(`/hitunghpp/check/${pb}`);
      setValidation(data);
      setPreview(data.valid ? data : null);
      setStep(data.valid ? 3 : 2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal cek periode');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirm(`Posting HPP periode ${periodbulan}? Setelah posting, transaksi & pembelian periode ini sebaiknya tidak diubah.`)) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/hitunghpp', { periodbulan, catatan: catatan || undefined });
      toast.success(`HPP ${periodbulan} berhasil diposting`);
      if (onSuccess) onSuccess();
      closeTab(tabId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal posting HPP');
    } finally {
      setSubmitting(false);
    }
  };

  const formatRp = (n) => Number(n || 0).toLocaleString('id-ID');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 pt-4 pb-2 border-b border-primary-100 shrink-0">
        <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h2 className="text-lg font-bold text-dark-500">Hitung Periode Baru</h2>
          <p className="text-xs text-dark-300">Perhitungan Harga Pokok Penjualan</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-4xl">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-dark-500">Pilih Periode</h3>
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-xs text-dark-300 mb-1">Bulan</label>
                <select value={bulan} onChange={(e) => setBulan(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-dark-500">
                  <option value="">-- Pilih --</option>
                  {BULAN.map((b, idx) => <option key={idx} value={String(idx + 1).padStart(2, '0')}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-dark-300 mb-1">Tahun</label>
                <select value={tahun} onChange={(e) => setTahun(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-dark-500">
                  {Array.from({length: 5}, (_, i) => String(new Date().getFullYear() - i)).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button onClick={handleCheck} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Cek & Preview
              </button>
            </div>
          </div>
        )}

        {step === 2 && validation && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${validation.reason === 'ACCOUNT_MISSING' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
              <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${validation.reason === 'ACCOUNT_MISSING' ? 'text-yellow-600' : 'text-red-600'}`} />
              <div>
                <p className="font-semibold text-dark-500">{validation.message}</p>
                {validation.reason === 'PREVIOUS_NOT_POSTED' && (
                  <p className="text-sm mt-2">Selesaikan periode {validation.missing} dulu sebelum melanjutkan.</p>
                )}
                {validation.reason === 'ALREADY_POSTED' && validation.existing && (
                  <p className="text-sm mt-2">Kode: {validation.existing.kodehitunghpp}</p>
                )}
                {validation.reason === 'ACCOUNT_MISSING' && (
                  <p className="text-sm mt-2">Buat akun <strong>HPP</strong> dan <strong>PERSEDIAAN</strong> di Master &gt; Akun.</p>
                )}
              </div>
            </div>
            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400">
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
          </div>
        )}

        {step === 3 && preview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-dark-500">Preview HPP</h3>
                <p className="text-sm text-dark-300">Periode: {preview.periodbulan} | {preview.tglawal} s/d {preview.tglakhir}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400">Batal</button>
                <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Posting HPP
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-warm-50 rounded-xl p-4 text-center">
                <p className="text-xs text-dark-300">Total Pembelian</p>
                <p className="text-lg font-bold text-dark-500">Rp {formatRp(preview.total_pembelian)}</p>
              </div>
              <div className="bg-warm-50 rounded-xl p-4 text-center">
                <p className="text-xs text-dark-300">Total HPP Jual</p>
                <p className="text-lg font-bold text-primary-600">Rp {formatRp(preview.total_hpp_jual)}</p>
              </div>
              <div className="bg-warm-50 rounded-xl p-4 text-center">
                <p className="text-xs text-dark-300">Total Saldo Akhir</p>
                <p className="text-lg font-bold text-dark-500">Rp {formatRp(preview.total_saldo_akhir)}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs text-dark-300 mb-1">Catatan (optional)</label>
              <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-dark-500" placeholder="Catatan untuk periode ini..." />
            </div>

            <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
              <div className="overflow-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-warm-50/50">
                    <tr className="border-b border-primary-50">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-dark-300">Kode</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-dark-300">Nama Barang</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">Saldo Awal Qty</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">Saldo Awal Nilai</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">Beli Qty</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">Beli Nilai</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">HPP/Unit</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">Jual Qty</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">HPP Jual</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">Adj Qty</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">Saldo Akhir Qty</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-dark-300">Saldo Akhir Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.items.map((item, i) => (
                      <tr key={i} className={`border-b border-primary-50/50 hover:bg-warm-50/30 ${Number(item.saldoakhir_qty) < 0 ? 'bg-yellow-50' : ''}`}>
                        <td className="px-3 py-2 font-mono text-xs text-dark-300">{item.kodebarang}</td>
                        <td className="px-3 py-2 text-dark-500 font-medium">{item.namabarang}</td>
                        <td className="px-3 py-2 text-right text-dark-400">{formatRp(item.saldoawal_qty)}</td>
                        <td className="px-3 py-2 text-right text-dark-400">Rp {formatRp(item.saldoawal_nilai)}</td>
                        <td className="px-3 py-2 text-right text-dark-400">{formatRp(item.pembelian_qty)}</td>
                        <td className="px-3 py-2 text-right text-dark-400">Rp {formatRp(item.pembelian_nilai)}</td>
                        <td className="px-3 py-2 text-right text-dark-500 font-mono">{Number(item.hpp_per_unit).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-dark-400">{formatRp(item.qty_jual)}</td>
                        <td className="px-3 py-2 text-right text-dark-500 font-semibold">Rp {formatRp(item.hpp_jual)}</td>
                        <td className="px-3 py-2 text-right text-dark-400">{formatRp(item.qty_adjust)}</td>
                        <td className="px-3 py-2 text-right text-dark-400 font-mono">{Number(item.saldoakhir_qty).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-dark-400">Rp {formatRp(item.saldoakhir_nilai)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
