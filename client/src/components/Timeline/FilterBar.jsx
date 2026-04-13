import React, { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import api from '../../services/api';

export default function FilterBar({ sortBy, setSortBy, topicId, setTopicId }) {
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    api.get('/topics').then(({ data }) => setTopics(data)).catch(() => {});
  }, []);

  return (
    <div className="border-b border-divider px-4 py-2 flex items-center gap-3 overflow-x-auto scrollbar-hide">
      <SlidersHorizontal className="w-4 h-4 text-text-secondary flex-shrink-0" />

      {/* Sort */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={() => setSortBy('date')}
          className={`text-sm px-3 py-1 rounded-full transition-colors ${
            sortBy === 'date'
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Nieuwste
        </button>
        <button
          onClick={() => setSortBy('likes')}
          className={`text-sm px-3 py-1 rounded-full transition-colors ${
            sortBy === 'likes'
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Populairste
        </button>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-divider flex-shrink-0" />

      {/* Topic filter */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={() => setTopicId(null)}
          className={`text-sm px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
            !topicId
              ? 'bg-accent/20 text-accent border border-accent/40'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Alles
        </button>
        {topics.map((t) => (
          <button
            key={t.id}
            onClick={() => setTopicId(topicId === t.id ? null : t.id)}
            className={`text-sm px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
              topicId === t.id
                ? 'bg-accent/20 text-accent border border-accent/40'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}
