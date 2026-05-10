import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { formatRupiah } from '../lib/utils';
import { Search, ChevronDown } from 'lucide-react';

// ─────────────── Browse Modals ───────────────

export function BrowseCustomerModal({ onSelect, onClose }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/customer', search ? { params: { search } } : {}).then(r => setCustomers(r.data));
  }, [search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-primary-50">
          <h3 className="text-sm font-bold text-dark-500">Pilih Customer</h3>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
            <input value={search} onChange={e => setSearch(e.target.value.toUpperCase())}
              placeholder="Cari customer..." autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-0.5">
            {customers.length === 0 && (
              <p className="text-sm text-dark-300 text-center py-6">Tidak ada customer ditemukan</p>
            )}
            {customers.map(c => (
              <button key={c.idcustomer} onClick={() => onSelect(c)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-warm-50 transition-colors">
                <p className="text-sm font-semibold text-dark-500">{c.namacustomer}</p>
                <p className="text-xs text-dark-300">{c.kodecustomer}{c.hp ? ` \u2022 ${c.hp}` : ''}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrowseSupplierModal({ onSelect, onClose }) {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params = search ? { params: { search } } : {};
    api.get('/supplier', params).then(r => setSuppliers(r.data));
  }, [search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-primary-50">
          <h3 className="text-sm font-bold text-dark-500">Pilih Supplier</h3>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
            <input value={search} onChange={e => setSearch(e.target.value.toUpperCase())}
              placeholder="Cari supplier..." autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-0.5">
            {suppliers.length === 0 && (
              <p className="text-sm text-dark-300 text-center py-6">Tidak ada supplier ditemukan</p>
            )}
            {suppliers.map(s => (
              <button key={s.idsupplier} onClick={() => onSelect(s)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-warm-50 transition-colors">
                <p className="text-sm font-semibold text-dark-500">{s.namasupplier}</p>
                <p className="text-xs text-dark-300">{s.kodesupplier}{s.hp ? ` \u2022 ${s.hp}` : ''}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrowseLokasiModal({ onSelect, onClose }) {
  const [lokasiList, setLokasiList] = useState([]);

  useEffect(() => { api.get('/lokasi').then(r => setLokasiList(r.data)); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-primary-50">
          <h3 className="text-sm font-bold text-dark-500">Pilih Lokasi</h3>
        </div>
        <div className="p-4 space-y-0.5 max-h-64 overflow-y-auto scrollbar-thin">
          {lokasiList.map(l => (
            <button key={l.idlokasi} onClick={() => onSelect(l)}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-warm-50 transition-colors">
              <p className="text-sm font-semibold text-dark-500">{l.namalokasi}</p>
              <p className="text-xs text-dark-300">{l.kodelokasi}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────── PPN Dropdown ───────────────

export function PpnDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const btnRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: rect.width,
      });
    }
  }, [open]);

  const isInclude = value === 'INCLUDE';

  return (
    <div ref={ref}>
      <button ref={btnRef} type="button" onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center justify-between gap-1.5 w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
          isInclude
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
        }`}>
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isInclude ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {isInclude ? 'INCLUDE' : 'TIDAK'}
        </span>
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div style={dropdownStyle} className="z-[100] bg-white rounded-xl border border-primary-100 shadow-xl overflow-hidden">
          <button type="button" onClick={() => { onChange('INCLUDE'); setOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors ${
              isInclude ? 'bg-emerald-50 text-emerald-700' : 'text-dark-500 hover:bg-emerald-50 hover:text-emerald-700'
            }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> INCLUDE
          </button>
          <button type="button" onClick={() => { onChange('TIDAK_PAKAI'); setOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors ${
              !isInclude ? 'bg-red-50 text-red-700' : 'text-dark-500 hover:bg-red-50 hover:text-red-700'
            }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> TIDAK
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────── Item Helpers ───────────────

export function getSatuanOptions(item) {
  const opts = [];
  if (item.satuanbesar) opts.push(item.satuanbesar);
  if (item.satuansedang) opts.push(item.satuansedang);
  if (item.satuankecil) opts.push(item.satuankecil);
  return opts.length ? opts : ['PCS'];
}

export function getDefaultSatuan(b) {
  const s = [b.satuanbesar, b.satuansedang, b.satuankecil].find(v => v && String(v).trim());
  return s ? String(s).trim() : 'PCS';
}

export function isJmlValid(val) {
  const s = String(val).trim();
  return s !== '' && /^\d+$/.test(s) && parseInt(s, 10) > 0;
}

export function isFloatValid(val) {
  const s = String(val).trim();
  return s !== '' && /^\d+([.,]\d+)?$/.test(s) && parseFloat(s.replace(',', '.')) > 0;
}

export function parseFloatVal(val) {
  return parseFloat(String(val).trim().replace(',', '.')) || 0;
}
