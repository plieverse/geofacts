import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LikeButton from '../components/Timeline/LikeButton';
import LinkPreview from '../components/Timeline/LinkPreview';
import CommentSection from '../components/Comments/CommentSection';

const TOPIC_COLORS = [
  'border-blue-500/50 text-blue-400 bg-blue-500/10',
  'border-green-500/50 text-green-400 bg-green-500/10',
  'border-purple-500/50 text-purple-400 bg-purple-500/10',
  'border-orange-500/50 text-orange-400 bg-orange-500/10',
  'border-pink-500/50 text-pink-400 bg-pink-500/10',
  'border-teal-500/50 text-teal-400 bg-teal-500/10',
  'border-yellow-500/50 text-yellow-400 bg-yellow-500/10',
  'border-red-500/50 text-red-400 bg-red-500/10',
  'border-indigo-500/50 text-indigo-400 bg-indigo-500/10',
  'border-cyan-500/50 text-cyan-400 bg-cyan-500/10',
];
function topicColor(id) { return TOPIC_COLORS[(id - 1) % TOPIC_COLORS.length]; }

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
            className="p-2 rounded-full hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
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
              <span key={t.id} className={`topic-chip ${topicColor(t.id)}`}>{t.name}</span>
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
