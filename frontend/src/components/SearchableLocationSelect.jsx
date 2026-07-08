import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

export default function SearchableLocationSelect({
  label,
  options,
  value,
  onChange,
  emptyLabel = 'All',
}) {
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery(value || '');
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [value]);

  const pick = (opt) => {
    onChange(opt);
    setQuery(opt);
    setOpen(false);
  };

  const clear = () => {
    onChange('');
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value.trim()) onChange('');
          }}
          onFocus={() => setOpen(true)}
          placeholder={`Search ${label.toLowerCase()}...`}
          className="w-full px-3 py-2.5 pr-16 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={clear}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              aria-label="Clear"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            aria-label="Toggle list"
          >
            <ChevronDown size={16} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <ul className="max-h-52 overflow-y-auto overscroll-contain">
            {!query.trim() && (
              <li>
                <button
                  type="button"
                  onClick={() => pick('')}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-teal-50 ${
                    !value ? 'bg-teal-50 text-teal-800 font-medium' : 'text-gray-600'
                  }`}
                >
                  {emptyLabel}
                </button>
              </li>
            )}
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-gray-400 text-center">No matches found</li>
            ) : (
              filtered.map((opt) => (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => pick(opt)}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-teal-50 ${
                      value === opt ? 'bg-teal-50 text-teal-800 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {opt}
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 text-[11px] text-gray-400">
            {filtered.length} of {options.length} shown
          </div>
        </div>
      )}

      <p className="text-[11px] text-gray-400 mt-1">{options.length} in Florida</p>
    </div>
  );
}
