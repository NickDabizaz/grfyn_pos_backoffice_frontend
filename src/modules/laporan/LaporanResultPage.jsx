import { useEffect, useState } from 'react';
import { Printer, RefreshCw } from 'lucide-react';
import { formatRupiah } from '../../lib/utils';

function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL || '/api';
}

function normalizeReportUrl(url) {
  if (!url) return '';
  const apiBase = getApiBaseUrl();
  if (url.startsWith('/api') && apiBase !== '/api') {
    return `${apiBase.replace(/\/api\/?$/, '')}${url}`;
  }
  return url;
}

export default function LaporanResultPage({ url, token, label, data, type }) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState('');

  const loadReport = async () => {
    if (!url) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(normalizeReportUrl(url), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const text = await response.text();
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        throw new Error(text || `Gagal memuat laporan (${response.status})`);
      }
      if (!contentType.includes('text/html')) {
        throw new Error('Response laporan bukan HTML');
      }
      if (text.includes('id="root"') || text.includes('GRFYN DEMO PUBLIC')) {
        throw new Error('Server mengembalikan halaman aplikasi, bukan hasil laporan');
      }
      setHtml(text);
    } catch (err) {
      setHtml('');
      setError(err.message || 'Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [url, token]);

  const handlePrint = () => {
    if (url) {
      const iframe = document.querySelector('iframe[title="Hasil Laporan"]');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
    } else {
      window.print();
    }
  };

  const renderTable = () => {
    if (type === 'barang') {
      return (
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary-50 bg-warm-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">No</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama Barang</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Satuan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Jenis</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Harga Jual</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Harga Beli</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((b, i) => (
              <tr key={b.idbarang || i} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                <td className="px-4 py-3 text-dark-400">{i + 1}</td>
                <td className="px-4 py-3 text-xs font-mono text-dark-300">{b.kodebarang}</td>
                <td className="px-4 py-3 font-medium text-dark-500">{b.namabarang}</td>
                <td className="px-4 py-3 text-dark-400">{b.satuankecil || '-'}</td>
                <td className="px-4 py-3 text-dark-400">{b.jenisbarang || '-'}</td>
                <td className="px-4 py-3 text-right">{formatRupiah(b.hargajual)}</td>
                <td className="px-4 py-3 text-right">{formatRupiah(b.hargabeli)}</td>
              </tr>
            ))}
            {(!data || data.length === 0) && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-dark-300">Tidak ada data</td></tr>
            )}
          </tbody>
        </table>
      );
    }
    if (type === 'customer') {
      return (
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary-50 bg-warm-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">No</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama Customer</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Alamat</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">No. HP</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Email</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((c, i) => (
              <tr key={c.idcustomer || i} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                <td className="px-4 py-3 text-dark-400">{i + 1}</td>
                <td className="px-4 py-3 text-xs font-mono text-dark-300">{c.kodecustomer}</td>
                <td className="px-4 py-3 font-medium text-dark-500">{c.namacustomer}</td>
                <td className="px-4 py-3 text-dark-400">{c.alamat || '-'}</td>
                <td className="px-4 py-3 text-dark-400">{c.hp || '-'}</td>
                <td className="px-4 py-3 text-dark-400">{c.email || '-'}</td>
              </tr>
            ))}
            {(!data || data.length === 0) && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-dark-300">Tidak ada data</td></tr>
            )}
          </tbody>
        </table>
      );
    }
    if (type === 'supplier') {
      return (
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary-50 bg-warm-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">No</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama Supplier</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Alamat</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">No. HP</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Email</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((s, i) => (
              <tr key={s.idsupplier || i} className="border-b border-primary-50/50 hover:bg-warm-50/30 text-sm">
                <td className="px-4 py-3 text-dark-400">{i + 1}</td>
                <td className="px-4 py-3 text-xs font-mono text-dark-300">{s.kodesupplier}</td>
                <td className="px-4 py-3 font-medium text-dark-500">{s.namasupplier}</td>
                <td className="px-4 py-3 text-dark-400">{s.alamat || '-'}</td>
                <td className="px-4 py-3 text-dark-400">{s.hp || '-'}</td>
                <td className="px-4 py-3 text-dark-400">{s.email || '-'}</td>
              </tr>
            ))}
            {(!data || data.length === 0) && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-dark-300">Tidak ada data</td></tr>
            )}
          </tbody>
        </table>
      );
    }
    return null;
  };

  if (!url && !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-dark-300 text-sm">URL laporan tidak tersedia</p>
      </div>
    );
  }

  if (url) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-2 border-b border-primary-100 bg-white shrink-0">
          <h3 className="text-sm font-bold text-dark-500">{label || 'Hasil Laporan'}</h3>
          <div className="flex items-center gap-2">
            {error && (
              <button
                onClick={loadReport}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary-100 text-dark-400 hover:bg-warm-50 text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Muat Ulang
              </button>
            )}
            <button
              onClick={handlePrint}
              disabled={!html}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak
            </button>
          </div>
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-dark-300">Memuat laporan...</div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md text-center">
              <p className="text-sm font-bold text-dark-500">Laporan gagal dimuat</p>
              <p className="mt-2 text-xs text-dark-300 leading-relaxed">{error}</p>
            </div>
          </div>
        ) : (
          <iframe srcDoc={html} className="flex-1 w-full border-0" title="Hasil Laporan" />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-primary-100 bg-white shrink-0">
        <h3 className="text-sm font-bold text-dark-500">{label || 'Hasil Laporan'}</h3>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold transition-colors"
        >
          <Printer className="w-3.5 h-3.5" /> Cetak
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">{renderTable()}</div>
    </div>
  );
}
