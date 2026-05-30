import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Calculator, CheckCircle2, Info } from 'lucide-react';
import useTabStore from '../../../store/tabStore';

const INIT = { namabarang: '', satuanbesar: '', satuansedang: '', satuankecil: '', konversi1: 1, konversi2: 1, jenis: 'BARANG JADI', stokmin: 1, hargabeli: '0', hargajual: '0', status: 'AKTIF' };

const cleanUnit = (value) => String(value || '').trim().toUpperCase();

const parsePositive = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const getNormalizedPayload = (form, pakaiBahanBaku) => {
  const satuanbesar = cleanUnit(form.satuanbesar);
  const satuansedang = cleanUnit(form.satuansedang);
  const satuankecil = cleanUnit(form.satuankecil);
  const units = [satuanbesar, satuansedang, satuankecil].filter(Boolean);

  if (!units.length) {
    return { ok: false, message: 'Minimal isi 1 satuan. Mulai dari Satuan Kecil.' };
  }

  if (!satuankecil && (satuansedang || satuanbesar)) {
    return { ok: false, message: 'Satuan Kecil harus diisi terlebih dahulu.' };
  }

  if (satuanbesar && !satuansedang) {
    return { ok: false, message: 'Satuan Sedang harus diisi sebelum Satuan Besar.' };
  }

  if (units.length !== new Set(units).size) {
    return { ok: false, message: 'Satuan tidak boleh sama.' };
  }

  let konversi1 = 1;
  let konversi2 = 1;

  if (satuansedang) {
    konversi2 = parsePositive(form.konversi2);
    if (!konversi2) return { ok: false, message: 'Konversi Kecil harus lebih dari 0.' };
  }

  if (satuanbesar) {
    konversi1 = parsePositive(form.konversi1);
    if (!konversi1) return { ok: false, message: 'Konversi Besar harus lebih dari 0.' };
  }

  return {
    ok: true,
    payload: {
      ...form,
      satuanbesar,
      satuansedang,
      satuankecil,
      konversi1,
      konversi2,
      jenis: pakaiBahanBaku ? form.jenis : 'BARANG JADI',
    },
  };
};

