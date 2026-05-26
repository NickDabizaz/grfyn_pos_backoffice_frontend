import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import useTabStore from '../../../store/tabStore';

const INIT = {
  idbarang: '',
  namabarang: '',
  nomorbatch: '',
  tglproduksi: '',
  tglkadaluarsa: '',
  qty_masuk: '',
  satuan: '',
};

export default function BatchLotForm({ mode, id, data, onSuccess, tabId }) {
  const [form, setForm] = useState(INIT);
  const [loading, setLoading] = useState(false);
  const [searchBarang, setSearchBarang] = useState('');
  const [barangResults, setBarangResults] = useState([]);
  const closeTab = useTabStore((s) => s.closeTab);

  useEffect(() => {
    if (mode === 'edit' && data) {
      setForm({
        idbarang: data.idbarang || '',
        namabarang: data.namabarang || '',
        nomorbatch: data.nomorbatch || '',
        tglproduksi: data.tglproduksi ? data.tglproduksi.split('T')[0] : '',
        tglkadaluarsa: data.tglkadaluarsa ? data.tglkadaluarsa.split('T')[0] : '',
        qty_masuk: data.qty_sisa ?? '',
        satuan: data.satuan || '',
      });
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

  const selectBarang = (b) => {
    setForm((prev) => ({ ...prev, idbarang: b.idbarang, namabarang: b.namabarang, satuan: b.satuan1 || b.satuankecil || '' }));
    setSearchBarang('');
    setBarangResults([]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.idbarang) { toast.error('Pilih barang terlebih dahulu'); return; }
    setLoading(true);
    try {
      if (mode === 'edit') {
        await api.put(`/batch-lot/${id}`, {
          qty_masuk: Number(form.qty_masuk),
          tglkadaluarsa: form.tglkadaluarsa || null,
        });
        toast.success('Batch diupdate');
      } else {
        await api.post('/batch-lot', {
          idbarang: form.idbarang,
          nomorbatch: form.nomorbatch,
          tglproduksi: form.tglproduksi || null,
          tglkadaluarsa: form.tglkadaluarsa || null,
          qty_masuk: Number(form.qty_masuk),
          satuan: form.satuan,
        });
        toast.success('Batch ditambah');
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
          <h2 className="text-lg font-bold text-dark-500">{mode === 'edit' ? 'Edit Batch' : 'Tambah Batch / Lot'}</h2>
          <p className="text-xs text-dark-300">{mode === 'edit' ? `Edit: ${data?.nomorbatch}` : 'Daftarkan batch atau lot produk baru'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSave} className="max-w-lg space-y-4">

          <div>
            <label className={lbl}>Barang</label>
            {mode === 'edit' ? (
              <input value={form.namabarang} disabled className={`${inp} bg-warm-50 text-dark-300 cursor-not-allowed`} />
            ) : (
              <div className="relative">
                <input type="text"
                  value={form.idbarang ? form.namabarang : searchBarang}
                  onChange={(e) => { if (!form.idbarang) setSearchBarang(e.target.value); }}
                  onClick={() => { if (form.idbarang) setForm((prev) => ({ ...prev, idbarang: '', namabarang: '' })); }}
                  placeholder="Cari barang..."
                  className={inp} required={!form.idbarang} />
                {barangResults.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-primary-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {barangResults.map((b) => (
                      <button key={b.idbarang} type="button" onClick={() => selectBarang(b)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-warm-50 text-left text-sm">
                        <span className="font-mono text-xs text-dark-300">{b.kodebarang}</span>
                        <span className="text-dark-500">{b.namabarang}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className={lbl}>No. Batch / Lot</label>
            <input value={form.nomorbatch} onChange={(e) => setForm({ ...form, nomorbatch: e.target.value })}
              className={inp} disabled={mode === 'edit'} required placeholder="Contoh: BATCH-2025-001" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Tgl Produksi <span className="font-normal text-dark-300">opsional</span></label>
              <input type="date" value={form.tglproduksi} onChange={(e) => setForm({ ...form, tglproduksi: e.target.value })}
                className={inp} disabled={mode === 'edit'} />
            </div>
            <div>
              <label className={lbl}>Tgl Kadaluarsa <span className="font-normal text-dark-300">opsional</span></label>
              <input type="date" value={form.tglkadaluarsa} onChange={(e) => setForm({ ...form, tglkadaluarsa: e.target.value })} className={inp} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>{mode === 'edit' ? 'Qty Sisa' : 'Qty Masuk'}</label>
              <input type="number" min="0" value={form.qty_masuk} onChange={(e) => setForm({ ...form, qty_masuk: e.target.value })} className={inp} required />
            </div>
            <div>
              <label className={lbl}>Satuan</label>
              <input value={form.satuan} onChange={(e) => setForm({ ...form, satuan: e.target.value })} className={inp} disabled={mode === 'edit'} />
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
