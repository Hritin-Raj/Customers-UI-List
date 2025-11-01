import { useId } from 'react';

export function SearchInput({ value, onChange, placeholder = 'Search customers' }) {
  const inputId = useId();

  return (
    <div className="search-input">
      <label htmlFor={inputId} className="visually-hidden">
        Search
      </label>
      <span className="search-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M13.5 12.5L18 17"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14.5 8.5C14.5 11.5376 12.0376 14 9 14C5.96243 14 3.5 11.5376 3.5 8.5C3.5 5.46243 5.96243 3 9 3C12.0376 3 14.5 5.46243 14.5 8.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </span>
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  );
}

