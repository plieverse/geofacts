import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import api from '../../services/api';
import CommentForm from './CommentForm';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'zojuist';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}u`;
  return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

export default function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/posts/${postId}/comments`)
      .then(({ data }) => setComments(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  function handleCommentAdded(comment) {
    setComments((prev) => [...prev, comment]);
  }

  return (
    <div className="mt-4 pt-3 border-t border-divider">
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-accent animate-spin" />
        </div>
      ) : (
        <>
          {comments.length > 0 && (
            <div className="space-y-3 mb-3">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs flex-shrink-0 mt-0.5">
                    {c.first_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 bg-bg rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-text-primary text-xs font-semibold">{c.first_name}</span>
                      <span className="text-text-secondary text-xs">{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="text-text-primary text-sm whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />
        </>
      )}
    </div>
  );
}
