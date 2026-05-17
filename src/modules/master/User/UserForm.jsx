import { useState, useEffect, useRef } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Loader2, ChevronDown } from 'lucide-react';
import useTabStore from '../../../store/tabStore';

const ACCESS_FIELDS = ['hakakses', 'tambah', 'ubah', 'approve', 'batalapprove', 'bataltransaksi', 'cetak'];
const ACCESS_LABELS = {
  hakakses: 'Hak Akses',
  tambah: 'Tambah',
  ubah: 'Ubah',
  approve: 'Approve',
  batalapprove: 'Batal Approve',
  bataltransaksi: 'Batal Transaksi',
  cetak: 'Cetak',
};

const emptyAccess = () => ACCESS_FIELDS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
const fullAccess = () => ACCESS_FIELDS.reduce((acc, key) => ({ ...acc, [key]: 1 }), {});
const normalizeAccess = (row = {}) => ACCESS_FIELDS.reduce((acc, key) => {
  acc[key] = Number(row[key] || 0) === 1 ? 1 : 0;
  return acc;
}, {});
const hasAnyAccess = (access = {}) => ACCESS_FIELDS.some((key) => Number(access[key] || 0) === 1);

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
  const [menuAccess, setMenuAccess] = useState({});
  const [selectedLokasi, setSelectedLokasi] = useState([]);
  const [allTemplates, setAllTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [expandedMenus, setExpandedMenus] = useState(new Set());

  useEffect(() => {
    async function loadRefs() {
      try {
        const [menuRes, lokRes, tmpRes] = await Promise.all([
          api.get('/menu/all'),
          api.get('/lokasi'),
          api.get('/user/templates'),
        ]);
        setAllMenus(menuRes.data);
        setAllLokasi(lokRes.data);
        setAllTemplates(tmpRes.data);

        if (isEdit && existingUser) {
          const [mRes, lRes] = await Promise.all([
            api.get(`/user/${existingUser.iduser}/menus`),
            api.get(`/user/${existingUser.iduser}/lokasis`),
          ]);
          const nextAccess = {};
          mRes.data.forEach((m) => {
            nextAccess[m.idmenu] = normalizeAccess(m);
          });
          setMenuAccess(nextAccess);
          setSelectedLokasi(lRes.data.map(l => l.idlokasi));
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Gagal load data referensi');
      }
    }
    loadRefs();
  }, [isEdit, existingUser]);

  const getAllIds = (item) => [item.idmenu, ...(item.children || []).flatMap(getAllIds)];

  const handleMenuToggle = (item, checked) => {
    const ids = getAllIds(item);
    setMenuAccess(prev => {
      const next = { ...prev };
      ids.forEach((idmenu) => {
        next[idmenu] = checked ? fullAccess() : emptyAccess();
      });
      return next;
    });
  };

  const handleAccessToggle = (item, field, checked) => {
    const ids = getAllIds(item);
    setMenuAccess(prev => {
      const next = { ...prev };
      ids.forEach((idmenu) => {
        const current = normalizeAccess(next[idmenu]);
        if (field === 'hakakses') {
          next[idmenu] = checked ? fullAccess() : emptyAccess();
          return;
        }
        const updated = { ...current, [field]: checked ? 1 : 0 };
        updated.hakakses = hasAnyAccess(updated) ? 1 : 0;
        next[idmenu] = updated;
      });
      return next;
    });
  };

  const getCheckedState = (item, accessMap) => {
    const ids = getAllIds(item);
    const n = ids.filter(id => hasAnyAccess(accessMap[id])).length;
    if (n === 0) return 'none';
    if (n === ids.length) return 'all';
    return 'some';
  };

  function MenuTreeItem({ item, level, accessMap, onToggle, onAccessToggle, expandedSet, onToggleExpand }) {
    const hasChildren = item.children && item.children.length > 0;
    const checkboxRef = useRef(null);
    const checkedState = getCheckedState(item, accessMap);
    const isOpen = expandedSet.has(item.idmenu);
    const currentAccess = normalizeAccess(accessMap[item.idmenu]);

    useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = checkedState === 'some';
        checkboxRef.current.checked = checkedState === 'all' || checkedState === 'some';
      }
    }, [checkedState]);

    return (
      <div>
        <div className="grid grid-cols-[minmax(240px,1fr)_repeat(7,minmax(96px,120px))] items-center gap-2 py-2 px-3 hover:bg-warm-50 text-sm border-b border-primary-50/40">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 16}px` }}>
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onToggleExpand(item.idmenu);
                }}
                className="p-0 hover:bg-warm-100 rounded"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
              </button>
            ) : <span className="w-3.5" />}
            <input
              ref={checkboxRef}
              type="checkbox"
              checked={checkedState === 'all'}
              onChange={(e) => onToggle(item, e.target.checked)}
              className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              title="Pilih semua akses"
            />
            <span className={checkedState === 'some' ? 'font-medium text-amber-600' : 'text-dark-400'}>
              {item.namamenu}
            </span>
          </div>
          {ACCESS_FIELDS.map((field) => (
            <label key={field} className="flex justify-center">
              <input
                type="checkbox"
                checked={Number(currentAccess[field] || 0) === 1}
                onChange={(e) => onAccessToggle(item, field, e.target.checked)}
                className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                title={ACCESS_LABELS[field]}
              />
            </label>
          ))}
        </div>
        {hasChildren && isOpen && item.children.map((child) => (
          <MenuTreeItem
            key={child.idmenu}
            item={child}
            level={level + 1}
            accessMap={accessMap}
            onToggle={onToggle}
            onAccessToggle={onAccessToggle}
            expandedSet={expandedSet}
            onToggleExpand={onToggleExpand}
          />
        ))}
      </div>
    );
  }

  const toggleLokasi = (idlokasi) => {
    setSelectedLokasi(prev => prev.includes(idlokasi) ? prev.filter(l => l !== idlokasi) : [...prev, idlokasi]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && (!username || !pass || !namauser)) return toast.error('Username, password, dan nama wajib diisi');
    setLoading(true);
    try {
      const payload = {
        username,
        namauser,
        email: email || null,
        hp: hp || null,
        menus: Object.entries(menuAccess)
          .map(([idmenu, access]) => ({ idmenu: Number(idmenu), ...normalizeAccess(access) }))
          .filter((menu) => hasAnyAccess(menu)),
        lokasis: selectedLokasi,
      };
      if (!isEdit) payload.pass = pass;
      if (!isEdit && selectedTemplate) payload.idtemplate = parseInt(selectedTemplate, 10);
      if (isEdit) payload.status = status;

      if (isEdit) {
        await api.put(`/user/${id}`, payload);
        toast.success('User berhasil diupdate');
      } else {
        await api.post('/user', payload);
        toast.success('User berhasil ditambah');
      }
      onSuccess?.();
      closeTab(tabId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  const labelClass = 'block text-xs font-medium text-dark-300 mb-1';
  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 pt-4 pb-2 border-b border-primary-100 shrink-0">
        <button onClick={() => closeTab(tabId)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h2 className="text-lg font-bold text-dark-500">{isEdit ? 'Edit User' : 'User Baru'}</h2>
          <p className="text-xs text-dark-300">{isEdit ? `Edit ${existingUser?.username}` : 'Tambah pengguna baru'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Username *</label>
                  <input value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} disabled={isEdit} />
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
            </div>

            <div>
              <label className={labelClass}>Lokasi Akses</label>
              <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto space-y-1 bg-white">
                {allLokasi.map(l => (
                  <label key={l.idlokasi} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-warm-50 px-2 rounded text-sm">
                    <input type="checkbox" checked={selectedLokasi.includes(l.idlokasi)} onChange={() => toggleLokasi(l.idlokasi)} className="rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                    <span className="text-dark-400">{l.kodelokasi} - {l.namalokasi}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Menu Akses</label>
            <div className="w-full max-h-[420px] overflow-auto space-y-0.5">
              <div className="grid grid-cols-[minmax(240px,1fr)_repeat(7,minmax(96px,120px))] gap-2 px-3 py-2 text-[10px] font-bold uppercase text-dark-300 sticky top-0 bg-warm-50 z-10 border-b border-primary-50">
                <div>Menu</div>
                {ACCESS_FIELDS.map((field) => <div key={field} className="text-center">{ACCESS_LABELS[field]}</div>)}
              </div>
              {allMenus.map(m => (
                <MenuTreeItem
                  key={m.idmenu}
                  item={m}
                  level={0}
                  accessMap={menuAccess}
                  onToggle={handleMenuToggle}
                  onAccessToggle={handleAccessToggle}
                  expandedSet={expandedMenus}
                  onToggleExpand={(k) => setExpandedMenus(prev => {
                    const n = new Set(prev);
                    n.has(k) ? n.delete(k) : n.add(k);
                    return n;
                  })}
                />
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
