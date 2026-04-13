import React, { useState, useRef } from 'react';
import { X, Link, Loader2 } from 'lucide-react';
import api from '../../services/api';
import TopicSelector from './TopicSelector';

export default function NewPostModal({ onClose, onCreated }) {
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkPreview, setLinkPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const linkDebounce = useRef(null);

  function handleLinkChange(e) {
    const url = e.target.value;
    setLinkUrl(url);
    setLinkPreview(null);
    setPreviewFailed(false);
    setManualTitle('');

    clearTimeout(linkDebounce.current);
    if (!url.trim()) return;

    linkDebounce.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const { data } = await api.post('/link-preview', { url: url.trim() });
        setLinkPreview(data);
        setPreviewFailed(false);
      } catch (_) {
        setLinkPreview(null);
        setPreviewFailed(true);
      } finally {
        setPreviewLoading(false);
      }
    }, 800);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) { setError('Inhoud is verplicht.'); return; }
    setError('');
    setSubmitting(true);

    try {
      const { data } = await api.post('/posts', {
        content: content.trim(),
        linkUrl: linkUrl.trim() || null,
        linkTitle: linkPreview?.title || manualTitle.trim() || null,
        linkDescription: linkPreview?.description || null,
        linkImage: linkPreview?.image || null,
        topicIds: selectedTopics,
      });
      onCreated?.(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Bericht plaatsen mislukt.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="card w-full max-w-lg animate-fadeIn max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-divider sticky top-0 bg-panel z-10">
          <h2 className="font-bold text-text-primary">Nieuw bericht</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-text-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Content */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Wat wil je delen?"
              className="input resize-none h-28"
              maxLength={2000}
              autoFocus
            />
            <div className="text-right text-xs text-text-secondary mt-1">{content.length}/2000</div>
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              <Link className="w-3.5 h-3.5 inline mr-1" />
              Link (optioneel)
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={handleLinkChange}
              placeholder="https://..."
              className="input"
            />
            {previewLoading && (
              <div className="flex items-center gap-2 mt-2 text-text-secondary text-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Voorvertoning laden...
              </div>
            )}
            {linkPreview && !previewLoading && (
              <div className="mt-2 border border-divider rounded-lg p-3 bg-bg">
                {linkPreview.image && (
                  <img src={linkPreview.image} alt="" className="w-full h-24 object-cover rounded mb-2" onError={(e) => { e.target.style.display = 'none'; }} />
                )}
                {linkPreview.title && <p className="text-sm font-semibold text-text-primary">{linkPreview.title}</p>}
                {linkPreview.description && <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{linkPreview.description}</p>}
              </div>
            )}
            {previewFailed && !previewLoading && linkUrl.trim() && (
              <div className="mt-2 space-y-1.5">
                <p className="text-xs text-text-secondary">
                  Automatische preview niet beschikbaar. Voer optioneel een titel in:
                </p>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Bijv: NYT — Iran Blockade Sets Up a Test..."
                  className="input text-sm"
                  maxLength={255}
                />
              </div>
            )}
          </div>

          {/* Topics */}
          <TopicSelector selected={selectedTopics} onChange={setSelectedTopics} />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Annuleren
            </button>
            <button type="submit" disabled={submitting || !content.trim()} className="btn-primary flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Plaatsen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
