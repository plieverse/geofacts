import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginModal() {
  const { login } = useAuth();
  const [firstName, setFirstName] = useState(() => localStorage.getItem('geofacts_last_name') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!firstName.trim()) {
      setError('Voer je voornaam in.');
      return;
    }
    setLoading(true);
    try {
      await login(firstName.trim());
      localStorage.setItem('geofacts_last_name', firstName.trim());
    } catch (err) {
      setError(err.response?.data?.error || 'Inloggen mislukt. Probeer opnieuw.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-bg z-50 p-4">
      <div className="card p-8 w-full max-w-sm animate-fadeIn">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">GeoFacts</h1>
          <p className="text-text-secondary text-sm mt-1">Geopolitiek nieuws met vrienden</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Voornaam
            </label>
            <input
              type="text"
              className="input"
              placeholder="Bijv. Thomas"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoFocus
              autoComplete="given-name"
              maxLength={50}
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading || !firstName.trim()}
          >
            {loading ? 'Bezig...' : 'Inloggen'}
          </button>
        </form>

        <p className="text-text-secondary text-xs text-center mt-6">
          Alleen toegang als GeoAdmin je heeft toegevoegd.
        </p>
      </div>
    </div>
  );
}
