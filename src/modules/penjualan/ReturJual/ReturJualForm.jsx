import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { useAuthStore } from '../../../store/authStore';
import { formatRupiah, today } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2, Users, Plus, Printer, MapPin } from 'lucide-react';
import useTabStore from '../../../store/tabStore';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';
import { BrowseBarangModal, BrowseCustomerModal, BrowseLokasiModal, isJmlValid } from '../../../lib/formHelpers';

function printNotaRetur(data, user) {
  const items = data.items || [];
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Nota Retur - ${data.kodereturjual}</title>
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
<p class="center" style="color:#888;margin:0 0 12px">NOTA RETUR PENJUALAN</p>
<div class="info">
  <span>Kode Retur</span><span>${data.kodereturjual}</span>
  <span>Tanggal</span><span>${String(data.tgltrans || '').slice(0, 10)}</span>
  <span>Customer</span><span>${data.namacustomer || '-'}</span>
  <span>Kode Jual</span><span>${data.kodejual || '-'}</span>
</div>
<table><thead><tr>
  <th style="width:32px">No</th><th>Kode</th><th>Nama Barang</th>
  <th class="r" style="width:50px">Jml</th>
  <th class="r" style="width:90px">Harga</th>
  <th class="r" style="width:100px">Subtotal</th>
  <th class="c" style="width:140px">Tindak Lanjut</th>
</tr></thead><tbody>
${items.map((item, i) => `<tr>
  <td class="c">${i + 1}</td>
  <td>${item.kodebarang || ''}</td>
  <td>${item.namabarang || ''}</td>
  <td class="r">${item.jml}</td>
  <td class="r">${Number(item.harga).toLocaleString('id-ID')}</td>
  <td class="r">${Number(item.subtotal).toLocaleString('id-ID')}</td>
  <td class="c">${item.tindaklanjut || '-'}${item.namabarang2nd ? ' \u2192 ' + item.namabarang2nd : ''}</td>
</tr>`).join('')}
</tbody></table>
<div class="totals">
  <div class="grand">Total: ${Number(data.total).toLocaleString('id-ID')}</div>
</div>
</body></html>`;
  const w = window.open('', '_blank', 'width=820,height=640');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}

export default function ReturJualForm({ onSuccess, tabId, editData }) {
  const user     = useAuthStore(s => s.user);
  const lokasiAuth = useAuthStore(s => s.lokasi);
  const closeTab = useTabStore(s => s.closeTab);
  const isEdit   = !!editData;

  const [tgltrans, setTgltrans] = useState(editData?.tgltrans ? String(editData.tgltrans).slice(0, 10) : today());
  const [lokasi, setLokasi] = useState(
    isEdit && editData.idlokasi
      ? { idlokasi: editData.idlokasi, namalokasi: editData.namalokasi, kodelokasi: editData.kodelokasi }
      : (lokasiAuth || null)
  );
  const [customer, setCustomer] = useState(
    isEdit && editData.idcustomer
      ? { idcustomer: editData.idcustomer, kodecustomer: editData.kodecustomer, namacustomer: editData.namacustomer }
      : null
  );
  const [kodejual, setKodejual] = useState(editData?.kodejual || '');
  const [idjualRef, setIdjualRef] = useState(editData?.idjual || null);
  const [catatan, setCatatan]   = useState(editData?.catatan || '');

  const [items, setItems] = useState(
    editData?.items
      ? editData.items.map(item => ({
          idbarang:     item.idbarang,
          kodebarang:   item.kodebarang,
          namabarang:   item.namabarang,
          satuan:       item.satuankecil || '',
          jml:          String(item.jml),
          harga:        parseFloat(item.harga) || 0,
          tindaklanjut: item.tindaklanjut || 'MASUK_STOK',
          idbarang2nd:  item.idbarang2nd || null,
          namabarang2nd: item.namabarang2nd || '',
        }))
      : []
  );

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showLokasiModal, setShowLokasiModal]     = useState(false);
  const [showBarangModal, setShowBarangModal]     = useState(false);
  const [showBarang2ndModal, setShowBarang2ndModal] = useState(false);
  const [barang2ndForIdx, setBarang2ndForIdx]     = useState(null);
  const [loading, setLoading] = useState(false);

  const addBarang = (b) => {
    if (items.find(i => i.idbarang === b.idbarang)) {
      toast('Barang sudah ada di tabel.', { icon: '\u2139\uFE0F' });
      setShowBarangModal(false);
      return;
    }
    setItems(prev => [...prev, {
      idbarang:     b.idbarang,
      kodebarang:   b.kodebarang,
      namabarang:   b.namabarang,
      satuan:       b.satuankecil || '',
      jml:          '1',
      harga:        parseFloat(b.hargajual_terbaru || 0),
      tindaklanjut: 'MASUK_STOK',
      idbarang2nd:  null,
      namabarang2nd: '',
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
    const jml      = parseFloat(item.jml) || 0;
    const subtotal = item.harga * jml;
    return { ...item, jml, subtotal };
  });

  const total = computedItems.reduce((s, i) => s + i.subtotal, 0);

  const handleSubmit = async (shouldPrint = false) => {
    if (items.length === 0) return toast.error('Tambahkan barang terlebih dahulu');
    if (!lokasi?.idlokasi) return toast.error('Lokasi wajib dipilih');
    if (!customer?.idcustomer) return toast.error('Customer wajib dipilih');

    const invalidIdx = items.findIndex(i => !isJmlValid(i.jml));
    if (invalidIdx !== -1) {
      return toast.error(`Jumlah pada baris ${invalidIdx + 1} harus angka bulat positif`);
    }

    for (let i = 0; i < items.length; i++) {
      if (items[i].tindaklanjut === 'MASUK_STOK_2ND' && !items[i].idbarang2nd) {
        return toast.error(`Barang pengganti wajib dipilih pada baris ${i + 1} (MASUK_STOK_2ND)`);
      }
    }

    setLoading(true);
    try {
      const payload = {
        tgltrans,
        idlokasi:    lokasi.idlokasi,
        idcustomer:  customer.idcustomer,
        idjual:      idjualRef || null,
        kodejual:    kodejual || null,
        catatan:     catatan || null,
        items: computedItems.map(i => ({
          idbarang:     i.idbarang,
          jml:          i.jml,
          harga:        i.harga,
          tindaklanjut: i.tindaklanjut,
          idbarang2nd:  i.tindaklanjut === 'MASUK_STOK_2ND' ? (i.idbarang2nd || null) : null,
        })),
      };

      let res;
      if (isEdit) {
        res = await api.put(`/returjual/${editData.idreturjual}`, payload);
      } else {
        res = await api.post('/returjual', payload);
      }

      toast.success(isEdit ? 'Retur berhasil diupdate!' : 'Retur berhasil disimpan!');

      if (shouldPrint) {
        try {
          const id = isEdit ? editData.idreturjual : res.data.idreturjual;
          const { data: fullData } = await api.get(`/returjual/${id}`);
          printNotaRetur(fullData, user);
        } catch {
          toast.error('Gagal memuat data untuk cetak');
        }
      }

      if (onSuccess) onSuccess();
      if (!isEdit) closeTab(tabId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  const tindakLanjutOptions = [
    { value: 'MASUK_STOK',     label: 'MASUK STOK' },
    { value: 'MASUK_STOK_2ND', label: 'MASUK STOK 2ND' },
    { value: 'HANGUS',         label: 'HANGUS' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 pt-4 pb-3 border-b border-primary-50 shrink-0">
        <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-warm-50 text-dark-400">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-dark-500">{isEdit ? `Edit ${editData?.kodereturjual || 'Retur'}` : 'Retur Penjualan Baru'}</h2>
          <p className="text-xs text-dark-300">{isEdit ? 'Edit transaksi retur' : 'Form input retur penjualan'}</p>
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
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Tanggal</label>
                <Flatpickr value={tgltrans} onChange={([d]) => setTgltrans(d.toISOString().slice(0, 10))}
                  options={{ dateFormat: 'Y-m-d', locale: 'id' }}
                  className="flatpickr-input w-full" placeholder="Pilih tanggal" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Kode Jual (Referensi)</label>
                <input type="text" value={kodejual} onChange={e => setKodejual(e.target.value.toUpperCase())}
                  placeholder="Masukkan kode jual..."
                  className="w-full px-3 py-2 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Lokasi</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-100 bg-warm-50/40 text-sm min-h-[38px]">
                    <MapPin className="w-3.5 h-3.5 text-dark-300 shrink-0" />
                    {lokasi ? <span className="text-dark-500">{lokasi.namalokasi}</span> : <span className="text-dark-300">Pilih Lokasi...</span>}
                  </div>
                  <button onClick={() => setShowLokasiModal(true)}
                    className="px-3 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors shrink-0">
                    Browse
                  </button>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Customer</label>
                <div className="flex items-start gap-3">
                  <button onClick={() => setShowCustomerModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors shrink-0">
                    <Users className="w-3.5 h-3.5" /> Browse Customer
                  </button>
                  {customer ? (
                    <div className="flex-1 grid grid-cols-3 gap-3 p-3 rounded-xl border border-primary-100 bg-warm-50/30">
                      {[
                        { label: 'Kode Customer', value: customer.kodecustomer },
                        { label: 'Nama Customer', value: customer.namacustomer },
                        { label: 'No. HP', value: customer.hp || '-' },
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

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Catatan</label>
                <textarea value={catatan} onChange={e => setCatatan(e.target.value)}
                  placeholder="Catatan retur (opsional)..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none" />
              </div>
            </div>
          </div>

          {/* SECTION 2: DETAIL RETUR */}
          <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
            <div className="px-5 py-3 border-b border-primary-50 bg-warm-50/50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-dark-400 uppercase tracking-wider">
                Barang Dikembalikan
                {computedItems.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-md bg-red-100 text-red-600 text-[10px] font-bold">
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
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-dark-300 w-20">Jumlah</th>
                    <th className="text-right  px-3 py-2.5 text-xs font-semibold text-dark-300 w-36">Harga</th>
                    <th className="text-right  px-3 py-2.5 text-xs font-semibold text-dark-300 w-32">Subtotal</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-dark-300 w-44">Tindak Lanjut</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {computedItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-sm text-dark-300">
                        Belum ada barang. Klik{' '}
                        <span className="font-semibold text-primary-500">Tambah Barang</span>{' '}
                        untuk menambahkan.
                      </td>
                    </tr>
                  ) : computedItems.map((item, idx) => {
                    const rawItem = items[idx];
                    return (
                      <tr key={item.idbarang} className="border-b border-primary-50/50 hover:bg-warm-50/20 transition-colors">
                        <td className="px-3 py-2.5 text-center text-xs text-dark-300">{idx + 1}</td>
                        <td className="px-3 py-2.5 text-xs font-mono text-dark-300">{item.kodebarang}</td>
                        <td className="px-3 py-2.5 font-medium text-dark-500">{item.namabarang}</td>
                        <td className="px-3 py-2.5">
                          <input type="text" value={rawItem.jml}
                            onChange={e => updateItem(idx, 'jml', e.target.value)}
                            className={`w-full px-2 py-1.5 rounded-lg border text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary-500/20 ${
                              !isJmlValid(rawItem.jml) ? 'border-red-300 bg-red-50 text-red-700' : 'border-primary-100'
                            }`} />
                        </td>
                        <td className="px-3 py-2.5">
                          <input type="number" min="0" value={item.harga}
                            onChange={e => updateItem(idx, 'harga', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 rounded-lg border border-primary-100 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary-500/20" />
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs font-mono font-semibold text-dark-500">
                          {formatRupiah(item.subtotal)}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-1">
                            <select value={item.tindaklanjut}
                              onChange={e => {
                                updateItem(idx, 'tindaklanjut', e.target.value);
                                if (e.target.value !== 'MASUK_STOK_2ND') {
                                  updateItem(idx, 'idbarang2nd', null);
                                  updateItem(idx, 'namabarang2nd', '');
                                }
                              }}
                              className="w-full px-2 py-1.5 rounded-lg border border-primary-100 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary-500/20">
                              {tindakLanjutOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            {item.tindaklanjut === 'MASUK_STOK_2ND' && (
                              <div className="flex gap-1">
                                <div className="flex-1 text-[10px] px-2 py-1 rounded border border-primary-100 bg-warm-50/30 truncate">
                                  {item.namabarang2nd || 'Pilih barang pengganti'}
                                </div>
                                <button
                                  onClick={() => { setBarang2ndForIdx(idx); setShowBarang2ndModal(true); }}
                                  className="px-2 py-1 rounded border border-primary-100 text-[10px] font-semibold text-dark-400 hover:bg-warm-50 shrink-0">
                                  Browse
                                </button>
                              </div>
                            )}
                          </div>
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
              <div>
                <div className="flex items-center gap-6">
                  <span className="text-xs font-bold text-dark-500 w-20 text-right">Total:</span>
                  <span className="text-xl font-bold text-accent-600 font-mono w-40 text-right">
                    {formatRupiah(total)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => handleSubmit(false)} disabled={loading || items.length === 0}
                  className="px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-accent-500/20 active:scale-[0.98]">
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button onClick={() => handleSubmit(true)} disabled={loading || items.length === 0}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-primary-500/20 active:scale-[0.98]">
                  <Printer className="w-4 h-4" />
                  {loading ? 'Menyimpan...' : 'Simpan dan Cetak'}
                </button>
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
          showStock={false}
          onSelect={addBarang}
          onClose={() => setShowBarangModal(false)}
        />
      )}
      {showBarang2ndModal && barang2ndForIdx !== null && (
        <BrowseBarangModal
          showStock={false}
          onSelect={b => {
            updateItem(barang2ndForIdx, 'idbarang2nd', b.idbarang);
            updateItem(barang2ndForIdx, 'namabarang2nd', b.namabarang);
            setShowBarang2ndModal(false);
            setBarang2ndForIdx(null);
          }}
          onClose={() => { setShowBarang2ndModal(false); setBarang2ndForIdx(null); }}
        />
      )}
    </div>
  );
}
