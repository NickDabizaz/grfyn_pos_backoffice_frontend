import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import useTabStore from '../../../store/tabStore';

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const INIT = { namaanggaran: '', periode: '', tglawal: '', tglakhir: '', items: [] };

export default function AnggaranForm({ mode, id, data, onSuccess, tabId }) {
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
        namaanggaran: data.namaanggaran || '',
        periode: data.periode || '',
        tglawal: data.tglawal ? data.tglawal.split('T')[0] : '',
        tglakhir: data.tglakhir ? data.tglakhir.split('T')[0] : '',
        items: [],
      });
      api.get(`/anggaran/${data.idanggaran}`).then((r) => {
        setForm((prev) => ({ ...prev, items: r.data.items || [] }));
      }).catch(() => {});
    } else {
      setForm({ ...INIT });
    }
  }, [mode, data]);

  const addAkunRow = () => {
    const idakun = akunList[0]?.idakun || '';
    const namaakun = akunList[0]?.namaakun || '';
    const newItems = Array.from({ length: 12 }, (_, i) => ({
      idakun,
      namaakun,
      bulan: i + 1,
      nilai_anggaran: '',
    }));
    setForm((prev) => ({ ...prev, items: [...prev.items, ...newItems] }));
  };

  const getAkunItems = (idakun) => form.items.filter((it) => String(it.idakun) === String(idakun));

  const uniqueAkuns = [...new Map(form.items.map((it) => [String(it.idakun), { idakun: it.idakun, namaakun: it.namaakun }])).values()];

  const updateItem = (idakun, bulan, field, val) => {
    setForm((prev) => {
      const items = prev.items.map((it) =>
        String(it.idakun) === String(idakun) && it.bulan === bulan ? { ...it, [field]: val } : it
      );
      return { ...prev, items };
    });
  };

  const changeAkun = (oldIdakun, newIdakun) => {
    const found = akunList.find((a) => String(a.idakun) === String(newIdakun));
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        String(it.idakun) === String(oldIdakun)
          ? { ...it, idakun: newIdakun, namaakun: found?.namaakun || '' }
          : it
      ),
    }));
  };

  const removeAkun = (idakun) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((it) => String(it.idakun) !== String(idakun)) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        namaanggaran: form.namaanggaran,
        periode: form.periode,
        tglawal: form.tglawal,
        tglakhir: form.tglakhir,
        items: form.items.filter((it) => it.nilai_anggaran !== '' && it.nilai_anggaran !== null).map((it) => ({
          idakun: it.idakun,
          bulan: it.bulan,
          nilai_anggaran: Number(it.nilai_anggaran || 0),
        })),
      };
      if (mode === 'edit') {
        await api.put(`/anggaran/${id}`, payload);
        toast.success('Anggaran diupdate');
      } else {
        await api.post('/anggaran', payload);
        toast.success('Anggaran dibuat');
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
          <h2 className="text-lg font-bold text-dark-500">{mode === 'edit' ? 'Edit Anggaran' : 'Buat Anggaran'}</h2>
          <p className="text-xs text-dark-300">Input anggaran per akun per bulan</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <div className="col-span-2">
              <label className={lbl}>Nama Anggaran</label>
              <input value={form.namaanggaran} onChange={(e) => setForm({ ...form, namaanggaran: e.target.value })} className={inp} required />
            </div>
            <div>
              <label className={lbl}>Periode (Tahun)</label>
              <input value={form.periode} onChange={(e) => setForm({ ...form, periode: e.target.value })} className={inp} placeholder="2025" required />
            </div>
            <div></div>
            <div>
              <label className={lbl}>Tanggal Mulai</label>
              <input type="date" value={form.tglawal} onChange={(e) => setForm({ ...form, tglawal: e.target.value })} className={inp} required />
            </div>
            <div>
              <label className={lbl}>Tanggal Akhir</label>
              <input type="date" value={form.tglakhir} onChange={(e) => setForm({ ...form, tglakhir: e.target.value })} className={inp} required />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-dark-500">Item Anggaran per Akun</label>
              <button type="button" onClick={addAkunRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 text-xs font-semibold hover:bg-primary-100">
                <Plus className="w-3.5 h-3.5" /> Tambah Akun
              </button>
            </div>

            {uniqueAkuns.length === 0 && (
              <p className="text-xs text-dark-300 text-center py-6 bg-warm-50 rounded-xl border border-primary-50">
                Belum ada item. Klik &quot;Tambah Akun&quot; untuk menambahkan baris anggaran.
              </p>
            )}

            <div className="space-y-4">
              {uniqueAkuns.map(({ idakun }) => {
                const akunItems = form.items.filter((it) => String(it.idakun) === String(idakun));
                const total = akunItems.reduce((s, it) => s + Number(it.nilai_anggaran || 0), 0);
                return (
                  <div key={idakun} className="rounded-xl border border-primary-50 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-warm-50/50 border-b border-primary-50">
                      <select value={idakun} onChange={(e) => changeAkun(idakun, e.target.value)}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20">
                        {akunList.map((a) => <option key={a.idakun} value={a.idakun}>{a.kodeakun} - {a.namaakun}</option>)}
                      </select>
                      <span className="text-xs text-dark-400 font-semibold shrink-0">
                        Total: Rp {total.toLocaleString('id-ID')}
                      </span>
                      <button type="button" onClick={() => removeAkun(idakun)} className="p-1 hover:text-red-500 text-dark-300 shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-2 p-3">
                      {akunItems.map((it) => (
                        <div key={it.bulan}>
                          <label className="block text-[10px] font-semibold text-dark-300 mb-1">{MONTHS[it.bulan - 1]}</label>
                          <input type="number" min="0" value={it.nilai_anggaran}
                            onChange={(e) => updateItem(idakun, it.bulan, 'nilai_anggaran', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20"
                            placeholder="0" />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-2 max-w-2xl">
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
