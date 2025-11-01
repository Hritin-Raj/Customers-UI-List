import { useEffect, useRef, useState } from 'react';

const FILTER_ITEMS = ['Filter 1', 'Filter 2', 'Filter 3', 'Filter 4'];

export function FiltersDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`filters-dropdown${open ? ' open' : ''}`} ref={containerRef}>
      <button type="button" className="filters-button" onClick={() => setOpen((prev) => !prev)}>
        <span className="filters-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M4 10H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        Add Filters
      </button>
      {open && (
        <div className="filters-menu" role="menu">
          {FILTER_ITEMS.map((label) => (
            <button key={label} type="button" role="menuitem" className="filters-menu-item">
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

