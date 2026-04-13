import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import api from '../../services/api';

const TOPIC_COLORS = [
  'border-blue-500/50 text-blue-400 bg-blue-500/10',
  'border-green-500/50 text-green-400 bg-green-500/10',
  'border-purple-500/50 text-purple-400 bg-purple-500/10',
  'border-orange-500/50 text-orange-400 bg-orange-500/10',
  'border-pink-500/50 text-pink-400 bg-pink-500/10',
  'border-teal-500/50 text-teal-400 bg-teal-500/10',
  'border-yellow-500/50 text-yellow-400 bg-yellow-500/10',
  'border-red-500/50 text-red-400 bg-red-500/10',
  'border-indigo-500/50 text-indigo-400 bg-indigo-500/10',
  'border-cyan-500/50 text-cyan-400 bg-cyan-500/10',
];
function topicColor(id) { return TOPIC_COLORS[(id - 1) % TOPIC_COLORS.length]; }

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
    e.preventDefault();
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
                ? topicColor(t.id) + ' opacity-100'
                : 'border-divider text-text-secondary bg-transparent opacity-60 hover:opacity-100'
            }`}
          >
            {selected.includes(t.id) && <span className="mr-1">✓</span>}
            {t.name}
          </button>
        ))}

        {showInput ? (
          <form onSubmit={handleAddTopic} className="flex items-center gap-1">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Nieuw onderwerp"
              className="input py-0.5 text-sm w-36"
              autoFocus
              maxLength={100}
            />
            <button type="submit" disabled={adding} className="text-accent hover:text-accent-light">
              <Plus className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setShowInput(false)} className="text-text-secondary">
              <X className="w-4 h-4" />
            </button>
          </form>
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
