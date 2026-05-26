import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2 } from 'lucide-react';
import useTabStore from '../../../store/tabStore';

const INIT = { namalevel: '', deskripsi: '', urutan: 1, items: [] };

export default function HargaLevelForm({ mode, id, data, onSuccess, tabId }) {
  const [form, setForm] = useState(INIT);
  const [loading, setLoading] = useState(false);
  const [searchBarang, setSearchBarang] = useState('');
  const [barangResults, setBarangResults] = useState([]);
  const closeTab = useTabStore((s) => s.closeTab);

  useEffect(() => {
    if (mode === 'edit' && data) {
      setForm({
        namalevel: data.namalevel || '',
        deskripsi: data.deskripsi || '',
        urutan: data.urutan ?? 1,
        items: data.items || [],
      });
      if (data.idhargajuallevel) {
        api.get(`/harga-level/${data.idhargajuallevel}`).then((r) => {
          setForm((prev) => ({ ...prev, items: r.data.items || [] }));
        }).catch(() => {});
      }
    } else {
      setForm({ ...INIT });
    }
  }, [mode, data]);

  useEffect(() => {
    if (searchBarang.length < 2) { setBarangResults([]); return; }
    api.get('/barang', { params: { search: searchBarang } }).then((r) => {
      setBarangResults(Array.isArray(r.data) ? r.data.slice(0, 10) : []);
    }).catch(() => {});
  }, [searchBarang]);

  const addBarang = (b) => {
    if (form.items.find((it) => it.idbarang === b.idbarang)) return;
    const satuan = b.satuan1 || b.satuankecil || 'PCS';
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { idbarang: b.idbarang, kodebarang: b.kodebarang, namabarang: b.namabarang, satuan, hargajual: '' }],
    }));
    setSearchBarang('');
    setBarangResults([]);
  };

  const updateItem = (idx, field, val) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: val };
      return { ...prev, items };
    });
  };

  const removeItem = (idx) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        namalevel: form.namalevel,
        deskripsi: form.deskripsi,
        urutan: Number(form.urutan),
        items: form.items.map((it) => ({ idbarang: it.idbarang, satuan: it.satuan, hargajual: Number(it.hargajual || 0) })),
      };
      if (mode === 'edit') {
        await api.put(`/harga-level/${id}`, payload);
        toast.success('Level harga diupdate');
      } else {
        await api.post('/harga-level', payload);
        toast.success('Level harga ditambah');
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
          <h2 className="text-lg font-bold text-dark-500">{mode === 'edit' ? 'Edit Level Harga' : 'Tambah Level Harga'}</h2>
          <p className="text-xs text-dark-300">Atur nama level dan harga jual per barang</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSave} className="max-w-3xl space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className={lbl}>Nama Level</label>
              <input value={form.namalevel} onChange={(e) => setForm({ ...form, namalevel: e.target.value })} className={inp} required />
            </div>
            <div>
              <label className={lbl}>Urutan</label>
              <input type="number" min="1" value={form.urutan} onChange={(e) => setForm({ ...form, urutan: e.target.value })} className={inp} />
            </div>
          </div>

          <div>
            <label className={lbl}>Deskripsi <span className="text-dark-300 font-normal">opsional</span></label>
            <input value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} className={inp} />
          </div>

          <div>
            <label className={lbl}>Harga Per Barang</label>
            <div className="relative mb-2">
              <input type="text" value={searchBarang} onChange={(e) => setSearchBarang(e.target.value)}
                placeholder="Ketik nama/kode barang untuk ditambahkan..."
                className={inp} />
              {barangResults.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-primary-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {barangResults.map((b) => (
                    <button key={b.idbarang} type="button" onClick={() => addBarang(b)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-warm-50 text-left text-sm">
                      <span className="font-mono text-xs text-dark-300">{b.kodebarang}</span>
                      <span className="text-dark-500">{b.namabarang}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-primary-50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-warm-50/50 border-b border-primary-50">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-dark-300">Barang</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-dark-300 w-28">Satuan</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-dark-300 w-36">Harga Jual (Rp)</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.length === 0 && (
                    <tr><td colSpan={4} className="px-3 py-6 text-center text-xs text-dark-300">Belum ada barang. Cari dan tambahkan di atas.</td></tr>
                  )}
                  {form.items.map((it, idx) => (
                    <tr key={it.idbarang} className="border-b border-primary-50/50">
                      <td className="px-3 py-2 text-sm text-dark-500">{it.namabarang}</td>
                      <td className="px-3 py-2">
                        <input value={it.satuan} onChange={(e) => updateItem(idx, 'satuan', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" value={it.hargajual} onChange={(e) => updateItem(idx, 'hargajual', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20" />
                      </td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => removeItem(idx)} className="p-1 hover:text-red-500 text-dark-300">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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
