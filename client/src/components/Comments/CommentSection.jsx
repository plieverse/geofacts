import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Heart, Edit2, Check, X } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CommentForm from './CommentForm';
import AttachmentDisplay from '../Posts/AttachmentDisplay';

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

function CommentItem({ postId, comment, onUpdate }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content || '');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);

  const canEdit = user && (user.id === comment.user_id || user.is_admin);

  function startEdit() {
    setEditContent(comment.content || '');
    setEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function cancelEdit() {
    setEditing(false);
    setEditContent(comment.content || '');
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/posts/${postId}/comments/${comment.id}`, {
        content: editContent,
      });
      onUpdate({ ...comment, content: data.content });
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Bewerken mislukt.');
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
    if (e.key === 'Escape') cancelEdit();
  }

  return (
    <div className="flex gap-2">
      <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs flex-shrink-0 mt-0.5">
        {comment.first_name?.[0]?.toUpperCase()}
      </div>
      <div className="flex-1 bg-bg rounded-lg px-3 py-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-text-primary text-xs font-semibold">{comment.first_name}</span>
          <span className="text-text-secondary text-xs">{timeAgo(comment.created_at)}</span>
          <div className="ml-auto flex items-center gap-2">
            {canEdit && !editing && (
              <button
                onClick={startEdit}
                className="text-text-secondary hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                title="Bewerken"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
            <CommentLikeButton
              postId={postId}
              commentId={comment.id}
              initialLiked={comment.user_liked}
              initialCount={comment.like_count}
            />
          </div>
        </div>

        {editing ? (
          <div className="space-y-1.5">
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input resize-none text-sm w-full py-1.5 min-h-[60px]"
              maxLength={1000}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving || (!editContent.trim() && !comment.attachments?.length)}
                className="flex items-center gap-1 text-xs text-accent hover:text-accent-light transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Opslaan
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-3 h-3" />
                Annuleren
              </button>
            </div>
          </div>
        ) : (
          <>
            {comment.content && (
              <p className="text-text-primary text-sm whitespace-pre-wrap">{comment.content}</p>
            )}
            <AttachmentDisplay attachments={comment.attachments} />
          </>
        )}
      </div>
    </div>
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

  function handleCommentUpdated(updated) {
    setComments((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
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
                <div key={c.id} className="group">
                  <CommentItem
                    postId={postId}
                    comment={c}
                    onUpdate={handleCommentUpdated}
                  />
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
