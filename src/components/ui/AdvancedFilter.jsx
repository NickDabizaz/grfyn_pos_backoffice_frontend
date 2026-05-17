import { useState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import api from '../../api/axios';

const FIELDS = {
  penjualan: [
    { key: 'namacustomer',  label: 'Nama Customer',  browseUrl: '/customer',           labelField: 'namacustomer', valueField: 'namacustomer' },
    { key: 'kodecustomer',  label: 'Kode Customer',  browseUrl: '/customer',           labelField: 'namacustomer', valueField: 'kodecustomer' },
    { key: 'alamatcustomer',label: 'Alamat Customer', browseUrl: null },
    { key: 'namabarang',    label: 'Nama Barang',    browseUrl: '/barang/browse-barang',labelField: 'namabarang',  valueField: 'namabarang' },
    { key: 'kodebarang',    label: 'Kode Barang',    browseUrl: '/barang/browse-barang',labelField: 'namabarang',  valueField: 'kodebarang' },
  ],
  pembelian: [
    { key: 'namasupplier',  label: 'Nama Supplier',  browseUrl: '/supplier',           labelField: 'namasupplier', valueField: 'namasupplier' },
    { key: 'kodesupplier',  label: 'Kode Supplier',  browseUrl: '/supplier',           labelField: 'namasupplier', valueField: 'kodesupplier' },
    { key: 'alamatsupplier',label: 'Alamat Supplier', browseUrl: null },
    { key: 'namabarang',    label: 'Nama Barang',    browseUrl: '/barang/browse-barang',labelField: 'namabarang',  valueField: 'namabarang' },
    { key: 'kodebarang',    label: 'Kode Barang',    browseUrl: '/barang/browse-barang',labelField: 'namabarang',  valueField: 'kodebarang' },
  ],
};

async function fetchSuggestions(browseUrl, search) {
  if (!browseUrl || !search.trim()) return [];
  try {
    const res = await api.get(browseUrl, { params: { search, limit: 8 } });
    return res.data || [];
  } catch {
    return [];
  }
}

export default function AdvancedFilter({ filterSide, onChange }) {
  const fields = FIELDS[filterSide] || [];
  const [selectedField, setSelectedField] = useState(fields[0]?.key || '');
  const [op, setOp] = useState('ADALAH');
  const [inputVal, setInputVal] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState([]);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const currentField = fields.find((f) => f.key === selectedField) || fields[0];

  useEffect(() => {
    if (op !== 'ADALAH' || !currentField?.browseUrl) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(currentField.browseUrl, inputVal);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [inputVal, op, currentField]);

  const handleAdd = (valueOverride) => {
    const value = valueOverride !== undefined ? valueOverride : inputVal.trim();
    if (!value) return;
    const next = [...filters, { field: currentField.key, label: currentField.label, op, value }];
    setFilters(next);
    onChange(next);
    setInputVal('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleRemove = (idx) => {
    const next = filters.filter((_, i) => i !== idx);
    setFilters(next);
    onChange(next);
  };

  const handleSuggestionClick = (item) => {
    const value = item[currentField.valueField] || item[currentField.labelField] || '';
    handleAdd(value);
  };

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-semibold text-dark-300">Filter Barang &amp; {filterSide === 'pembelian' ? 'Supplier' : 'Customer'}</label>

      {/* Row 1: Field selector */}
      <select
        value={selectedField}
        onChange={(e) => { setSelectedField(e.target.value); setInputVal(''); setSuggestions([]); }}
        className="w-full px-2 py-1.5 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20"
      >
        {fields.map((f) => (
          <option key={f.key} value={f.key}>{f.label}</option>
        ))}
      </select>

      {/* Row 2: Operator */}
      <div className="flex gap-2">
        {['ADALAH', 'BERISI KATA'].map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => { setOp(o); setInputVal(''); setSuggestions([]); }}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
              op === o ? 'bg-primary-500 text-white' : 'bg-warm-50 text-dark-400 hover:bg-warm-100'
            }`}
          >
            {o}
          </button>
        ))}
      </div>

      {/* Row 3: Value input + Add */}
      <div className="relative">
        <div className="flex gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
            placeholder={op === 'ADALAH' ? 'Pilih atau ketik...' : 'Ketik nilai...'}
            className="flex-1 px-2 py-1.5 rounded-lg border border-primary-100 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20"
          />
          <button
            type="button"
            onClick={() => handleAdd()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-[10px] font-semibold shrink-0"
          >
            <Plus className="w-3 h-3" /> Tambah
          </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-20 top-full left-0 right-12 mt-0.5 bg-white border border-primary-100 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {suggestions.map((item, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={() => handleSuggestionClick(item)}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-primary-50 text-dark-500"
              >
                <span className="font-medium">{item[currentField.valueField]}</span>
                {currentField.valueField !== currentField.labelField && (
                  <span className="text-dark-300 ml-1">— {item[currentField.labelField]}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected filters */}
      {filters.length > 0 && (
        <div className="flex flex-col gap-1 pt-1">
          {filters.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary-50 border border-primary-100">
              <span className="text-[10px] font-semibold text-primary-700 truncate flex-1">
                {f.label} <span className="font-normal text-dark-400">{f.op}</span> {f.value}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="shrink-0 hover:text-red-500 text-dark-300"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