export default function BarangForm({ mode, idbarang, data, onSuccess, tabId, isActive }) {
  const [form, setForm]                 = useState(INIT);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [kodeInput, setKodeInput]       = useState('');
  const [loading, setLoading]           = useState(false);
  const [pakaiBahanBaku, setPakaiBahanBaku] = useState(true);
  const closeTab                        = useTabStore((s) => s.closeTab);
  const closeCurrentTab                 = () => closeTab(tabId ?? useTabStore.getState().activeTabId);
  const unitFieldsLocked                = mode === 'edit' && Boolean(Number(data?.has_transaksi || 0));
  const editableInputClass              = 'w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20';
  const lockedInputClass                = `${editableInputClass} disabled:bg-warm-50 disabled:text-dark-300 disabled:cursor-not-allowed`;

  useEffect(() => {
    api.get('/setting/toko')
      .then(({ data }) => {
        const enabled = data.pakaibahanbaku !== 'TIDAK';
        setPakaiBahanBaku(enabled);
        if (!enabled) setForm(prev => ({ ...prev, jenis: 'BARANG JADI' }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === 'edit' && data) {
      setForm({
        namabarang  : data.namabarang,
        satuanbesar : data.satuanbesar || '',
        satuansedang: data.satuansedang || '',
        satuankecil : data.satuankecil || '',
        konversi1   : data.konversi1 || 0,
        konversi2   : data.konversi2 || 0,
        jenis       : data.jenis || 'BARANG JADI',
        stokmin     : data.stokmin || 0,
        hargabeli   : data.hargabeli_terbaru || '',
        hargajual   : data.hargajual_terbaru || '',
        status      : data.status || 'AKTIF',
      });
    } else if (mode === 'add') {
      setForm({ ...INIT });
      setAutoGenerate(true);
      setKodeInput('');
    }
  }, [mode, data]);

  const handleSave = async (e) => {
    e.preventDefault();
    const normalized = getNormalizedPayload(form, pakaiBahanBaku);
    if (!normalized.ok) {
      toast.error(normalized.message);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'edit') {
        await api.put(`/barang/${idbarang}`, normalized.payload);
        toast.success('Barang diupdate');
      } else {
        const payload = { ...normalized.payload };
        if (!autoGenerate && kodeInput.trim()) payload.kodebarang = kodeInput.trim();
        await api.post('/barang', payload);
        toast.success('Barang ditambah');
      }
      if (onSuccess) onSuccess();
      closeCurrentTab();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal');
    } finally {
      setLoading(false);
    }
  };

  const jenisOptions = [
    { value: 'BAHAN BAKU', label: 'BAHAN BAKU' },
    { value: 'BAHAN SETENGAH JADI', label: 'BAHAN SETENGAH JADI' },
    { value: 'BARANG JADI', label: 'BARANG JADI' }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 pt-4 pb-2 border-b border-primary-50 shrink-0">
        <button onClick={closeCurrentTab} className="p-1.5 rounded-lg hover:bg-warm-50 text-dark-400">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-dark-500">{mode === 'edit' ? 'Edit Barang' : 'Tambah Barang'}</h2>
          <p className="text-xs text-dark-300">{mode === 'edit' ? `Edit: ${data?.kodebarang}` : 'Form tambah data barang baru'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)] gap-5">
        <form onSubmit={handleSave} className="space-y-4">

          {/* Kode Barang */}
          <div>
            <label className="block text-xs font-semibold text-dark-400 mb-1">Kode Barang</label>
            {mode === 'edit' ? (
              <input value={data?.kodebarang || ''} disabled
                className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm bg-warm-50 text-dark-300 cursor-not-allowed" />
            ) : (
              <div className="flex items-center gap-3">
                <input
                  disabled={autoGenerate}
                  value={autoGenerate ? '(Auto-generate)' : kodeInput}
                  onChange={(e) => setKodeInput(e.target.value.toUpperCase())}
                  placeholder="Masukkan kode barang..."
                  className="flex-1 px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-warm-50 disabled:text-dark-300 disabled:cursor-not-allowed"
                />
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input type="checkbox" checked={autoGenerate}
                    onChange={(e) => { setAutoGenerate(e.target.checked); if (e.target.checked) setKodeInput(''); }}
                    className="w-3.5 h-3.5 rounded accent-primary-500" />
                  <span className="text-xs text-dark-400 font-medium">Generate</span>
                </label>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-400 mb-1">Nama Barang</label>
            <input value={form.namabarang} onChange={(e) => setForm({ ...form, namabarang: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" required />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1">Satuan Besar</label>
              <input value={form.satuanbesar} disabled={unitFieldsLocked} onChange={(e) => setForm({ ...form, satuanbesar: e.target.value.toUpperCase() })}
                className={lockedInputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1">Satuan Sedang</label>
              <input value={form.satuansedang} disabled={unitFieldsLocked} onChange={(e) => setForm({ ...form, satuansedang: e.target.value.toUpperCase() })}
                className={lockedInputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1">Satuan Kecil</label>
              <input value={form.satuankecil} disabled={unitFieldsLocked} onChange={(e) => setForm({ ...form, satuankecil: e.target.value.toUpperCase() })}
                className={lockedInputClass} />
            </div>
          </div>
          {unitFieldsLocked && (
            <p className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Satuan tidak dapat diubah karena barang sudah memiliki transaksi.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1">
                Konversi Besar <span className="text-[10px] text-dark-200">(Satuan Besar &#x2192; Satuan Sedang)</span>
              </label>
              <input type="number" value={form.konversi1} disabled={unitFieldsLocked} onChange={(e) => setForm({ ...form, konversi1: e.target.value })}
                className={lockedInputClass} placeholder="36" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1">
                Konversi Kecil <span className="text-[10px] text-dark-200">(Satuan Sedang &#x2192; Satuan Kecil)</span>
              </label>
              <input type="number" value={form.konversi2} disabled={unitFieldsLocked} onChange={(e) => setForm({ ...form, konversi2: e.target.value })}
                className={lockedInputClass} placeholder="1000" />
            </div>
          </div>

           <div className="grid grid-cols-2 gap-3">
            {pakaiBahanBaku && (
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1">Jenis</label>
              <select
                value={form.jenis}
                onChange={(e) => setForm({ ...form, jenis: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
              >
                {jenisOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            )}
            <div className={pakaiBahanBaku ? '' : 'col-span-2'}>
              <label className="block text-xs font-semibold text-dark-400 mb-1">Stok Minimum (Satuan Terkecil)</label>
              <input type="number" value={form.stokmin} onChange={(e) => setForm({ ...form, stokmin: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1">Harga Beli</label>
              <input type="number" value={form.hargabeli} onChange={(e) => setForm({ ...form, hargabeli: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark-400 mb-1">Harga Jual</label>
              <input type="number" value={form.hargajual} onChange={(e) => setForm({ ...form, hargajual: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              {form.hargabeli && form.hargajual && parseFloat(form.hargajual) < parseFloat(form.hargabeli) && (
                <p className="text-[10px] text-red-500 mt-1">Harga jual di bawah harga beli!</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-dark-400 mb-2">Status</label>
            <button type="button"
              onClick={() => setForm({ ...form, status: form.status === 'AKTIF' ? 'TIDAK AKTIF' : 'AKTIF' })}
              className="flex items-center gap-3">
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.status === 'AKTIF' ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.status === 'AKTIF' ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <span className={`text-sm font-semibold ${form.status === 'AKTIF' ? 'text-emerald-600' : 'text-gray-400'}`}>
                {form.status === 'AKTIF' ? 'Aktif' : 'Tidak Aktif'}
              </span>
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={closeCurrentTab} className="flex-1 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50">Batal</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
        <aside className="space-y-3">
          <div className="rounded-xl border border-primary-100 bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-primary-500" />
              <h3 className="text-sm font-bold text-dark-500">Rules Satuan</h3>
            </div>
            <div className="space-y-2 text-xs text-dark-400">
              <p>Minimal 1 satuan wajib diisi, dan pengisian harus mulai dari satuan terkecil.</p>
              <div className="rounded-lg bg-warm-50 border border-primary-50 p-3 space-y-1">
                <p className="font-semibold text-dark-500">Urutan valid:</p>
                <p>1. Satuan Kecil saja</p>
                <p>2. Satuan Sedang + Satuan Kecil</p>
                <p>3. Satuan Besar + Satuan Sedang + Satuan Kecil</p>
              </div>
              <p>Jika Satuan Sedang kosong, Satuan Besar belum boleh diisi. Jika Satuan Kecil kosong, Satuan Sedang dan Besar belum boleh diisi.</p>
            </div>
          </div>

          <div className="rounded-xl border border-primary-100 bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-accent-500" />
              <h3 className="text-sm font-bold text-dark-500">Konversi</h3>
            </div>
            <div className="space-y-2 text-xs text-dark-400">
              <p><span className="font-semibold text-dark-500">Konversi Besar</span> adalah jumlah satuan sedang di dalam 1 satuan besar.</p>
              <p><span className="font-semibold text-dark-500">Konversi Kecil</span> adalah jumlah satuan kecil di dalam 1 satuan sedang.</p>
              <div className="rounded-lg bg-warm-50 border border-primary-50 p-3">
                <p className="font-semibold text-dark-500 mb-1">Contoh Air Putih</p>
                <p>Satuan: DUS / BTL / LTR</p>
                <p>Konversi Besar: 36</p>
                <p>Konversi Kecil: 2</p>
                <p className="mt-2 text-dark-500">Artinya 1 DUS = 36 BTL, dan 1 BTL = 2 LTR.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
              <div className="space-y-1 text-xs text-emerald-800">
                <p className="font-bold">Otomatis saat simpan</p>
                <p>Jika hanya Satuan Kecil yang diisi, kedua konversi akan disimpan sebagai 1.</p>
              </div>
            </div>
          </div>
        </aside>
        </div>
      </div>
    </div>
  );
}
