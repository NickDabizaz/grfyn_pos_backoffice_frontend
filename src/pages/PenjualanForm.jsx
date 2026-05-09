import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { formatRupiah, today } from '../lib/utils';
import toast from 'react-hot-toast';
import { ArrowLeft, Search, Trash2, MapPin, Users, Plus, Printer, ChevronDown } from 'lucide-react';
import useTabStore from '../store/tabStore';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';

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
  <th class="r" style="width:60px">Diskon</th>
  <th class="r" style="width:80px">PPN</th>
  <th class="r" style="width:100px">Subtotal</th>
</tr></thead><tbody>
${items.map((item, i) => `<tr>
  <td class="c">${i + 1}</td>
  <td>${item.kodebarang || ''}</td>
  <td>${item.namabarang || ''}</td>
  <td class="c">${item.satuan || item.satuankecil || ''}</td>
  <td class="r">${item.jml}</td>
  <td class="r">${Number(item.harga).toLocaleString('id-ID')}</td>
  <td class="r">${Number(item.diskon || 0).toLocaleString('id-ID')}</td>
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

function BrowseCustomerModal({ onSelect, onClose }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  useEffect(() => {
    api.get('/customer', search ? { params: { search } } : {}).then(r => setCustomers(r.data));
  }, [search]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-primary-50">
          <h3 className="text-sm font-bold text-dark-500">Pilih Customer</h3>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
            <input value={search} onChange={e => setSearch(e.target.value.toUpperCase())}
              placeholder="Cari customer..." autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-0.5">
            {customers.length === 0 && (
              <p className="text-sm text-dark-300 text-center py-6">Tidak ada customer ditemukan</p>
            )}
            {customers.map(c => (
              <button key={c.idcustomer} onClick={() => onSelect(c)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-warm-50 transition-colors">
                <p className="text-sm font-semibold text-dark-500">{c.namacustomer}</p>
                <p className="text-xs text-dark-300">{c.kodecustomer}{c.hp ? ` \u2022 ${c.hp}` : ''}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BrowseLokasiModal({ onSelect, onClose }) {
  const [lokasiList, setLokasiList] = useState([]);
  useEffect(() => { api.get('/lokasi').then(r => setLokasiList(r.data)); }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-primary-50">
          <h3 className="text-sm font-bold text-dark-500">Pilih Lokasi</h3>
        </div>
        <div className="p-4 space-y-0.5 max-h-64 overflow-y-auto scrollbar-thin">
          {lokasiList.map(l => (
            <button key={l.idlokasi} onClick={() => onSelect(l)}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-warm-50 transition-colors">
              <p className="text-sm font-semibold text-dark-500">{l.namalokasi}</p>
              <p className="text-xs text-dark-300">{l.kodelokasi}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BrowseBarangModal({ onSelect, onClose }) {
  const [barangList, setBarangList] = useState([]);
  const [search, setSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      const params = search ? { search } : {};
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
                    <th className="text-right px-3 py-2 text-xs text-dark-300">Harga Jual</th>
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
                      <td className="px-3 py-2.5 text-right font-mono text-dark-400 text-xs">
                        {formatRupiah(b.hargajual_terbaru)}
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

function PpnDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  const isInclude = value === 'INCLUDE';
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`flex items-center justify-between gap-1.5 w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
          isInclude ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
        }`}>
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isInclude ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {isInclude ? 'INCLUDE' : 'TIDAK'}
        </span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 left-0 right-0 bg-white rounded-xl border border-primary-100 shadow-lg min-w-[130px]">
          <button type="button" onClick={() => { onChange('INCLUDE'); setOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors first:rounded-t-xl ${
              isInclude ? 'bg-emerald-50 text-emerald-700' : 'text-dark-500 hover:bg-emerald-50 hover:text-emerald-700'
            }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> INCLUDE
          </button>
          <button type="button" onClick={() => { onChange('TIDAK_PAKAI'); setOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors last:rounded-b-xl ${
              !isInclude ? 'bg-red-50 text-red-700' : 'text-dark-500 hover:bg-red-50 hover:text-red-700'
            }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> TIDAK
          </button>
        </div>
      )}
    </div>
  );
}

function getSatuanOptions(item) {
  const opts = [];
  if (item.satuanbesar) opts.push(item.satuanbesar);
  if (item.satuansedang) opts.push(item.satuansedang);
  if (item.satuankecil) opts.push(item.satuankecil);
  return opts.length ? opts : ['PCS'];
}

function getDefaultSatuan(b) {
  const s = [b.satuanbesar, b.satuansedang, b.satuankecil].find(v => v && String(v).trim());
  return s ? String(s).trim() : 'PCS';
}

function isJmlValid(val) {
  const s = String(val).trim();
  return s !== '' && /^\d+$/.test(s) && parseInt(s, 10) > 0;
}

export default function PenjualanForm({ onSuccess, tabId, editData }) {
  const user       = useAuthStore(s => s.user);
  const lokasiAuth = useAuthStore(s => s.lokasi);
  const closeTab   = useTabStore(s => s.closeTab);

  const isEdit = !!editData;
  const defaultPpnMode = (user?.ppn ?? 11) > 0 ? 'INCLUDE' : 'TIDAK_PAKAI';

  const [autoGenerate, setAutoGenerate] = useState(!isEdit);
  const [kodejual, setKodejual]         = useState(editData?.kodejual || '');
  const [lokasi, setLokasi]             = useState(
    isEdit
      ? (editData.idlokasi ? { idlokasi: editData.idlokasi, namalokasi: editData.namalokasi, kodelokasi: editData.kodelokasi } : null)
      : (lokasiAuth || null)
  );
  const [tgltrans, setTgltrans]         = useState(editData?.tgltrans ? String(editData.tgltrans).slice(0, 10) : today());
  const [customer, setCustomer]         = useState(
    isEdit && editData.idcustomer
      ? { idcustomer: editData.idcustomer, kodecustomer: editData.kodecustomer, namacustomer: editData.namacustomer, alamat: editData.alamat, hp: editData.hp }
      : null
  );
  const [metodbayar, setMetodbayar]     = useState(editData?.metodbayar || 'TUNAI');
  const [langsungLunas, setLangsungLunas] = useState(editData?.statuslunas == 'LUNAS');

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
          satuan:       item.satuan || getDefaultSatuan(item),
          jml:          Number(item.jml),
          harga:        parseFloat(item.harga) || 0,
          diskon:       parseFloat(item.diskon) || 0,
          ppn_mode:     item.ppn > 0 ? 'INCLUDE' : 'TIDAK_PAKAI',
        }))
      : []
  );

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showLokasiModal, setShowLokasiModal]     = useState(false);
  const [showBarangModal, setShowBarangModal]     = useState(false);
  const [loading, setLoading] = useState(false);
  const ppnPercent = user?.ppn || 11;

  const addBarang = (b) => {
    if (items.find(i => i.idbarang === b.idbarang)) {
      toast('Barang sudah ada di tabel. Ubah jumlah pada baris terkait.', { icon: '\u2139\uFE0F' });
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
      satuan:       getDefaultSatuan(b),
      jml:          '1',
      harga:        hargaJual,
      diskon:       0,
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
    const jml    = parseFloat(item.jml) || 0;
    const satuan = item.satuan;
    const base   = item.harga * jml;
    const diskonAmt = item.diskon ? (base * item.diskon) / 100 : 0;
    const ppnAmt = item.ppn_mode === 'INCLUDE' ? ((base - diskonAmt) * ppnPercent) / 100 : 0;
    return { ...item, jml, satuan, diskonAmt, ppnAmt, subtotal: base - diskonAmt + ppnAmt };
  });

  const totalPpn    = computedItems.reduce((s, i) => s + i.ppnAmt, 0);
  const totalDiskon = computedItems.reduce((s, i) => s + i.diskonAmt, 0);
  const grandTotal  = computedItems.reduce((s, i) => s + i.subtotal, 0);

  const handleSubmit = async (shouldPrint = false) => {
    if (items.length === 0) return toast.error('Tambahkan barang terlebih dahulu');

    const parsedItems = items.map(i => {
      const n = Number(i.jml);
      return { ...i, jml: isNaN(n) ? i.jml : n };
    });

    const invalidIdx = parsedItems.findIndex(i => !isJmlValid(i.jml));
    if (invalidIdx !== -1) {
      return toast.error(`Jumlah pada baris ${invalidIdx + 1} harus angka bulat positif`);
    }

    if (!autoGenerate && !kodejual.trim()) return toast.error('Kode jual wajib diisi');
    setLoading(true);
    try {
      const payload = {
        kodejual:    autoGenerate ? null : kodejual.trim(),
        tgltrans,
        idcustomer:  customer?.idcustomer || null,
        idlokasi:    lokasi?.idlokasi     || null,
        jenis:       'JUAL',
        metodbayar,
        useppn:      true,
        bayar:       grandTotal,
        langsung_lunas: langsungLunas,
        items: computedItems.map(i => ({
          idbarang: i.idbarang,
          jml:      i.jml,
          harga:    i.harga,
          diskon:   i.diskon || 0,
          satuan:   i.satuan && String(i.satuan).trim() ? String(i.satuan).trim() : 'PCS',
        })),
      };

      let res;
      if (isEdit) {
        res = await api.put(`/jual/${editData.idjual}`, payload);
      } else {
        res = await api.post('/jual', payload);
      }

      toast.success(isEdit ? 'Penjualan berhasil diupdate!' : 'Penjualan berhasil disimpan!');

      if (shouldPrint) {
        try {
          const idjual = res.data.idjual;
          const { data: fullData } = await api.get(`/jual/${idjual}`);
          printFaktur(fullData, user);
        } catch {
          toast.error('Gagal memuat data untuk cetak');
        }
      }

      if (onSuccess) onSuccess();
      closeTab(tabId);
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
          <h2 className="text-lg font-bold text-dark-500">{isEdit ? `Edit ${editData?.kodejual || 'Penjualan'}` : 'Penjualan Baru'}</h2>
          <p className="text-xs text-dark-300">{isEdit ? 'Edit transaksi penjualan' : 'Form input transaksi penjualan'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* SECTION 1: HEADER */}
          <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
            <div className="px-5 py-3 border-b border-primary-50 bg-warm-50/50">
              <h3 className="text-xs font-bold text-dark-400 uppercase tracking-wider">Header</h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">

              {/* Kode Jual */}
              <div>
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
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Tanggal Transaksi</label>
                <Flatpickr 
                  value={tgltrans} 
                  // Gunakan dateStr (argumen kedua)
                  onChange={([d], dateStr) => setTgltrans(dateStr)} 
                  options={{ dateFormat: 'Y-m-d', locale: 'id' }}
                  className="flatpickr-input w-full" 
                />
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

              {/* Metode Bayar */}
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Metode Bayar</label>
                <select value={metodbayar} onChange={e => setMetodbayar(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                  <option value="TUNAI">TUNAI</option>
                  <option value="NON TUNAI">NON TUNAI</option>
                </select>
              </div>

              {/* Customer — spans full width */}
              <div className="col-span-2">
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

          {/* SECTION 2: DETAIL BARANG */}
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
                        <td className="px-3 py-2.5">
                          <input type="text" value={rawItem.jml}
                            onChange={e => updateItem(idx, 'jml', e.target.value)}
                            placeholder="0"
                            className={`w-full px-2 py-1.5 rounded-lg border text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary-500/20 ${
                              !isJmlValid(rawItem.jml) ? 'border-red-300 bg-red-50 text-red-700' : 'border-primary-100'
                            }`} />
                        </td>
                        <td className="px-3 py-2.5">
                          <input type="number" min="0" value={item.harga}
                            onChange={e => updateItem(idx, 'harga', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 rounded-lg border border-primary-100 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary-500/20" />
                        </td>
                        <td className="px-3 py-2.5">
                          <input type="number" min="0" max="100" value={item.diskon}
                            onChange={e => updateItem(idx, 'diskon', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 rounded-lg border border-primary-100 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary-500/20" />
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

          {/* SECTION 3: FOOTER */}
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

      {/* Modals */}
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
          onSelect={addBarang}
          onClose={() => setShowBarangModal(false)}
        />
      )}
    </div>
  );
}
