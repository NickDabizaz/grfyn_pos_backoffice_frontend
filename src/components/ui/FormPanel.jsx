import { cn } from '../../lib/utils';
import { X, Save } from 'lucide-react';

/**
 * Form panel wrapper with mode indicator
 */
export default function FormPanel({ mode, onCancel, onSave, loading, children }) {
  const isTambah = mode === 'tambah';

  return (
    <div className="h-full flex flex-col bg-warm-50">
      {/* Header */}
      <div className="bg-white border-b border-primary-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-dark-500">
              {isTambah ? 'Tambah Data Baru' : 'Ubah Data'}
            </h2>
            <p className="text-xs text-dark-300 mt-0.5">
              {isTambah
                ? 'Lengkapi form di bawah untuk menambah data baru'
                : 'Perbarui data yang diperlukan'}
            </p>
          </div>
          <span
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold',
              isTambah
                ? 'bg-accent-100 text-accent-600'
                : 'bg-primary-100 text-primary-600'
            )}
          >
            Mode: {isTambah ? 'Tambah' : 'Ubah'}
          </span>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-primary-100 p-6">
          {children}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="bg-white border-t border-primary-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-dark-400 bg-warm-100 hover:bg-warm-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Batal
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
