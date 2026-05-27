import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarDays, Search, Trash2 } from 'lucide-react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';
import useTabStore from '../../../store/tabStore';

const INIT = {
  kodediskon: '',
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
  const [searchBarang, setSearchBarang] = useState('');
  const [barangResults, setBarangResults] = useState([]);
  const closeTab = useTabStore((s) => s.closeTab);
  const activeTabId = useTabStore((s) => s.activeTabId);

  useEffect(() => {
    if (mode === 'edit' && data) {
      setForm({
        kodediskon: data.kodediskon || '',
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
    if (!form.kodediskon || !form.namadiskon) { toast.error('Kode dan nama promo harus diisi'); return; }
    if (!form.tglawal || !form.tglakhir) { toast.error('Tanggal berlaku harus diisi'); return; }
    setLoading(true);
    try {
      const payload = {
        kodediskon: form.kodediskon,
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
        items: form.berlaku_semua_barang ? [] : form.items.map((it) => it.idbarang),
      };
      if (mode === 'edit') {
        await api.put(`/diskon/${id}`, payload);
        toast.success('Diskon diupdate');
      } else {
        await api.post('/diskon', payload);
        toast.success('Diskon ditambah');
      }
      try {
        if (onSuccess) await onSuccess();
      } catch {
        // Simpan sudah berhasil; kegagalan refresh list tidak boleh menahan tab form.
      }
      closeTab(tabId ?? activeTabId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  const setDate = (key, dateStr) => {
    setForm((prev) => ({ ...prev, [key]: dateStr }));
  };

  const inp = 'w-full px-3 py-2.5 rounded-xl border border-primary-100 bg-white text-sm text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300';
  const lbl = 'block text-xs font-semibold text-dark-400 mb-1';
  const dateOptions = { dateFormat: 'Y-m-d', altInput: true, altFormat: 'd F Y', locale: 'id', allowInput: true };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 pt-4 pb-2 border-b border-primary-50 shrink-0">
        <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-warm-50 text-dark-400">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-dark-500">{mode === 'edit' ? 'Edit Promo' : 'Tambah Promo'}</h2>
          <p className="text-xs text-dark-300">{mode === 'edit' ? `Kode: ${data?.kodediskon}` : 'Atur periode, nilai, dan barang yang mendapat promo'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSave} className="grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <label className={lbl}>Kode Promo</label>
                <input value={form.kodediskon} onChange={(e) => setForm({ ...form, kodediskon: e.target.value.toUpperCase() })} className={inp} required />
              </div>
              <div>
                <label className={lbl}>Nama Promo</label>
                <input value={form.namadiskon} onChange={(e) => setForm({ ...form, namadiskon: e.target.value })} className={inp} required />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <div>
                <label className={lbl}>Tipe Promo</label>
                <select value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value })} className={inp}>
                  <option value="PERSEN">Potongan Persen</option>
                  <option value="NOMINAL">Potongan Nominal</option>
                  <option value="BELI_X_GRATIS_Y">Beli X Gratis Y</option>
                </select>
              </div>
              <label className="mt-6 flex h-[42px] items-center gap-3 rounded-xl border border-primary-100 bg-white px-3 text-sm font-medium text-dark-400">
                <input
                  type="checkbox"
                  checked={form.status === 'AKTIF'}
                  onChange={(e) => setForm({ ...form, status: e.target.checked ? 'AKTIF' : 'TIDAK_AKTIF' })}
                  className="h-4 w-4 rounded accent-primary-500"
                />
                Promo aktif
              </label>
            </div>

            {form.jenis !== 'BELI_X_GRATIS_Y' ? (
              <div>
                <label className={lbl}>{form.jenis === 'PERSEN' ? 'Nilai Potongan (%)' : 'Nilai Potongan (Rp)'}</label>
                <input type="number" min="0" value={form.nilai} onChange={(e) => setForm({ ...form, nilai: e.target.value })} className={inp} required />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Jumlah Pembelian</label>
                  <input type="number" min="1" value={form.nilai_x} onChange={(e) => setForm({ ...form, nilai_x: e.target.value })} className={inp} required />
                </div>
                <div>
                  <label className={lbl}>Jumlah Gratis</label>
                  <input type="number" min="1" value={form.nilai_y} onChange={(e) => setForm({ ...form, nilai_y: e.target.value })} className={inp} required />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={lbl}>Minimum Belanja <span className="text-dark-300 font-normal">(opsional)</span></label>
                <input type="number" min="0" value={form.min_pembelian} onChange={(e) => setForm({ ...form, min_pembelian: e.target.value })} className={inp} />
              </div>
              {form.jenis === 'PERSEN' && (
                <div>
                  <label className={lbl}>Batas Potongan <span className="text-dark-300 font-normal">(opsional)</span></label>
                  <input type="number" min="0" value={form.max_diskon} onChange={(e) => setForm({ ...form, max_diskon: e.target.value })} className={inp} placeholder="Tidak dibatasi" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={lbl}>Mulai Berlaku</label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-300" />
                  <Flatpickr value={form.tglawal} onChange={(_, dateStr) => setDate('tglawal', dateStr)} options={dateOptions} className={`${inp} pr-9`} placeholder="Pilih tanggal" />
                </div>
              </div>
              <div>
                <label className={lbl}>Berakhir Pada</label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-300" />
                  <Flatpickr value={form.tglakhir} onChange={(_, dateStr) => setDate('tglakhir', dateStr)} options={dateOptions} className={`${inp} pr-9`} placeholder="Pilih tanggal" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => closeTab(tabId)} className="flex-1 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">Batal</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50">
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-primary-50 bg-white p-4">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-dark-500">Cakupan Barang</h3>
              <p className="text-xs text-dark-300">Pilih semua barang atau batasi promo ke barang tertentu.</p>
            </div>

            <label className="mb-3 flex cursor-pointer items-center gap-2 rounded-xl border border-primary-100 bg-warm-50 px-3 py-2.5">
              <input type="checkbox" checked={form.berlaku_semua_barang}
                onChange={(e) => setForm({ ...form, berlaku_semua_barang: e.target.checked })}
                className="w-4 h-4 rounded accent-primary-500" />
              <span className="text-sm font-medium text-dark-400">Berlaku untuk semua barang</span>
            </label>

            {!form.berlaku_semua_barang && (
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-300" />
                <input type="text" value={searchBarang} onChange={(e) => setSearchBarang(e.target.value)}
                  placeholder="Cari kode atau nama barang..."
                  className={`${inp} pl-9`} />
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
            )}

            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {form.berlaku_semua_barang ? (
                <div className="rounded-xl bg-warm-50 px-3 py-4 text-center text-xs text-dark-300">
                  Promo akan berlaku untuk seluruh barang aktif.
                </div>
              ) : form.items.length === 0 ? (
                <div className="rounded-xl bg-warm-50 px-3 py-4 text-center text-xs text-dark-300">
                  Belum ada barang dipilih.
                </div>
              ) : (
                form.items.map((it) => (
                  <div key={it.idbarang} className="flex items-center justify-between gap-3 rounded-xl border border-primary-50 bg-warm-50 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-dark-500">{it.namabarang || `Barang ID ${it.idbarang}`}</div>
                      {it.kodebarang && <div className="text-[11px] font-mono text-dark-300">{it.kodebarang}</div>}
                    </div>
                    <button type="button" onClick={() => removeBarang(it.idbarang)} className="shrink-0 p-1 hover:text-red-500 text-dark-300">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
