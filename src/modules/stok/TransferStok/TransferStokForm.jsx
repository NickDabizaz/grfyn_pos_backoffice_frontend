import { useState } from 'react';
import api from '../../../api/axios';
import { useAuthStore } from '../../../store/authStore';
import { today, toDateInputValue } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, Plus, Trash2 } from 'lucide-react';
import useTabStore from '../../../store/tabStore';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';
import { BrowseBarangModal, BrowseLokasiModal, getDefaultSatuan, getSatuanOptions, isJmlValid } from '../../../lib/formHelpers';
import { canAccess, useMenuAccess } from '../../../hooks/useMenuAccess';

const STATUS_BADGE = {
  DRAFT: 'bg-amber-50 text-amber-600 border-amber-100',
  APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  CANCELLED: 'bg-red-50 text-red-500 border-red-100',
};

export default function TransferStokForm({ onSuccess, tabId, editData }) {
  const lokasiAuth = useAuthStore(s => s.lokasi);
  const closeTab = useTabStore(s => s.closeTab);
  const { access } = useMenuAccess('stok.transferstok');
  const isEdit = !!editData;
  const isLocked = isEdit && editData?.status !== 'DRAFT';
  const [lokasiAsal, setLokasiAsal] = useState(
    isEdit ? { idlokasi: editData.idlokasi, kodelokasi: editData.kodelokasi, namalokasi: editData.namalokasi } : (lokasiAuth || null)
  );
  const [lokasiTujuan, setLokasiTujuan] = useState(
    isEdit ? { idlokasi: editData.idlokasitujuan, kodelokasi: editData.kodelokasitujuan, namalokasi: editData.namalokasitujuan } : null
  );
  const [tgltrans, setTgltrans] = useState(toDateInputValue(editData?.tgltrans || today()));
  const [catatan, setCatatan] = useState(editData?.catatan || '');
  const [items, setItems] = useState(
    editData?.items
      ? editData.items.map(item => ({
          idbarang: item.idbarang,
          kodebarang: item.kodebarang,
          namabarang: item.namabarang,
          satuanbesar: item.satuanbesar || null,
          satuansedang: item.satuansedang || null,
          satuankecil: item.satuankecil || null,
          satuan: item.satuan || item.satuankecil || getDefaultSatuan(item),
          jml: String(Number(item.jml || 0)),
        }))
      : []
  );
  const [loading, setLoading] = useState(false);
  const [browseMode, setBrowseMode] = useState(null);
  const [showBarangModal, setShowBarangModal] = useState(false);

  const addBarang = (b) => {
    if (items.some(i => i.idbarang === b.idbarang)) {
      toast('Barang sudah ada di tabel. Ubah jumlah pada baris terkait.', { icon: 'i' });
      setShowBarangModal(false);
      return;
    }
    setItems(prev => [...prev, {
      idbarang: b.idbarang,
      kodebarang: b.kodebarang,
      namabarang: b.namabarang,
      satuanbesar: b.satuanbesar || null,
      satuansedang: b.satuansedang || null,
      satuankecil: b.satuankecil || null,
      satuan: getDefaultSatuan(b),
      jml: '1',
    }]);
    setShowBarangModal(false);
  };

  const updateItem = (idx, field, value) => setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (approve = false) => {
    if (isLocked) return toast.error('Transfer yang sudah approve/cancel tidak bisa disimpan');
    if (!lokasiAsal?.idlokasi) return toast.error('Lokasi asal wajib dipilih');
    if (!lokasiTujuan?.idlokasi) return toast.error('Lokasi tujuan wajib dipilih');
    if (lokasiAsal.idlokasi === lokasiTujuan.idlokasi) return toast.error('Lokasi asal dan tujuan tidak boleh sama');
    if (!items.length) return toast.error('Tambahkan barang terlebih dahulu');
    const invalidIdx = items.findIndex(i => !isJmlValid(i.jml));
    if (invalidIdx !== -1) return toast.error(`Jumlah pada baris ${invalidIdx + 1} harus positif`);

    setLoading(true);
    try {
      const payload = {
        idlokasiasal: lokasiAsal.idlokasi,
        idlokasitujuan: lokasiTujuan.idlokasi,
        tgltrans,
        catatan: catatan || null,
        approve,
        items: items.map(i => ({ idbarang: i.idbarang, jml: Number(i.jml), satuan: i.satuan })),
      };
      if (isEdit) {
        await api.put(`/transfer-stok/${editData.idtransferstok}`, payload);
      } else {
        await api.post('/transfer-stok', payload);
      }
      toast.success(approve ? 'Transfer stok disimpan dan diapprove' : 'Transfer stok disimpan sebagai DRAFT');
      if (onSuccess) onSuccess();
      closeTab(tabId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLokasi = (l) => {
    if (browseMode === 'asal') setLokasiAsal(l);
    if (browseMode === 'tujuan') setLokasiTujuan(l);
    setBrowseMode(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 pt-4 pb-3 border-b border-primary-50 shrink-0">
        <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-warm-50 text-dark-400">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-dark-500">{isEdit ? `Edit ${editData?.kodetransferstok || 'Transfer Stok'}` : 'Transfer Stok Baru'}</h2>
            {isEdit && editData?.status && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGE[editData.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>{editData.status}</span>
            )}
          </div>
          <p className="text-xs text-dark-300">Pindahkan stok antar lokasi</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
            <div className="px-5 py-3 border-b border-primary-50 bg-warm-50/50">
              <h3 className="text-xs font-bold text-dark-400 uppercase tracking-wider">Header</h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Tanggal Transfer</label>
                <Flatpickr value={tgltrans} onChange={([d]) => setTgltrans(toDateInputValue(d))}
                  options={{ dateFormat: 'Y-m-d', locale: 'id' }} className="flatpickr-input w-full" />
              </div>
              {[{ label: 'Lokasi Asal', value: lokasiAsal, mode: 'asal' }, { label: 'Lokasi Tujuan', value: lokasiTujuan, mode: 'tujuan' }].map(f => (
                <div key={f.mode}>
                  <label className="block text-xs font-semibold text-dark-400 mb-1.5">{f.label}</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 bg-warm-50/40 text-sm min-h-[38px]">
                      <MapPin className="w-3.5 h-3.5 text-dark-300 shrink-0" />
                      {f.value ? <span className="text-dark-500">{f.value.namalokasi}</span> : <span className="text-dark-300">Pilih Lokasi...</span>}
                    </div>
                    <button onClick={() => setBrowseMode(f.mode)} disabled={isLocked} className="px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 disabled:opacity-50">Browse</button>
                  </div>
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Catatan</label>
                <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={2} placeholder="Opsional..."
                  className="w-full px-3 py-2 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
            <div className="px-5 py-3 border-b border-primary-50 bg-warm-50/50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-dark-400 uppercase tracking-wider">Detail Barang <span className="ml-2 px-1.5 py-0.5 rounded-md bg-primary-100 text-primary-600 text-[10px]">{items.length}</span></h3>
              <button onClick={() => setShowBarangModal(true)} disabled={isLocked} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold disabled:opacity-50">
                <Plus className="w-3.5 h-3.5" /> Tambah Barang
              </button>
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-primary-50 bg-warm-50/30">
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-dark-300 w-10">No</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-dark-300 w-28">Kode</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-dark-300">Nama Barang</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-dark-300 w-28">Satuan</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-dark-300 w-28">Jumlah</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-dark-300">Belum ada barang. Klik <span className="font-semibold text-primary-500">Tambah Barang</span>.</td></tr>
                  ) : items.map((item, idx) => (
                    <tr key={item.idbarang} className="border-b border-primary-50/50 hover:bg-warm-50/20">
                      <td className="px-3 py-2.5 text-center text-xs text-dark-300">{idx + 1}</td>
                      <td className="px-3 py-2.5 text-xs font-mono text-dark-300">{item.kodebarang}</td>
                      <td className="px-3 py-2.5 font-medium text-dark-500">{item.namabarang}</td>
                      <td className="px-3 py-2.5">
                        <select value={item.satuan} onChange={e => updateItem(idx, 'satuan', e.target.value)} disabled={isLocked} className="w-full px-2 py-1.5 rounded-lg border border-primary-100 text-xs bg-white disabled:bg-warm-50">
                          {getSatuanOptions(item).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        <input type="text" value={item.jml} onChange={e => updateItem(idx, 'jml', e.target.value)} disabled={isLocked}
                          className="w-full px-2 py-1.5 rounded-lg border border-primary-100 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary-500/20 disabled:bg-warm-50" />
                      </td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => removeItem(idx)} disabled={isLocked} className="p-1 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500 disabled:opacity-40">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-primary-50 p-5 flex items-center justify-end gap-3">
            <button onClick={() => handleSubmit(false)} disabled={loading || !items.length || isLocked} className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold disabled:opacity-50">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
            {canAccess(access, 'approve') && (
              <button onClick={() => handleSubmit(true)} disabled={loading || !items.length || isLocked} className="px-5 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold disabled:opacity-50">
                {loading ? 'Menyimpan...' : 'Simpan dan Approve'}
              </button>
            )}
          </div>
        </div>
      </div>

      {browseMode && <BrowseLokasiModal onSelect={handleSelectLokasi} onClose={() => setBrowseMode(null)} />}
      {showBarangModal && <BrowseBarangModal priceType="beli" showStock={true} onSelect={addBarang} onClose={() => setShowBarangModal(false)} />}
    </div>
  );
}
