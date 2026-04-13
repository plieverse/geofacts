import React, { useState } from 'react';
import { Send } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function CommentForm({ postId, onCommentAdded }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { content: content.trim() });
      onCommentAdded?.(data);
      setContent('');
    } catch (err) {
      setError(err.response?.data?.error || 'Reactie plaatsen mislukt.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
      <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs flex-shrink-0 mt-1">
        {user.firstName?.[0]?.toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="flex gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Schrijf een reactie... (Ctrl+Enter om te plaatsen)"
            className="input resize-none text-sm h-10 min-h-[40px] max-h-32 py-2"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="btn-primary px-3 py-2 self-end flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>
    </form>
  );
}
