import React, { useEffect, useState, useRef } from 'react';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import api from '../../services/api';

export default function FilterBar({ sortBy, setSortBy, topicId, setTopicId, search, setSearch }) {
  const [topics, setTopics] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    api.get('/topics').then(({ data }) => setTopics(data)).catch(() => {});
  }, []);

  // Sluit dropdown bij klik buiten
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeTopic = topics.find((t) => t.id === topicId);

  return (
    <div className="border-b border-divider px-4 py-2 space-y-2">
      {/* Bovenste rij: sortering + filter-knop */}
      <div className="flex items-center gap-2">
        {/* Sorteerknopjes */}
        <div className="flex gap-1">
          <button
            onClick={() => setSortBy('date')}
            className={`text-sm px-3 py-1 rounded-full transition-colors ${
              sortBy === 'date' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Nieuwste
          </button>
          <button
            onClick={() => setSortBy('likes')}
            className={`text-sm px-3 py-1 rounded-full transition-colors ${
              sortBy === 'likes' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Populairste
          </button>
        </div>

        <div className="h-5 w-px bg-divider" />

        {/* Onderwerp-dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className={`flex items-center gap-1.5 text-sm px-3 py-1 rounded-full transition-colors ${
              topicId
                ? 'bg-accent/20 text-accent border border-accent/40'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {activeTopic ? activeTopic.name : 'Onderwerp'}
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 top-full mt-1 card py-1 z-20 w-52 shadow-xl animate-fadeIn max-h-72 overflow-y-auto">
              <button
                onClick={() => { setTopicId(null); setDropdownOpen(false); }}
                className={`flex items-center w-full px-3 py-2 text-sm transition-colors ${
                  !topicId ? 'text-accent font-semibold' : 'text-text-primary hover:bg-white/5'
                }`}
              >
                Alle onderwerpen
              </button>
              <div className="border-t border-divider my-1" />
              {topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTopicId(topicId === t.id ? null : t.id); setDropdownOpen(false); }}
                  className={`flex items-center w-full px-3 py-2 text-sm transition-colors ${
                    topicId === t.id ? 'text-accent font-semibold' : 'text-text-primary hover:bg-white/5'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Wis filters */}
        {(topicId || search) && (
          <button
            onClick={() => { setTopicId(null); setSearch(''); }}
            className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Wis filters
          </button>
        )}
      </div>

      {/* Zoekbalk */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek in berichten..."
          className="input pl-8 py-1.5 text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
