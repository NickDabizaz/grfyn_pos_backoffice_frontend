import { useState } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

/**
 * Generic CRUD operations hook
 * @param {string} endpoint - API endpoint (e.g., '/barang')
 * @returns {object} CRUD operations and loading state
 */
export function useCrudApi(endpoint) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAll = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(endpoint, { params });
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal memuat data';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getOne = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${endpoint}/${id}`);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal memuat data';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const create = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post(endpoint, payload);
      toast.success(data.message || 'Data berhasil disimpan');
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal menyimpan data';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id, payload) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.put(`${endpoint}/${id}`, payload);
      toast.success(data.message || 'Data berhasil diperbarui');
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal memperbarui data';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.delete(`${endpoint}/${id}`);
      toast.success(data.message || 'Data berhasil dihapus');
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal menghapus data';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getAll,
    getOne,
    create,
    update,
    remove,
  };
}
