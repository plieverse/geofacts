import React, { useState, useEffect } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/users')
      .then(({ data }) => setUsers(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>;
  }

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-text-primary">Gebruikers ({users.length})</h2>
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
        </div>
      ))}
    </div>
  );
}
