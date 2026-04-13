import React from 'react';
import { Globe, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../Notifications/NotificationBell';
import { useNotifications } from '../../hooks/useNotifications';

export default function Header({ onAdminClick, showAdmin }) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications();

  return (
    <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur border-b border-divider">
      <div className="max-w-[600px] mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-text-primary text-lg">GeoFacts</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user && (
            <>
              <span className="text-text-secondary text-sm hidden sm:block">
                {user.firstName}
              </span>

              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAllRead={markAllRead}
                onMarkOneRead={markOneRead}
              />

              {user.is_admin && (
                <button
                  onClick={onAdminClick}
                  className={`p-2 rounded-full transition-colors ${
                    showAdmin
                      ? 'text-accent bg-accent/10'
                      : 'text-text-secondary hover:text-accent hover:bg-accent/10'
                  }`}
                  title="Beheer"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={logout}
                className="p-2 rounded-full text-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="Uitloggen"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
