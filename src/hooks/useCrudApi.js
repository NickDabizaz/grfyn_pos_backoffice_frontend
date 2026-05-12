import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import toast from 'react-hot-toast';

/**
 * Generic CRUD operations hook — includes both imperative methods (legacy)
 * and TanStack Query hooks for automatic caching/deduplication.
 *
 * @param {string} endpoint - API endpoint (e.g., '/barang')
 * @param {object} options  - { showToast, queryKey, queryParams, enabled }
 */
export function useCrudApi(endpoint, options = {}) {
  const { showToast = false } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // ─── Imperative helpers (backward-compat) ───────────────────────────────
  const getAll = async (params = {}) => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.get(endpoint, { params });
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal memuat data';
      setError(message);
      if (showToast) toast.error(message);
      throw err;
    } finally { setLoading(false); }
  };

  const getOne = async (id) => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.get(`${endpoint}/${id}`);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal memuat data';
      setError(message);
      if (showToast) toast.error(message);
      throw err;
    } finally { setLoading(false); }
  };

  const create = async (payload) => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.post(endpoint, payload);
      if (showToast) toast.success(data.message || 'Data berhasil disimpan');
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal menyimpan data';
      setError(message);
      if (showToast) toast.error(message);
      throw err;
    } finally { setLoading(false); }
  };

  const update = async (id, payload) => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.put(`${endpoint}/${id}`, payload);
      if (showToast) toast.success(data.message || 'Data berhasil diperbarui');
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal memperbarui data';
      setError(message);
      if (showToast) toast.error(message);
      throw err;
    } finally { setLoading(false); }
  };

  const remove = async (id) => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.delete(`${endpoint}/${id}`);
      if (showToast) toast.success(data.message || 'Data berhasil dihapus');
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal menghapus data';
      setError(message);
      if (showToast) toast.error(message);
      throw err;
    } finally { setLoading(false); }
  };

  return { loading, error, getAll, getOne, create, update, remove };
}

// ─── TanStack Query hooks ────────────────────────────────────────────────────

/**
 * Cached query hook — replaces manual useEffect + getAll calls.
 * Data is cached per (endpoint + params) key; switching tabs won't re-fetch
 * until the cache becomes stale (default 5 min).
 *
 * Usage:
 *   const { data, isLoading, refetch } = useQueryData('/barang', { search: q });
 */
export function useQueryData(endpoint, params = {}, options = {}) {
  const key = [endpoint, params];
  return useQuery({
    queryKey : key,
    queryFn  : async () => {
      const { data } = await axios.get(endpoint, { params });
      return data;
    },
    ...options,
  });
}

/**
 * Mutation hook with automatic cache invalidation.
 * After any mutation the cache for `endpoint` is invalidated so lists
 * refresh automatically.
 *
 * Usage:
 *   const save   = useMutateData('/barang', 'create', { showToast: true });
 *   const remove = useMutateData('/barang', 'remove', { showToast: true });
 */
export function useMutateData(endpoint, action = 'create', options = {}) {
  const { showToast = false } = options;
  const qc = useQueryClient();

  const mutationFn = async (payload) => {
    let res;
    if (action === 'create') {
      res = await axios.post(endpoint, payload);
    } else if (action === 'update') {
      res = await axios.put(`${endpoint}/${payload.id}`, payload.data);
    } else if (action === 'remove') {
      res = await axios.delete(`${endpoint}/${payload}`);
    }
    return res.data;
  };

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [endpoint] });
      if (showToast) {
        const msg = data?.message || (action === 'remove' ? 'Data dihapus' : 'Data disimpan');
        toast.success(msg);
      }
    },
    onError: (err) => {
      const message = err.response?.data?.message || 'Operasi gagal';
      if (showToast) toast.error(message);
    },
  });
}
