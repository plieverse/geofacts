import React, { useState, useEffect } from 'react';
import { Globe, Smartphone, Monitor, AlertTriangle, Download } from 'lucide-react';

function detectDevice() {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  return { isIOS, isAndroid, isSafari, isInStandaloneMode, isDesktop: !isIOS && !isAndroid };
}

export default function InstallPage() {
  const [device, setDevice] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setDevice(detectDevice());

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  }

  if (!device) return null;

  if (device.isInStandaloneMode || installed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 max-w-sm w-full text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-2">GeoFacts is geïnstalleerd!</h1>
          <p className="text-text-secondary text-sm">Je kunt de app nu starten vanuit je beginscherm.</p>
          <a href="/" className="btn-primary mt-6 inline-block">Ga naar GeoFacts</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-16">
      <div className="max-w-[600px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 py-6 border-b border-divider mb-6">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">GeoFacts installeren</h1>
            <p className="text-text-secondary text-sm">Voeg toe aan je beginscherm</p>
          </div>
        </div>

        {/* iOS */}
        {device.isIOS && (
          <div className="space-y-4">
            {!device.isSafari && (
              <div className="border border-yellow-500/40 bg-yellow-500/10 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-semibold text-sm">Gebruik Safari</p>
                  <p className="text-text-secondary text-sm mt-1">
                    Om GeoFacts te installeren op iPhone of iPad moet je Safari gebruiken.
                    Open deze pagina in Safari en volg de stappen hieronder.
                  </p>
                </div>
              </div>
            )}

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-5 h-5 text-accent" />
                <h2 className="font-semibold text-text-primary">Installatie op iPhone / iPad</h2>
              </div>
              <ol className="space-y-4">
                {[
                  { step: '1', text: 'Open deze pagina in Safari (niet Chrome of Firefox).' },
                  { step: '2', text: 'Tik onderaan op het Deel-icoon (het vierkantje met een pijl omhoog).' },
                  { step: '3', text: 'Scroll naar beneden en tik op "Zet op beginscherm".' },
                  { step: '4', text: 'Tik op "Voeg toe" rechtsboven.' },
                  { step: '5', text: 'GeoFacts verschijnt nu op je beginscherm.' },
                ].map(({ step, text }) => (
                  <li key={step} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {step}
                    </span>
                    <p className="text-text-secondary text-sm">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* Android */}
        {device.isAndroid && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-accent" />
              <h2 className="font-semibold text-text-primary">Installatie op Android</h2>
            </div>

            {deferredPrompt ? (
              <div className="text-center py-4">
                <p className="text-text-secondary text-sm mb-4">
                  Klik op de knop hieronder om GeoFacts direct te installeren.
                </p>
                <button onClick={handleInstallClick} className="btn-primary flex items-center gap-2 mx-auto">
                  <Download className="w-4 h-4" />
                  Installeer GeoFacts
                </button>
              </div>
            ) : (
              <ol className="space-y-4">
                {[
                  { step: '1', text: 'Tik rechtsboven op het menu (drie puntjes ⋮).' },
                  { step: '2', text: 'Tik op "Toevoegen aan beginscherm" of "App installeren".' },
                  { step: '3', text: 'Bevestig door op "Toevoegen" te tikken.' },
                  { step: '4', text: 'GeoFacts verschijnt nu op je beginscherm.' },
                ].map(({ step, text }) => (
                  <li key={step} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {step}
                    </span>
                    <p className="text-text-secondary text-sm">{text}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {/* Desktop */}
        {device.isDesktop && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="w-5 h-5 text-accent" />
              <h2 className="font-semibold text-text-primary">Installatie op computer</h2>
            </div>

            {deferredPrompt ? (
              <div className="text-center py-4">
                <p className="text-text-secondary text-sm mb-4">
                  Klik op de knop hieronder om GeoFacts als app te installeren.
                </p>
                <button onClick={handleInstallClick} className="btn-primary flex items-center gap-2 mx-auto">
                  <Download className="w-4 h-4" />
                  Installeer GeoFacts
                </button>
              </div>
            ) : (
              <ol className="space-y-4">
                {[
                  { step: '1', text: 'Klik rechtsboven in de adresbalk op het installeer-icoon (een computerscherm met een pijl omhoog), of klik op de drie puntjes (⋮) en kies "GeoFacts installeren".' },
                  { step: '2', text: 'Klik in het pop-upvenster op "Installeren".' },
                  { step: '3', text: 'GeoFacts opent als zelfstandige app op je computer.' },
                ].map(({ step, text }) => (
                  <li key={step} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {step}
                    </span>
                    <p className="text-text-secondary text-sm">{text}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {/* Info block */}
        <div className="mt-6 border border-divider rounded-xl p-4">
          <h3 className="font-semibold text-text-primary text-sm mb-2">Voordelen van de app</h3>
          <ul className="space-y-1.5 text-sm text-text-secondary">
            <li>✓ Push notificaties voor nieuwe berichten</li>
            <li>✓ Werkt als een echte app, zonder browser-interface</li>
            <li>✓ Sneller laden en beter bereikbaar</li>
          </ul>
        </div>

        <div className="mt-4 text-center">
          <a href="/" className="text-accent hover:text-accent-light text-sm transition-colors">
            Terug naar GeoFacts
          </a>
        </div>
      </div>
    </div>
  );
}
