import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import useTabStore from '../../../store/tabStore';

const INIT = {
  namadiskon: '',
  jenis: 'PERSEN',
  nilai: '',
  nilai_x: '',
  nilai_y: '',
  min_pembelian: '',
  max_diskon: '',
  tglawal: '',
  tglakhir: '',
  berlaku_semua_barang: true,
  status: 'AKTIF',
  items: [],
};

export default function DiskonForm({ mode, id, data, onSuccess, tabId }) {
  const [form, setForm] = useState(INIT);
  const [loading, setLoading] = useState(false);
  const [barangList, setBarangList] = useState([]);
  const [searchBarang, setSearchBarang] = useState('');
  const [barangResults, setBarangResults] = useState([]);
  const closeTab = useTabStore((s) => s.closeTab);

  useEffect(() => {
    if (mode === 'edit' && data) {
      setForm({
        namadiskon: data.namadiskon || '',
        jenis: data.jenis || 'PERSEN',
        nilai: data.nilai ?? '',
        nilai_x: data.nilai_x ?? '',
        nilai_y: data.nilai_y ?? '',
        min_pembelian: data.min_pembelian ?? '',
        max_diskon: data.max_diskon ?? '',
        tglawal: data.tglawal ? data.tglawal.split('T')[0] : '',
        tglakhir: data.tglakhir ? data.tglakhir.split('T')[0] : '',
        berlaku_semua_barang: Boolean(data.berlaku_semua_barang),
        status: data.status || 'AKTIF',
        items: data.items || [],
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

  const addBarang = (b) => {
    if (form.items.find((it) => it.idbarang === b.idbarang)) return;
    setForm((prev) => ({ ...prev, items: [...prev.items, { idbarang: b.idbarang, kodebarang: b.kodebarang, namabarang: b.namabarang }] }));
    setSearchBarang('');
    setBarangResults([]);
  };

  const removeBarang = (idbarang) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((it) => it.idbarang !== idbarang) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.tglawal || !form.tglakhir) { toast.error('Tanggal berlaku harus diisi'); return; }
    setLoading(true);
    try {
      const payload = {
        namadiskon: form.namadiskon,
        jenis: form.jenis,
        nilai: form.jenis !== 'BELI_X_GRATIS_Y' ? Number(form.nilai) : undefined,
        nilai_x: form.jenis === 'BELI_X_GRATIS_Y' ? Number(form.nilai_x) : undefined,
        nilai_y: form.jenis === 'BELI_X_GRATIS_Y' ? Number(form.nilai_y) : undefined,
        min_pembelian: form.min_pembelian !== '' ? Number(form.min_pembelian) : null,
        max_diskon: form.max_diskon !== '' ? Number(form.max_diskon) : null,
        tglawal: form.tglawal,
        tglakhir: form.tglakhir,
        berlaku_semua_barang: form.berlaku_semua_barang,
        status: form.status,
        items: form.berlaku_semua_barang ? [] : form.items.map((it) => ({ idbarang: it.idbarang })),
      };
      if (mode === 'edit') {
        await api.put(`/diskon/${id}`, payload);
        toast.success('Diskon diupdate');
      } else {
        await api.post('/diskon', payload);
        toast.success('Diskon ditambah');
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
          <h2 className="text-lg font-bold text-dark-500">{mode === 'edit' ? 'Edit Diskon' : 'Tambah Diskon'}</h2>
          <p className="text-xs text-dark-300">{mode === 'edit' ? `Edit: ${data?.kodediskon}` : 'Form tambah diskon / promo baru'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSave} className="max-w-2xl space-y-4">

          <div>
            <label className={lbl}>Nama Diskon</label>
            <input value={form.namadiskon} onChange={(e) => setForm({ ...form, namadiskon: e.target.value })} className={inp} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Jenis Diskon</label>
              <select value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value })} className={inp}>
                <option value="PERSEN">Persen (%)</option>
                <option value="NOMINAL">Nominal (Rp)</option>
                <option value="BELI_X_GRATIS_Y">Beli X Gratis Y</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inp}>
                <option value="AKTIF">Aktif</option>
                <option value="TIDAK_AKTIF">Tidak Aktif</option>
              </select>
            </div>
          </div>

          {form.jenis !== 'BELI_X_GRATIS_Y' ? (
            <div>
              <label className={lbl}>{form.jenis === 'PERSEN' ? 'Nilai Diskon (%)' : 'Nilai Diskon (Rp)'}</label>
              <input type="number" min="0" value={form.nilai} onChange={(e) => setForm({ ...form, nilai: e.target.value })} className={inp} required />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Beli X (qty)</label>
                <input type="number" min="1" value={form.nilai_x} onChange={(e) => setForm({ ...form, nilai_x: e.target.value })} className={inp} required />
              </div>
              <div>
                <label className={lbl}>Gratis Y (qty)</label>
                <input type="number" min="1" value={form.nilai_y} onChange={(e) => setForm({ ...form, nilai_y: e.target.value })} className={inp} required />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Min Pembelian (Rp) <span className="text-dark-300 font-normal">opsional</span></label>
              <input type="number" min="0" value={form.min_pembelian} onChange={(e) => setForm({ ...form, min_pembelian: e.target.value })} className={inp} placeholder="0" />
            </div>
            {form.jenis === 'PERSEN' && (
              <div>
                <label className={lbl}>Maks Diskon (Rp) <span className="text-dark-300 font-normal">opsional</span></label>
                <input type="number" min="0" value={form.max_diskon} onChange={(e) => setForm({ ...form, max_diskon: e.target.value })} className={inp} placeholder="Tidak terbatas" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.berlaku_semua_barang}
                onChange={(e) => setForm({ ...form, berlaku_semua_barang: e.target.checked })}
                className="w-4 h-4 rounded accent-primary-500" />
              <span className="text-sm font-medium text-dark-400">Berlaku untuk semua barang</span>
            </label>
          </div>

          {!form.berlaku_semua_barang && (
            <div>
              <label className={lbl}>Barang yang Mendapat Diskon</label>
              <div className="relative mb-2">
                <input type="text" value={searchBarang} onChange={(e) => setSearchBarang(e.target.value)}
                  placeholder="Cari barang untuk ditambahkan..."
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
              <div className="space-y-1">
                {form.items.map((it) => (
                  <div key={it.idbarang} className="flex items-center justify-between px-3 py-2 rounded-lg bg-warm-50 border border-primary-50">
                    <span className="text-sm text-dark-500">{it.namabarang || `ID: ${it.idbarang}`}</span>
                    <button type="button" onClick={() => removeBarang(it.idbarang)} className="p-1 hover:text-red-500 text-dark-300">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {form.items.length === 0 && (
                  <p className="text-xs text-dark-300 text-center py-3">Belum ada barang dipilih</p>
                )}
              </div>
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
