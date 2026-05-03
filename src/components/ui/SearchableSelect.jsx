import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Cari...',
  displayKey = 'label',
  valueKey = 'value',
  className = '',
  required = false,
  disabled = false,
}) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const containerRef        = useRef(null);

  const selected = options.find((o) => (typeof o === 'object' ? o[valueKey] : o) === value);

  const filtered = search
    ? options.filter((o) => {
        const label = typeof o === 'object' ? (o[displayKey] || '') : String(o);
        return label.toLowerCase().includes(search.toLowerCase());
      }).slice(0, 6)
    : options.slice(0, 6);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (opt) => {
    const val = typeof opt === 'object' ? opt[valueKey] : opt;
    onChange(val);
    const label = typeof opt === 'object' ? opt[displayKey] : String(opt);
    setSearch(label);
    setOpen(false);
  };

  const handleClear = () => {
    onChange('' );
    setSearch('');
    setOpen(false);
  };

  const displayValue = selected
    ? (typeof selected === 'object' ? (selected[displayKey] || '') : String(selected))
    : search;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
        <input
          type     = "text"
          value    = {open ? search : displayValue}
          onChange = {(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            if (!search) setSearch(displayValue || '' );
          }}
          placeholder = {placeholder}
          className   = "w-full pl-9 pr-8 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white input-upper"
          required    = {required}
          disabled    = {disabled}
        />
        {(value || search) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-warm-100 text-dark-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 border border-primary-100 rounded-xl bg-white shadow-lg max-h-48 overflow-y-auto scrollbar-thin">
          {filtered.map((opt, i) => {
            const val      = typeof opt === 'object' ? opt[valueKey] : opt;
            const label    = typeof opt === 'object' ? opt[displayKey] : String(opt);
            const isActive = val        === value;
            return (
              <button
                key       = {val ?? i}
                type      = "button"
                onClick   = {() => handleSelect(opt)}
                className = {`w-full text-left px-3 py-2 text-sm transition-colors ${isActive ? 'bg-primary-50 text-primary-700 font-semibold': 'text-dark-400 hover:bg-warm-50'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
