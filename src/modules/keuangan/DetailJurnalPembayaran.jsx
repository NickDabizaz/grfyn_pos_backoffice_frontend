import { Plus, Trash2 } from 'lucide-react';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { formatRupiah } from '../../lib/utils';

const normalizePembayaran = (rows = []) =>
  rows.map((row) => ({
    idakun: row.idakun || '',
    amount: row.amount === undefined || row.amount === null ? '' : String(row.amount),
  }));

export { normalizePembayaran };

export default function DetailJurnalPembayaran({
  rows,
  setRows,
  akunList,
  totalBayar,
  paymentPosition = 'DEBET',
  balancingPosition = 'KREDIT',
  balancingAccount = null,
  defaultPaymentAccount = null,
  disabled = false,
}) {
  const totalPembayaran = rows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
  const selisih = totalPembayaran - totalBayar;
  const isBalanced = Math.abs(selisih) < 0.01;
  const akunMap = new Map(akunList.map((akun) => [String(akun.idakun), akun]));

  const accountLabel = (account) => {
    if (!account) return '-';
    return [account.kodeakun, account.namaakun].filter(Boolean).join(' - ');
  };

  const getAccount = (idakun) => akunMap.get(String(idakun)) || null;
  const previewPaymentRows = rows.length > 0
    ? rows
    : (defaultPaymentAccount && totalBayar > 0 ? [{ idakun: defaultPaymentAccount.idakun, amount: totalBayar, isDefault: true }] : []);
  const journalLines = [
    ...previewPaymentRows
      .map((row) => ({
        posisi: paymentPosition,
        account: getAccount(row.idakun) || (row.isDefault ? defaultPaymentAccount : null),
        amount: parseFloat(row.amount) || 0,
      }))
      .filter((line) => line.amount > 0),
    ...(balancingAccount && totalBayar > 0
      ? [{ posisi: balancingPosition, account: balancingAccount, amount: totalBayar }]
      : []),
  ];
  const totalDebet = journalLines
    .filter((line) => line.posisi === 'DEBET')
    .reduce((sum, line) => sum + line.amount, 0);
  const totalKredit = journalLines
    .filter((line) => line.posisi === 'KREDIT')
    .reduce((sum, line) => sum + line.amount, 0);
  const journalBalanced = journalLines.length > 0 && Math.abs(totalDebet - totalKredit) < 0.01;

  const updateRow = (index, field, value) => {
    setRows(rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addRow = () => setRows([...rows, { idakun: '', amount: '' }]);
  const removeRow = (index) => setRows(rows.filter((_, i) => i !== index));

  return (
    <div className="bg-white rounded-2xl border border-primary-50 overflow-visible">
      <div className="px-5 py-3 border-b border-primary-50 bg-warm-50/50 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-dark-400 uppercase tracking-wider">Detail Pembayaran</h3>
          <p className="text-[11px] text-dark-300 mt-0.5">Akun kas/bank penerima pembayaran; kosongkan untuk memakai default.</p>
        </div>
        <div className={`text-xs font-bold ${journalBalanced || rows.length === 0 || isBalanced ? 'text-emerald-600' : 'text-red-500'}`}>
          {journalBalanced ? 'Balance' : (rows.length === 0 ? 'Default' : `Kurang/lebih ${formatRupiah(Math.abs(selisih))}`)}
        </div>
      </div>
      <div className="p-5 space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-primary-100 bg-warm-50/30 px-4 py-5 text-center text-xs text-dark-300">
            Belum ada detail pembayaran
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((row, index) => (
              <div key={index} className="grid grid-cols-[1fr_180px_36px] gap-2 items-end">
                <div>
                  <label className="block text-[10px] font-semibold text-dark-300 mb-1">Akun Pembayaran</label>
                  <SearchableSelect
                    value={row.idakun}
                    onChange={(val) => updateRow(index, 'idakun', val)}
                    options={akunList.map((akun) => ({ value: akun.idakun, label: `${akun.kodeakun} - ${akun.namaakun}` }))}
                    placeholder="Pilih akun"
                    disabled={disabled}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-dark-300 mb-1">Nominal</label>
                  <input
                    type="number"
                    min="0"
                    value={row.amount}
                    onChange={(e) => updateRow(index, 'amount', e.target.value)}
                    disabled={disabled}
                    className="w-full px-3 py-2.5 rounded-xl border border-primary-100 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-gray-50 disabled:text-dark-300"
                    placeholder="0"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  disabled={disabled}
                  className="h-[42px] p-2 rounded-xl hover:bg-red-50 text-dark-300 hover:text-red-500 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={addRow}
            disabled={disabled}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-500 hover:text-primary-600 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Baris Pembayaran
          </button>
          {rows.length > 0 && (
            <div className="text-right">
              <div className="text-[10px] text-dark-300">Total Pembayaran</div>
              <div className="text-sm font-bold font-mono text-dark-500">{formatRupiah(totalPembayaran)}</div>
            </div>
          )}
        </div>
        <div className="overflow-hidden rounded-xl border border-primary-50">
          <div className="px-3 py-2 bg-warm-50/40 border-b border-primary-50 flex items-center justify-between">
            <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Preview Jurnal</span>
            <span className={`text-[10px] font-bold ${journalBalanced ? 'text-emerald-600' : 'text-red-500'}`}>
              DEBET {formatRupiah(totalDebet)} / KREDIT {formatRupiah(totalKredit)}
            </span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-white border-b border-primary-50">
                <th className="px-3 py-2 text-left font-semibold text-dark-300 w-24">Posisi</th>
                <th className="px-3 py-2 text-left font-semibold text-dark-300">Akun</th>
                <th className="px-3 py-2 text-right font-semibold text-dark-300 w-32">DEBET</th>
                <th className="px-3 py-2 text-right font-semibold text-dark-300 w-32">KREDIT</th>
              </tr>
            </thead>
            <tbody>
              {journalLines.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-5 text-center text-dark-300">
                    Pilih invoice untuk melihat jurnal
                  </td>
                </tr>
              ) : (
                journalLines.map((line, index) => (
                  <tr key={`${line.posisi}-${line.account?.idakun || index}-${index}`} className="border-b border-primary-50/60 last:border-b-0">
                    <td className={`px-3 py-2 font-bold ${line.posisi === 'DEBET' ? 'text-emerald-600' : 'text-primary-600'}`}>
                      {line.posisi}
                    </td>
                    <td className="px-3 py-2 text-dark-500 font-medium">
                      {accountLabel(line.account)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-dark-500">
                      {line.posisi === 'DEBET' ? formatRupiah(line.amount) : '-'}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-dark-500">
                      {line.posisi === 'KREDIT' ? formatRupiah(line.amount) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {journalLines.length > 0 && (
              <tfoot>
                <tr className="bg-warm-50/40 border-t border-primary-50">
                  <td className="px-3 py-2 font-bold text-dark-400" colSpan={2}>Total</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-dark-500">{formatRupiah(totalDebet)}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-dark-500">{formatRupiah(totalKredit)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
