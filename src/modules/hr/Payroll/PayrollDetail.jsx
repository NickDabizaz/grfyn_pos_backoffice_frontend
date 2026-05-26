import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { formatRupiah } from '../../../lib/utils';
import { ArrowLeft, Loader2 } from 'lucide-react';
import useTabStore from '../../../store/tabStore';

const STATUS_BADGE = {
  DRAFT:   'bg-amber-50 text-amber-600 border-amber-100',
  POSTED:  'bg-emerald-50 text-emerald-600 border-emerald-100',
  POSTING: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

export default function PayrollDetail({ payrollId, tabId }) {
  const closeTab = useTabStore(s => s.closeTab);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!payrollId) return;
    api.get(`/payroll/${payrollId}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [payrollId]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 pt-4 pb-2 border-b border-primary-100 shrink-0">
        <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-dark-500">Detail Payroll</h2>
          <p className="text-xs text-dark-300">Rincian komponen gaji karyawan</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
        </div>
      ) : !data ? (
        <div className="flex-1 flex items-center justify-center text-sm text-dark-300">Data tidak ditemukan</div>
      ) : (
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl space-y-6">
            <div className="bg-white rounded-2xl border border-primary-50 p-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold text-dark-300 mb-0.5">Karyawan</p>
                <p className="text-sm font-semibold text-dark-500">{data.namakaryawan || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-dark-300 mb-0.5">Bulan</p>
                <p className="text-sm text-dark-500">{data.bulanpayroll || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-dark-300 mb-0.5">Status</p>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGE[data.status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                  {data.status}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-dark-300 mb-0.5">Gaji Bersih</p>
                <p className="text-sm font-bold text-accent-600">{formatRupiah(data.gajinetbersih)}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-primary-50 p-4">
              <h3 className="text-xs font-bold text-dark-400 mb-3">Ringkasan</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-dark-300">Gaji Pokok (Master)</span>
                  <span className="text-dark-500 font-medium">{formatRupiah(data.gajipokok)}</span>
                </div>
                {data.gajipoko_efektif !== undefined && data.gajipoko_efektif !== null && (
                  <div className="flex justify-between">
                    <span className="text-dark-300">Gaji Pokok Efektif (Prorate)</span>
                    <span className="text-dark-500 font-medium">{formatRupiah(data.gajipoko_efektif)}</span>
                  </div>
                )}
                {data.hari_dibayar !== undefined && data.hari_dibayar !== null && (
                  <div className="flex justify-between">
                    <span className="text-dark-300">Hari Dibayar</span>
                    <span className="text-dark-500 font-medium">{data.hari_dibayar} hari</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-dark-300">Tunjangan</span>
                  <span className="text-dark-500 font-medium">{formatRupiah(data.tunjangan)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-300">Potongan</span>
                  <span className="text-red-400 font-medium">-{formatRupiah(data.potongan)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-primary-50">
                  <span className="text-dark-400 font-semibold">Gaji Bersih</span>
                  <span className="text-accent-600 font-bold">{formatRupiah(data.gajinetbersih)}</span>
                </div>
              </div>
            </div>

            {Array.isArray(data.details) && data.details.length > 0 && (
              <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-primary-50">
                  <h3 className="text-xs font-bold text-dark-400">Rincian Per Karyawan</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-primary-50 bg-warm-50/50">
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-dark-300">Karyawan</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-dark-300">Hari Dibayar</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-dark-300">Gaji Pokok</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-dark-300">Gaji Efektif</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-dark-300">Tunjangan</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-dark-300">Potongan</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-dark-300">Bersih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.details.map((d, i) => (
                        <tr key={i} className="border-b border-primary-50/50 text-xs">
                          <td className="px-4 py-2.5 text-dark-500 font-medium">{d.namakaryawan || '-'}</td>
                          <td className="px-4 py-2.5 text-right text-dark-400">{d.hari_dibayar ?? '-'}</td>
                          <td className="px-4 py-2.5 text-right text-dark-400">{formatRupiah(d.gajipokok)}</td>
                          <td className="px-4 py-2.5 text-right text-dark-500 font-medium">{formatRupiah(d.gajipoko_efektif)}</td>
                          <td className="px-4 py-2.5 text-right text-dark-400">{formatRupiah(d.tunjangan)}</td>
                          <td className="px-4 py-2.5 text-right text-dark-400">{formatRupiah(d.potongan)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-accent-600">{formatRupiah(d.gajinetbersih)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
