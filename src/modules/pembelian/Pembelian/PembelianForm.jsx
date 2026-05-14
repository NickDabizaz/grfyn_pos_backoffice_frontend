import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { useAuthStore } from '../../../store/authStore';
import { formatRupiah, today } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { ArrowLeft, Search, Trash2, MapPin, Users, Plus, Printer, FileText, X } from 'lucide-react';
import useTabStore from '../../../store/tabStore';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';
import { BrowseSupplierModal, BrowseLokasiModal, BrowseGRNModal, PpnDropdown, getSatuanOptions, getDefaultSatuan, isJmlValid, isFloatValid, parseFloatVal } from '../../../lib/formHelpers';

function printFaktur(data, user) {
  const items = data.items || [];
  const ppnTotal = items.reduce((s, i) => s + parseFloat(i.ppn || 0), 0);
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Faktur Pembelian - ${data.kodebeli}</title>
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
<p class="center" style="color:#888;margin:0 0 12px">FAKTUR PEMBELIAN</p>
<div class="info">
  <span>Kode Beli</span><span>${data.kodebeli}</span>
  <span>Tanggal</span><span>${String(data.tgltrans || '').slice(0, 10)}</span>
  <span>Supplier</span><span>${data.namasupplier || '-'}</span>
  <span>Lokasi</span><span>${data.namalokasi || '-'}</span>
</div>
<table><thead><tr>
  <th style="width:32px">No</th><th>Kode</th><th>Nama Barang</th>
  <th class="c" style="width:60px">Sat</th>
  <th class="r" style="width:50px">Jml</th>
  <th class="r" style="width:90px">Harga</th>
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

function BrowseBarangModal({ onSelect, onClose }) {
  const [barangList, setBarangList] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      const params = { excludeJenis: 'BARANG JADI' };
      if (search) params.search = search;
      api.get('/barang/browse-barang', { params }).then(r => setBarangList(search ? r.data : r.data.slice(0, 10)));
    }, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-primary-50">
          <h3 className="text-sm font-bold text-dark-500">Pilih Barang</h3>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
            <input value={search} onChange={e => setSearch(e.target.value.toUpperCase())}
              placeholder="Cari kode / nama barang..." autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            {barangList.length === 0 && (
              <p className="text-sm text-dark-300 text-center py-8">{search ? 'Tidak ada hasil' : 'Memuat...'}</p>
            )}
            {barangList.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary-50">
                    <th className="text-left px-3 py-2 text-xs text-dark-300">Kode</th>
                    <th className="text-left px-3 py-2 text-xs text-dark-300">Nama Barang</th>
                    <th className="text-left px-3 py-2 text-xs text-dark-300">Satuan</th>
                    <th className="text-right px-3 py-2 text-xs text-dark-300">Stok</th>
                    <th className="text-right px-3 py-2 text-xs text-dark-300">Harga Beli</th>
                  </tr>
                </thead>
                <tbody>
                  {barangList.map(b => (
                    <tr key={b.idbarang} onClick={() => onSelect(b)}
                      className="border-b border-primary-50/50 hover:bg-warm-50 cursor-pointer transition-colors">
                      <td className="px-3 py-2.5 text-xs font-mono text-dark-300">{b.kodebarang}</td>
                      <td className="px-3 py-2.5 font-medium text-dark-500">{b.namabarang}</td>
                      <td className="px-3 py-2.5 text-dark-400 text-xs">
                        {b.satuanbesar || b.satuansedang || b.satuankecil || '-'}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-mono text-xs font-semibold ${Number(b.stok) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {Number(b.stok || 0)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-dark-400 text-xs">
                        {formatRupiah(b.hargabeli_terbaru)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PembelianForm({ onSuccess, tabId, editData }) {
  const user       = useAuthStore(s => s.user);
  const lokasiAuth = useAuthStore(s => s.lokasi);
  const closeTab   = useTabStore(s => s.closeTab);

  const isEdit = !!editData;
  const defaultPpnMode = (user?.ppn ?? 11) > 0 ? 'INCLUDE' : 'TIDAK_PAKAI';

  const [autoGenerate, setAutoGenerate] = useState(!isEdit);
  const [kodebeli, setKodebeli]         = useState(editData?.kodebeli || '');
  const [lokasi, setLokasi]             = useState(
    isEdit
      ? (editData.idlokasi ? { idlokasi: editData.idlokasi, namalokasi: editData.namalokasi, kodelokasi: editData.kodelokasi } : null)
      : (lokasiAuth || null)
  );
  const [tgltrans, setTgltrans]         = useState(editData?.tgltrans ? String(editData.tgltrans).slice(0, 10) : today());
  const [supplier, setSupplier]         = useState(
    isEdit
      ? (editData.idsupplier ? { idsupplier: editData.idsupplier, kodesupplier: editData.kodesupplier, namasupplier: editData.namasupplier, alamat: editData.salamat, hp: editData.shp } : null)
      : null
  );

  const [items, setItems] = useState(
    editData?.items
      ? editData.items.map(item => ({
          idbarang:        item.idbarang,
          kodebarang:     item.kodebarang,
          namabarang:      item.namabarang,
          satuanbesar:     item.satuanbesar  || null,
          satuansedang:    item.satuansedang || null,
          satuankecil:     item.satuankecil  || null,
          konversi1:       item.konversi1    || 0,
          konversi2:       item.konversi2    || 0,
          stok:            item.stok         || 0,
          satuan:          item.satuan || getDefaultSatuan(item),
          jml:             String(item.jml),
          harga_sebelumnya: parseFloat(item.harga) || 0,
          harga:           String(parseFloat(item.harga) || 0),
          ppn_mode:        item.ppn_mode || defaultPpnMode,
        }))
      : []
  );

  const [idgrn, setIdgrn]     = useState(editData?.idgrn   || null);
  const [kodegrn, setKodegrn] = useState(editData?.kodegrn || '');
  const [catatan, setCatatan] = useState(editData?.catatan || '');

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showLokasiModal, setShowLokasiModal]     = useState(false);
  const [showBarangModal, setShowBarangModal]     = useState(false);
  const [showGRNModal, setShowGRNModal]           = useState(false);

  const [loading, setLoading] = useState(false);
  const [langsungLunas, setLangsungLunas] = useState(editData?.statuslunas == 'LUNAS');
  const ppnPercent = user?.ppn || 11;

  const handleSelectGRN = async (grn) => {
    setShowGRNModal(false);
    try {
      const { data } = await api.get(`/grn/${grn.idgrn}`);
      setIdgrn(data.idgrn);
      setKodegrn(data.kodegrn);
      if (data.idsupplier) {
        setSupplier({
          idsupplier:   data.idsupplier,
          kodesupplier: data.kodesupplier,
          namasupplier: data.namasupplier,
          alamat:       data.salamat,
          hp:           data.shp,
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
          idbarang:        item.idbarang,
          kodebarang:      item.kodebarang,
          namabarang:      item.namabarang,
          satuanbesar:     item.satuanbesar  || null,
          satuansedang:    item.satuansedang || null,
          satuankecil:     item.satuankecil  || null,
          konversi1:       item.konversi1    || 0,
          konversi2:       item.konversi2    || 0,
          stok:            0,
          satuan:          item.satuan || getDefaultSatuan(item),
          jml:             '0',
          harga_sebelumnya: parseFloat(item.harga) || 0,
          harga:           String(parseFloat(item.harga) || 0),
          ppn_mode:        defaultPpnMode,
        })));
      }
    } catch {
      toast.error('Gagal memuat data GRN');
    }
  };

  const addBarang = (b) => {
    if (items.find(i => i.idbarang === b.idbarang)) {
      toast('Barang sudah ada di tabel. Ubah jumlah pada baris terkait.', { icon: 'ℹ️' });
      setShowBarangModal(false);
      return;
    }
    const hargaSebelumnya = parseFloat(b.hargabeli_terbaru || 0);
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
      satuan:           getDefaultSatuan(b),
      jml:              '1',
      harga_sebelumnya: hargaSebelumnya,
      harga:            String(hargaSebelumnya || ''),
      ppn_mode:         defaultPpnMode,
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
    const jml    = parseFloat(item.jml) || 0;
    const harga  = parseFloatVal(item.harga);
    const base   = harga * jml;
    const ppnAmt = item.ppn_mode === 'INCLUDE' ? (base * ppnPercent) / 100 : 0;
    return { ...item, jml, harga, ppnAmt, subtotal: base + ppnAmt };
  });

  const totalPpn   = computedItems.reduce((s, i) => s + i.ppnAmt, 0);
  const grandTotal = computedItems.reduce((s, i) => s + i.subtotal, 0);

  const handleSubmit = async (shouldPrint = false) => {
    if (items.length === 0) return toast.error('Tambahkan barang terlebih dahulu');
    if (!lokasi?.idlokasi) return toast.error('Lokasi wajib dipilih');
    if (!supplier?.idsupplier) return toast.error('Supplier wajib dipilih');

    const parsedItems = items.map(i => {
      const n = Number(i.jml);
      return { ...i, jml: isNaN(n) ? i.jml : n };
    });

    const invalidIdx = parsedItems.findIndex(i => !isJmlValid(i.jml));
    if (invalidIdx !== -1) {
      return toast.error(`Jumlah pada baris ${invalidIdx + 1} harus angka bulat positif`);
    }

    if (!autoGenerate && !kodebeli.trim()) return toast.error('Kode beli wajib diisi');
    setLoading(true);
    try {
      const payload = {
        kodebeli:   autoGenerate ? null : kodebeli.trim(),
        tgltrans,
        idsupplier: supplier.idsupplier,
        idlokasi:   lokasi.idlokasi,
        grandtotal: grandTotal,
        bayar:      langsungLunas ? grandTotal : 0,
        langsung_lunas: langsungLunas,
        idgrn:      idgrn || null,
        kodegrn:    kodegrn || null,
        catatan:    catatan || null,
        items: computedItems.map(i => ({
          idbarang: i.idbarang,
          jml:      i.jml,
          harga:    i.harga,
          satuan:   i.satuan && String(i.satuan).trim() ? String(i.satuan).trim() : 'PCS',
          ppn_mode: i.ppn_mode,
        })),
      };

      let res;
      if (isEdit) {
        res = await api.put(`/beli/${editData.idbeli}`, payload);
      } else {
        res = await api.post('/beli', payload);
      }

      toast.success(isEdit ? 'Pembelian berhasil diupdate!' : 'Pembelian berhasil disimpan!');

      if (shouldPrint) {
        try {
          const idbeli = isEdit ? editData.idbeli : res.data.idbeli;
          const { data: fullData } = await api.get(`/beli/${idbeli}`);
          printFaktur(fullData, user);
        } catch {
          toast.error('Gagal memuat data untuk cetak');
        }
      }

      if (onSuccess) onSuccess();
      if (!isEdit) closeTab(tabId);
    } catch (err) {
      console.log(err)
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
          <h2 className="text-lg font-bold text-dark-500">{isEdit ? `Edit ${editData?.kodebeli || 'Pembelian'}` : 'Pembelian Baru'}</h2>
          <p className="text-xs text-dark-300">{isEdit ? 'Edit transaksi pembelian' : 'Form input transaksi pembelian'}</p>
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

              {/* Kode Beli */}
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Kode Beli</label>
                {isEdit ? (
                  <div className="px-3 py-2 rounded-xl border border-primary-100 bg-warm-50/40 text-sm text-dark-400 font-mono">
                    {kodebeli}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      disabled={autoGenerate}
                      value={autoGenerate ? '(Auto-generate)' : kodebeli}
                      onChange={e => setKodebeli(e.target.value.toUpperCase())}
                      placeholder="Masukkan kode beli..."
                      className="flex-1 px-3 py-2 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-warm-50 disabled:text-dark-300 disabled:cursor-not-allowed"
                    />
                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                      <input type="checkbox" checked={autoGenerate}
                        onChange={e => { setAutoGenerate(e.target.checked); if (e.target.checked) setKodebeli(''); }}
                        className="w-3.5 h-3.5 rounded accent-primary-500" />
                      <span className="text-xs text-dark-400 font-medium">Generate</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Tanggal Transaksi */}
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Tanggal Transaksi</label>
                <Flatpickr value={tgltrans} onChange={([d]) => setTgltrans(d.toISOString().slice(0, 10))}
                  options={{ dateFormat: 'Y-m-d', locale: 'id' }}
                  className="flatpickr-input w-full" placeholder="Pilih tanggal" />
              </div>

              {/* Lokasi */}
              <div>
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

              {/* Kode Referensi GRN — optional */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Kode GRN (Referensi, Opsional)</label>
                <div className="flex items-center gap-2">
                  <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm min-h-[38px] ${idgrn ? 'border-primary-100 bg-warm-50/40' : 'border-primary-100 bg-transparent'}`}>
                    <FileText className="w-3.5 h-3.5 text-dark-300 shrink-0" />
                    {kodegrn
                      ? <span className="font-mono text-dark-500 text-xs">{kodegrn}</span>
                      : <span className="text-dark-300 text-xs">Opsional — kosongkan jika tanpa referensi GRN</span>
                    }
                  </div>
                  <button onClick={() => setShowGRNModal(true)}
                    className="px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors shrink-0">
                    Browse GRN
                  </button>
                  {kodegrn && (
                    <button onClick={() => { setIdgrn(null); setKodegrn(''); }}
                      className="p-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Catatan — spans full width */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Catatan</label>
                <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={2}
                  placeholder="Opsional..."
                  className="w-full px-3 py-2 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none" />
              </div>

              {/* Supplier — spans full width */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Supplier</label>
                <div className="flex items-start gap-3">
                  <button onClick={() => setShowSupplierModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors shrink-0">
                    <Users className="w-3.5 h-3.5" /> Browse Supplier
                  </button>
                  {supplier ? (
                    <div className="flex-1 grid grid-cols-4 gap-3 p-3 rounded-xl border border-primary-100 bg-warm-50/30">
                      {[
                        { label: 'Kode Supplier', value: supplier.kodesupplier },
                        { label: 'Nama Supplier', value: supplier.namasupplier },
                        { label: 'Alamat',         value: supplier.alamat || '-' },
                        { label: 'No. HP',          value: supplier.hp    || '-' },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-[10px] text-dark-300 mb-0.5">{f.label}</p>
                          <p className="text-xs font-semibold text-dark-500 truncate" title={f.value}>{f.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 px-4 py-3 rounded-xl border border-dashed border-primary-100 text-xs text-dark-300 text-center">
                      Pilih Supplier
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
              <table className="w-full min-w-[960px] text-sm">
                <thead>
                  <tr className="border-b border-primary-50 bg-warm-50/30">
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-dark-300 w-10">No</th>
                    <th className="text-left   px-3 py-2.5 text-xs font-semibold text-dark-300 w-28">Kode</th>
                    <th className="text-left   px-3 py-2.5 text-xs font-semibold text-dark-300">Nama Barang</th>
                    <th className="text-left   px-3 py-2.5 text-xs font-semibold text-dark-300 w-28">Satuan</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-dark-300 w-20">Stok</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-dark-300 w-20">Jumlah</th>
                    <th className="text-right  px-3 py-2.5 text-xs font-semibold text-dark-300 w-36">Harga Beli Sblm</th>
                    <th className="text-right  px-3 py-2.5 text-xs font-semibold text-dark-300 w-36">Harga Beli</th>
                    <th className="text-right  px-3 py-2.5 text-xs font-semibold text-dark-300 w-32">Subtotal</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-dark-300 w-36">PPN</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {computedItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-sm text-dark-300">
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
                          <input type="text" value={Number(rawItem.jml)}
                            onChange={e => updateItem(idx, 'jml', e.target.value)}
                            placeholder="0"
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
                            placeholder="0"
                            className={`w-full px-2 py-1.5 rounded-lg border text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary-500/20 ${
                              rawItem.harga && !isFloatValid(rawItem.harga) ? 'border-red-300 bg-red-50 text-red-700' : 'border-primary-100'
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
                <button onClick={() => handleSubmit(false)} disabled={loading || items.length === 0}
                  className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button onClick={() => handleSubmit(true)} disabled={loading || items.length === 0}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <Printer className="w-4 h-4" />
                  {loading ? 'Menyimpan...' : 'Simpan dan Cetak'}
                </button>
                  <label className="flex items-center gap-2 cursor-pointer ml-2">
                    <input type="checkbox" checked={langsungLunas} onChange={e => setLangsungLunas(e.target.checked)}
                      className="w-4 h-4 rounded accent-primary-500 cursor-pointer" />
                    <span className="text-xs text-dark-400 font-medium">Langsung Lunas</span>
                  </label>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Modals ── */}
      {showGRNModal && (
        <BrowseGRNModal
          onSelect={handleSelectGRN}
          onClose={() => setShowGRNModal(false)}
        />
      )}
      {showSupplierModal && (
        <BrowseSupplierModal
          onSelect={s => { setSupplier(s); setShowSupplierModal(false); }}
          onClose={() => setShowSupplierModal(false)}
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
          onSelect={addBarang}
          onClose={() => setShowBarangModal(false)}
        />
      )}
    </div>
  );
}
