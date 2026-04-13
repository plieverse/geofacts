import React from 'react';
import { MessageCircle, Heart, FileText, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'zojuist';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}u`;
  return `${Math.floor(diff / 86400)}d`;
}

const TYPE_ICONS = {
  new_post: <FileText className="w-4 h-4 text-accent" />,
  comment: <MessageCircle className="w-4 h-4 text-success" />,
  like: <Heart className="w-4 h-4 text-heart" />,
};

const TYPE_LABELS = {
  new_post: 'heeft een nieuw bericht geplaatst',
  comment: 'reageerde op een bericht',
  like: 'vind jouw bericht leuk',
};

export default function NotificationDropdown({ notifications, onMarkAllRead, onMarkOneRead, onClose }) {
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.is_read);

  function handleClick(n) {
    onMarkOneRead(n.id);
    navigate(`/post/${n.post_id}`);
    onClose();
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 card shadow-xl z-50 animate-fadeIn overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-divider">
        <span className="font-semibold text-text-primary text-sm">Meldingen</span>
        {unread.length > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-xs text-accent hover:text-accent-light transition-colors"
          >
            <CheckCheck className="w-3 h-3" />
            Alles gelezen
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-text-secondary text-sm">
            Geen meldingen
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors border-b border-divider last:border-0 ${
                !n.is_read ? 'bg-accent/5' : ''
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {TYPE_ICONS[n.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary">
                  <span className="font-semibold">{n.triggered_by_name}</span>{' '}
                  {TYPE_LABELS[n.type]}
                </p>
                <p className="text-xs text-text-secondary mt-0.5 truncate">
                  {n.post_content?.substring(0, 60)}...
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-1">
                <span className="text-xs text-text-secondary">{timeAgo(n.created_at)}</span>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
