import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicEventApi } from '../api/publicEventApi';
import LightboxModal from '../components/LightboxModal';
import {
  Camera,
  ArrowLeft,
  Image as ImageIcon,
  Maximize2,
  Lock,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

export const GuestGalleryPage = () => {
  const { eventId } = useParams();

  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [uiState, setUiState] = useState('loading'); // 'loading' | 'success' | 'notFound' | 'private' | 'serverError'
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    loadGallery();
  }, [eventId]);

  const loadGallery = async () => {
    if (!eventId) {
      setUiState('notFound');
      return;
    }

    setUiState('loading');

    try {
      // 1. Fetch public event info
      const eventRes = await publicEventApi.getPublicEvent(eventId);
      if (!eventRes || !eventRes.success || !eventRes.data) {
        setUiState('notFound');
        return;
      }
      setEvent(eventRes.data);

      // 2. Fetch public event photos
      const photosRes = await publicEventApi.getPublicEventPhotos(eventId);
      if (photosRes && photosRes.success && Array.isArray(photosRes.data)) {
        setPhotos(photosRes.data);
      } else {
        setPhotos([]);
      }

      setUiState('success');
    } catch (err) {
      if (err.status === 404) {
        setUiState('notFound');
      } else if (err.status === 403) {
        setUiState('private');
      } else {
        setUiState('serverError');
      }
    }
  };

  // State: Loading
  if (uiState === 'loading') {
    return (
      <div className="guest-page-container">
        <header className="guest-page-header">
          <div className="guest-brand">
            <div className="guest-brand-logo">
              <Camera size={22} className="text-primary" />
            </div>
            <span className="guest-brand-text">Photoday</span>
          </div>
        </header>
        <main className="guest-page-main">
          <div className="guest-page-state-box">
            <div className="spinner"></div>
            <p className="state-message mt-4">Loading photos...</p>
          </div>
        </main>
      </div>
    );
  }

  // State: Event not found (404)
  if (uiState === 'notFound') {
    return (
      <div className="guest-page-container">
        <header className="guest-page-header">
          <div className="guest-brand">
            <div className="guest-brand-logo">
              <Camera size={22} className="text-primary" />
            </div>
            <span className="guest-brand-text">Photoday</span>
          </div>
        </header>
        <main className="guest-page-main">
          <div className="guest-page-state-box">
            <div className="state-icon-circle text-danger">
              <AlertCircle size={36} />
            </div>
            <h2 className="state-message">Event not found.</h2>
          </div>
        </main>
      </div>
    );
  }

  // State: Private event (403)
  if (uiState === 'private') {
    return (
      <div className="guest-page-container">
        <header className="guest-page-header">
          <div className="guest-brand">
            <div className="guest-brand-logo">
              <Camera size={22} className="text-primary" />
            </div>
            <span className="guest-brand-text">Photoday</span>
          </div>
        </header>
        <main className="guest-page-main">
          <div className="guest-page-state-box">
            <div className="state-icon-circle text-warning">
              <Lock size={36} />
            </div>
            <h2 className="state-message">This event is currently unavailable.</h2>
          </div>
        </main>
      </div>
    );
  }

  // State: Server Error (500 or network failure)
  if (uiState === 'serverError' || !event) {
    return (
      <div className="guest-page-container">
        <header className="guest-page-header">
          <div className="guest-brand">
            <div className="guest-brand-logo">
              <Camera size={22} className="text-primary" />
            </div>
            <span className="guest-brand-text">Photoday</span>
          </div>
        </header>
        <main className="guest-page-main">
          <div className="guest-page-state-box">
            <div className="state-icon-circle text-danger">
              <AlertTriangle size={36} />
            </div>
            <h2 className="state-message">Something went wrong. Please try again.</h2>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="guest-gallery-container">
      {/* Top Bar */}
      <header className="guest-gallery-header">
        <div className="guest-gallery-header-inner">
          <Link to={`/event/${eventId}`} className="guest-gallery-back-link">
            <ArrowLeft size={18} />
            <span>Back to Event</span>
          </Link>

          <div className="guest-brand">
            <div className="guest-brand-logo">
              <Camera size={20} className="text-primary" />
            </div>
            <span className="guest-brand-text">Photoday</span>
          </div>

          <div className="guest-gallery-counter-badge">
            <ImageIcon size={15} />
            <span>{photos.length} Photo{photos.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </header>

      {/* Hero Title Area */}
      <div className="guest-gallery-hero">
        <div className="guest-gallery-hero-inner">
          <h1 className="guest-gallery-title">{event.name} Gallery</h1>
          {event.location && (
            <p className="guest-gallery-subtitle">{event.location}</p>
          )}
        </div>
      </div>

      {/* Photos Content */}
      <main className="guest-gallery-main">
        {photos.length === 0 ? (
          // Empty State
          <div className="guest-gallery-empty-card">
            <div className="empty-icon-circle">
              <ImageIcon size={38} className="text-muted" />
            </div>
            <h2 className="state-message">No photos uploaded yet.</h2>
            <p className="state-subtext">
              The photographer has not added photographs to this event gallery yet.
            </p>
          </div>
        ) : (
          // Responsive Photos Grid
          <div className="guest-gallery-grid">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="guest-gallery-item"
                onClick={() => setLightboxIndex(index)}
              >
                <img
                  src={photo.imageUrl}
                  alt={`${event.name} photograph ${index + 1}`}
                  loading="lazy"
                  className="guest-gallery-img"
                />
                <div className="guest-gallery-hover">
                  <div className="hover-action-pill">
                    <Maximize2 size={16} />
                    <span>View Full Size</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <LightboxModal
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIndex) => setLightboxIndex(newIndex)}
        />
      )}
    </div>
  );
};

export default GuestGalleryPage;
