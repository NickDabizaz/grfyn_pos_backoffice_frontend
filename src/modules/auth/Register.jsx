import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Store, ArrowRight, ArrowLeft, Check, Eye, EyeOff } from 'lucide-react';

const steps = ['Perusahaan', 'Lokasi', 'Owner'];

function normalizeUpper(value) {
  return String(value || '').toUpperCase();
}

export default function Register() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const loginAction = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    tenant: { namatenant: '', alamat: '', hp: '', email: '', npwp: '', ppn: 11 },
    lokasi: { kodelokasi: '01', namalokasi: '', alamat: '', hp: '' },
    user  : { username: '', pass: '', namauser: '', email: '', hp: '' },
  });

  const update = (section, field, value) => {
    setForm(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const updateUpper = (section, field, value) => {
    update(section, field, normalizeUpper(value));
  };

  const canNext = () => {
    if (step === 0) return form.tenant.namatenant.trim();
    if (step === 1) return form.lokasi.namalokasi.trim() && form.lokasi.kodelokasi.trim();
    if (step === 2) return form.user.username.trim() && form.user.pass.trim() && form.user.namauser.trim();
    return false;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      loginAction(data.token, data.user, data.lokasi);
      toast.success('Pendaftaran berhasil!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Pendaftaran gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-100/50 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent-100/50 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg animate-in">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500 mb-3 shadow-lg shadow-primary-500/20">
              <Store className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-dark-500">Daftar Perusahaan</h1>
            <p className="text-sm text-dark-300 mt-1">Buat akun perusahaan baru</p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step ? 'bg-primary-500 text-white' :
                  i === step ? 'bg-primary-100 text-primary-600 ring-2 ring-primary-500' :
                  'bg-warm-100 text-dark-300'
                }`}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${i <= step ? 'text-dark-500' : 'text-dark-200'}`}>{s}</span>
                {i < 2 && <div className={`w-8 h-0.5 rounded ${i < step ? 'bg-primary-300' : 'bg-warm-200'}`} />}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-dark-300 -mt-5 mb-6 text-center">
            <span className="font-semibold text-primary-600">*</span> wajib diisi
          </p>

          {step === 0 && (
            <div className="space-y-4 mt-4 ms-4">
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Nama Perusahaan *</label>
                <input value={form.tenant.namatenant} onChange={e => updateUpper('tenant', 'namatenant', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-dark-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                  placeholder="PT. Nama Perusahaan" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Alamat</label>
                <textarea value={form.tenant.alamat} onChange={e => updateUpper('tenant', 'alamat', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-dark-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                  rows={2} placeholder="Alamat lengkap" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dark-400 mb-1">No. HP</label>
                  <input value={form.tenant.hp} onChange={e => update('tenant', 'hp', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-dark-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                    placeholder="08xxx" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-400 mb-1">Email</label>
                  <input value={form.tenant.email} onChange={e => update('tenant', 'email', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-dark-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                    placeholder="email@perusahaan.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dark-400 mb-1">NPWP</label>
                  <input value={form.tenant.npwp} onChange={e => updateUpper('tenant', 'npwp', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-dark-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                    placeholder="xx.xxx.xxx.x-xxx.xxx" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-400 mb-1">PPN (%)</label>
                  <input type="number" value={form.tenant.ppn} onChange={e => update('tenant', 'ppn', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-dark-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300" />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 mt-4 ms-4">
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Kode Lokasi *</label>
                <input value={form.lokasi.kodelokasi} onChange={e => updateUpper('lokasi', 'kodelokasi', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-dark-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                  placeholder="01" />
                <p className="text-[10px] text-dark-200 mt-1">Kode unik per perusahaan (contoh: 01, 02)</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Nama Lokasi *</label>
                <input value={form.lokasi.namalokasi} onChange={e => updateUpper('lokasi', 'namalokasi', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-dark-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                  placeholder="Toko Pusat" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Alamat</label>
                <textarea value={form.lokasi.alamat} onChange={e => updateUpper('lokasi', 'alamat', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-dark-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                  rows={2} placeholder="Alamat lokasi" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">No. HP</label>
                <input value={form.lokasi.hp} onChange={e => update('lokasi', 'hp', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-dark-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                  placeholder="08xxx" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 mt-4 ms-4">
              <div className="bg-warm-50 rounded-xl p-3 text-xs text-dark-300 mb-2">
                Anda akan menjadi <strong className="text-dark-500">Owner</strong> perusahaan ini dengan akses penuh ke semua menu dan lokasi.
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Username *</label>
                <input value={form.user.username} onChange={e => update('user', 'username', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-dark-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                  placeholder="OWNER" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dark-400 mb-1">Password *</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={form.user.pass} onChange={e => update('user', 'pass', e.target.value)}
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-primary-100 bg-warm-50 text-dark-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                      placeholder="Min. 6 karakter" />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300 hover:text-dark-500"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-400 mb-1">Nama Lengkap *</label>
                  <input value={form.user.namauser} onChange={e => update('user', 'namauser', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-dark-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                    placeholder="Nama owner" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dark-400 mb-1">Email</label>
                  <input value={form.user.email} onChange={e => update('user', 'email', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-dark-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                    placeholder="owner@email.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-400 mb-1">No. HP</label>
                  <input value={form.user.hp} onChange={e => update('user', 'hp', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-primary-100 bg-warm-50 text-dark-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                    placeholder="08xxx" />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-primary-100 text-dark-400 text-sm font-medium hover:bg-warm-50">
                <ArrowLeft className="w-4 h-4" /> Sebelumnya
              </button>
            )}
            {step < 2 && (
              <button onClick={() => setStep(step + 1)} disabled={!canNext()}
                className="ml-auto flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-40 transition-all">
                Selanjutnya <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {step === 2 && (
              <button onClick={handleSubmit} disabled={loading || !canNext()}
                className="ml-auto flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-40 transition-all">
                {loading ? 'Mendaftarkan...' : 'Daftar & Masuk'}
              </button>
            )}
          </div>

          <p className="text-center text-xs text-dark-300 mt-6">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
