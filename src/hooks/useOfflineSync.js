import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { getPendingTransactions, markSynced, markFailed } from '../lib/offlineDb';

/**
 * Listens for the browser coming online and flushes the Dexie outbox by
 * re-posting any queued transactions to the server.
 */
export function useOfflineSync() {
  const syncingRef = useRef(false);

  const flush = async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      const pending = await getPendingTransactions();
      if (pending.length === 0) return;

      toast.loading(`Menyinkronkan ${pending.length} transaksi offline…`, { id: 'sync' });
      let success = 0;

      for (const record of pending) {
        try {
          await api.post('/jual', record.payload);
          await markSynced(record.id);
          success++;
        } catch {
          await markFailed(record.id);
        }
      }

      toast.dismiss('sync');
      if (success > 0) toast.success(`${success} transaksi offline berhasil disinkronkan`);
    } finally {
      syncingRef.current = false;
    }
  };

  useEffect(() => {
    window.addEventListener('online', flush);
    // Also attempt sync on mount in case we're already online with pending data
    if (navigator.onLine) flush();
    return () => window.removeEventListener('online', flush);
  }, []);
}
