'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { searchLocations, LocationSearchResult, LocationType } from '@/lib/kenya-locations';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, location?: LocationSearchResult) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Search location...',
  label,
  required,
  error,
  className = '',
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search locations when query changes
  useEffect(() => {
    const searchResults = searchLocations(query);
    setResults(searchResults);
    setHighlightedIndex(-1);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          selectLocation(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  }, [isOpen, results, highlightedIndex]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const selectLocation = (location: LocationSearchResult) => {
    setQuery(location.displayName);
    onChange(location.displayName, location);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const clearInput = () => {
    setQuery('');
    onChange('');
    inputRef.current?.focus();
  };

  const getTypeIcon = (type: LocationType) => {
    switch (type) {
      case 'county':
        return '🏛️';
      case 'constituency':
        return '📍';
      case 'ward':
        return '🏘️';
      case 'area':
        return '⭐';
      default:
        return '📌';
    }
  };

  const getTypeColor = (type: LocationType) => {
    switch (type) {
      case 'county':
        return 'text-blue-600 bg-blue-50';
      case 'constituency':
        return 'text-green-600 bg-green-50';
      case 'ward':
        return 'text-purple-600 bg-purple-50';
      case 'area':
        return 'text-amber-600 bg-amber-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPinIcon className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-10 py-2.5 
            border rounded-lg shadow-sm
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-300' : 'border-gray-300'}
            text-gray-900 placeholder-gray-400
          `}
          autoComplete="off"
        />

        {query && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {!query && (
            <li className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
              Popular Locations
            </li>
          )}
          {results.map((result, index) => (
            <li
              key={`${result.type}-${result.name}-${index}`}
              onClick={() => selectLocation(result)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`
                px-3 py-2 cursor-pointer flex items-start gap-3
                ${highlightedIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'}
              `}
            >
              <span className="text-lg flex-shrink-0 mt-0.5">
                {getTypeIcon(result.type)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {result.displayName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {result.subtitle}
                </p>
              </div>
              <span className={`
                text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0
                ${getTypeColor(result.type)}
              `}>
                {result.type}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* No results message */}
      {isOpen && query && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-3 text-gray-500">
            <MagnifyingGlassIcon className="h-5 w-5" />
            <p className="text-sm">No locations found for "{query}"</p>
          </div>
        </div>
      )}
    </div>
  );
}
