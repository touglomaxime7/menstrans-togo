import { useState, useRef, useEffect } from 'react';

export default function ComboBox({
  value = '',
  onChange,
  options = [],
  placeholder = 'Taper ou sélectionner...',
  className = '',
  disabled = false,
}) {
  const [open,     setOpen]     = useState(false);
  const [query,    setQuery]    = useState(value);
  const [touched,  setTouched]  = useState(false);
  const wrapperRef              = useRef(null);

  // Sync externe → interne
  useEffect(() => { setQuery(value); setTouched(false); }, [value]);

  // Fermer si clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setTouched(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Options filtrées : seulement si l'utilisateur a tapé quelque chose
  // Si on n'a pas encore touché au champ → montrer toutes les options
  const filtered = (touched && query)
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  const handleInput = (e) => {
    setQuery(e.target.value);
    setTouched(true);
    onChange(e.target.value);
    setOpen(true);
  };

  const handleFocus = () => {
    setOpen(true);
    setTouched(false); // Réinitialiser pour montrer toutes les options à l'ouverture
  };

  const handleSelect = (option) => {
    setQuery(option);
    setTouched(false);
    onChange(option);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-9 border border-gray-200 rounded-md px-3 pr-7 text-xs outline-none focus:border-blue-400 bg-white disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          type="button"
          onClick={() => { setOpen(!open); setTouched(false); }}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[10px]"
        >
          {open ? '▲' : '▼'}
        </button>
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute top-10 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {filtered.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition ${
                option === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {open && touched && filtered.length === 0 && query && (
        <div className="absolute top-10 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="px-3 py-2 text-xs text-gray-400 italic">
            Valeur personnalisée : "{query}"
          </div>
        </div>
      )}
    </div>
  );
}