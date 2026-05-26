import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Search, RefreshCw, Star, Settings, Users, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/ui/Pagination';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';

const TAB = { SETTING: 'setting', CUSTOMER: 'customer' };

function SettingPane({ access }) {
  const canUbah = canAccess(access, 'ubah');
  const [form, setForm] = useState({ nominal_per_poin: '', nilai_tukar_poin: '', min_poin_tukar: '', max_poin_per_transaksi: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/poin/setting');
      setForm({
        nominal_per_poin: data.nominal_per_poin ?? '',
        nilai_tukar_poin: data.nilai_tukar_poin ?? '',
        min_poin_tukar: data.min_poin_tukar ?? '',
        max_poin_per_transaksi: data.max_poin_per_transaksi ?? '',
      });
    } catch { toast.error('Gagal memuat setting poin'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/poin/setting', {
        nominal_per_poin: Number(form.nominal_per_poin),
        nilai_tukar_poin: Number(form.nilai_tukar_poin),
        min_poin_tukar: form.min_poin_tukar !== '' ? Number(form.min_poin_tukar) : null,
        max_poin_per_transaksi: form.max_poin_per_transaksi !== '' ? Number(form.max_poin_per_transaksi) : null,
      });
      toast.success('Setting poin disimpan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally { setSaving(false); }
  };

  const inp = 'w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20';
  const lbl = 'block text-xs font-semibold text-dark-400 mb-1';

  if (loading) return <div className="p-6 text-sm text-dark-300">Memuat...</div>;

  return (
    <form onSubmit={handleSave} className="p-6 max-w-lg space-y-4">
      <div className="p-4 rounded-xl bg-warm-50 border border-primary-50 space-y-1">
        <p className="text-xs font-semibold text-dark-400">Cara Kerja Poin</p>
        <p className="text-xs text-dark-300">Setiap belanja kelipatan <strong>nominal_per_poin</strong> Rupiah → customer dapat 1 poin.</p>
        <p className="text-xs text-dark-300">1 poin dapat ditukar dengan diskon sebesar <strong>nilai_tukar_poin</strong> Rupiah.</p>
      </div>

      <div>
        <label className={lbl}>Nominal Per Poin (Rp)</label>
        <input type="number" min="1" value={form.nominal_per_poin} onChange={(e) => setForm({ ...form, nominal_per_poin: e.target.value })} className={inp} required placeholder="Contoh: 10000" />
        <p className="text-[10px] text-dark-300 mt-1">Setiap belanja Rp {Number(form.nominal_per_poin || 0).toLocaleString('id-ID')} customer mendapat 1 poin</p>
      </div>
      <div>
        <label className={lbl}>Nilai Tukar Poin (Rp)</label>
        <input type="number" min="1" value={form.nilai_tukar_poin} onChange={(e) => setForm({ ...form, nilai_tukar_poin: e.target.value })} className={inp} required placeholder="Contoh: 1000" />
        <p className="text-[10px] text-dark-300 mt-1">1 poin = Rp {Number(form.nilai_tukar_poin || 0).toLocaleString('id-ID')} diskon</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Min Poin Tukar</label>
          <input type="number" min="0" value={form.min_poin_tukar} onChange={(e) => setForm({ ...form, min_poin_tukar: e.target.value })} className={inp} placeholder="Tidak ada min" />
        </div>
        <div>
          <label className={lbl}>Maks Poin Per Transaksi</label>
          <input type="number" min="0" value={form.max_poin_per_transaksi} onChange={(e) => setForm({ ...form, max_poin_per_transaksi: e.target.value })} className={inp} placeholder="Tidak terbatas" />
        </div>
      </div>

      {canUbah && (
        <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50">
          {saving ? 'Menyimpan...' : 'Simpan Setting'}
        </button>
      )}
    </form>
  );
}

function CustomerPane() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ idcustomer: null, poin: '', jenis: 'MASUK', keterangan: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/poin/customer', { params: search ? { search } : {} });
      setList(Array.isArray(data) ? data : []);
    } catch { toast.error('Gagal memuat data poin customer'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const loadDetail = async (idcustomer) => {
    try {
      const { data } = await api.get(`/poin/customer/${idcustomer}`);
      setDetail(data);
    } catch { toast.error('Gagal memuat detail poin'); }
  };

  const handleManualSave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/poin/tambah', {
        idcustomer: manualForm.idcustomer,
        poin: Number(manualForm.poin),
        jenis: manualForm.jenis,
        keterangan: manualForm.keterangan,
      });
      toast.success('Poin berhasil ditambahkan');
      setShowManual(false);
      load();
      if (detail?.idcustomer === manualForm.idcustomer) loadDetail(manualForm.idcustomer);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    }
  };

  const { page, setPage, totalPages, paginatedItems, resetPage } = usePagination(list, 20);
  useEffect(() => { resetPage(); }, [search]);

  return (
    <div className="flex gap-4 p-6 h-full">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari customer..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-primary-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <button onClick={load} disabled={loading} className="p-2 rounded-xl border border-primary-100 hover:bg-warm-50 text-dark-400">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden flex-1">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-primary-50 bg-warm-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Customer</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Saldo Poin</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300 w-24">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-dark-300">Tidak ada data</td></tr>
              )}
              {paginatedItems.map((c) => (
                <tr key={c.idcustomer} onClick={() => loadDetail(c.idcustomer)}
                  className={`border-b border-primary-50/50 text-sm cursor-pointer transition-colors ${detail?.idcustomer === c.idcustomer ? 'bg-primary-50' : 'hover:bg-warm-50/30'}`}>
                  <td className="px-4 py-3 font-medium text-dark-500">{c.namacustomer}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                      <Star className="w-3.5 h-3.5" />{Number(c.saldo_poin || 0).toLocaleString('id-ID')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setManualForm({ idcustomer: c.idcustomer, poin: '', jenis: 'MASUK', keterangan: '' }); setShowManual(true); }}
                      className="text-xs px-2 py-1 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 font-semibold">
                      Tambah/Kurang
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
      </div>

      {detail && (
        <div className="w-80 shrink-0 bg-white rounded-2xl border border-primary-50 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-dark-500">{detail.namacustomer || 'Customer'}</h3>
            <button onClick={() => setDetail(null)} className="text-dark-300 hover:text-dark-500 text-xs">×</button>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 mb-3">
            <Star className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-[10px] text-dark-300">Saldo Poin</p>
              <p className="text-xl font-bold text-amber-600">{Number(detail.saldo_poin || 0).toLocaleString('id-ID')}</p>
            </div>
          </div>
          <p className="text-xs font-semibold text-dark-400 mb-2">Histori Poin</p>
          <div className="space-y-1.5">
            {(detail.histori || []).map((h, i) => (
              <div key={i} className="flex items-start justify-between p-2 rounded-lg bg-warm-50 border border-primary-50">
                <div>
                  <p className="text-xs font-medium text-dark-500">{h.keterangan || '-'}</p>
                  <p className="text-[10px] text-dark-300">{new Date(h.created_at || h.tgl).toLocaleDateString('id-ID')}</p>
                </div>
                <span className={`text-xs font-bold ${h.jenis === 'MASUK' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {h.jenis === 'MASUK' ? '+' : '-'}{h.poin}
                </span>
              </div>
            ))}
            {(!detail.histori || detail.histori.length === 0) && (
              <p className="text-xs text-dark-300 text-center py-3">Belum ada histori</p>
            )}
          </div>
        </div>
      )}

      {showManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowManual(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-dark-500 mb-4">Tambah / Kurangi Poin Manual</h3>
            <form onSubmit={handleManualSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Jenis</label>
                <div className="flex gap-2">
                  {['MASUK', 'KELUAR'].map((j) => (
                    <button key={j} type="button" onClick={() => setManualForm({ ...manualForm, jenis: j })}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${manualForm.jenis === j ? 'bg-primary-500 text-white' : 'border border-primary-100 text-dark-400 hover:bg-warm-50'}`}>
                      {j === 'MASUK' ? <><Plus className="w-3.5 h-3.5 inline mr-1" />Tambah</> : <><Minus className="w-3.5 h-3.5 inline mr-1" />Kurangi</>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Jumlah Poin</label>
                <input type="number" min="1" value={manualForm.poin} onChange={(e) => setManualForm({ ...manualForm, poin: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1">Keterangan</label>
                <input value={manualForm.keterangan} onChange={(e) => setManualForm({ ...manualForm, keterangan: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowManual(false)} className="flex-1 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">Batal</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Poin() {
  const [activeTab, setActiveTab] = useState(TAB.SETTING);
  const { access } = useMenuAccess('master.poin');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Loyalty Points (Poin Member)</h2>
          <p className="text-sm text-dark-300">Setting poin dan kelola saldo poin customer</p>
        </div>
      </div>

      <div className="px-6 shrink-0">
        <div className="flex gap-1 border-b border-primary-50">
          {[
            { key: TAB.SETTING, label: 'Konfigurasi Poin', Icon: Settings },
            { key: TAB.CUSTOMER, label: 'Saldo Customer', Icon: Users },
          ].map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${activeTab === key ? 'border-primary-500 text-primary-600' : 'border-transparent text-dark-400 hover:text-dark-500'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === TAB.SETTING && <SettingPane access={access} />}
        {activeTab === TAB.CUSTOMER && <CustomerPane />}
      </div>
    </div>
  );
}
