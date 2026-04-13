import React, { useState } from 'react';
import { FileText, Users, Tag } from 'lucide-react';
import AdminPosts from './AdminPosts';
import AdminUsers from './AdminUsers';
import AdminTopics from './AdminTopics';

const TABS = [
  { id: 'posts', label: 'Berichten', icon: FileText },
  { id: 'users', label: 'Gebruikers', icon: Users },
  { id: 'topics', label: 'Onderwerpen', icon: Tag },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('posts');

  return (
    <div className="max-w-[600px] mx-auto">
      {/* Tab bar */}
      <div className="border-b border-divider flex">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === id
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === 'posts' && <AdminPosts />}
        {tab === 'users' && <AdminUsers />}
        {tab === 'topics' && <AdminTopics />}
      </div>
    </div>
  );
}
