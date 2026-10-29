import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicEventApi } from '../api/publicEventApi';
import {
  Camera,
  Calendar,
  MapPin,
  Lock,
  AlertCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

export const PublicEventPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [uiState, setUiState] = useState('loading'); // 'loading' | 'success' | 'notFound' | 'private' | 'serverError'

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    if (!eventId) {
      setUiState('notFound');
      return;
    }

    setUiState('loading');

    try {
      const res = await publicEventApi.getPublicEvent(eventId);
      if (res && res.success && res.data) {
        setEvent(res.data);
        setUiState('success');
      } else {
        setUiState('notFound');
      }
    } catch (err) {
      const status = err.status || err.response?.status;
      if (status === 404) {
        setUiState('notFound');
      } else if (status === 403) {
        setUiState('private');
      } else {
        setUiState('serverError');
      }
    }
  };

  const handleActionClick = (actionName) => {
    if (actionName === 'gallery') {
      navigate(`/event/${eventId}/photos`);
    } else if (actionName === 'findPhotos') {
      navigate(`/event/${eventId}/my-photos`);
    }
  };

  // State 1: Loading
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
            <p className="state-message mt-4">Loading event...</p>
          </div>
        </main>
      </div>
    );
  }

  // State 2: Event not found (404)
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

  // State 3: Private event (403)
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

  // State 4: Server error (500 or network failure)
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

  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="guest-page-container">
      {/* Header */}
      <header className="guest-page-header">
        <div className="guest-brand">
          <div className="guest-brand-logo">
            <Camera size={22} className="text-primary" />
          </div>
          <span className="guest-brand-text">Photoday</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="guest-page-main">
        <div className="guest-event-card">
          {/* Cover image if available */}
          {event.coverImage && (
            <div className="guest-cover-wrapper">
              <img
                src={event.coverImage}
                alt={event.name}
                className="guest-cover-image"
              />
            </div>
          )}

          {/* Event Name */}
          <h1 className="guest-event-title">{event.name}</h1>

          {/* Event Meta (Date if available) */}
          <div className="guest-event-meta">
            {formattedDate && (
              <div className="guest-event-date">
                <Calendar size={16} />
                <span>{formattedDate}</span>
              </div>
            )}
            {event.location && (
              <div className="guest-event-location">
                <MapPin size={15} />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {/* Description if available */}
          {event.description && (
            <p className="guest-event-description">{event.description}</p>
          )}

          {/* Action Buttons */}
          <div className="guest-actions-group">
            <button
              type="button"
              className="btn-guest-action btn-guest-gallery"
              onClick={() => handleActionClick('gallery')}
            >
              <span>View Gallery</span>
            </button>

            <button
              type="button"
              className="btn-guest-action btn-guest-selfie"
              onClick={() => handleActionClick('findPhotos')}
            >
              <span>🤳 Find My Photos</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicEventPage;
