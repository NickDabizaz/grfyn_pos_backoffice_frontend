import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function MultiSelect({
  value = [],
  onChange,
  options = [],
  placeholder = 'Cari...',
  displayKey = 'label',
  valueKey = 'value',
  className = '',
  disabled = false,
}) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const containerRef        = useRef(null);

  const selectedValues = Array.isArray(value) ? value : [];

  const getOption = (val) =>
    options.find((o) => (typeof o === 'object' ? o[valueKey] : o) === val);

  const filtered = options
    .filter((o) => {
      const val = typeof o === 'object' ? o[valueKey] : o;
      if (selectedValues.includes(val)) return false;
      const label = typeof o === 'object' ? (o[displayKey] || '') : String(o);
      if (!search) return true;
      return label.toLowerCase().includes(search.toLowerCase());
    })
    .slice(0, 6);

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
    if (!selectedValues.includes(val)) {
      onChange([...selectedValues, val]);
    }
    setSearch('');
  };

  const handleRemove = (valToRemove) => {
    onChange(selectedValues.filter((v) => v !== valToRemove));
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-300" />
        <input
          type="text"
          value={open ? search : search || ''}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-primary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white input-upper"
          disabled={disabled}
        />
        {(selectedValues.length > 0 || search) && (
          <button
            type="button"
            onClick={() => {
              onChange([]);
              setSearch('');
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-warm-100 text-dark-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selectedValues.map((val) => {
            const opt = getOption(val);
            const label = opt
              ? typeof opt === 'object'
                ? opt[displayKey] || ''
                : String(opt)
              : String(val);
            return (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium"
              >
                {label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(val);
                  }}
                  className="p-0.5 rounded hover:bg-primary-100 text-primary-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 border border-primary-100 rounded-xl bg-white shadow-lg max-h-48 overflow-y-auto scrollbar-thin">
          {filtered.map((opt, i) => {
            const val   = typeof opt === 'object' ? opt[valueKey] : opt;
            const label = typeof opt === 'object' ? opt[displayKey] : String(opt);
            return (
              <button
                key={val ?? i}
                type="button"
                onClick={() => handleSelect(opt)}
                className="w-full text-left px-3 py-2 text-sm text-dark-400 hover:bg-warm-50 transition-colors"
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
