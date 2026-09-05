import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import EventGalleryPage from './pages/EventGalleryPage';
import PublicEventPage from './pages/PublicEventPage';
import NotFoundPage from './pages/NotFoundPage';

import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';

// Root redirector based on authentication status
const RootRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-center full-page-loader">
        <div className="spinner"></div>
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? '/photographer/dashboard' : '/login'} replace />;
};

// Layout for photographer portal matching reference design
const PhotographerLayout = () => {
  return (
    <div className="app-layout-wrapper">
      <Sidebar />
      <div className="app-main-area">
        <TopHeader />
        <main className="main-viewport">
          <ProtectedRoute />
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Photographer Portal */}
          <Route path="/photographer" element={<PhotographerLayout />}>
            <Route index element={<Navigate to="/photographer/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="events/:eventId" element={<EventDetailPage />} />
            <Route path="events/:eventId/gallery" element={<EventGalleryPage />} />
          </Route>

          {/* Public Guest Gallery Routes (NO photographer authentication needed) */}
          <Route path="/public/events/:eventId" element={<PublicEventPage />} />
          <Route path="/public/event/:eventId" element={<PublicEventPage />} />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
