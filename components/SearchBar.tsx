import React, { useState } from 'react';
import SearchIcon from './icons/SearchIcon';
import LoaderIcon from './icons/LoaderIcon';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
  disabled: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isSearching, disabled }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      onSearch(query);
    };

    return (
      <form onSubmit={handleSubmit} className="relative">
        <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-content-200" />
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={disabled && !isSearching ? "Please set your API key to start" : "Ask a research question... e.g., 'Does mindfulness reduce anxiety?'"} disabled={disabled} className="w-full pl-14 pr-32 py-4 text-lg bg-base-200 border-2 border-base-300 rounded-full focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition text-content-100 placeholder-content-200 disabled:opacity-70 disabled:cursor-not-allowed" aria-label="Research question"/>
        <button type="submit" disabled={disabled || !query.trim()} className="absolute inset-y-0 right-0 flex items-center justify-center w-28 text-white bg-brand-primary rounded-full m-2 font-semibold hover:bg-brand-secondary transition-colors disabled:bg-base-300 disabled:cursor-not-allowed" aria-label="Analyze">
          {isSearching ? <LoaderIcon className="w-6 h-6 animate-spin" /> : <span>Analyze</span>}
        </button>
      </form>
    );
};
export default SearchBar;
