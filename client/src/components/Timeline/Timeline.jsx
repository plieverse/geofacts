import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import api from '../../services/api';
import PostCard from './PostCard';
import FilterBar from './FilterBar';

export default function Timeline({ refreshKey }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [topicId, setTopicId] = useState(null);
  const [search, setSearch] = useState('');

  const fetchPosts = useCallback(async (pageNum = 1, reset = false) => {
    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit: 20,
        sortBy,
        ...(topicId ? { topicId } : {}),
        ...(search ? { search } : {}),
      });
      const { data } = await api.get(`/posts?${params}`);
      if (reset || pageNum === 1) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }
      setTotalPages(data.totalPages);
      setPage(pageNum);
    } catch (err) {
      console.error('Fetch posts error:', err);
    }
  }, [sortBy, topicId, search]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchPosts(1, true).finally(() => setLoading(false));
  }, [fetchPosts, refreshKey]);

  async function loadMore() {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    await fetchPosts(page + 1);
    setLoadingMore(false);
  }

  function handleDelete(postId) {
    if (!window.confirm('Weet je zeker dat je dit bericht wilt verwijderen?')) return;
    api.delete(`/posts/${postId}`)
      .then(() => setPosts((prev) => prev.filter((p) => p.id !== postId)))
      .catch((err) => alert(err.response?.data?.error || 'Verwijderen mislukt.'));
  }

  function handleUpdate(updated) {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
  }

  return (
    <div>
      <FilterBar
        sortBy={sortBy}
        setSortBy={setSortBy}
        topicId={topicId}
        setTopicId={setTopicId}
        search={search}
        setSearch={setSearch}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <p className="text-lg">Nog geen berichten</p>
          <p className="text-sm mt-1">Wees de eerste om iets te delen!</p>
        </div>
      ) : (
        <div className="divide-y divide-divider">
          {posts.map((post) => (
            <div key={post.id} className="p-4">
              <PostCard post={post} onDelete={handleDelete} onUpdate={handleUpdate} />
            </div>
          ))}
        </div>
      )}

      {page < totalPages && !loading && (
        <div className="flex justify-center py-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="btn-secondary flex items-center gap-2"
          >
            {loadingMore ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Laden...</>
            ) : (
              'Meer laden'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
