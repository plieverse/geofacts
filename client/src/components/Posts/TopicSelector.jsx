import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import api from '../../services/api';

export default function TopicSelector({ selected, onChange }) {
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [adding, setAdding] = useState(false);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    api.get('/topics').then(({ data }) => setTopics(data)).catch(() => {});
  }, []);

  function toggleTopic(id) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  async function handleAddTopic(e) {
    e?.preventDefault();
    if (!newTopic.trim()) return;
    setAdding(true);
    try {
      const { data } = await api.post('/topics', { name: newTopic.trim() });
      setTopics((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      onChange([...selected, data.id]);
      setNewTopic('');
      setShowInput(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Aanmaken mislukt.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-2">Onderwerpen</label>
      <div className="flex flex-wrap gap-2">
        {topics.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => toggleTopic(t.id)}
            className={`topic-chip transition-all ${
              selected.includes(t.id)
                ? 'border-accent/50 text-accent bg-accent/10 opacity-100'
                : 'border-divider text-text-secondary bg-transparent opacity-60 hover:opacity-100'
            }`}
          >
            {selected.includes(t.id) && <span className="mr-1">✓</span>}
            {t.name}
          </button>
        ))}

        {showInput ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTopic(); } }}
              placeholder="Nieuw onderwerp"
              className="input py-0.5 text-sm w-36"
              autoFocus
              maxLength={100}
            />
            <button type="button" onClick={handleAddTopic} disabled={adding} className="text-accent hover:text-accent-light">
              <Plus className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setShowInput(false)} className="text-text-secondary">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowInput(true)}
            className="topic-chip border-dashed border-divider text-text-secondary hover:text-accent hover:border-accent transition-colors"
          >
            <Plus className="w-3 h-3 inline mr-1" />
            Nieuw
          </button>
        )}
      </div>
    </div>
  );
}
