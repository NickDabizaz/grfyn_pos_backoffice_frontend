import { useEffect, useState } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Save, RefreshCw } from 'lucide-react';
import { useMenuAccess, canAccess } from '../../../hooks/useMenuAccess';

const emptyRow = { kodejenis: '', namajenis: '', potonggaji: false, status: 'AKTIF', isNew: true };

export default function SettingAbsensi() {
  const { access } = useMenuAccess('sdm.settingabsensi');
  const canTambah = canAccess(access, 'tambah');
  const canUbah = canAccess(access, 'ubah');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/setting-absensi')
      .then(r => setRows(r.data || []))
      .catch(err => toast.error(err.response?.data?.message || 'Gagal memuat setting absensi'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateRow = (idx, patch) => {
    setRows(prev => prev.map((row, i) => i === idx ? { ...row, ...patch } : row));
  };

  const saveRow = async (row) => {
    if (!row.kodejenis || !row.namajenis) return toast.error('Kode dan nama wajib diisi');
    setSavingId(row.idjenisabsensi || 'new');
    const payload = {
      kodejenis: String(row.kodejenis).toUpperCase(),
      namajenis: String(row.namajenis).toUpperCase(),
      potonggaji: Boolean(row.potonggaji),
      status: row.status || 'AKTIF',
    };
    try {
      if (row.isNew) await api.post('/setting-absensi', payload);
      else await api.put(`/setting-absensi/${row.idjenisabsensi}`, payload);
      toast.success('Setting absensi disimpan');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-dark-500">Setting Absensi</h2>
          <p className="text-sm text-dark-300">Atur jenis absensi yang memotong gaji</p>
        </div>
        <div className="flex items-center gap-2">
          {canTambah && <button onClick={() => setRows(prev => [...prev, { ...emptyRow }])} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold"><Plus className="w-4 h-4" /> Jenis Baru</button>}
          <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400 hover:bg-warm-50"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-4">
        <div className="bg-white rounded-2xl border border-primary-50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary-50 bg-warm-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Kode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark-300">Nama</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Potong Gaji</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-dark-300">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-dark-300">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-dark-300">Tidak ada setting absensi</td></tr>}
              {rows.map((row, idx) => (
                <tr key={row.idjenisabsensi || `new-${idx}`} className="border-b border-primary-50/50 text-sm">
                  <td className="px-4 py-3">
                    <input value={row.kodejenis || ''} onChange={e => updateRow(idx, { kodejenis: e.target.value.toUpperCase() })} disabled={!row.isNew && !canUbah} className="w-full px-2 py-1.5 rounded-lg border border-primary-100 text-xs font-mono disabled:bg-gray-50" />
                  </td>
                  <td className="px-4 py-3">
                    <input value={row.namajenis || ''} onChange={e => updateRow(idx, { namajenis: e.target.value.toUpperCase() })} disabled={!canUbah && !row.isNew} className="w-full px-2 py-1.5 rounded-lg border border-primary-100 text-xs disabled:bg-gray-50" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={Boolean(row.potonggaji)} onChange={e => updateRow(idx, { potonggaji: e.target.checked })} disabled={!canUbah && !row.isNew} className="w-4 h-4 rounded accent-primary-500" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select value={row.status || 'AKTIF'} onChange={e => updateRow(idx, { status: e.target.value })} disabled={!canUbah && !row.isNew} className="px-2 py-1.5 rounded-lg border border-primary-100 text-xs disabled:bg-gray-50">
                      <option value="AKTIF">AKTIF</option>
                      <option value="NONAKTIF">NONAKTIF</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(row.isNew ? canTambah : canUbah) && (
                      <button onClick={() => saveRow(row)} disabled={savingId === (row.idjenisabsensi || 'new')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold disabled:opacity-50">
                        <Save className="w-3.5 h-3.5" /> Simpan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
