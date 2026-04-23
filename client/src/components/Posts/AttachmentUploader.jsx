import React, { useRef } from 'react';
import { Paperclip, X, Loader2, FileText, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'image/heic', 'image/heif', 'application/pdf',
];

// attachments: [{ id, localUrl, url, publicId, filename, fileType, fileSize, status, error }]
// onChange: (updater: prev => next) => void
export default function AttachmentUploader({ attachments = [], onChange, disabled = false }) {
  const inputRef = useRef(null);

  async function handleFiles(fileList) {
    const files = Array.from(fileList);
    const doneCount = attachments.filter((a) => a.status !== 'error').length;
    const slots = MAX_FILES - doneCount;
    if (slots <= 0) return;

    const toProcess = files.slice(0, slots).filter((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) return false;
      if (f.size > MAX_SIZE) return false;
      return true;
    });

    for (const file of toProcess) {
      const tempId = `${Date.now()}-${Math.random()}`;
      const localUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

      onChange((prev) => [
        ...prev,
        { id: tempId, localUrl, url: null, publicId: null, filename: file.name, fileType: file.type, fileSize: file.size, status: 'uploading', error: null },
      ]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': undefined },
        });
        onChange((prev) =>
          prev.map((a) =>
            a.id === tempId
              ? { ...a, url: data.url, publicId: data.publicId, status: 'done' }
              : a
          )
        );
      } catch (err) {
        onChange((prev) =>
          prev.map((a) =>
            a.id === tempId
              ? { ...a, status: 'error', error: err.response?.data?.error || 'Upload mislukt' }
              : a
          )
        );
      }
    }
  }

  function handleRemove(id) {
    onChange((prev) => prev.filter((a) => a.id !== id));
  }

  const canAdd = !disabled && attachments.filter((a) => a.status !== 'error').length < MAX_FILES;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((a) => (
            <AttachmentThumb key={a.id} attachment={a} onRemove={() => handleRemove(a.id)} />
          ))}
        </div>
      )}

      {canAdd && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent transition-colors"
        >
          <Paperclip className="w-3.5 h-3.5" />
          Bijlage toevoegen
        </button>
      )}
    </div>
  );
}

function AttachmentThumb({ attachment, onRemove }) {
  const isImage = attachment.fileType?.startsWith('image/');

  return (
    <div className="relative group">
      {isImage ? (
        <div className="w-16 h-16 rounded-lg overflow-hidden border border-divider bg-bg flex-shrink-0">
          <img
            src={attachment.localUrl || attachment.url}
            alt={attachment.filename}
            className="w-full h-full object-cover"
          />
          {attachment.status === 'uploading' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
          )}
          {attachment.status === 'error' && (
            <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center rounded-lg" title={attachment.error}>
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 border border-divider rounded-lg px-2.5 py-1.5 bg-bg max-w-[160px]">
          {attachment.status === 'uploading' ? (
            <Loader2 className="w-4 h-4 text-text-secondary animate-spin flex-shrink-0" />
          ) : attachment.status === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" title={attachment.error} />
          ) : (
            <FileText className="w-4 h-4 text-accent flex-shrink-0" />
          )}
          <span className="text-xs text-text-primary truncate">{attachment.filename}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}
