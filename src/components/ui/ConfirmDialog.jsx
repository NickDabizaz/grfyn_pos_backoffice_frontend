import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    message: '',
    title: 'Konfirmasi',
    confirmText: 'Ya',
    cancelText: 'Batal',
    variant: 'danger',
  });

  const resolveRef = useRef(null);

  const confirm = useCallback(({
    message = '',
    title = 'Konfirmasi',
    confirmText = 'Ya',
    cancelText = 'Batal',
    variant = 'danger',
  } = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ open: true, message, title, confirmText, cancelText, variant });
    });
  }, []);

  const handleClose = useCallback((result) => {
    setState((s) => ({ ...s, open: false }));
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  }, []);

  const handleConfirm = useCallback(() => handleClose(true), [handleClose]);
  const handleCancel = useCallback(() => handleClose(false), [handleClose]);

  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-600',
    primary: 'bg-primary-500 hover:bg-primary-600',
    accent: 'bg-accent-500 hover:bg-accent-600',
  };

  const iconColors = {
    danger: 'text-red-500',
    primary: 'text-primary-500',
    accent: 'text-accent-500',
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancel();
          }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 p-2 rounded-xl bg-warm-50 ${iconColors[state.variant]}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-dark-500">{state.title}</h3>
                <p className="text-xs text-dark-400 mt-1 leading-relaxed">{state.message}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl border border-primary-100 text-xs font-semibold text-dark-400 hover:bg-warm-50 transition-colors"
              >
                {state.cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold transition-colors ${variantStyles[state.variant]}`}
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
