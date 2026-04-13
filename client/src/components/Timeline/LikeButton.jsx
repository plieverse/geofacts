import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function LikeButton({ postId, initialLiked, initialCount, onLoginRequired }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLike() {
    if (!user) {
      onLoginRequired?.();
      return;
    }
    if (loading) return;

    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setCount((c) => newLiked ? c + 1 : c - 1);
    if (newLiked) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
    }

    setLoading(true);
    try {
      const { data } = await api.post(`/posts/${postId}/like`);
      setLiked(data.liked);
      setCount(data.like_count);
    } catch (err) {
      // Rollback on error
      setLiked(!newLiked);
      setCount((c) => newLiked ? c - 1 : c + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLike}
      className={`flex items-center gap-1.5 transition-colors group ${
        liked ? 'text-heart' : 'text-text-secondary hover:text-heart'
      }`}
      aria-label={liked ? 'Vind ik niet meer leuk' : 'Vind ik leuk'}
    >
      <Heart
        className={`w-4 h-4 transition-transform ${animating ? 'animate-heart' : ''} ${
          liked ? 'fill-heart' : 'group-hover:fill-heart/20'
        }`}
      />
      <span className="text-sm">{count > 0 ? count : ''}</span>
    </button>
  );
}
