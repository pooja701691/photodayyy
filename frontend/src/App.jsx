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
import GuestGalleryPage from './pages/GuestGalleryPage';
import GuestFindPhotosPage from './pages/GuestFindPhotosPage';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';

import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';

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
          {/* Public Landing / Starting Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Direct Dashboard Convenience Redirect */}
          <Route path="/dashboard" element={<Navigate to="/photographer/dashboard" replace />} />

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

          {/* Public Guest Event Routes (NO photographer authentication needed) */}
          <Route path="/event/:eventId" element={<PublicEventPage />} />
          <Route path="/event/:eventId/photos" element={<GuestGalleryPage />} />
          <Route path="/event/:eventId/my-photos" element={<GuestFindPhotosPage />} />
          <Route path="/public/events/:eventId" element={<PublicEventPage />} />
          <Route path="/public/events/:eventId/photos" element={<GuestGalleryPage />} />
          <Route path="/public/event/:eventId" element={<PublicEventPage />} />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
