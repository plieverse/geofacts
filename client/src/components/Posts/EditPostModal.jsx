import React, { useState, useRef } from 'react';
import { X, Link, Loader2 } from 'lucide-react';
import api from '../../services/api';
import TopicSelector from './TopicSelector';

export default function EditPostModal({ post, onClose, onUpdate }) {
  const [content, setContent] = useState(post.content || '');
  const [linkUrl, setLinkUrl] = useState(post.link_url || '');
  const [linkPreview, setLinkPreview] = useState(
    post.link_url
      ? { title: post.link_title, description: post.link_description, image: post.link_image }
      : null
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState(post.topics?.map((t) => t.id) || []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const linkDebounce = useRef(null);

  function handleLinkChange(e) {
    const url = e.target.value;
    setLinkUrl(url);
    if (!url.trim()) { setLinkPreview(null); return; }

    clearTimeout(linkDebounce.current);
    linkDebounce.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const { data } = await api.post('/link-preview', { url: url.trim() });
        setLinkPreview(data);
      } catch (_) {}
      finally { setPreviewLoading(false); }
    }, 800);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) { setError('Inhoud is verplicht.'); return; }
    setError('');
    setSubmitting(true);

    try {
      await api.put(`/posts/${post.id}`, {
        content: content.trim(),
        linkUrl: linkUrl.trim() || null,
        linkTitle: linkPreview?.title || null,
        linkDescription: linkPreview?.description || null,
        linkImage: linkPreview?.image || null,
        topicIds: selectedTopics,
      });
      // Haal het volledige bericht op zodat topics correct worden bijgewerkt
      const { data: fullPost } = await api.get(`/posts/${post.id}`);
      onUpdate?.(fullPost);
    } catch (err) {
      setError(err.response?.data?.error || 'Bewerken mislukt.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg animate-fadeIn max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-divider sticky top-0 bg-panel z-10">
          <h2 className="font-bold text-text-primary">Bericht bewerken</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-text-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input resize-none h-28"
              maxLength={2000}
              autoFocus
            />
            <div className="text-right text-xs text-text-secondary mt-1">{content.length}/2000</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              <Link className="w-3.5 h-3.5 inline mr-1" />
              Link (optioneel)
            </label>
            <input type="url" value={linkUrl} onChange={handleLinkChange} placeholder="https://..." className="input" />
            {previewLoading && (
              <div className="flex items-center gap-2 mt-2 text-text-secondary text-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Voorvertoning laden...
              </div>
            )}
            {linkPreview && !previewLoading && (
              <div className="mt-2 border border-divider rounded-lg p-3 bg-bg">
                {linkPreview.image && <img src={linkPreview.image} alt="" className="w-full h-24 object-cover rounded mb-2" onError={(e) => { e.target.style.display = 'none'; }} />}
                {linkPreview.title && <p className="text-sm font-semibold text-text-primary">{linkPreview.title}</p>}
                {linkPreview.description && <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{linkPreview.description}</p>}
              </div>
            )}
          </div>

          <TopicSelector selected={selectedTopics} onChange={setSelectedTopics} />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Annuleren</button>
            <button type="submit" disabled={submitting || !content.trim()} className="btn-primary flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
