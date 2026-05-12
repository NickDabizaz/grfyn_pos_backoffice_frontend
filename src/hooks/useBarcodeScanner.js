import { useEffect, useRef, useCallback } from 'react';

const SCANNER_SPEED_THRESHOLD_MS = 30; // chars faster than this = scanner
const SCANNER_MIN_LENGTH = 3;          // minimum barcode length

/**
 * Detects hardware barcode scanner input by monitoring keystroke speed.
 * Scanners fire keypresses in <30ms bursts — human typing is much slower.
 *
 * @param {(barcode: string) => void} onScan - Callback fired with the scanned string
 * @param {object} options
 * @param {boolean} [options.enabled=true]
 */
export function useBarcodeScanner(onScan, { enabled = true } = {}) {
  const bufferRef   = useRef('');
  const lastTimeRef = useRef(0);
  const timerRef    = useRef(null);

  const flush = useCallback(() => {
    const code = bufferRef.current.trim();
    bufferRef.current = '';
    lastTimeRef.current = 0;
    if (code.length >= SCANNER_MIN_LENGTH) {
      onScan(code);
    }
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Ignore modifier combinations (Ctrl+C, Alt+F4, etc.)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const now     = Date.now();
      const elapsed = now - lastTimeRef.current;

      if (e.key === 'Enter') {
        clearTimeout(timerRef.current);
        // Only treat as scanner if buffer has scanner-speed chars
        if (bufferRef.current.length >= SCANNER_MIN_LENGTH) {
          flush();
        }
        return;
      }

      // Only single printable chars
      if (e.key.length !== 1) return;

      // If this char arrived slower than threshold after a reset, it's human typing
      if (lastTimeRef.current && elapsed > SCANNER_SPEED_THRESHOLD_MS) {
        // Gap too long — not a scanner burst; discard buffer and start fresh
        bufferRef.current  = '';
      }

      bufferRef.current   += e.key;
      lastTimeRef.current  = now;

      // Auto-flush 80ms after the last char (handles scanners without Enter suffix)
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, 80);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timerRef.current);
    };
  }, [enabled, flush]);
}
