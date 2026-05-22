import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { CheckCircle2, CreditCard, DatabaseBackup, Headset, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { formatRupiah } from '../../lib/utils';

function limitText(value, suffix) {
  return value === null || value === undefined ? 'Unlimited' : `${value} ${suffix}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Subscription() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subscription/status');
      setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat subscription');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const plan = data?.plan;
  const pro = data?.pro_plan;
  const transactionLimit = plan?.benefits?.transaction_limit;
  const userLimit = plan?.benefits?.max_users;
  const transactionPercent = useMemo(() => {
    if (!transactionLimit) return 100;
    return Math.min(100, Math.round((Number(data?.usage?.transactions_this_month || 0) / transactionLimit) * 100));
  }, [data, transactionLimit]);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res = await api.post('/subscription/checkout');
      if (res.data?.redirect_url) {
        window.open(res.data.redirect_url, '_blank', 'noopener,noreferrer');
        toast.success('Halaman pembayaran Midtrans dibuka');
      } else {
        toast.error('Redirect URL Midtrans tidak ditemukan');
      }
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat pembayaran');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await api.get('/subscription/backup', { responseType: 'blob' });
      const disposition = res.headers['content-disposition'] || '';
      const match = disposition.match(/filename="([^"]+)"/i);
      downloadBlob(res.data, match?.[1] || 'grfyn-backup.json');
      toast.success('Backup berhasil dibuat');
    } catch (err) {
      const message = err.response?.data?.message || 'Backup hanya tersedia untuk PRO';
      toast.error(message);
    } finally {
      setBackupLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-sm text-dark-300">Memuat subscription...</div>;

  return (
    <div className="flex flex-col h-full bg-warm-50">
      <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Subscription</h2>
          <p className="text-sm text-dark-300">Kelola plan tenant, pembayaran, backup, dan akses support.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary-100 bg-white text-xs font-semibold text-dark-400 hover:bg-warm-50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="grid grid-cols-12 gap-4">
          <section className="col-span-12 xl:col-span-7 bg-white border border-primary-100 rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-dark-300">Plan Aktif</p>
                <div className="mt-1 flex items-center gap-2">
                  <h3 className="text-3xl font-black text-dark-500">{plan?.code || 'FREE'}</h3>
                  <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${plan?.is_pro ? 'bg-emerald-100 text-emerald-700' : 'bg-primary-100 text-dark-400'}`}>
                    {plan?.status || 'ACTIVE'}
                  </span>
                </div>
                {plan?.expires_at && (
                  <p className="mt-1 text-xs text-dark-300">
                    Berlaku sampai {new Date(plan.expires_at).toLocaleDateString('id-ID')}
                  </p>
                )}
              </div>
              <ShieldCheck className={`w-10 h-10 ${plan?.is_pro ? 'text-emerald-600' : 'text-dark-200'}`} />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-primary-100 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-dark-300">
                  <CreditCard className="w-4 h-4" /> Transaksi Bulan Ini
                </div>
                <p className="mt-2 text-2xl font-black text-dark-500">
                  {data?.usage?.transactions_this_month || 0}
                  <span className="text-sm font-semibold text-dark-300"> / {limitText(transactionLimit, 'transaksi')}</span>
                </p>
                {transactionLimit && (
                  <div className="mt-3 h-2 rounded-full bg-primary-50 overflow-hidden">
                    <div className="h-full bg-accent-500" style={{ width: `${transactionPercent}%` }} />
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-primary-100 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-dark-300">
                  <Users className="w-4 h-4" /> User Aktif
                </div>
                <p className="mt-2 text-2xl font-black text-dark-500">
                  {data?.usage?.active_users || 0}
                  <span className="text-sm font-semibold text-dark-300"> / {limitText(userLimit, 'user')}</span>
                </p>
              </div>
            </div>
          </section>

          <section className="col-span-12 xl:col-span-5 bg-white border border-primary-100 rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-dark-300">Upgrade</p>
                <h3 className="mt-1 text-2xl font-black text-dark-500">PRO</h3>
                <p className="mt-1 text-sm font-bold text-accent-700">Rp {formatRupiah(pro?.price || 99000)} / bulan</p>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-bold disabled:opacity-60"
              >
                <CreditCard className="w-4 h-4" /> {checkoutLoading ? 'Memproses...' : 'Bayar Midtrans'}
              </button>
            </div>

            <div className="mt-5 space-y-2 text-sm text-dark-400">
              <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Transaksi unlimited per bulan</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Multi-user tanpa batas sistem</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Backup data tenant</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Support ke admin</p>
            </div>
          </section>

          <section className="col-span-12 xl:col-span-7 bg-white border border-primary-100 rounded-lg p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-dark-500">Backup Data</h3>
                <p className="mt-1 text-xs text-dark-300">Export data tenant ke file JSON. Tersedia untuk PRO.</p>
              </div>
              <button
                onClick={handleBackup}
                disabled={!plan?.benefits?.backup || backupLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-primary-100 text-sm font-bold text-dark-400 hover:bg-warm-50 disabled:opacity-50"
              >
                <DatabaseBackup className="w-4 h-4" /> {backupLoading ? 'Membuat...' : 'Backup'}
              </button>
            </div>
          </section>

          <section className="col-span-12 xl:col-span-5 bg-white border border-primary-100 rounded-lg p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-dark-500">Support Admin</h3>
                <p className="mt-1 text-xs text-dark-300">
                  {plan?.benefits?.support ? 'Kontak support tersedia untuk tenant PRO.' : 'Upgrade ke PRO untuk akses support admin.'}
                </p>
              </div>
              {plan?.benefits?.support && data?.support?.url ? (
                <a
                  href={data.support.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-dark-500 text-white text-sm font-bold hover:bg-dark-400"
                >
                  <Headset className="w-4 h-4" /> Hubungi
                </a>
              ) : (
                <Headset className="w-8 h-8 text-dark-200" />
              )}
            </div>
          </section>

          <section className="col-span-12 bg-white border border-primary-100 rounded-lg p-5">
            <h3 className="text-sm font-bold text-dark-500 mb-3">Riwayat Pembayaran</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-dark-300 border-b border-primary-100">
                    <th className="py-2 pr-3">Order ID</th>
                    <th className="py-2 pr-3">Plan</th>
                    <th className="py-2 pr-3">Nominal</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recent_payments || []).map((p) => (
                    <tr key={p.idpayment} className="border-b border-primary-50 text-dark-400">
                      <td className="py-2 pr-3 font-mono text-xs">{p.order_id}</td>
                      <td className="py-2 pr-3">{p.plan_code}</td>
                      <td className="py-2 pr-3">Rp {formatRupiah(p.amount)}</td>
                      <td className="py-2 pr-3">
                        <span className="px-2 py-1 rounded-md bg-primary-50 text-[11px] font-bold">{p.status}</span>
                      </td>
                      <td className="py-2 pr-3">{new Date(p.tglentry).toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                  {(!data?.recent_payments || data.recent_payments.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-dark-300">Belum ada pembayaran.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
