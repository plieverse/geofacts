import React, { useState } from 'react';
import { MessageCircle, Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LikeButton from './LikeButton';
import LinkPreview from './LinkPreview';
import CommentSection from '../Comments/CommentSection';
import EditPostModal from '../Posts/EditPostModal';

const TOPIC_CHIP_CLASS = 'border-white/20 text-text-secondary bg-white/5';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'zojuist';
  if (diff < 3600) return `${Math.floor(diff / 60)} min geleden`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} uur geleden`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} dagen geleden`;
  return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

export default function PostCard({ post, onDelete, onUpdate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [currentTopics, setCurrentTopics] = useState(post.topics || []);
  const [showComments, setShowComments] = useState((post.comment_count || 0) > 0);

  const canEdit = user && (user.id === post.user_id || user.is_admin);
  const canDelete = user && (user.id === post.user_id || user.is_admin);

  function handleCardClick(e) {
    if (e.target.closest('button') || e.target.closest('a')) return;
    navigate(`/post/${post.id}`);
  }

  function handleUpdate(updated) {
    if (updated.topics) setCurrentTopics(updated.topics);
    onUpdate?.(updated);
  }

  return (
    <>
      <article className="card p-4 hover:border-accent/30 transition-colors cursor-pointer" onClick={handleCardClick}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
              {post.first_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-text-primary font-semibold text-sm">{post.first_name}</p>
              <p className="text-text-secondary text-xs">{timeAgo(post.created_at)}</p>
            </div>
          </div>

          {canEdit && (
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                className="p-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 card py-1 z-10 w-36 shadow-xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => { setShowEdit(true); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-white/5 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Bewerken
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => { onDelete?.(post.id); setMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Verwijderen
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>

        {/* Link preview */}
        {post.link_url && (
          <LinkPreview
            url={post.link_url}
            title={post.link_title}
            description={post.link_description}
            image={post.link_image}
          />
        )}

        {/* Actiebalk + onderwerpen */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-divider">
          <div className="flex items-center gap-4">
            <LikeButton
              postId={post.id}
              initialLiked={post.user_liked}
              initialCount={post.like_count || 0}
            />
            <button
              onClick={(e) => { e.stopPropagation(); setShowComments((v) => !v); }}
              className={`flex items-center gap-1.5 transition-colors ${showComments ? 'text-accent' : 'text-text-secondary hover:text-accent'}`}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{post.comment_count || 0}</span>
            </button>
          </div>

          {/* Onderwerpen rechtsonder */}
          {currentTopics?.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end">
              {currentTopics.map((t) => (
                <span key={t.id} className={`topic-chip text-xs ${TOPIC_CHIP_CLASS}`}>
                  {t.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Reacties: toon alleen als open */}
        {showComments && (
          <div onClick={(e) => e.stopPropagation()}>
            <CommentSection postId={post.id} />
          </div>
        )}
      </article>

      {showEdit && (
        <EditPostModal
          post={{ ...post, topics: currentTopics }}
          onClose={() => setShowEdit(false)}
          onUpdate={(updated) => { handleUpdate(updated); setShowEdit(false); }}
        />
      )}
    </>
  );
}
