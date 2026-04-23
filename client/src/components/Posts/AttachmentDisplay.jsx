import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';

function getViewUrl(file) {
  if (file.fileType === 'application/pdf' && file.url) {
    return `/api/view-file?url=${encodeURIComponent(file.url)}`;
  }
  return file.url;
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function AttachmentDisplay({ attachments }) {
  if (!attachments || attachments.length === 0) return null;

  const images = attachments.filter((a) => a.fileType?.startsWith('image/') && a.url);
  const files = attachments.filter((a) => !a.fileType?.startsWith('image/') && a.url);

  const gridClass =
    images.length === 1
      ? ''
      : images.length === 2
      ? 'grid grid-cols-2 gap-1'
      : 'grid grid-cols-3 gap-1';

  return (
    <div className="mt-2 space-y-1.5">
      {images.length > 0 && (
        <div className={gridClass}>
          {images.map((img, i) => (
            <a
              key={i}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="block rounded-lg overflow-hidden border border-divider"
            >
              <img
                src={img.url}
                alt={img.filename || 'Afbeelding'}
                className={`w-full object-cover ${
                  images.length === 1 ? 'max-h-72' : 'h-28'
                }`}
                loading="lazy"
              />
            </a>
          ))}
        </div>
      )}

      {files.map((file, i) => (
        <a
          key={i}
          href={getViewUrl(file)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2.5 border border-divider rounded-lg px-3 py-2 bg-bg hover:border-accent/40 transition-colors"
        >
          <FileText className="w-4 h-4 text-accent flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-primary truncate font-medium">{file.filename}</p>
            {file.fileSize && (
              <p className="text-xs text-text-secondary">{formatSize(file.fileSize)}</p>
            )}
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" />
        </a>
      ))}
    </div>
  );
}
