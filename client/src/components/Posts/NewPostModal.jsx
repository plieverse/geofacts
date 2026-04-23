import React, { useState, useRef } from 'react';
import { X, Link, Loader2, Sparkles, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import TopicSelector from './TopicSelector';
import AttachmentUploader from './AttachmentUploader';

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

  // Bijlagen
  const [attachments, setAttachments] = useState([]);

  // Samenvatting
  const [summary, setSummary] = useState('');
  const [summaryStatus, setSummaryStatus] = useState('idle'); // idle | loading | success | error
  const [summaryError, setSummaryError] = useState('');
  const [summaryIsManual, setSummaryIsManual] = useState(false);
  const [showSummaryEdit, setShowSummaryEdit] = useState(false);

  const linkDebounce = useRef(null);

  function handleLinkChange(e) {
    const url = e.target.value;
    setLinkUrl(url);
    setLinkPreview(null);
    setPreviewFailed(false);
    setSummary('');
    setSummaryStatus('idle');
    setSummaryError('');
    setSummaryIsManual(false);
    setShowSummaryEdit(false);

    try {
      const parsed = new URL(url.trim());
      const hostname = parsed.hostname.replace('www.', '');
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1]
          .replace(/\.\w{2,5}$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        setManualTitle(`${hostname} — ${lastSegment}`);
      } else {
        setManualTitle(hostname);
      }
    } catch {
      setManualTitle('');
    }

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

  async function handleGenerateSummary() {
    if (!linkUrl.trim() || summaryStatus === 'loading') return;
    setSummaryStatus('loading');
    setSummaryError('');
    setSummary('');
    setSummaryIsManual(false);
    setShowSummaryEdit(false);
    try {
      const { data } = await api.post('/summarize', { url: linkUrl.trim() });
      setSummary(data.summary);
      setSummaryStatus('success');
    } catch (err) {
      setSummaryError(err.response?.data?.error || 'Samenvatting genereren mislukt.');
      setSummaryStatus('error');
    }
  }

  function handleClearSummary() {
    setSummary('');
    setSummaryStatus('idle');
    setSummaryError('');
    setSummaryIsManual(false);
    setShowSummaryEdit(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) { setError('Inhoud is verplicht.'); return; }
    setError('');
    setSubmitting(true);

    try {
      const doneAttachments = attachments
        .filter((a) => a.status === 'done')
        .map(({ url, publicId, filename, fileType, fileSize }) => ({ url, publicId, filename, fileType, fileSize }));

      const { data } = await api.post('/posts', {
        content: content.trim(),
        linkUrl: linkUrl.trim() || null,
        linkTitle: linkPreview?.title || manualTitle.trim() || null,
        linkDescription: linkPreview?.description || null,
        linkImage: linkPreview?.image || null,
        topicIds: selectedTopics,
        summary: summary.trim() || null,
        summaryIsManual,
        attachments: doneAttachments,
      });
      onCreated?.(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Bericht plaatsen mislukt.');
    } finally {
      setSubmitting(false);
    }
  }

  const showSummaryButton = linkUrl.trim().length > 0 && !previewLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="card w-full max-w-lg animate-fadeIn max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-divider sticky top-0 bg-panel z-10">
          <h2 className="font-bold text-text-primary">Nieuw bericht</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-hover-surface/10 text-text-secondary">
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

            {/* Samenvatting — genereer-knop */}
            {showSummaryButton && summaryStatus === 'idle' && (
              <button
                type="button"
                onClick={handleGenerateSummary}
                className="mt-2 flex items-center gap-1.5 text-xs text-accent hover:text-accent-light transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI-samenvatting genereren
              </button>
            )}

            {/* Samenvatting — laden */}
            {summaryStatus === 'loading' && (
              <div className="mt-2 flex items-center gap-2 text-text-secondary text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Samenvatting genereren...
              </div>
            )}

            {/* Samenvatting — gegenereerd */}
            {summaryStatus === 'success' && (
              <div className="mt-2 rounded-lg border border-accent/20 bg-accent/5 p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-accent">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    AI-samenvatting
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSummaryEdit((v) => !v)}
                      className="text-text-secondary hover:text-text-primary transition-colors"
                      title="Bewerken"
                    >
                      {showSummaryEdit ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearSummary}
                      className="text-text-secondary hover:text-red-400 transition-colors"
                      title="Verwijderen"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {showSummaryEdit ? (
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="input resize-none text-xs w-full mt-1"
                    rows={4}
                    maxLength={1000}
                  />
                ) : (
                  <p className="text-xs text-text-primary leading-relaxed">{summary}</p>
                )}
              </div>
            )}

            {/* Samenvatting — fout + handmatig invoerveld */}
            {summaryStatus === 'error' && (
              <div className="mt-2 rounded-lg border border-divider p-3 space-y-2">
                <div className="flex items-start gap-1.5 text-xs text-text-secondary">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{summaryError} Typ of plak hieronder zelf een samenvatting, of probeer opnieuw.</span>
                </div>
                <textarea
                  value={summary}
                  onChange={(e) => { setSummary(e.target.value); setSummaryIsManual(true); }}
                  placeholder="Typ of plak hier een samenvatting..."
                  className="input resize-none text-xs w-full"
                  rows={3}
                  maxLength={1000}
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleGenerateSummary}
                    className="text-xs text-accent hover:text-accent-light transition-colors"
                  >
                    Opnieuw proberen
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSummary}
                    className="text-xs text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bijlagen */}
          <AttachmentUploader attachments={attachments} onChange={setAttachments} />

          {/* Topics */}
          <TopicSelector selected={selectedTopics} onChange={setSelectedTopics} />

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {selectedTopics.length === 0 && (
            <p className="text-text-secondary text-xs">Kies minimaal één onderwerp om te kunnen plaatsen.</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Annuleren
            </button>
            <button
              type="submit"
              disabled={submitting || !content.trim() || selectedTopics.length === 0 || previewLoading}
              className="btn-primary flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Plaatsen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
