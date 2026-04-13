import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit2, Loader2 } from 'lucide-react';
import api from '../../services/api';
import EditPostModal from '../Posts/EditPostModal';

function timeAgo(dateStr) {
  return new Date(dateStr).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editPost, setEditPost] = useState(null);

  const fetchPosts = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/posts?page=${p}&limit=20`);
      setPosts(data.posts);
      setTotalPages(data.totalPages);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(1); }, [fetchPosts]);

  async function handleDelete(postId) {
    if (!window.confirm('Weet je zeker dat je dit bericht wilt verwijderen?')) return;
    try {
      await api.delete(`/admin/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      alert(err.response?.data?.error || 'Verwijderen mislukt.');
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>;
  }

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-text-primary">Alle berichten ({posts.length})</h2>
      {posts.map((post) => (
        <div key={post.id} className="card p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-text-primary">{post.first_name}</span>
                <span className="text-xs text-text-secondary">{timeAgo(post.created_at)}</span>
              </div>
              <p className="text-sm text-text-secondary line-clamp-2">{post.content}</p>
              <div className="flex gap-3 mt-2 text-xs text-text-secondary">
                <span>❤ {post.like_count}</span>
                <span>💬 {post.comment_count}</span>
                {post.link_url && <span>🔗 Link</span>}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => setEditPost(post)}
                className="p-1.5 rounded-full text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(post.id)}
                className="p-1.5 rounded-full text-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center pt-2">
          <button disabled={page <= 1} onClick={() => fetchPosts(page - 1)} className="btn-secondary text-sm px-3 py-1.5">Vorige</button>
          <span className="text-text-secondary text-sm self-center">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => fetchPosts(page + 1)} className="btn-secondary text-sm px-3 py-1.5">Volgende</button>
        </div>
      )}

      {editPost && (
        <EditPostModal
          post={editPost}
          onClose={() => setEditPost(null)}
          onUpdate={(updated) => {
            setPosts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
            setEditPost(null);
          }}
        />
      )}
    </div>
  );
}
