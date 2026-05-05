import { useState } from 'react';

/**
 * Custom hook to manage form mode (tambah/ubah) and data
 * @returns {object} Form mode state and controls
 */
export function useFormMode() {
  const [mode, setMode] = useState('tambah'); // 'tambah' | 'ubah'
  const [data, setData] = useState(null);

  const setTambah = () => {
    setMode('tambah');
    setData(null);
  };

  const setUbah = (record) => {
    setMode('ubah');
    setData(record);
  };

  const isTambah = mode === 'tambah';
  const isUbah = mode === 'ubah';

  return {
    mode,
    data,
    setMode,
    setData,
    setTambah,
    setUbah,
    isTambah,
    isUbah,
  };
}
