import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('geofacts_token');
    const stored = localStorage.getItem('geofacts_user');
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (_) {
        localStorage.removeItem('geofacts_token');
        localStorage.removeItem('geofacts_user');
      }
    }
    setLoading(false);
  }, []);

  async function login(firstName) {
    const { data } = await api.post('/auth/login', { firstName });
    localStorage.setItem('geofacts_token', data.token);
    localStorage.setItem('geofacts_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('geofacts_token');
    localStorage.removeItem('geofacts_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
