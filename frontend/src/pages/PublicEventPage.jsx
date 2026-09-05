import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicEventApi } from '../api/publicEventApi';
import LightboxModal from '../components/LightboxModal';
import {
  Camera,
  Calendar,
  MapPin,
  Lock,
  Image as ImageIcon,
  Maximize2,
  Download,
  AlertCircle,
  Share2,
  Check
} from 'lucide-react';

export const PublicEventPage = () => {
  const { eventId } = useParams();

  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    fetchPublicEvent();
  }, [eventId]);

  const fetchPublicEvent = async () => {
    setIsLoading(true);
    setError('');
    setIsPrivate(false);

    try {
      // 1. Fetch public event info
      const eventRes = await publicEventApi.getPublicEvent(eventId);
      if (eventRes.success && eventRes.data) {
        setEvent(eventRes.data);

        // 2. Fetch public event photos
        const photosRes = await publicEventApi.getPublicEventPhotos(eventId);
        if (photosRes.success && Array.isArray(photosRes.data)) {
          setPhotos(photosRes.data);
        }
      }
    } catch (err) {
      if (err.status === 403) {
        setIsPrivate(true);
      } else if (err.status === 404) {
        setError('Event not found. Please verify the URL or ask your photographer.');
      } else {
        setError(err.message || 'Unable to load public gallery.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event ? `${event.name} — Photo-Dey Gallery` : 'Event Gallery',
          url: window.location.href,
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="public-page-wrapper">
        <header className="public-header">
          <div className="public-brand">
            <Camera size={24} className="text-primary" />
            <span>Photo-Dey</span>
          </div>
        </header>
        <div className="public-center-box">
          <div className="spinner"></div>
          <p className="loading-text mt-4">Loading event photos...</p>
        </div>
      </div>
    );
  }

  // Private event state
  if (isPrivate) {
    return (
      <div className="public-page-wrapper">
        <header className="public-header">
          <div className="public-brand">
            <Camera size={24} className="text-primary" />
            <span>Photo-Dey</span>
          </div>
        </header>

        <div className="public-center-box">
          <div className="private-badge-circle">
            <Lock size={44} className="text-warning" />
          </div>
          <h2 className="public-notice-title">This Event is Private</h2>
          <p className="public-notice-desc">
            The photographer has restricted public access to this event.
            If you are a guest, please check with the host or photographer for access.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="public-page-wrapper">
        <header className="public-header">
          <div className="public-brand">
            <Camera size={24} className="text-primary" />
            <span>Photo-Dey</span>
          </div>
        </header>

        <div className="public-center-box">
          <div className="error-badge-circle">
            <AlertCircle size={44} className="text-danger" />
          </div>
          <h2 className="public-notice-title">Gallery Unavailable</h2>
          <p className="public-notice-desc">{error || 'Event could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page-wrapper">
      {/* Top Bar */}
      <header className="public-header">
        <div className="public-header-inner">
          <div className="public-brand">
            <div className="public-logo-icon">
              <Camera size={22} className="text-primary" />
            </div>
            <span className="brand-name">Photo<span className="text-gradient">-Dey</span></span>
          </div>

          <div className="public-header-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm flex items-center gap-1"
              onClick={handleShare}
            >
              {copiedLink ? (
                <>
                  <Check size={16} className="text-success" />
                  <span>Copied Link!</span>
                </>
              ) : (
                <>
                  <Share2 size={16} />
                  <span>Share Gallery</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="public-hero">
        <div className="public-hero-content">
          <span className="public-tag">Official Event Gallery</span>
          <h1 className="public-event-title">{event.name}</h1>

          <div className="public-meta-row">
            <div className="public-meta-item">
              <Calendar size={16} className="text-primary" />
              <span>
                {new Date(event.date).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="public-meta-item">
              <MapPin size={16} className="text-primary" />
              <span>{event.location}</span>
            </div>
            {event.photographer?.name && (
              <div className="public-meta-item">
                <Camera size={16} className="text-primary" />
                <span>Captured by <strong>{event.photographer.name}</strong></span>
              </div>
            )}
          </div>

          {event.description && (
            <p className="public-description">{event.description}</p>
          )}

          <div className="public-photos-counter">
            <ImageIcon size={18} />
            <span>{photos.length} High-Resolution Photo{photos.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </section>

      {/* Photo Gallery Grid */}
      <main className="public-main-content">
        {photos.length === 0 ? (
          <div className="empty-state-card text-center my-12">
            <div className="empty-icon-circle">
              <ImageIcon size={40} className="text-muted" />
            </div>
            <h3>No photos available yet</h3>
            <p className="empty-desc">
              The photographer hasn't uploaded photos to this event yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="public-gallery-grid">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="public-photo-item"
                onClick={() => setLightboxIndex(index)}
              >
                <img
                  src={photo.imageUrl}
                  alt={`${event.name} Photo ${index + 1}`}
                  loading="lazy"
                  className="public-photo-img"
                />
                <div className="public-photo-hover">
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

      {/* Public Footer */}
      <footer className="public-footer">
        <div className="public-footer-inner">
          <p>© {new Date().getFullYear()} {event.name}. Powered by Photo-Dey.</p>
          <Link to="/login" className="photographer-login-link">
            Photographer Login
          </Link>
        </div>
      </footer>

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

export default PublicEventPage;
