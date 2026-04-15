import React, { useState, useEffect } from 'react';
import { Loader2, Heart } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CommentForm from './CommentForm';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'zojuist';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}u`;
  return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

function CommentLikeButton({ postId, commentId, initialLiked, initialCount }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount || 0);
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLike() {
    if (!user || loading) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setCount((c) => newLiked ? c + 1 : c - 1);
    if (newLiked) { setAnimating(true); setTimeout(() => setAnimating(false), 300); }
    setLoading(true);
    try {
      const { data } = await api.post(`/posts/${postId}/comments/${commentId}/like`);
      setLiked(data.liked);
      setCount(data.like_count);
    } catch {
      setLiked(!newLiked);
      setCount((c) => newLiked ? c - 1 : c + 1);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <button
      onClick={handleLike}
      className={`flex items-center gap-1 transition-colors group ${
        liked ? 'text-heart' : 'text-text-secondary hover:text-heart'
      }`}
      aria-label={liked ? 'Vind ik niet meer leuk' : 'Vind ik leuk'}
    >
      <Heart
        className={`w-3.5 h-3.5 transition-transform ${animating ? 'animate-heart' : ''} ${
          liked ? 'fill-heart' : 'group-hover:fill-heart/20'
        }`}
      />
      {count > 0 && <span className="text-xs">{count}</span>}
    </button>
  );
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
                      <div className="ml-auto">
                        <CommentLikeButton
                          postId={postId}
                          commentId={c.id}
                          initialLiked={c.user_liked}
                          initialCount={c.like_count}
                        />
                      </div>
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
