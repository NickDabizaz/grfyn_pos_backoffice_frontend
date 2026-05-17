import { useEffect, useState } from 'react';
import api from '../api/axios';

const EMPTY_ACCESS = {
  allowed: false,
  hakakses: 0,
  tambah: 0,
  ubah: 0,
  approve: 0,
  batalapprove: 0,
  bataltransaksi: 0,
  cetak: 0,
};

export function useMenuAccess(kodemenu) {
  const [access, setAccess] = useState(EMPTY_ACCESS);
  const [loading, setLoading] = useState(Boolean(kodemenu));

  useEffect(() => {
    let alive = true;
    if (!kodemenu) {
      setAccess(EMPTY_ACCESS);
      setLoading(false);
      return () => { alive = false; };
    }

    setLoading(true);
    api.get('/auth/access', { params: { kodemenu } })
      .then((res) => {
        if (alive) setAccess({ ...EMPTY_ACCESS, ...res.data });
      })
      .catch(() => {
        if (alive) setAccess(EMPTY_ACCESS);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, [kodemenu]);

  return { access, loading };
}

export function canAccess(access, key) {
  return Number(access?.[key] || 0) === 1;
}
