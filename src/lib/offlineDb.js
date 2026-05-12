import Dexie from 'dexie';

/**
 * IndexedDB schema via Dexie.
 * Stores pending POS transactions so they survive network outages and
 * are synced automatically when connectivity is restored.
 */
export const db = new Dexie('GrfynPOS');

db.version(1).stores({
  // outbox: queued transactions waiting to be posted to /api/jual
  outbox: '++id, status, createdAt',
  // cache: offline snapshot of product data for the POS catalog
  productCache: 'idbarang, updatedAt',
});

/**
 * Add a transaction to the offline outbox.
 * @param {object} payload - The same payload sent to POST /api/jual
 */
export async function enqueueTransaction(payload) {
  return db.outbox.add({
    payload,
    status   : 'pending',
    createdAt: new Date().toISOString(),
    retries  : 0,
  });
}

/**
 * Get all queued (pending) transactions.
 */
export async function getPendingTransactions() {
  return db.outbox.where('status').equals('pending').toArray();
}

/**
 * Mark a queued transaction as synced (remove from outbox).
 */
export async function markSynced(id) {
  return db.outbox.delete(id);
}

/**
 * Mark a queued transaction as failed (increment retries).
 */
export async function markFailed(id) {
  return db.outbox
    .where('id').equals(id)
    .modify(r => { r.retries += 1; if (r.retries >= 5) r.status = 'failed'; });
}
