import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { subscribeToPush, isPushSupported, getNotificationPermission } from '../../services/pushService';
import { useAuth } from '../../context/AuthContext';

const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  navigator.standalone === true;

export default function PushPermissionBanner() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (dismissed) return;
    if (!isPushSupported()) return;
    const permission = getNotificationPermission();
    if (permission === 'default') {
      const wasDismissed = localStorage.getItem('geofacts_push_dismissed');
      // In standalone-modus altijd tonen (ook al eerder weggedrukt in browser)
      if (!wasDismissed || isStandalone) {
        setShow(true);
      }
    }
  }, [user, dismissed]);

  async function handleEnable() {
    setLoading(true);
    try {
      await subscribeToPush();
      setShow(false);
    } catch (err) {
      console.error('Push subscribe error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem('geofacts_push_dismissed', '1');
    setShow(false);
    setDismissed(true);
  }

  if (!show) return null;

  return (
    <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mx-4 mt-4 animate-fadeIn">
      <div className="flex items-start gap-3">
        <Bell className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-primary">
            {isStandalone ? 'Wil je ook meldingen ontvangen?' : 'Schakel meldingen in'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            {isStandalone
              ? 'Je gebruikt GeoFacts als app. Schakel meldingen in om niets te missen.'
              : 'Ontvang een melding zodra er een nieuw bericht of reactie is.'}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="btn-primary text-sm py-1.5 px-3"
            >
              {loading ? 'Bezig...' : 'Inschakelen'}
            </button>
            <button
              onClick={handleDismiss}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Niet nu
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-text-secondary hover:text-text-primary">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
