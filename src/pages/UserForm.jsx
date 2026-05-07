import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X, Save, Loader2 } from 'lucide-react';
import useTabStore from '../store/tabStore';

export default function UserForm({ id, user: existingUser, onSuccess, tabId }) {
  const closeTab = useTabStore((s) => s.closeTab);
  const isEdit = Boolean(id);

  const [username, setUsername] = useState(existingUser?.username || '');
  const [pass, setPass] = useState('');
  const [namauser, setNamauser] = useState(existingUser?.namauser || '');
  const [email, setEmail] = useState(existingUser?.email || '');
  const [hp, setHp] = useState(existingUser?.hp || '');
  const [status, setStatus] = useState(existingUser?.status || 'AKTIF');
  const [loading, setLoading] = useState(false);

  const [allMenus, setAllMenus] = useState([]);
  const [allLokasi, setAllLokasi] = useState([]);
  const [selectedMenus, setSelectedMenus] = useState([]);
  const [selectedLokasi, setSelectedLokasi] = useState([]);
  const [allTemplates, setAllTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    async function loadRefs() {
      try {
        const [menuRes, lokRes, tmpRes] = await Promise.all([
          api.get('/menu/all'),
          api.get('/lokasi'),
          api.get('/user/templates')
        ]);
        setAllMenus(menuRes.data);
        setAllLokasi(lokRes.data);
        setAllTemplates(tmpRes.data);

        if (isEdit && existingUser) {
          try {
            const [mRes, lRes] = await Promise.all([
              api.get(`/user/${existingUser.iduser}/menus`),
              api.get(`/user/${existingUser.iduser}/lokasis`)
            ]);
            setSelectedMenus(mRes.data.map(m => m.idmenu));
            setSelectedLokasi(lRes.data.map(l => l.idlokasi));
          } catch (_) {}
        }
      } catch (err) {
        toast.error('Gagal load data referensi');
      }
    }
    loadRefs();
  }, []);

  const toggleMenu = (idmenu) => {
    setSelectedMenus(prev => prev.includes(idmenu) ? prev.filter(m => m !== idmenu) : [...prev, idmenu]);
  };

  const toggleLokasi = (idlokasi) => {
    setSelectedLokasi(prev => prev.includes(idlokasi) ? prev.filter(l => l !== idlokasi) : [...prev, idlokasi]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && (!username || !pass || !namauser)) return toast.error('Username, password, dan nama wajib diisi');
    setLoading(true);
    try {
      const payload = {
        username: username.toUpperCase(),
        namauser,
        email: email || null,
        hp: hp || null,
        menus: selectedMenus,
        lokasis: selectedLokasi
      };
      if (!isEdit) payload.pass = pass;
      if (!isEdit && selectedTemplate) payload.idtemplate = parseInt(selectedTemplate);
      if (isEdit) payload.status = status;

      if (isEdit) {
        await api.put(`/user/${id}`, payload);
        toast.success('User berhasil diupdate');
      } else {
        await api.post('/user', payload);
        toast.success('User berhasil ditambah');
      }
      if (onSuccess) onSuccess();
      closeTab(tabId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  const labelClass = "block text-xs font-medium text-dark-300 mb-1";
  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 pt-4 pb-2 border-b border-primary-100 shrink-0">
        <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400"><ArrowLeft className="w-5 h-5" /></button>
        <div><h2 className="text-lg font-bold text-dark-500">{isEdit ? 'Edit User' : 'User Baru'}</h2><p className="text-xs text-dark-300">{isEdit ? `Edit ${existingUser?.username}` : 'Tambah pengguna baru'}</p></div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Username *</label>
              <input value={username} onChange={(e) => setUsername(e.target.value.toUpperCase())} className={inputClass} disabled={isEdit} />
            </div>
            {!isEdit && (
              <div>
                <label className={labelClass}>Password *</label>
                <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className={inputClass} minLength={6} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nama *</label>
              <input value={namauser} onChange={(e) => setNamauser(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>HP</label>
              <input value={hp} onChange={(e) => setHp(e.target.value)} className={inputClass} />
            </div>
            {isEdit && (
              <div>
                <label className={labelClass}>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                  <option value="AKTIF">AKTIF</option>
                  <option value="NONAKTIF">NONAKTIF</option>
                </select>
              </div>
            )}
          </div>

          {!isEdit && allTemplates.length > 0 && (
            <div>
              <label className={labelClass}>Template Menu (opsional)</label>
              <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className={inputClass}>
                <option value="">-- Manual --</option>
                {allTemplates.map(t => <option key={t.idmenutemplate} value={t.idmenutemplate}>{t.namatemplate}</option>)}
              </select>
            </div>
          )}

          {/* Menu */}
          <div>
            <label className={labelClass}>Menu Akses</label>
            <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
              {allMenus.map(m => (
                <label key={m.idmenu} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-warm-50 px-2 rounded text-sm">
                  <input type="checkbox" checked={selectedMenus.includes(m.idmenu)} onChange={() => toggleMenu(m.idmenu)} className="rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                  <span className="text-dark-400">{m.namamenu}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Lokasi */}
          <div>
            <label className={labelClass}>Lokasi Akses</label>
            <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
              {allLokasi.map(l => (
                <label key={l.idlokasi} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-warm-50 px-2 rounded text-sm">
                  <input type="checkbox" checked={selectedLokasi.includes(l.idlokasi)} onChange={() => toggleLokasi(l.idlokasi)} className="rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                  <span className="text-dark-400">{l.kodelokasi} — {l.namalokasi}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => closeTab(tabId)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary-100 text-sm font-semibold text-dark-400">Batal</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {isEdit ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
