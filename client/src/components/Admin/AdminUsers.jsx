import React, { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, Trash2, Plus, Check, X } from 'lucide-react';
import api from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.get('/admin/users')
      .then(({ data }) => setUsers(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const { data } = await api.post('/admin/users', { firstName: newName.trim() });
      setUsers((prev) => [data, ...prev]);
      setNewName('');
      setShowAdd(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Toevoegen mislukt.');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(user) {
    if (user.post_count > 0 || user.comment_count > 0) {
      alert(`${user.first_name} heeft nog ${user.post_count} berichten en ${user.comment_count} reacties. Verwijder die eerst.`);
      return;
    }
    if (!window.confirm(`Weet je zeker dat je ${user.first_name} wilt verwijderen?`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      alert(err.response?.data?.error || 'Verwijderen mislukt.');
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-text-primary">Gebruikers ({users.length})</h2>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Toevoegen
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="card p-3 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Voornaam van nieuwe gebruiker"
            className="input flex-1 text-sm"
            autoFocus
            maxLength={50}
          />
          <button type="submit" disabled={adding || !newName.trim()} className="btn-primary text-sm px-3">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button type="button" onClick={() => { setShowAdd(false); setNewName(''); }} className="btn-secondary text-sm px-3">
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {users.map((u) => (
        <div key={u.id} className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-base flex-shrink-0">
            {u.first_name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-text-primary">{u.first_name}</span>
              {u.is_admin && <ShieldCheck className="w-4 h-4 text-accent" title="Beheerder" />}
            </div>
            <div className="flex gap-3 mt-0.5 text-xs text-text-secondary">
              <span>{u.post_count} berichten</span>
              <span>{u.comment_count} reacties</span>
              <span>Lid sinds {new Date(u.created_at).toLocaleDateString('nl-NL')}</span>
            </div>
          </div>
          {!u.is_admin && (
            <button
              onClick={() => handleDelete(u)}
              disabled={u.post_count > 0 || u.comment_count > 0}
              className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={u.post_count > 0 || u.comment_count > 0 ? 'Heeft nog berichten of reacties' : 'Verwijder gebruiker'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
