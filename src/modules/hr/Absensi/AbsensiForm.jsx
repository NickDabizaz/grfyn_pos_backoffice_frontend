import { useEffect, useMemo, useState } from 'react';
import api from '../../../api/axios';
import { today } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Loader2, CheckCircle, Search } from 'lucide-react';
import useTabStore from '../../../store/tabStore';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';

export default function AbsensiForm({ absensiId, onSuccess, tabId }) {
  const closeTab = useTabStore(s => s.closeTab);
  const isEdit = Boolean(absensiId);
  const [lokasiList, setLokasiList] = useState([]);
  const [jenisList, setJenisList] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ tgltrans: today(), idlokasi: '', kodeabsen: '', status: 'DRAFT', catatan: '', items: [] });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([api.get('/lokasi'), api.get('/setting-absensi')])
      .then(([lokasiRes, jenisRes]) => {
        if (!alive) return;
        setLokasiList(lokasiRes.data || []);
        setJenisList((jenisRes.data || []).filter(j => j.status === 'AKTIF'));
        if (!isEdit && lokasiRes.data?.[0]) {
          setForm(prev => ({ ...prev, idlokasi: lokasiRes.data[0].idlokasi }));
        }
      })
      .finally(() => alive && setInitializing(false));
    return () => { alive = false; };
  }, [isEdit]);

  useEffect(() => {
    if (!absensiId) return;
    setInitializing(true);
    api.get(`/absensi/${absensiId}`)
      .then(r => {
        const data = r.data;
        setForm({
          tgltrans: data.tgltrans || today(),
          idlokasi: data.idlokasi || '',
          kodeabsen: data.kodeabsen || '',
          status: data.status || 'DRAFT',
          catatan: data.catatan || '',
          items: (data.details || []).map(d => ({ idkaryawan: d.idkaryawan, kodekaryawan: d.kodekaryawan, namakaryawan: d.namakaryawan, jenis: d.jenis || 'HADIR', catatan: d.catatan || '' })),
        });
      })
      .catch(err => toast.error(err.response?.data?.message || 'Gagal memuat absensi'))
      .finally(() => setInitializing(false));
  }, [absensiId]);

  useEffect(() => {
    if (isEdit || !form.idlokasi) return;
    api.get('/karyawan', { params: { status: 'AKTIF', idlokasi: form.idlokasi } })
      .then(r => {
        setForm(prev => ({
          ...prev,
          items: (r.data || []).map(k => ({ idkaryawan: k.idkaryawan, kodekaryawan: k.kodekaryawan, namakaryawan: k.namakaryawan, jenis: 'HADIR', catatan: '' })),
        }));
      })
      .catch(() => {});
  }, [form.idlokasi, isEdit]);

  const filteredItems = useMemo(() => {
    const s = search.toLowerCase();
    if (!s) return form.items;
    return form.items.filter(i => `${i.kodekaryawan} ${i.namakaryawan}`.toLowerCase().includes(s));
  }, [form.items, search]);

  const updateItem = (idkaryawan, patch) => {
    setForm(prev => ({ ...prev, items: prev.items.map(i => i.idkaryawan === idkaryawan ? { ...i, ...patch } : i) }));
  };

  const submit = async (approve = false) => {
    if (!form.idlokasi) return toast.error('Lokasi wajib dipilih');
    if (!form.items.length) return toast.error('Tidak ada karyawan untuk lokasi ini');
    setLoading(true);
    const payload = { ...form, idlokasi: Number(form.idlokasi), approve };
    try {
      if (isEdit) await api.put(`/absensi/${absensiId}`, payload);
      else await api.post('/absensi', payload);
      toast.success(approve ? 'Absensi disimpan dan diapprove' : 'Absensi disimpan');
      onSuccess?.();
      closeTab(tabId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan absensi');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500';
  const readOnly = form.status !== 'DRAFT';

  if (initializing) return <div className="p-8 text-sm text-dark-300">Memuat...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-primary-100 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h2 className="text-lg font-bold text-dark-500">{isEdit ? `Absensi ${form.kodeabsen}` : 'Absensi Baru'}</h2>
            <p className="text-xs text-dark-300">Status {form.status}</p>
          </div>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <button onClick={() => submit(false)} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400"><Save className="w-4 h-4" /> Simpan</button>
            <button onClick={() => submit(true)} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Simpan dan Approve
            </button>
          </div>
        )}
      </div>

      <div className="p-6 space-y-4 overflow-auto">
        <div className="bg-white rounded-2xl border border-primary-50 p-4 grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1">Tanggal</label>
            <Flatpickr value={form.tgltrans} onChange={([d]) => setForm(prev => ({ ...prev, tgltrans: d.toISOString().slice(0, 10) }))} options={{ dateFormat: 'Y-m-d', locale: 'id' }} className={inputClass} disabled={readOnly} />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1">Lokasi</label>
            <select value={form.idlokasi} onChange={e => setForm(prev => ({ ...prev, idlokasi: e.target.value }))} className={inputClass} disabled={readOnly || isEdit}>
              <option value="">-- Pilih Lokasi --</option>
              {lokasiList.map(l => <option key={l.idlokasi} value={l.idlokasi}>{l.kodelokasi} - {l.namalokasi}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1">Cari Karyawan</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
              <input value={search} onChange={e => setSearch(e.target.value)} className={`${inputClass} pl-8`} placeholder="Cari nama/kode..." />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary-50 bg-warm-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Karyawan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Jenis</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 && <tr><td colSpan={3} className="px-4 py-12 text-center text-sm text-dark-300">Tidak ada karyawan</td></tr>}
              {filteredItems.map(item => (
                <tr key={item.idkaryawan} className="border-b border-primary-50/50 text-sm">
                  <td className="px-4 py-3"><span className="font-mono text-xs text-dark-300">{item.kodekaryawan}</span><div className="font-medium text-dark-500">{item.namakaryawan}</div></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {jenisList.map(j => (
                        <label key={j.kodejenis} className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${item.jenis === j.kodejenis ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white border-primary-100 text-dark-400'}`}>
                          <input type="radio" className="hidden" disabled={readOnly} checked={item.jenis === j.kodejenis} onChange={() => updateItem(item.idkaryawan, { jenis: j.kodejenis })} />
                          {j.namajenis}
                        </label>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input value={item.catatan || ''} disabled={readOnly} onChange={e => updateItem(item.idkaryawan, { catatan: e.target.value })} className="w-full px-2.5 py-2 rounded-lg border border-primary-100 text-xs disabled:bg-gray-50" placeholder="Opsional" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
