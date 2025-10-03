'use client';

import { useState, useEffect, useCallback } from 'react';

interface ReportSearchProps {
  onSearch: (query: string) => void;
}

export default function ReportSearch({ onSearch }: ReportSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search
  const debouncedSearch = useCallback(
    (searchQuery: string) => {
      const timer = setTimeout(() => {
        onSearch(searchQuery);
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    },
    [onSearch]
  );

  useEffect(() => {
    if (query) {
      setIsSearching(true);
      const cleanup = debouncedSearch(query);
      return cleanup;
    } else {
      onSearch('');
      setIsSearching(false);
    }
  }, [query, debouncedSearch, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="relative" style={{ display: 'inline-block' }}>
      <div className="relative">
        <span
          className="material-symbols-outlined"
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '20px',
            color: 'var(--text-muted)'
          }}
        >
          search
        </span>
        <input
          type="text"
          placeholder="Search reports..."
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          className="form-input"
          style={{ paddingLeft: '2.5rem', paddingRight: query ? '2.5rem' : '1rem', width: '260px' }}
        />
        {query && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>
              close
            </span>
          </button>
        )}
      </div>
      {isSearching && (
        <div style={{ position: 'absolute', top: '100%', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Searching...
        </div>
      )}
    </div>
  );
}