import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import useTabStore from '../../store/tabStore';

const INIT = {
  namaaset: '',
  kategori: '',
  tglbeli: '',
  nilai_beli: '',
  umur_ekonomis: '',
  metode_penyusutan: 'GARIS_LURUS',
  nilai_sisa: '0',
  idakun_aset: '',
  idakun_penyusutan: '',
  idakun_akumulasi: '',
  status: 'AKTIF',
};

export default function AsetTetapForm({ mode, id, data, onSuccess, tabId }) {
  const [form, setForm] = useState(INIT);
  const [loading, setLoading] = useState(false);
  const [akunList, setAkunList] = useState([]);
  const closeTab = useTabStore((s) => s.closeTab);

  useEffect(() => {
    api.get('/akun').then((r) => setAkunList(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === 'edit' && data) {
      setForm({
        namaaset: data.namaaset || '',
        kategori: data.kategori || '',
        tglbeli: data.tglbeli ? data.tglbeli.split('T')[0] : '',
        nilai_beli: data.nilai_beli ?? '',
        umur_ekonomis: data.umur_ekonomis ?? '',
        metode_penyusutan: data.metode_penyusutan || 'GARIS_LURUS',
        nilai_sisa: data.nilai_sisa ?? '0',
        idakun_aset: data.idakun_aset ?? '',
        idakun_penyusutan: data.idakun_penyusutan ?? '',
        idakun_akumulasi: data.idakun_akumulasi ?? '',
        status: data.status || 'AKTIF',
      });
    } else {
      setForm({ ...INIT });
    }
  }, [mode, data]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        nilai_beli: Number(form.nilai_beli),
        umur_ekonomis: Number(form.umur_ekonomis),
        nilai_sisa: Number(form.nilai_sisa || 0),
        idakun_aset: form.idakun_aset || null,
        idakun_penyusutan: form.idakun_penyusutan || null,
        idakun_akumulasi: form.idakun_akumulasi || null,
      };
      if (mode === 'edit') {
        await api.put(`/aset/${id}`, payload);
        toast.success('Aset diupdate');
      } else {
        await api.post('/aset', payload);
        toast.success('Aset ditambah');
      }
      if (onSuccess) onSuccess();
      closeTab(tabId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20';
  const lbl = 'block text-xs font-semibold text-dark-400 mb-1';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 pt-4 pb-2 border-b border-primary-50 shrink-0">
        <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-warm-50 text-dark-400">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-dark-500">{mode === 'edit' ? 'Edit Aset Tetap' : 'Tambah Aset Tetap'}</h2>
          <p className="text-xs text-dark-300">{mode === 'edit' ? `Edit: ${data?.namaaset}` : 'Daftarkan aset tetap baru'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSave} className="max-w-2xl space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={lbl}>Nama Aset</label>
              <input value={form.namaaset} onChange={(e) => setForm({ ...form, namaaset: e.target.value })} className={inp} required />
            </div>
            <div>
              <label className={lbl}>Kategori</label>
              <input value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value.toUpperCase() })} className={inp} placeholder="PERALATAN, KENDARAAN, dll" />
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inp}>
                <option value="AKTIF">Aktif</option>
                <option value="HABIS">Habis</option>
                <option value="DIJUAL">Dijual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Tanggal Beli</label>
              <input type="date" value={form.tglbeli} onChange={(e) => setForm({ ...form, tglbeli: e.target.value })} className={inp} required />
            </div>
            <div>
              <label className={lbl}>Nilai Beli (Rp)</label>
              <input type="number" min="0" value={form.nilai_beli} onChange={(e) => setForm({ ...form, nilai_beli: e.target.value })} className={inp} required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={lbl}>Umur Ekonomis (bulan)</label>
              <input type="number" min="1" value={form.umur_ekonomis} onChange={(e) => setForm({ ...form, umur_ekonomis: e.target.value })} className={inp} required placeholder="Cth: 36" />
            </div>
            <div>
              <label className={lbl}>Metode Penyusutan</label>
              <select value={form.metode_penyusutan} onChange={(e) => setForm({ ...form, metode_penyusutan: e.target.value })} className={inp}>
                <option value="GARIS_LURUS">Garis Lurus</option>
                <option value="SALDO_MENURUN">Saldo Menurun</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Nilai Sisa (Rp)</label>
              <input type="number" min="0" value={form.nilai_sisa} onChange={(e) => setForm({ ...form, nilai_sisa: e.target.value })} className={inp} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={lbl}>Akun Aset <span className="font-normal text-dark-300">opsional</span></label>
              <select value={form.idakun_aset} onChange={(e) => setForm({ ...form, idakun_aset: e.target.value })} className={inp}>
                <option value="">-- Pilih Akun --</option>
                {akunList.map((a) => <option key={a.idakun} value={a.idakun}>{a.kodeakun} - {a.namaakun}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Akun Penyusutan <span className="font-normal text-dark-300">opsional</span></label>
              <select value={form.idakun_penyusutan} onChange={(e) => setForm({ ...form, idakun_penyusutan: e.target.value })} className={inp}>
                <option value="">-- Pilih Akun --</option>
                {akunList.map((a) => <option key={a.idakun} value={a.idakun}>{a.kodeakun} - {a.namaakun}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Akun Akumulasi <span className="font-normal text-dark-300">opsional</span></label>
              <select value={form.idakun_akumulasi} onChange={(e) => setForm({ ...form, idakun_akumulasi: e.target.value })} className={inp}>
                <option value="">-- Pilih Akun --</option>
                {akunList.map((a) => <option key={a.idakun} value={a.idakun}>{a.kodeakun} - {a.namaakun}</option>)}
              </select>
            </div>
          </div>

          {mode === 'edit' && data?.nilai_buku !== undefined && (
            <div className="p-3 rounded-xl bg-accent-50 border border-accent-100">
              <p className="text-xs font-semibold text-accent-700">Nilai Buku Saat Ini</p>
              <p className="text-lg font-bold text-accent-600">Rp {Number(data.nilai_buku || 0).toLocaleString('id-ID')}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => closeTab(tabId)} className="flex-1 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
