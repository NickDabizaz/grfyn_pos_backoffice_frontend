import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { useAuthStore } from '../../../store/authStore';
import { formatRupiah, today } from '../../../lib/utils';
import toast from 'react-hot-toast';
import { ArrowLeft, Users } from 'lucide-react';
import useTabStore from '../../../store/tabStore';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/l10n/id.js';
import { BrowseCustomerModal } from '../../../lib/formHelpers';

const STATUS_BADGE = {
  DRAFT: 'bg-amber-50 text-amber-600 border-amber-100',
  APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  CANCELLED: 'bg-red-50 text-red-500 border-red-100',
};

export default function PelunasanPiutangForm({ onSuccess, tabId, editData }) {
  const user     = useAuthStore(s => s.user);
  const closeTab = useTabStore(s => s.closeTab);

  const isEdit = !!editData;
  const isLocked = isEdit && editData?.status !== 'DRAFT';

  const [autoGenerate, setAutoGenerate] = useState(!isEdit);
  const [kode, setKode]                 = useState(editData?.kodepelunasan || '');
  const [tgltrans, setTgltrans]         = useState(editData?.tgltrans ? String(editData.tgltrans).slice(0, 10) : today());
  const [customer, setCustomer]         = useState(
    isEdit && editData.idcustomer
      ? { idcustomer: editData.idcustomer, kodecustomer: editData.kodecustomer, namacustomer: editData.namacustomer }
      : null
  );
  const [metodbayar, setMetodbayar] = useState(editData?.metodbayar || 'TUNAI');
  const [catatan, setCatatan]       = useState(editData?.catatan || '');

  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [amounts, setAmounts] = useState({});

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customer) { setInvoices([]); setSelectedIds(new Set()); setAmounts({}); return; }
    setLoadingInvoices(true);
    api.get(`/kartupiutang/open-invoices/${customer.idcustomer}`)
      .then(r => {
        setInvoices(r.data || []);
        const sel = new Set();
        const amt = {};
        if (isEdit && editData?.details?.length) {
          editData.details.forEach(d => {
            sel.add(d.kodetrans);
            amt[d.kodetrans] = parseFloat(d.amount) || 0;
          });
        } else {
          (r.data || []).forEach(inv => {
            sel.add(inv.kodetrans);
            amt[inv.kodetrans] = parseFloat(inv.sisa) || 0;
          });
        }
        setSelectedIds(sel);
        setAmounts(amt);
      })
      .catch(() => toast.error('Gagal memuat invoice piutang'))
      .finally(() => setLoadingInvoices(false));
  }, [customer?.idcustomer]);

  const toggleInvoice = (kodetrans) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(kodetrans)) {
        next.delete(kodetrans);
      } else {
        next.add(kodetrans);
        if (!amounts[kodetrans]) {
          const inv = invoices.find(i => i.kodetrans === kodetrans);
          setAmounts(prevAmt => ({ ...prevAmt, [kodetrans]: parseFloat(inv?.sisa) || 0 }));
        }
      }
      return next;
    });
  };

  const updateAmount = (kodetrans, value) => {
    setAmounts(prev => ({ ...prev, [kodetrans]: parseFloat(value) || 0 }));
  };

  const computedDetails = invoices
    .filter(inv => selectedIds.has(inv.kodetrans))
    .map(inv => ({
      ...inv,
      payAmount: amounts[inv.kodetrans] || 0,
    }))
    .filter(d => d.payAmount > 0);

  const totalBayar = computedDetails.reduce((s, d) => s + d.payAmount, 0);

  const handleSubmit = async (approve = false) => {
    if (isLocked) return toast.error('Pelunasan yang sudah approve/cancel tidak bisa disimpan');
    if (!customer) return toast.error('Customer harus dipilih');
    if (computedDetails.length === 0) return toast.error('Pilih minimal satu invoice untuk dibayar');
    if (!autoGenerate && !kode.trim()) return toast.error('Kode pelunasan wajib diisi');

    setLoading(true);
    try {
      const payload = {
        idcustomer: customer.idcustomer,
        tgltrans,
        total_amount: totalBayar,
        metodbayar,
        catatan,
        approve,
        details: computedDetails.map(d => ({
          kodetrans: d.kodetrans,
          amount: d.payAmount,
        })),
      };

      if (isEdit) {
        await api.put(`/pelunasanpiutang/${editData.idpelunasan}`, payload);
      } else {
        await api.post('/pelunasanpiutang', payload);
      }

      toast.success(isEdit ? 'Pelunasan piutang berhasil diupdate!' : 'Pelunasan piutang berhasil disimpan!');
      if (onSuccess) onSuccess();
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
            <h2 className="text-lg font-bold text-dark-500">{isEdit ? `Edit ${editData?.kodepelunasan || 'Pelunasan Piutang'}` : 'Pelunasan Piutang Baru'}</h2>
            {isEdit && editData?.status && <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGE[editData.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>{editData.status}</span>}
          </div>
          <p className="text-xs text-dark-300">{isEdit ? 'Edit pelunasan piutang customer' : 'Form input pelunasan piutang customer'}</p>
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
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Kode Pelunasan</label>
                {isEdit ? (
                  <div className="px-3 py-2 rounded-xl border border-primary-100 bg-warm-50/40 text-sm text-dark-400 font-mono">
                    {kode}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      disabled={autoGenerate}
                      value={autoGenerate ? '(Auto-generate)' : kode}
                      onChange={e => setKode(e.target.value.toUpperCase())}
                      placeholder="Masukkan kode pelunasan..."
                      className="flex-1 px-3 py-2 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-warm-50 disabled:text-dark-300 disabled:cursor-not-allowed"
                    />
                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                      <input type="checkbox" checked={autoGenerate}
                        onChange={e => { setAutoGenerate(e.target.checked); if (e.target.checked) setKode(''); }}
                        className="w-3.5 h-3.5 rounded accent-primary-500" />
                      <span className="text-xs text-dark-400 font-medium">Generate</span>
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Tanggal Pelunasan</label>
                <Flatpickr
                  value={tgltrans}
                  onChange={([d], dateStr) => setTgltrans(dateStr)}
                  options={{ dateFormat: 'Y-m-d', locale: 'id' }}
                  className="flatpickr-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Metode Bayar</label>
                <select value={metodbayar} onChange={e => setMetodbayar(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                  <option value="TUNAI">TUNAI</option>
                  <option value="NON TUNAI">NON TUNAI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Catatan</label>
                <input type="text" value={catatan} onChange={e => setCatatan(e.target.value)}
                  placeholder="Catatan (opsional)..."
                  className="w-full px-3 py-2 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-dark-400 mb-1.5">Customer</label>
                <div className="flex items-start gap-3">
                  <button onClick={() => setShowCustomerModal(true)} disabled={isLocked}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors shrink-0 disabled:opacity-50">
                    <Users className="w-3.5 h-3.5" /> Browse Customer
                  </button>
                  {customer ? (
                    <div className="flex-1 grid grid-cols-2 gap-3 p-3 rounded-xl border border-primary-100 bg-warm-50/30">
                      {[
                        { label: 'Kode Customer', value: customer.kodecustomer },
                        { label: 'Nama Customer', value: customer.namacustomer },
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

          {/* SECTION 2: DETAIL INVOICE */}
          <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
            <div className="px-5 py-3 border-b border-primary-50 bg-warm-50/50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-dark-400 uppercase tracking-wider">
                Invoice Piutang
                {computedDetails.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-md bg-primary-100 text-primary-600 text-[10px] font-bold">
                    {computedDetails.length}
                  </span>
                )}
              </h3>
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              {!customer ? (
                <div className="px-4 py-12 text-center text-sm text-dark-300">
                  Pilih customer terlebih dahulu untuk memuat invoice
                </div>
              ) : loadingInvoices ? (
                <div className="px-4 py-12 text-center text-sm text-dark-300">Memuat invoice...</div>
              ) : invoices.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-dark-300">
                  Tidak ada invoice piutang yang belum lunas
                </div>
              ) : (
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-primary-50 bg-warm-50/30">
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-dark-300 w-10">
                        <input type="checkbox" checked={selectedIds.size === invoices.length && invoices.length > 0}
                          onChange={() => {
                            if (selectedIds.size === invoices.length) { setSelectedIds(new Set()); }
                            else {
                              const sel = new Set();
                              const amt = { ...amounts };
                              invoices.forEach(inv => {
                                sel.add(inv.kodetrans);
                                if (!amt[inv.kodetrans]) amt[inv.kodetrans] = parseFloat(inv.sisa) || 0;
                              });
                              setSelectedIds(sel);
                              setAmounts(amt);
                            }
                          }}
                          className="w-3.5 h-3.5 rounded accent-primary-500 cursor-pointer" />
                      </th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-dark-300">Kode Transaksi</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-dark-300">Tanggal</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-dark-300">Jumlah Awal</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-dark-300">Sudah Dibayar</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-dark-300">Sisa</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-dark-300">Jumlah Bayar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv, idx) => {
                      const isSelected = selectedIds.has(inv.kodetrans);
                      const sisa = parseFloat(inv.sisa) || 0;
                      const original = parseFloat(inv.original_amount) || 0;
                      const terbayar = parseFloat(inv.terbayar) || 0;
                      return (
                        <tr key={inv.kodetrans}
                          className={`border-b border-primary-50/50 transition-colors ${isSelected ? 'bg-primary-50/40' : 'hover:bg-warm-50/20'}`}>
                          <td className="px-3 py-2.5 text-center">
                            <input type="checkbox" checked={isSelected} disabled={isLocked}
                              onChange={() => toggleInvoice(inv.kodetrans)}
                              className="w-3.5 h-3.5 rounded accent-primary-500 cursor-pointer" />
                          </td>
                          <td className="px-3 py-2.5 text-xs font-mono font-semibold text-dark-400">{inv.kodetrans}</td>
                          <td className="px-3 py-2.5 text-dark-400 text-xs">{String(inv.tgltrans || '').slice(0, 10)}</td>
                          <td className="px-3 py-2.5 text-right text-xs font-mono text-dark-400">{formatRupiah(original)}</td>
                          <td className="px-3 py-2.5 text-right text-xs font-mono text-dark-400">{formatRupiah(terbayar)}</td>
                          <td className="px-3 py-2.5 text-right text-xs font-mono font-semibold text-accent-600">{formatRupiah(sisa)}</td>
                          <td className="px-3 py-2.5">
                            <input type="number" min="0" max={sisa}
                              value={amounts[inv.kodetrans] ?? sisa}
                              onChange={e => updateAmount(inv.kodetrans, e.target.value)}
                              disabled={!isSelected || isLocked}
                              className="w-full px-2 py-1.5 rounded-lg border border-primary-100 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary-500/20 disabled:bg-gray-50 disabled:text-dark-300 disabled:cursor-not-allowed" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* SECTION 3: FOOTER */}
          <div className="bg-white rounded-2xl border border-primary-50 p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-6">
                  <span className="text-xs text-dark-300 w-28 text-right">Invoice Dipilih:</span>
                  <span className="text-sm font-semibold text-dark-400 font-mono w-40 text-right">
                    {computedDetails.length} invoice
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xs font-bold text-dark-500 w-28 text-right">Total Bayar:</span>
                  <span className="text-xl font-bold text-accent-600 font-mono w-40 text-right">
                    {formatRupiah(totalBayar)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => handleSubmit(false)} disabled={loading || computedDetails.length === 0 || isLocked}
                  className="px-5 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button onClick={() => handleSubmit(true)} disabled={loading || computedDetails.length === 0 || isLocked}
                  className="px-5 py-2 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Menyimpan...' : 'Simpan dan Approve'}
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
    </div>
  );
}
