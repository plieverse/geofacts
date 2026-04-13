import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function LinkPreview({ url, title, description, image }) {
  if (!url) return null;

  const displayUrl = (() => {
    try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
  })();

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-divider rounded-xl overflow-hidden hover:border-accent/50 transition-colors mt-3 group"
    >
      {image && (
        <div className="w-full h-40 overflow-hidden bg-panel">
          <img
            src={image}
            alt={title || 'Voorvertoning'}
            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center gap-1 text-text-secondary text-xs mb-1">
          <ExternalLink className="w-3 h-3" />
          <span>{displayUrl}</span>
        </div>
        {title && (
          <p className="text-text-primary text-sm font-semibold line-clamp-2">{title}</p>
        )}
        {description && (
          <p className="text-text-secondary text-xs mt-1 line-clamp-2">{description}</p>
        )}
      </div>
    </a>
  );
}
