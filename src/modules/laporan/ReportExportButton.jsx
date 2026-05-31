import { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function normalizeReportUrl(url) {
  if (!url) return '';
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  if (url.startsWith('/api') && apiBase !== '/api') {
    return `${apiBase.replace(/\/api\/?$/, '')}${url}`;
  }
  return url;
}

export default function ReportExportButton({ url, token, className = '' }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!url) return;
    setExporting(true);
    try {
      const exportUrl = new URL(normalizeReportUrl(url), window.location.origin);
      exportUrl.searchParams.set('format', 'xls');
      const authToken = token || localStorage.getItem('grfyn_token');
      const response = await fetch(exportUrl.toString(), {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (!response.ok) {
        throw new Error(await response.text() || `Gagal export Excel (${response.status})`);
      }

      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') || '';
      const filename = disposition.match(/filename="?([^"]+)"?/i)?.[1] || 'laporan.xls';
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(downloadUrl);
      toast.success('Export Excel berhasil diunduh');
    } catch (err) {
      toast.error(err.message || 'Gagal export Excel');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleExport}
        disabled={!url || exporting}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all disabled:cursor-not-allowed ${!url ? 'opacity-50' : ''} ${className}`}
      >
        <FileSpreadsheet className="w-4 h-4" /> Export Excel
      </button>

      {exporting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            role="status"
            aria-live="polite"
            className="flex w-full max-w-xs flex-col items-center rounded-2xl bg-white px-6 py-7 text-center shadow-2xl"
          >
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <h3 className="mt-4 text-sm font-bold text-dark-500">Sedang memproses</h3>
            <p className="mt-1 text-xs leading-relaxed text-dark-300">
              Export Excel sedang disiapkan. Mohon tunggu hingga unduhan dimulai.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
