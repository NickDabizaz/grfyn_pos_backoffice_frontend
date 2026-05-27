import { useState } from 'react';
import api from '../../../api/axios';
import { useAuthStore } from '../../../store/authStore';
import { formatRupiah, today } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2, MapPin, Users, Plus } from 'lucide-react';
import useTabStore from '../../../store/tabStore';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';
import { BrowseBarangModal, BrowseCustomerModal, BrowseLokasiModal, PpnDropdown, getSatuanOptions, getDefaultSatuanPenjualan, isJmlValid, isFloatValid, parseFloatVal } from '../../../lib/formHelpers';
import { canAccess, useMenuAccess } from '../../../hooks/useMenuAccess';

function toDateInputValue(value) {
  if (!value) return today();
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return today();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const STATUS_BADGE = {
  DRAFT:     'bg-amber-50 text-amber-600 border-amber-100',
  APPROVED:  'bg-emerald-50 text-emerald-600 border-emerald-100',
  CONFIRMED: 'bg-blue-50 text-blue-600 border-blue-100',
  CANCELLED: 'bg-red-50 text-red-500 border-red-100',
};

export default function SalesOrderForm({ onSuccess, tabId, editData }) {
  const user       = useAuthStore(s => s.user);
  const lokasiAuth = useAuthStore(s => s.lokasi);
  const closeTab   = useTabStore(s => s.closeTab);
  const requestRefresh = useTabStore(s => s.requestRefresh);
  const { access } = useMenuAccess('penjualan.so');

  const isEdit = !!editData;
  const defaultPpnMode = user?.pakaiPPN !== 'TIDAK' ? 'INCLUDE' : 'TIDAK_PAKAI';

  const [lokasi, setLokasi]     = useState(
    isEdit
      ? (editData.idlokasi ? { idlokasi: editData.idlokasi, namalokasi: editData.namalokasi, kodelokasi: editData.kodelokasi } : null)
      : (lokasiAuth || null)
  );
  const [tgltrans, setTgltrans] = useState(toDateInputValue(editData?.tgltrans));
  const [customer, setCustomer] = useState(
    isEdit
      ? (editData.idcustomer ? { idcustomer: editData.idcustomer, kodecustomer: editData.kodecustomer, namacustomer: editData.namacustomer, alamat: editData.calamat, hp: editData.chp } : null)
      : null
  );
  const [catatan, setCatatan]   = useState(editData?.catatan || '');

  const [items, setItems] = useState(
    editData?.items
      ? editData.items.map(item => ({
          idbarang:        item.idbarang,
          kodebarang:      item.kodebarang,
          namabarang:      item.namabarang,
          satuanbesar:     item.satuanbesar  || null,
          satuansedang:    item.satuansedang || null,
          satuankecil:     item.satuankecil  || null,
          konversi1:       item.konversi1    || 0,
          konversi2:       item.konversi2    || 0,
          stok:            0,
          satuan:          item.satuan || getDefaultSatuanPenjualan(item),
          jml:             String(parseInt(item.jml, 10) || 0),
          harga_sebelumnya: parseFloat(item.harga) || 0,
          harga:           String(parseFloat(item.harga) || 0),
          diskon:          String(item.diskon ?? 0),
          ppn_mode:        item.ppn_mode || defaultPpnMode,
        }))
      : []
  );

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showLokasiModal, setShowLokasiModal]     = useState(false);
  const [showBarangModal, setShowBarangModal]     = useState(false);
  const [loading, setLoading] = useState(false);
  const ppnPercent = user?.ppn || 11;
  const isLocked = isEdit && editData?.status !== 'DRAFT';

  const addBarang = (b) => {
    if (items.find(i => i.idbarang === b.idbarang)) {
      toast('Barang sudah ada di tabel. Ubah jumlah pada baris terkait.', { icon: 'ℹ️' });
      setShowBarangModal(false);
      return;
    }
    const hargaSebelumnya = parseFloat(b.hargajual_terbaru || 0);
    setItems(prev => [...prev, {
      idbarang:     b.idbarang,
      kodebarang:   b.kodebarang,
      namabarang:   b.namabarang,
      satuanbesar:  b.satuanbesar  || null,
      satuansedang: b.satuansedang || null,
      satuankecil:  b.satuankecil  || null,
      konversi1:    b.konversi1    || 0,
      konversi2:    b.konversi2    || 0,
      stok:         b.stok         || 0,
      satuan:           getDefaultSatuanPenjualan(b),
      jml:              '1',
      harga_sebelumnya: hargaSebelumnya,
      harga:            String(hargaSebelumnya || ''),
      diskon:           '0',
      ppn_mode:         defaultPpnMode,
    }]);
    setShowBarangModal(false);
  };

  const updateItem = (idx, field, value) =>
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const removeItem = (idx) =>
    setItems(prev => prev.filter((_, i) => i !== idx));

  const computedItems = items.map(item => {
    const jml       = parseFloat(item.jml) || 0;
    const harga     = parseFloatVal(item.harga);
    const diskon    = parseFloat(item.diskon) || 0;
    const base      = harga * jml;
    const diskonAmt = base * diskon / 100;
    const afterDiskon = base - diskonAmt;
    const ppnAmt    = item.ppn_mode === 'INCLUDE' ? (afterDiskon * ppnPercent) / 100 : 0;
    return { ...item, jml, harga, diskon, ppnAmt, subtotal: afterDiskon + ppnAmt };
  });

  const totalPpn   = computedItems.reduce((s, i) => s + i.ppnAmt, 0);
  const grandTotal = computedItems.reduce((s, i) => s + i.subtotal, 0);

  const handleSubmit = async (approve = false) => {
    if (isLocked) return toast.error('SO yang sudah approve tidak bisa disimpan lagi');
    if (items.length === 0) return toast.error('Tambahkan barang terlebih dahulu');
    if (!lokasi?.idlokasi) return toast.error('Lokasi wajib dipilih');
    if (!customer?.idcustomer) return toast.error('Customer wajib dipilih');

    const invalidIdx = computedItems.findIndex(i => !isJmlValid(i.jml));
    if (invalidIdx !== -1) return toast.error(`Jumlah pada baris ${invalidIdx + 1} harus angka bulat positif`);

    setLoading(true);
    try {
      const payload = {
        tgltrans,
        idcustomer: customer.idcustomer,
        idlokasi:   lokasi.idlokasi,
        catatan:    catatan || null,
        approve,
        items: computedItems.map(i => ({
          idbarang: i.idbarang,
          jml:      i.jml,
          harga:    i.harga,
          diskon:   i.diskon,
          satuan:   i.satuan && String(i.satuan).trim() ? String(i.satuan).trim() : 'PCS',
          ppn_mode: i.ppn_mode,
        })),
      };

      if (isEdit) {
        await api.put(`/sales-order/${editData.idso}`, payload);
        toast.success(approve ? 'Sales Order berhasil diupdate dan diapprove!' : 'Sales Order berhasil diupdate!');
      } else {
        await api.post('/sales-order', payload);
        toast.success(approve ? 'Sales Order berhasil dibuat dan diapprove!' : 'Sales Order berhasil dibuat!');
      }

      if (onSuccess) onSuccess();
      requestRefresh('penjualan.so');
      closeTab(tabId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">

      <div className="flex items-center gap-3 px-6 pt-4 pb-3 border-b border-primary-50 shrink-0">
        <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-warm-50 text-dark-400">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-dark-500">{isEdit ? `Edit ${editData?.kodeso || 'Sales Order'}` : 'Sales Order Baru'}</h2>
            {isEdit && editData?.status && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGE[editData.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                {editData.status}
              </span>
            )}
          </div>
          <p className="text-xs text-dark-300">{isEdit ? 'Edit sales order' : 'Buat sales order ke customer'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* HEADER */}
          <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
            <div className="px-5 py-3 border-b border-primary-50 bg-warm-50/50">
              <h3 className="text-xs font-bold text-dark-400 uppercase tracking-wider">Header</h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">

              <div className="order-1">
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Tanggal Transaksi</label>
                <Flatpickr value={tgltrans} onChange={([d]) => setTgltrans(toDateInputValue(d))}
                  options={{ dateFormat: 'Y-m-d', locale: 'id' }}
                  className="flatpickr-input w-full" placeholder="Pilih tanggal" />
              </div>

              <div className="order-2">
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Lokasi</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 bg-warm-50/40 text-sm min-h-[38px]">
                    <MapPin className="w-3.5 h-3.5 text-dark-300 shrink-0" />
                    {lokasi
                      ? <span className="text-dark-500">{lokasi.namalokasi}</span>
                      : <span className="text-dark-300">Pilih Lokasi...</span>
                    }
                  </div>
                  <button onClick={() => setShowLokasiModal(true)}
                    className="px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors shrink-0">
                    Browse
                  </button>
                </div>
              </div>

              <div className="col-span-2 order-4">
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Catatan</label>
                <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={2}
                  placeholder="Opsional..."
                  className="w-full px-3 py-2 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none" />
              </div>

              <div className="col-span-2 order-3">
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Customer</label>
                <div className="flex items-start gap-3">
                  <button onClick={() => setShowCustomerModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors shrink-0">
                    <Users className="w-3.5 h-3.5" /> Browse Customer
                  </button>
                  {customer ? (
                    <div className="flex-1 grid grid-cols-4 gap-3 p-3 rounded-xl border border-primary-100 bg-warm-50/30">
                      {[
                        { label: 'Kode Customer', value: customer.kodecustomer },
                        { label: 'Nama Customer', value: customer.namacustomer },
                        { label: 'Alamat',         value: customer.alamat || '-' },
                        { label: 'No. HP',          value: customer.hp    || '-' },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-[10px] text-dark-300 mb-0.5">{f.label}</p>
                          <p className="text-xs font-semibold text-dark-500 truncate" title={f.value}>{f.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 px-4 py-3 rounded-xl border border-dashed border-primary-100 text-xs text-dark-300 text-center">
                      Pilih Customer
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* DETAIL */}
          <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
            <div className="px-5 py-3 border-b border-primary-50 bg-warm-50/50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-dark-400 uppercase tracking-wider">
                Detail Barang
                {computedItems.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-md bg-primary-100 text-primary-600 text-[10px] font-bold">
                    {computedItems.length}
                  </span>
                )}
              </h3>
              <button onClick={() => setShowBarangModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold transition-colors">
                <Plus className="w-3.5 h-3.5" /> Tambah Barang
              </button>
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[1020px] text-sm">
                <thead>
                  <tr className="border-b border-primary-50 bg-warm-50/30">
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-dark-300 w-10">No</th>
                    <th className="text-left   px-3 py-2.5 text-xs font-semibold text-dark-300 w-28">Kode</th>
                    <th className="text-left   px-3 py-2.5 text-xs font-semibold text-dark-300">Nama Barang</th>
                    <th className="text-left   px-3 py-2.5 text-xs font-semibold text-dark-300 w-28">Satuan</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-dark-300 w-20">Jumlah</th>
                    <th className="text-right  px-3 py-2.5 text-xs font-semibold text-dark-300 w-36">Harga Sblm</th>
                    <th className="text-right  px-3 py-2.5 text-xs font-semibold text-dark-300 w-36">Harga Jual</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-dark-300 w-20">Diskon%</th>
                    <th className="text-right  px-3 py-2.5 text-xs font-semibold text-dark-300 w-32">Subtotal</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-dark-300 w-36">PPN</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {computedItems.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-12 text-center text-sm text-dark-300">
                        Belum ada barang. Klik <span className="font-semibold text-primary-500">Tambah Barang</span> untuk menambahkan.
                      </td>
                    </tr>
                  ) : computedItems.map((item, idx) => {
                    const satuanOpts = getSatuanOptions(item);
                    const rawItem = items[idx];
                    return (
                      <tr key={item.idbarang} className="border-b border-primary-50/50 hover:bg-warm-50/20 transition-colors">
                        <td className="px-3 py-2.5 text-center text-xs text-dark-300">{idx + 1}</td>
                        <td className="px-3 py-2.5 text-xs font-mono text-dark-300">{item.kodebarang}</td>
                        <td className="px-3 py-2.5 font-medium text-dark-500">{item.namabarang}</td>
                        <td className="px-3 py-2.5">
                          <select value={item.satuan} onChange={e => updateItem(idx, 'satuan', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-primary-100 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary-500/20">
                            {satuanOpts.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2.5">
                          <input type="text" value={Number(rawItem.jml)}
                            onChange={e => updateItem(idx, 'jml', e.target.value)}
                            className={`w-full px-2 py-1.5 rounded-lg border text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary-500/20 ${
                              !isJmlValid(Number(rawItem.jml)) ? 'border-red-300 bg-red-50 text-red-700' : 'border-primary-100'
                            }`} />
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs font-mono text-dark-300">
                          {formatRupiah(item.harga_sebelumnya)}
                        </td>
                        <td className="px-3 py-2.5">
                          <input type="text" value={rawItem.harga}
                            onChange={e => updateItem(idx, 'harga', e.target.value)}
                            className={`w-full px-2 py-1.5 rounded-lg border text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary-500/20 ${
                              rawItem.harga && !isFloatValid(rawItem.harga) ? 'border-red-300 bg-red-50 text-red-700' : 'border-primary-100'
                            }`} />
                        </td>
                        <td className="px-3 py-2.5">
                          <input type="text" value={rawItem.diskon}
                            onChange={e => updateItem(idx, 'diskon', e.target.value)}
                            className={`w-full px-2 py-1.5 rounded-lg border text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary-500/20 ${
                              rawItem.diskon && !isFloatValid(rawItem.diskon) ? 'border-red-300 bg-red-50 text-red-700' : 'border-primary-100'
                            }`} />
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs font-mono font-semibold text-dark-500">
                          {formatRupiah(item.subtotal)}
                        </td>
                        <td className="px-3 py-2.5">
                          <PpnDropdown value={item.ppn_mode} onChange={v => updateItem(idx, 'ppn_mode', v)} />
                        </td>
                        <td className="px-3 py-2.5">
                          <button onClick={() => removeItem(idx)}
                            className="p-1 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* FOOTER */}
          <div className="bg-white rounded-2xl border border-primary-50 p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-6">
                  <span className="text-xs text-dark-300 w-28 text-right">Total PPN:</span>
                  <span className="text-sm font-semibold text-dark-400 font-mono w-40 text-right">
                    {formatRupiah(totalPpn)}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xs font-bold text-dark-500 w-28 text-right">Grand Total:</span>
                  <span className="text-xl font-bold text-accent-600 font-mono w-40 text-right">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => handleSubmit(false)} disabled={loading || items.length === 0 || isLocked}
                  className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
                {canAccess(access, 'approve') && <button onClick={() => handleSubmit(true)} disabled={loading || items.length === 0 || isLocked}
                  className="px-5 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Menyimpan...' : 'Simpan dan Approve'}
                </button>}
              </div>
            </div>
          </div>

        </div>
      </div>

      {showCustomerModal && (
        <BrowseCustomerModal
          onSelect={c => { setCustomer(c); setShowCustomerModal(false); }}
          onClose={() => setShowCustomerModal(false)}
        />
      )}
      {showLokasiModal && (
        <BrowseLokasiModal
          onSelect={l => { setLokasi(l); setShowLokasiModal(false); }}
          onClose={() => setShowLokasiModal(false)}
        />
      )}
      {showBarangModal && (
        <BrowseBarangModal
          priceType="jual"
          showStock={true}
          onSelect={addBarang}
          onClose={() => setShowBarangModal(false)}
        />
      )}
    </div>
  );
}
