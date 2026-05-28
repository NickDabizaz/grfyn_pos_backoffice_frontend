import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarDays, Gift, Search, Trash2 } from 'lucide-react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';
import useTabStore from '../../../store/tabStore';

const INIT = {
  kodepromo: '',
  namapromo: '',
  deskripsi: '',
  jenis: 'PERSEN_TRANSAKSI',
  berlaku_untuk: 'PENJUALAN',
  nilai: '',
  nilai_x: '',
  nilai_y: '',
  min_transaksi: '',
  min_qty: '',
  max_diskon: '',
  max_penggunaan: '',
  tglawal: '',
  tglakhir: '',
  berlaku_semua_barang: true,
  status: 'AKTIF',
  items: [],
  barang_gratis: [],
};

function normalizeItems(items = []) {
  return items.map((item) => ({
    idbarang: item.idbarang,
    kodebarang: item.kodebarang,
    namabarang: item.namabarang,
  }));
}

function normalizeGratis(items = []) {
  return items.map((item) => ({
    idbarang: item.idbarang,
    kodebarang: item.kodebarang,
    namabarang: item.namabarang,
    jml: item.jml ?? 1,
  }));
}

export default function PromoForm({ mode, id, data, onSuccess, tabId }) {
  const [form, setForm] = useState(INIT);
  const [loading, setLoading] = useState(false);
  const [searchBarang, setSearchBarang] = useState('');
  const [searchGratis, setSearchGratis] = useState('');
  const [barangResults, setBarangResults] = useState([]);
  const [gratisResults, setGratisResults] = useState([]);
  const closeTab = useTabStore((s) => s.closeTab);
  const activeTabId = useTabStore((s) => s.activeTabId);

  useEffect(() => {
    let ignore = false;
    async function loadDetail() {
      if (mode !== 'edit') {
        setForm({ ...INIT });
        return;
      }
      const detail = data?.items || data?.barang_gratis ? data : (await api.get(`/promo/${id}`)).data;
      if (ignore) return;
      setForm({
        kodepromo: detail.kodepromo || '',
        namapromo: detail.namapromo || '',
        deskripsi: detail.deskripsi || '',
        jenis: detail.jenis || 'PERSEN_TRANSAKSI',
        berlaku_untuk: detail.berlaku_untuk || 'PENJUALAN',
        nilai: detail.nilai ?? '',
        nilai_x: detail.nilai_x ?? '',
        nilai_y: detail.nilai_y ?? '',
        min_transaksi: detail.min_transaksi ?? '',
        min_qty: detail.min_qty ?? '',
        max_diskon: detail.max_diskon ?? '',
        max_penggunaan: detail.max_penggunaan ?? '',
        tglawal: detail.tglawal ? String(detail.tglawal).slice(0, 10) : '',
        tglakhir: detail.tglakhir ? String(detail.tglakhir).slice(0, 10) : '',
        berlaku_semua_barang: Boolean(Number(detail.berlaku_semua_barang ?? 1)),
        status: detail.status || 'AKTIF',
        items: normalizeItems(detail.items || []),
        barang_gratis: normalizeGratis(detail.barang_gratis || []),
      });
    }
    loadDetail().catch(() => toast.error('Gagal memuat detail promo'));
    return () => { ignore = true; };
  }, [mode, id, data]);

  useEffect(() => {
    if (searchBarang.length < 2) { setBarangResults([]); return; }
    api.get('/barang', { params: { search: searchBarang } })
      .then((r) => setBarangResults(Array.isArray(r.data) ? r.data.slice(0, 10) : []))
      .catch(() => {});
  }, [searchBarang]);

  useEffect(() => {
    if (searchGratis.length < 2) { setGratisResults([]); return; }
    api.get('/barang', { params: { search: searchGratis } })
      .then((r) => setGratisResults(Array.isArray(r.data) ? r.data.slice(0, 10) : []))
      .catch(() => {});
  }, [searchGratis]);

  const addBarang = (b) => {
    if (form.items.some((it) => it.idbarang === b.idbarang)) return;
    setForm((prev) => ({ ...prev, items: [...prev.items, { idbarang: b.idbarang, kodebarang: b.kodebarang, namabarang: b.namabarang }] }));
    setSearchBarang('');
    setBarangResults([]);
  };

  const addGratis = (b) => {
    if (form.barang_gratis.some((it) => it.idbarang === b.idbarang)) return;
    setForm((prev) => ({ ...prev, barang_gratis: [...prev.barang_gratis, { idbarang: b.idbarang, kodebarang: b.kodebarang, namabarang: b.namabarang, jml: prev.nilai_y || 1 }] }));
    setSearchGratis('');
    setGratisResults([]);
  };

  const removeBarang = (idbarang) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((it) => it.idbarang !== idbarang) }));
  };

  const removeGratis = (idbarang) => {
    setForm((prev) => ({ ...prev, barang_gratis: prev.barang_gratis.filter((it) => it.idbarang !== idbarang) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.kodepromo || !form.namapromo) return toast.error('Kode dan nama promo harus diisi');
    if (!form.tglawal || !form.tglakhir) return toast.error('Periode promo harus diisi');
    if (form.jenis === 'BELI_X_GRATIS_Y' && (!form.nilai_x || !form.nilai_y || form.barang_gratis.length === 0)) {
      return toast.error('Promo Beli X Gratis Y membutuhkan nilai X, nilai Y, dan barang gratis');
    }
    if (!form.berlaku_semua_barang && !['PERSEN_TRANSAKSI', 'NOMINAL_TRANSAKSI'].includes(form.jenis) && form.items.length === 0) {
      return toast.error('Pilih barang yang mendapat promo');
    }

    setLoading(true);
    try {
      const payload = {
        kodepromo: form.kodepromo.trim().toUpperCase(),
        namapromo: form.namapromo.trim(),
        deskripsi: form.deskripsi || null,
        jenis: form.jenis,
        berlaku_untuk: form.berlaku_untuk,
        nilai: form.jenis === 'BELI_X_GRATIS_Y' ? 0 : Number(form.nilai || 0),
        nilai_x: form.jenis === 'BELI_X_GRATIS_Y' ? Number(form.nilai_x || 0) : null,
        nilai_y: form.jenis === 'BELI_X_GRATIS_Y' ? Number(form.nilai_y || 0) : null,
        min_transaksi: form.min_transaksi !== '' ? Number(form.min_transaksi) : 0,
        min_qty: form.min_qty !== '' ? Number(form.min_qty) : 0,
        max_diskon: form.max_diskon !== '' ? Number(form.max_diskon) : null,
        max_penggunaan: form.max_penggunaan !== '' ? Number(form.max_penggunaan) : null,
        tglawal: form.tglawal,
        tglakhir: form.tglakhir,
        berlaku_semua_barang: form.berlaku_semua_barang,
        status: form.status,
        items: form.berlaku_semua_barang ? [] : form.items.map((it) => it.idbarang),
        barang_gratis: form.jenis === 'BELI_X_GRATIS_Y'
          ? form.barang_gratis.map((it) => ({ idbarang: it.idbarang, jml: Number(it.jml || form.nilai_y || 1) }))
          : [],
      };

      if (mode === 'edit') {
        await api.put(`/promo/${id}`, payload);
        toast.success('Promo diupdate');
      } else {
        await api.post('/promo', payload);
        toast.success('Promo ditambah');
      }
      if (onSuccess) await onSuccess();
      closeTab(tabId ?? activeTabId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan promo');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full px-3 py-2.5 rounded-xl border border-primary-100 bg-white text-sm text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300';
  const lbl = 'block text-xs font-semibold text-dark-400 mb-1';
  const dateOptions = { dateFormat: 'Y-m-d', altInput: true, altFormat: 'd F Y', locale: 'id', allowInput: true };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 pt-4 pb-2 border-b border-primary-50 shrink-0">
        <button onClick={() => closeTab(tabId ?? activeTabId)} className="p-1.5 rounded-lg hover:bg-warm-50 text-dark-400">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-dark-500">{mode === 'edit' ? 'Edit Promo' : 'Tambah Promo'}</h2>
          <p className="text-xs text-dark-300">{mode === 'edit' ? `Kode: ${data?.kodepromo || form.kodepromo}` : 'Atur katalog promo otomatis'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSave} className="grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <label className={lbl}>Kode Promo</label>
                <input value={form.kodepromo} onChange={(e) => setForm({ ...form, kodepromo: e.target.value.toUpperCase() })} className={inp} required />
              </div>
              <div>
                <label className={lbl}>Nama Promo</label>
                <input value={form.namapromo} onChange={(e) => setForm({ ...form, namapromo: e.target.value })} className={inp} required />
              </div>
            </div>

            <div>
              <label className={lbl}>Deskripsi</label>
              <textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={2} className={`${inp} resize-none`} placeholder="Opsional" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px_160px]">
              <div>
                <label className={lbl}>Jenis Promo</label>
                <select value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value })} className={inp}>
                  <option value="PERSEN_ITEM">Diskon % per barang</option>
                  <option value="NOMINAL_ITEM">Diskon nominal per barang</option>
                  <option value="PERSEN_TRANSAKSI">Diskon % transaksi</option>
                  <option value="NOMINAL_TRANSAKSI">Diskon nominal transaksi</option>
                  <option value="BELI_X_GRATIS_Y">Beli X Gratis Y</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Berlaku Untuk</label>
                <select value={form.berlaku_untuk} onChange={(e) => setForm({ ...form, berlaku_untuk: e.target.value })} className={inp}>
                  <option value="PENJUALAN">Penjualan</option>
                  <option value="PEMBELIAN">Pembelian</option>
                  <option value="KEDUANYA">Keduanya</option>
                </select>
              </div>
              <label className="mt-6 flex h-[42px] items-center gap-3 rounded-xl border border-primary-100 bg-white px-3 text-sm font-medium text-dark-400">
                <input type="checkbox" checked={form.status === 'AKTIF'} onChange={(e) => setForm({ ...form, status: e.target.checked ? 'AKTIF' : 'NONAKTIF' })} className="h-4 w-4 rounded accent-primary-500" />
                Aktif
              </label>
            </div>

            {form.jenis === 'BELI_X_GRATIS_Y' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Beli Minimal X</label>
                  <input type="number" min="1" value={form.nilai_x} onChange={(e) => setForm({ ...form, nilai_x: e.target.value })} className={inp} required />
                </div>
                <div>
                  <label className={lbl}>Gratis Y</label>
                  <input type="number" min="1" value={form.nilai_y} onChange={(e) => setForm({ ...form, nilai_y: e.target.value })} className={inp} required />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className={lbl}>{form.jenis.includes('PERSEN') ? 'Nilai (%)' : 'Nilai (Rp)'}</label>
                  <input type="number" min="0" value={form.nilai} onChange={(e) => setForm({ ...form, nilai: e.target.value })} className={inp} required />
                </div>
                <div>
                  <label className={lbl}>Minimum Transaksi</label>
                  <input type="number" min="0" value={form.min_transaksi} onChange={(e) => setForm({ ...form, min_transaksi: e.target.value })} className={inp} placeholder="0" />
                </div>
                <div>
                  <label className={lbl}>Maksimum Diskon</label>
                  <input type="number" min="0" value={form.max_diskon} onChange={(e) => setForm({ ...form, max_diskon: e.target.value })} className={inp} placeholder="Tidak dibatasi" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className={lbl}>Minimum Qty</label>
                <input type="number" min="0" value={form.min_qty} onChange={(e) => setForm({ ...form, min_qty: e.target.value })} className={inp} placeholder="0" />
              </div>
              <div>
                <label className={lbl}>Maks. Penggunaan</label>
                <input type="number" min="0" value={form.max_penggunaan} onChange={(e) => setForm({ ...form, max_penggunaan: e.target.value })} className={inp} placeholder="Tidak dibatasi" />
              </div>
              <label className="mt-6 flex h-[42px] items-center gap-3 rounded-xl border border-primary-100 bg-white px-3 text-sm font-medium text-dark-400">
                <input type="checkbox" checked={form.berlaku_semua_barang} onChange={(e) => setForm({ ...form, berlaku_semua_barang: e.target.checked })} className="h-4 w-4 rounded accent-primary-500" />
                Semua barang
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={lbl}>Mulai Berlaku</label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-300" />
                  <Flatpickr value={form.tglawal} onChange={(_, dateStr) => setForm((prev) => ({ ...prev, tglawal: dateStr }))} options={dateOptions} className={`${inp} pr-9`} placeholder="Pilih tanggal" />
                </div>
              </div>
              <div>
                <label className={lbl}>Berakhir Pada</label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-300" />
                  <Flatpickr value={form.tglakhir} onChange={(_, dateStr) => setForm((prev) => ({ ...prev, tglakhir: dateStr }))} options={dateOptions} className={`${inp} pr-9`} placeholder="Pilih tanggal" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => closeTab(tabId ?? activeTabId)} className="flex-1 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">Batal</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50">
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-primary-50 bg-white p-4">
              <h3 className="text-sm font-bold text-dark-500">Cakupan Barang</h3>
              <p className="mb-3 text-xs text-dark-300">Dipakai untuk promo item dan Beli X Gratis Y.</p>
              {!form.berlaku_semua_barang && (
                <div className="relative mb-3">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-300" />
                  <input type="text" value={searchBarang} onChange={(e) => setSearchBarang(e.target.value)} placeholder="Cari barang..." className={`${inp} pl-9`} />
                  {barangResults.length > 0 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-primary-100 bg-white shadow-lg">
                      {barangResults.map((b) => (
                        <button key={b.idbarang} type="button" onClick={() => addBarang(b)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-warm-50">
                          <span className="font-mono text-xs text-dark-300">{b.kodebarang}</span>
                          <span className="text-dark-500">{b.namabarang}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {form.berlaku_semua_barang ? (
                  <div className="rounded-xl bg-warm-50 px-3 py-4 text-center text-xs text-dark-300">Berlaku untuk seluruh barang aktif.</div>
                ) : form.items.length === 0 ? (
                  <div className="rounded-xl bg-warm-50 px-3 py-4 text-center text-xs text-dark-300">Belum ada barang dipilih.</div>
                ) : form.items.map((it) => (
                  <div key={it.idbarang} className="flex items-center justify-between gap-3 rounded-xl border border-primary-50 bg-warm-50 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-dark-500">{it.namabarang || `Barang ID ${it.idbarang}`}</div>
                      {it.kodebarang && <div className="text-[11px] font-mono text-dark-300">{it.kodebarang}</div>}
                    </div>
                    <button type="button" onClick={() => removeBarang(it.idbarang)} className="shrink-0 p-1 text-dark-300 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {form.jenis === 'BELI_X_GRATIS_Y' && (
              <div className="rounded-xl border border-primary-50 bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary-500" />
                  <h3 className="text-sm font-bold text-dark-500">Barang Gratis</h3>
                </div>
                <div className="relative mb-3">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-300" />
                  <input type="text" value={searchGratis} onChange={(e) => setSearchGratis(e.target.value)} placeholder="Cari barang gratis..." className={`${inp} pl-9`} />
                  {gratisResults.length > 0 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-primary-100 bg-white shadow-lg">
                      {gratisResults.map((b) => (
                        <button key={b.idbarang} type="button" onClick={() => addGratis(b)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-warm-50">
                          <span className="font-mono text-xs text-dark-300">{b.kodebarang}</span>
                          <span className="text-dark-500">{b.namabarang}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {form.barang_gratis.length === 0 ? (
                    <div className="rounded-xl bg-warm-50 px-3 py-4 text-center text-xs text-dark-300">Belum ada barang gratis.</div>
                  ) : form.barang_gratis.map((it, idx) => (
                    <div key={it.idbarang} className="grid grid-cols-[minmax(0,1fr)_70px_28px] items-center gap-2 rounded-xl border border-primary-50 bg-warm-50 px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-dark-500">{it.namabarang || `Barang ID ${it.idbarang}`}</div>
                        {it.kodebarang && <div className="text-[11px] font-mono text-dark-300">{it.kodebarang}</div>}
                      </div>
                      <input type="number" min="1" value={it.jml} onChange={(e) => setForm((prev) => ({
                        ...prev,
                        barang_gratis: prev.barang_gratis.map((row, rowIdx) => rowIdx === idx ? { ...row, jml: e.target.value } : row),
                      }))} className="rounded-lg border border-primary-100 px-2 py-1.5 text-center text-xs" />
                      <button type="button" onClick={() => removeGratis(it.idbarang)} className="p-1 text-dark-300 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
