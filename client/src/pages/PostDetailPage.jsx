import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LikeButton from '../components/Timeline/LikeButton';
import LinkPreview from '../components/Timeline/LinkPreview';
import CommentSection from '../components/Comments/CommentSection';

const TOPIC_CHIP_CLASS = 'border-hover-surface/20 text-text-secondary bg-hover-surface/5';

function timeAgo(dateStr) {
  return new Date(dateStr).toLocaleString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    api.get(`/posts/${id}`)
      .then(({ data }) => setPost(data))
      .catch(() => setError('Bericht niet gevonden.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-text-secondary">{error || 'Bericht niet gevonden.'}</p>
        <button onClick={() => navigate('/')} className="btn-primary">Terug naar home</button>
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto pb-20">
      {/* Back button */}
      <div className="sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-divider">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-hover-surface/5 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-text-primary">Bericht</span>
        </div>
      </div>

      <div className="p-4">
        {/* Author */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
            {post.first_name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-text-primary">{post.first_name}</p>
            <p className="text-text-secondary text-xs">{timeAgo(post.created_at)}</p>
          </div>
        </div>

        {/* Topics */}
        {post.topics?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.topics.map((t) => (
              <span key={t.id} className={`topic-chip ${TOPIC_CHIP_CLASS}`}>{t.name}</span>
            ))}
          </div>
        )}

        {/* Content */}
        <p className="text-text-primary leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>

        {/* Link preview */}
        {post.link_url && (
          <LinkPreview
            url={post.link_url}
            title={post.link_title}
            description={post.link_description}
            image={post.link_image}
          />
        )}

        {/* Samenvatting */}
        {post.summary && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowSummary((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-light transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              AI-samenvatting
              {showSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showSummary && (
              <div className="mt-2 rounded-lg border border-accent/20 bg-accent/5 p-4">
                <p className="text-sm text-text-primary leading-relaxed">{post.summary}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-divider">
          <LikeButton
            postId={post.id}
            initialLiked={post.user_liked}
            initialCount={post.like_count || 0}
          />
          <span className="text-text-secondary text-sm">{post.comment_count || 0} reacties</span>
        </div>

        {/* Comments */}
        <div className="mt-2">
          <CommentSection postId={post.id} />
        </div>
      </div>
    </div>
  );
}
