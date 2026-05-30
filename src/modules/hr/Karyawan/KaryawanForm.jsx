import { useEffect, useState } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import useTabStore from '../../../store/tabStore';

export default function KaryawanForm({ existingData, onSuccess, tabId }) {
  const closeTab = useTabStore(s => s.closeTab);
  const isEdit = Boolean(existingData);
  const [lokasiList, setLokasiList] = useState([]);
  const [form, setForm] = useState({
    kodekaryawan: existingData?.kodekaryawan || '',
    namakaryawan: existingData?.namakaryawan || '',
    email: existingData?.email || '',
    hp: existingData?.hp || existingData?.nohp || '',
    gaji: existingData?.gaji || 0,
    idlokasi: existingData?.idlokasi || '',
    status: existingData?.status || 'AKTIF',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/lokasi').then(r => setLokasiList(r.data || [])).catch(() => {});
  }, []);

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.namakaryawan) return toast.error('Nama karyawan wajib diisi');
    if (!form.idlokasi) return toast.error('Lokasi wajib dipilih');
    setLoading(true);
    try {
      const payload = {
        namakaryawan: form.namakaryawan,
        email: form.email || null,
        hp: form.hp || null,
        gaji: Number(form.gaji || 0),
        idlokasi: Number(form.idlokasi),
        status: form.status,
      };
      if (isEdit) {
        await api.put(`/karyawan/${existingData.idkaryawan}`, payload);
        toast.success('Karyawan berhasil diupdate');
      } else {
        await api.post('/karyawan', payload);
        toast.success('Karyawan berhasil ditambah');
      }
      onSuccess?.();
      closeTab(tabId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500';
  const labelClass = 'block text-xs font-medium text-dark-300 mb-1';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 pt-4 pb-2 border-b border-primary-100 shrink-0">
        <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h2 className="text-lg font-bold text-dark-500">{isEdit ? 'Edit Karyawan' : 'Karyawan Baru'}</h2>
          <p className="text-xs text-dark-300">{isEdit ? form.kodekaryawan : 'Kode dibuat otomatis saat simpan'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Kode Karyawan</label>
            <input value={form.kodekaryawan || 'AUTO'} disabled className={`${inputClass} bg-gray-50 text-dark-300`} />
          </div>
          <div>
            <label className={labelClass}>Lokasi *</label>
            <select value={form.idlokasi} onChange={e => setField('idlokasi', e.target.value)} className={inputClass}>
              <option value="">-- Pilih Lokasi --</option>
              {lokasiList.map(l => <option key={l.idlokasi} value={l.idlokasi}>{l.kodelokasi} - {l.namalokasi}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Nama Karyawan *</label>
            <input value={form.namakaryawan} onChange={e => setField('namakaryawan', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={form.email || ''} onChange={e => setField('email', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>No. HP</label>
            <input value={form.hp || ''} onChange={e => setField('hp', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Gaji</label>
            <input type="number" min="0" value={form.gaji} onChange={e => setField('gaji', e.target.value)} className={inputClass} />
          </div>
          {isEdit && (
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={e => setField('status', e.target.value)} className={inputClass}>
                <option value="AKTIF">AKTIF</option>
                <option value="NONAKTIF">NONAKTIF</option>
              </select>
            </div>
          )}
          <div className="col-span-2 flex gap-2 pt-4">
            <button type="button" onClick={() => closeTab(tabId)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400">Batal</button>
            <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
