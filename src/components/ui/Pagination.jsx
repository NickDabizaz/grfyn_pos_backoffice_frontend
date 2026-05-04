import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, setPage }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-primary-50 bg-white">
      <p className="text-xs text-dark-300">
        Halaman {page} dari {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
