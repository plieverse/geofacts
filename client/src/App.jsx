import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Layout/Header';
import FloatingActionButton from './components/Layout/FloatingActionButton';
import LoginModal from './components/Auth/LoginModal';
import Timeline from './components/Timeline/Timeline';
import NewPostModal from './components/Posts/NewPostModal';
import AdminDashboard from './components/Admin/AdminDashboard';
import PushPermissionBanner from './components/Notifications/PushPermissionBanner';
import InstallPage from './pages/InstallPage';
import PostDetailPage from './pages/PostDetailPage';

function MainApp() {
  const { user, loading } = useAuth();
  const [showNewPost, setShowNewPost] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [timelineKey, setTimelineKey] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginModal />;
  }

  // Admin dashboard shown for admin users when toggled
  const showingAdmin = user.is_admin && showAdmin;

  return (
    <>
      <Header
        onAdminClick={() => setShowAdmin((v) => !v)}
        showAdmin={showingAdmin}
      />

      <main className="max-w-[600px] mx-auto pb-20">
        <PushPermissionBanner />

        {showingAdmin ? (
          <AdminDashboard />
        ) : (
          <Timeline refreshKey={timelineKey} />
        )}
      </main>

      {!showingAdmin && (
        <FloatingActionButton onClick={() => setShowNewPost(true)} />
      )}

      {showNewPost && (
        <NewPostModal
          onClose={() => setShowNewPost(false)}
          onCreated={() => {
            setShowNewPost(false);
            setTimelineKey((k) => k + 1);
          }}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/installeren" element={<InstallPage />} />
          <Route path="/post/:id" element={<PostDetailPage />} />
          <Route path="/" element={<MainApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
