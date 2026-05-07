import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import useTabStore from '../store/tabStore';

export default function LokasiForm({ id, lokasi: existingLokasi, onSuccess, tabId }) {
  const closeTab = useTabStore((s) => s.closeTab);
  const isEdit = Boolean(id);

  const [kodelokasi, setKodelokasi] = useState(existingLokasi?.kodelokasi || '');
  const [namalokasi, setNamalokasi] = useState(existingLokasi?.namalokasi || '');
  const [alamat, setAlamat] = useState(existingLokasi?.alamat || '');
  const [hp, setHp] = useState(existingLokasi?.hp || '');
  const [isdefault, setIsdefault] = useState(existingLokasi?.isdefault || false);
  const [status, setStatus] = useState(existingLokasi?.status || 'AKTIF');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!kodelokasi || !namalokasi) return toast.error('Kode dan nama lokasi wajib diisi');
    setLoading(true);
    try {
      const payload = { kodelokasi: kodelokasi.toUpperCase(), namalokasi, alamat: alamat || null, hp: hp || null, isdefault };
      if (isEdit) payload.status = status;

      if (isEdit) {
        await api.put(`/lokasi/${id}`, payload);
        toast.success('Lokasi berhasil diupdate');
      } else {
        await api.post('/lokasi', payload);
        toast.success('Lokasi berhasil ditambah');
      }
      if (onSuccess) onSuccess();
      closeTab(tabId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  const labelClass = "block text-xs font-medium text-dark-300 mb-1";
  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 pt-4 pb-2 border-b border-primary-100 shrink-0">
        <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400"><ArrowLeft className="w-5 h-5" /></button>
        <div><h2 className="text-lg font-bold text-dark-500">{isEdit ? 'Edit Lokasi' : 'Lokasi Baru'}</h2><p className="text-xs text-dark-300">{isEdit ? `Edit ${existingLokasi?.namalokasi}` : 'Tambah lokasi baru'}</p></div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Kode Lokasi *</label>
              <input value={kodelokasi} onChange={(e) => setKodelokasi(e.target.value.toUpperCase())} className={inputClass} disabled={isEdit} placeholder="GRF01" />
            </div>
            <div>
              <label className={labelClass}>Nama Lokasi *</label>
              <input value={namalokasi} onChange={(e) => setNamalokasi(e.target.value)} className={inputClass} placeholder="Cabang Utama" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Alamat</label>
            <textarea value={alamat} onChange={(e) => setAlamat(e.target.value)} rows={2} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>HP</label>
              <input value={hp} onChange={(e) => setHp(e.target.value)} className={inputClass} />
            </div>
            {isEdit && (
              <div>
                <label className={labelClass}>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                  <option value="AKTIF">AKTIF</option>
                  <option value="NONAKTIF">NONAKTIF</option>
                </select>
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 py-1 cursor-pointer text-sm">
            <input type="checkbox" checked={isdefault} onChange={(e) => setIsdefault(e.target.checked)} className="rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
            <span className="text-dark-400">Jadikan lokasi default</span>
          </label>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => closeTab(tabId)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400">Batal</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {isEdit ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
