import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { useAuthStore } from '../../../store/authStore';
import { formatRupiah, today } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2, MapPin, Users, Plus, FileText, X } from 'lucide-react';
import useTabStore from '../../../store/tabStore';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';
import { BrowseBarangModal, BrowseCustomerModal, BrowseLokasiModal, BrowseBPKModal, PpnDropdown, getSatuanOptions, getDefaultSatuan, isJmlValid, isFloatValid, parseFloatVal } from '../../../lib/formHelpers';
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

function printFaktur(data, user) {
  const items = data.items || [];
  const ppnTotal = items.reduce((s, i) => s + parseFloat(i.ppn || 0), 0);
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Faktur Penjualan - ${data.kodejual}</title>
<style>
  body{font-family:Arial,sans-serif;font-size:12px;margin:20px;color:#333}
  h2{text-align:center;margin:0 0 2px}
  .center{text-align:center}
  .info{margin:12px 0;display:grid;grid-template-columns:130px 1fr;gap:2px 8px}
  .info span:first-child{font-weight:bold;color:#555}
  table{width:100%;border-collapse:collapse;margin-top:14px}
  th{background:#f4f4f4;padding:6px 8px;text-align:left;border-bottom:2px solid #ddd;font-size:11px}
  td{padding:5px 8px;border-bottom:1px solid #eee;font-size:11px}
  .r{text-align:right} .c{text-align:center}
  .totals{margin-top:14px;text-align:right}
  .grand{font-size:14px;font-weight:bold;margin-top:4px}
  @media print{body{margin:0}}
</style></head><body>
<h2>${user?.namatenant || 'GRFYN POS'}</h2>
<p class="center" style="color:#888;margin:0 0 12px">FAKTUR PENJUALAN</p>
<div class="info">
  <span>Kode Jual</span><span>${data.kodejual}</span>
  <span>Tanggal</span><span>${String(data.tgltrans || '').slice(0, 10)}</span>
  <span>Customer</span><span>${data.namacustomer || '-'}</span>
  <span>Lokasi</span><span>${data.namalokasi || '-'}</span>
</div>
<table><thead><tr>
  <th style="width:32px">No</th><th>Kode</th><th>Nama Barang</th>
  <th class="c" style="width:60px">Sat</th>
  <th class="r" style="width:50px">Jml</th>
  <th class="r" style="width:90px">Harga</th>
  <th class="r" style="width:60px">Diskon%</th>
  <th class="r" style="width:80px">PPN</th>
  <th class="r" style="width:100px">Subtotal</th>
</tr></thead><tbody>
${items.map((item, i) => `<tr>
  <td class="c">${i + 1}</td>
  <td>${item.kodebarang || ''}</td>
  <td>${item.namabarang || ''}</td>
  <td class="c">${item.satuan || ''}</td>
  <td class="r">${item.jml}</td>
  <td class="r">${Number(item.harga).toLocaleString('id-ID')}</td>
  <td class="r">${Number(item.diskon || 0)}%</td>
  <td class="r">${Number(item.ppn || 0).toLocaleString('id-ID')}</td>
  <td class="r">${Number(item.subtotal).toLocaleString('id-ID')}</td>
</tr>`).join('')}
</tbody></table>
<div class="totals">
  <div>Total PPN: <strong>${ppnTotal.toLocaleString('id-ID')}</strong></div>
  <div class="grand">Grand Total: ${Number(data.grandtotal).toLocaleString('id-ID')}</div>
</div>
</body></html>`;
  const w = window.open('', '_blank', 'width=820,height=640');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}

export default function PenjualanForm({ onSuccess, tabId, editData }) {
  const user       = useAuthStore(s => s.user);
  const lokasiAuth = useAuthStore(s => s.lokasi);
  const closeTab   = useTabStore(s => s.closeTab);
  const requestRefresh = useTabStore(s => s.requestRefresh);
  const { access } = useMenuAccess('penjualan.transaksi');

  const isEdit = !!editData;
  const defaultPpnMode = user?.pakaiPPN !== 'TIDAK' ? 'INCLUDE' : 'TIDAK_PAKAI';

  const [autoGenerate, setAutoGenerate] = useState(!isEdit);
  const [kodejual, setKodejual]         = useState(editData?.kodejual || '');
  const [lokasi, setLokasi]             = useState(
    isEdit
      ? (editData.idlokasi ? { idlokasi: editData.idlokasi, namalokasi: editData.namalokasi, kodelokasi: editData.kodelokasi } : null)
      : (lokasiAuth || null)
  );
  const [tgltrans, setTgltrans]         = useState(toDateInputValue(editData?.tgltrans));
  const [customer, setCustomer]         = useState(
    isEdit
      ? (editData.idcustomer ? { idcustomer: editData.idcustomer, kodecustomer: editData.kodecustomer, namacustomer: editData.namacustomer, alamat: editData.alamat, hp: editData.hp } : null)
      : null
  );

  const [items, setItems] = useState(
    editData?.items
      ? editData.items.map(item => ({
          idbarang:     item.idbarang,
          kodebarang:   item.kodebarang,
          namabarang:   item.namabarang,
          satuanbesar:  item.satuanbesar  || null,
          satuansedang: item.satuansedang || null,
          satuankecil:  item.satuankecil  || null,
          konversi1:    item.konversi1    || 0,
          konversi2:    item.konversi2    || 0,
          stok:         item.stok         || 0,
          satuan:       item.satuan || getDefaultSatuan(item),
          jml:          String(parseInt(item.jml, 10) || 0),
          harga:        String(parseFloat(item.harga) || 0),
          diskon:       String(parseFloat(item.diskon) || 0),
          bpk_jml:      item.bpk_jml ?? item.jml,
          bpk_harga:    item.bpk_harga ?? item.harga,
          ppn_mode:     item.ppn_mode || defaultPpnMode,
        }))
      : []
  );

  const [idbpk, setidbpk]     = useState(editData?.idbpk   || null);
  const [kodebpk, setkodebpk] = useState(editData?.kodebpk || '');
  const [catatan, setCatatan] = useState(editData?.catatan || '');

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showLokasiModal, setShowLokasiModal]     = useState(false);
  const [showBarangModal, setShowBarangModal]     = useState(false);
  const [showBPKModal, setShowBPKModal]           = useState(false);

  const [loading, setLoading] = useState(false);
  const [langsungLunas, setLangsungLunas] = useState(editData?.statuslunas === 'LUNAS');
  const ppnPercent = user?.ppn || 11;

  useEffect(() => {
    if (!isEdit || !idbpk) return;
    api.get(`/bpk-jual/${idbpk}`).then(({ data }) => {
      const bpkMap = new Map((data.items || []).map(i => [i.idbarang, i]));
      setItems(prev => prev.map(item => {
        const ref = bpkMap.get(item.idbarang);
        if (!ref) return item;
        return { ...item, bpk_jml: parseFloat(ref.jml || 0), bpk_harga: parseFloat(ref.harga || 0) };
      }));
    }).catch(() => {});
  }, [isEdit, idbpk]);

  const handleSelectBPK = async (bpk) => {
    setShowBPKModal(false);
    try {
      const { data } = await api.get(`/bpk-jual/${bpk.idbpk}`);
      setidbpk(data.idbpk);
      setkodebpk(data.kodebpk);
      if (data.idcustomer) {
        setCustomer({
          idcustomer:   data.idcustomer,
          kodecustomer: data.kodecustomer,
          namacustomer: data.namacustomer,
          alamat:       data.alamat,
          hp:           data.hp,
        });
      }
      if (data.idlokasi) {
        setLokasi({
          idlokasi:   data.idlokasi,
          namalokasi: data.namalokasi,
          kodelokasi: data.kodelokasi,
        });
      }
      if (data.items && data.items.length) {
        setItems(data.items.map(item => ({
          idbarang:     item.idbarang,
          kodebarang:   item.kodebarang,
          namabarang:   item.namabarang,
          satuanbesar:  item.satuanbesar  || null,
          satuansedang: item.satuansedang || null,
          satuankecil:  item.satuankecil  || null,
          konversi1:    item.konversi1    || 0,
          konversi2:    item.konversi2    || 0,
          stok:         item.stok         || 0,
          satuan:       item.satuan || getDefaultSatuan(item),
          jml:          String(item.jml || 0),
          harga:        String(parseFloat(item.harga) || 0),
          diskon:       String(parseFloat(item.diskon) || 0),
          bpk_jml:      parseFloat(item.jml || 0),
          bpk_harga:    parseFloat(item.harga || 0),
          ppn_mode:     defaultPpnMode,
        })));
      }
    } catch {
      toast.error('Gagal memuat data BPK');
    }
  };

  const addBarang = (b) => {
    if (items.find(i => i.idbarang === b.idbarang)) {
      toast('Barang sudah ada di tabel. Ubah jumlah pada baris terkait.', { icon: 'ℹ️' });
      setShowBarangModal(false);
      return;
    }
    const hargaJual = parseFloat(b.hargajual_terbaru || 0);
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
      satuan:       getDefaultSatuan(b),
      jml:          '1',
      harga:        String(hargaJual || ''),
      diskon:       '0',
      ppn_mode:     defaultPpnMode,
    }]);
    setShowBarangModal(false);
  };

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const removeItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const computedItems = items.map(item => {
    const jml       = parseFloat(item.jml) || 0;
    const harga     = parseFloatVal(item.harga);
    const diskon    = parseFloatVal(item.diskon);
    const base      = harga * jml;
    const diskonAmt = diskon ? (base * diskon) / 100 : 0;
    const ppnAmt    = item.ppn_mode === 'INCLUDE' ? ((base - diskonAmt) * ppnPercent) / 100 : 0;
    return { ...item, jml, harga, diskon, diskonAmt, ppnAmt, subtotal: base - diskonAmt + ppnAmt };
  });

  const totalPpn    = computedItems.reduce((s, i) => s + i.ppnAmt, 0);
  const totalDiskon = computedItems.reduce((s, i) => s + i.diskonAmt, 0);
  const grandTotal  = computedItems.reduce((s, i) => s + i.subtotal, 0);

  const isLocked = isEdit && editData?.status !== 'DRAFT';

  const hasBpkDiff = () => idbpk && computedItems.some(i =>
    Number(i.bpk_jml ?? i.jml) !== Number(i.jml) ||
    Number(i.bpk_harga ?? i.harga) !== Number(i.harga)
  );

  const handleSubmit = async (approve = false) => {
    if (langsungLunas) approve = true;
    if (isLocked) return toast.error('Penjualan yang sudah approve tidak bisa disimpan lagi');
    if (items.length === 0) return toast.error('Tambahkan barang terlebih dahulu');
    if (!lokasi?.idlokasi) return toast.error('Lokasi wajib dipilih');
    if (!customer?.idcustomer) return toast.error('Customer wajib dipilih');

    const parsedItems = items.map(i => {
      const n = Number(i.jml);
      return { ...i, jml: isNaN(n) ? i.jml : n };
    });

    const invalidIdx = parsedItems.findIndex(i => !isJmlValid(i.jml));
    if (invalidIdx !== -1) {
      return toast.error(`Jumlah pada baris ${invalidIdx + 1} harus angka bulat positif`);
    }

    if (!autoGenerate && !kodejual.trim()) return toast.error('Kode jual wajib diisi');
    if (isEdit && hasBpkDiff()) {
      const ok = window.confirm('Jumlah atau harga berbeda dengan BPK. Lanjutkan simpan perubahan?');
      if (!ok) return;
    }
    setLoading(true);
    try {
      const payload = {
        kodejual:         autoGenerate ? null : kodejual.trim(),
        tgltrans,
        idcustomer:       customer.idcustomer,
        idlokasi:         lokasi.idlokasi,
        grandtotal:       grandTotal,
        bayar:            langsungLunas ? grandTotal : 0,
        is_lunaslangsung: langsungLunas,
        idbpk:            idbpk || null,
        kodebpk:          kodebpk || null,
        jalurpenjualan:   idbpk ? 'PESANAN' : 'LANGSUNG',
        approve,
        catatan:          catatan || null,
        items: computedItems.map(i => ({
          idbarang: i.idbarang,
          jml:      i.jml,
          harga:    i.harga,
          diskon:   i.diskon || 0,
          satuan:   i.satuan && String(i.satuan).trim() ? String(i.satuan).trim() : 'PCS',
          ppn_mode: i.ppn_mode,
        })),
      };

      if (isEdit) {
        await api.put(`/jual/${editData.idjual}`, payload);
      } else {
        await api.post('/jual', payload);
      }

      toast.success(approve ? 'Penjualan berhasil disimpan dan diapprove!' : (isEdit ? 'Penjualan berhasil diupdate!' : 'Penjualan berhasil disimpan!'));

      if (onSuccess) onSuccess();
      requestRefresh('penjualan.bpk');
      closeTab(tabId);
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">

      {/* Page header */}
      <div className="flex items-center gap-3 px-6 pt-4 pb-3 border-b border-primary-50 shrink-0">
        <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-warm-50 text-dark-400">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-dark-500">{isEdit ? `Edit ${editData?.kodejual || 'Penjualan'}` : 'Penjualan Baru'}</h2>
            {isEdit && editData?.status && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGE[editData.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                {editData.status}
              </span>
            )}
          </div>
          <p className="text-xs text-dark-300">{isEdit ? 'Edit transaksi penjualan' : 'Form input transaksi penjualan'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* ────── SECTION 1: HEADER ────── */}
          <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
            <div className="px-5 py-3 border-b border-primary-50 bg-warm-50/50">
              <h3 className="text-xs font-bold text-dark-400 uppercase tracking-wider">Header</h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">

              {/* Kode Jual */}
              <div className="col-span-2 order-6">
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Kode Jual</label>
                {isEdit ? (
                  <div className="px-3 py-2 rounded-xl border border-primary-100 bg-warm-50/40 text-sm text-dark-400 font-mono">
                    {kodejual}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      disabled={autoGenerate}
                      value={autoGenerate ? '(Auto-generate)' : kodejual}
                      onChange={e => setKodejual(e.target.value.toUpperCase())}
                      placeholder="Masukkan kode jual..."
                      className="flex-1 px-3 py-2 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-warm-50 disabled:text-dark-300 disabled:cursor-not-allowed"
                    />
                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                      <input type="checkbox" checked={autoGenerate}
                        onChange={e => { setAutoGenerate(e.target.checked); if (e.target.checked) setKodejual(''); }}
                        className="w-3.5 h-3.5 rounded accent-primary-500" />
                      <span className="text-xs text-dark-400 font-medium">Generate</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Tanggal Transaksi */}
              <div className="order-1">
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Tanggal Transaksi</label>
                <Flatpickr value={tgltrans} onChange={([d]) => setTgltrans(toDateInputValue(d))}
                  options={{ dateFormat: 'Y-m-d', locale: 'id' }}
                  className="flatpickr-input w-full" placeholder="Pilih tanggal" />
              </div>

              {/* Lokasi */}
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

              {/* Kode Referensi BPK — optional */}
              <div className="col-span-2 order-3">
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Kode BPK (Referensi, Opsional)</label>
                <div className="flex items-center gap-2">
                  <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm min-h-[38px] ${idbpk ? 'border-primary-100 bg-warm-50/40' : 'border-primary-100 bg-transparent'}`}>
                    <FileText className="w-3.5 h-3.5 text-dark-300 shrink-0" />
                    {kodebpk
                      ? <span className="font-mono text-dark-500 text-xs">{kodebpk}</span>
                      : <span className="text-dark-300 text-xs">Opsional — kosongkan jika tanpa referensi BPK</span>
                    }
                  </div>
                  <button onClick={() => setShowBPKModal(true)}
                    className="px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors shrink-0">
                    Browse BPK
                  </button>
                  {kodebpk && (
                    <button onClick={() => { setidbpk(null); setkodebpk(''); }}
                      className="p-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Catatan */}
              <div className="col-span-2 order-5">
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Catatan</label>
                <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={2}
                  placeholder="Opsional..."
                  className="w-full px-3 py-2 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none" />
              </div>

              {/* Customer — spans full width */}
              <div className="col-span-2 order-4">
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

          {/* ────── SECTION 2: DETAIL ────── */}
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
              <table className="w-full min-w-[1080px] text-sm">
                <thead>
                  <tr className="border-b border-primary-50 bg-warm-50/30">
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-dark-300 w-10">No</th>
                    <th className="text-left   px-3 py-2.5 text-xs font-semibold text-dark-300 w-28">Kode</th>
                    <th className="text-left   px-3 py-2.5 text-xs font-semibold text-dark-300">Nama Barang</th>
                    <th className="text-left   px-3 py-2.5 text-xs font-semibold text-dark-300 w-28">Satuan</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-dark-300 w-20">Stok</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-dark-300 w-20">Jumlah</th>
                    <th className="text-right  px-3 py-2.5 text-xs font-semibold text-dark-300 w-36">Harga Jual</th>
                    <th className="text-right  px-3 py-2.5 text-xs font-semibold text-dark-300 w-24">Diskon %</th>
                    <th className="text-right  px-3 py-2.5 text-xs font-semibold text-dark-300 w-32">Subtotal</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-dark-300 w-36">PPN</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {computedItems.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-12 text-center text-sm text-dark-300">
                        Belum ada barang. Klik{' '}
                        <span className="font-semibold text-primary-500">Tambah Barang</span>{' '}
                        untuk menambahkan.
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
                        <td className={`px-3 py-2.5 text-center font-mono text-xs font-semibold ${Number(rawItem.stok) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {Number(rawItem.stok || 0)}
                        </td>
                        <td className="px-3 py-2.5">
                          <input type="text" value={rawItem.jml}
                            onChange={e => updateItem(idx, 'jml', e.target.value)}
                            placeholder="0"
                            className={`w-full px-2 py-1.5 rounded-lg border text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary-500/20 ${
                              !isJmlValid(rawItem.jml) ? 'border-red-300 bg-red-50 text-red-700' : 'border-primary-100'
                            }`} />
                        </td>
                        <td className="px-3 py-2.5">
                          <input type="text" value={rawItem.harga}
                            onChange={e => updateItem(idx, 'harga', e.target.value)}
                            placeholder="0"
                            className={`w-full px-2 py-1.5 rounded-lg border text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary-500/20 ${
                              rawItem.harga && !isFloatValid(rawItem.harga) ? 'border-red-300 bg-red-50 text-red-700' : 'border-primary-100'
                            }`} />
                        </td>
                        <td className="px-3 py-2.5">
                          <input type="text" value={rawItem.diskon}
                            onChange={e => updateItem(idx, 'diskon', e.target.value)}
                            placeholder="0"
                            className={`w-full px-2 py-1.5 rounded-lg border text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary-500/20 ${
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

          {/* ────── SECTION 3: FOOTER ────── */}
          <div className="bg-white rounded-2xl border border-primary-50 p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-6">
                  <span className="text-xs text-dark-300 w-28 text-right">Total Diskon:</span>
                  <span className="text-sm font-semibold text-red-500 font-mono w-40 text-right">
                    {totalDiskon === 0 ? '0' : `-${formatRupiah(totalDiskon)}`}
                  </span>
                </div>
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
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Menyimpan...' : 'Simpan dan Approve'}
                </button>}
                <label className="flex items-center gap-2 cursor-pointer ml-2">
                  <input type="checkbox" checked={langsungLunas} onChange={e => setLangsungLunas(e.target.checked)}
                    disabled={isLocked}
                    className="w-4 h-4 rounded accent-primary-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50" />
                  <span className="text-xs text-dark-400 font-medium">Langsung Lunas</span>
                </label>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Modals ── */}
      {showBPKModal && (
        <BrowseBPKModal
          onSelect={handleSelectBPK}
          onClose={() => setShowBPKModal(false)}
        />
      )}
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
          onSelect={addBarang}
          onClose={() => setShowBarangModal(false)}
        />
      )}
    </div>
  );
}
