import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Edit2, Trash2, Check, X, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../../services/api';

export default function AdminTopics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    api.get('/topics')
      .then(({ data }) => setTopics(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleEdit(id) {
    if (!editName.trim()) return;
    try {
      const { data } = await api.put(`/topics/${id}`, { name: editName.trim() });
      setTopics((prev) => prev.map((t) => (t.id === id ? data : t)));
      setEditId(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Bewerken mislukt.');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Dit onderwerp verwijderen?')) return;
    try {
      await api.delete(`/topics/${id}`);
      setTopics((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Verwijderen mislukt.');
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const { data } = await api.post('/topics', { name: newName.trim() });
      setTopics((prev) => [...prev, data]);
      setNewName('');
      setShowAdd(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Aanmaken mislukt.');
    } finally {
      setAdding(false);
    }
  }

  async function moveItem(index, direction) {
    const newTopics = [...topics];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= newTopics.length) return;
    [newTopics[index], newTopics[swapIndex]] = [newTopics[swapIndex], newTopics[index]];
    setTopics(newTopics);
    setReordering(true);
    try {
      await api.put('/admin/topics/reorder', { orderedIds: newTopics.map((t) => t.id) });
    } catch (err) {
      alert(err.response?.data?.error || 'Volgorde opslaan mislukt.');
      // Revert
      setTopics(topics);
    } finally {
      setReordering(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-text-primary">Onderwerpen ({topics.length})</h2>
        <button onClick={() => setShowAdd((v) => !v)} className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Nieuw
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="card p-3 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Naam van onderwerp"
            className="input flex-1 text-sm"
            autoFocus
            maxLength={100}
          />
          <button type="submit" disabled={adding || !newName.trim()} className="btn-primary text-sm px-3">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary text-sm px-3">
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {topics.map((t, index) => (
        <div key={t.id} className="card p-3 flex items-center gap-2">
          {/* Volgorde knoppen */}
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => moveItem(index, -1)}
              disabled={index === 0 || reordering || editId === t.id}
              className="p-0.5 rounded text-text-secondary hover:text-accent hover:bg-accent/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              title="Omhoog"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => moveItem(index, 1)}
              disabled={index === topics.length - 1 || reordering || editId === t.id}
              className="p-0.5 rounded text-text-secondary hover:text-accent hover:bg-accent/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              title="Omlaag"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {editId === t.id ? (
            <>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="input flex-1 text-sm"
                autoFocus
                onKeyDown={(e) => e.key === 'Escape' && setEditId(null)}
              />
              <button onClick={() => handleEdit(t.id)} className="p-1.5 rounded-full text-success hover:bg-success/10 transition-colors">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditId(null)} className="p-1.5 rounded-full text-text-secondary hover:bg-hover-surface/5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <span className="flex-1 text-text-primary text-sm">{t.name}</span>
              <button
                onClick={() => { setEditId(t.id); setEditName(t.name); }}
                className="p-1.5 rounded-full text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(t.id)}
                className="p-1.5 rounded-full text-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
