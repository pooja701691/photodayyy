import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventApi } from '../api/eventApi';
import {
  Calendar,
  Image as ImageIcon,
  Plus,
  ArrowRight,
  User,
  Mail,
  MapPin,
  Globe,
  Lock,
  Sparkles,
  Loader,
  AlertCircle
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Create Event Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await eventApi.getMyEvents();
      if (res.success && Array.isArray(res.data)) {
        setEvents(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load events.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!eventName.trim() || !eventDate || !eventLocation.trim()) {
      setFormError('Event name, date, and location are required.');
      return;
    }

    setIsCreating(true);
    try {
      const res = await eventApi.createEvent({
        name: eventName.trim(),
        date: eventDate,
        location: eventLocation.trim(),
        description: eventDescription.trim() || undefined,
      });

      if (res.success && res.data) {
        setIsModalOpen(false);
        setEventName('');
        setEventDate('');
        setEventLocation('');
        setEventDescription('');
        navigate(`/photographer/events/${res.data.id}`);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create event.');
    } finally {
      setIsCreating(false);
    }
  };

  // Real statistics derived purely from backend data
  const totalEvents = events.length;
  const totalPhotos = events.reduce((acc, ev) => acc + (ev._count?.photos || 0), 0);
  const publicEventsCount = events.filter((ev) => ev.isPublic).length;

  return (
    <div className="dashboard-container page-content">
      {/* Welcome Banner & Photographer Profile */}
      <div className="dashboard-banner">
        <div className="banner-content">
          <div className="photographer-avatar-large">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User size={32} />}
          </div>
          <div className="banner-text">
            <span className="badge-role">{user?.role || 'Photographer'}</span>
            <h1 className="banner-title">Welcome, {user?.name}!</h1>
            <p className="banner-email flex items-center gap-1">
              <Mail size={15} />
              <span>{user?.email}</span>
            </p>
          </div>
        </div>

        <div className="banner-actions">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={18} />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* Real Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper bg-blue-light">
            <Calendar size={24} className="text-primary" />
          </div>
          <div className="stat-info">
            <span className="stat-label">My Events</span>
            <span className="stat-number">{isLoading ? '-' : totalEvents}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-purple-light">
            <ImageIcon size={24} className="text-purple" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Uploaded Photos</span>
            <span className="stat-number">{isLoading ? '-' : totalPhotos}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-green-light">
            <Globe size={24} className="text-success" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Public Events</span>
            <span className="stat-number">{isLoading ? '-' : publicEventsCount}</span>
          </div>
        </div>
      </div>

      {/* Recent Events Section */}
      <div className="section-container mt-8">
        <div className="section-header">
          <div>
            <h2 className="section-title">My Recent Events</h2>
            <p className="section-subtitle">Manage your event galleries, upload photos, and control public access</p>
          </div>
          <Link to="/photographer/events" className="btn btn-secondary btn-sm flex items-center gap-1">
            <span>View All ({events.length})</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="loading-state-card">
            <div className="spinner"></div>
            <p>Loading your events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon-circle">
              <Calendar size={40} className="text-muted" />
            </div>
            <h3>No events created yet</h3>
            <p className="empty-desc">
              Create your first event to start uploading client photos and generating QR code galleries.
            </p>
            <button
              type="button"
              className="btn btn-primary mt-4"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={18} />
              <span>Create Your First Event</span>
            </button>
          </div>
        ) : (
          <div className="events-grid">
            {events.slice(0, 6).map((event) => (
              <div key={event.id} className="event-card">
                <div className="event-card-header">
                  <span className={`status-badge ${event.isPublic ? 'status-public' : 'status-private'}`}>
                    {event.isPublic ? (
                      <>
                        <Globe size={12} /> Public
                      </>
                    ) : (
                      <>
                        <Lock size={12} /> Private
                      </>
                    )}
                  </span>
                  <span className="photo-count-badge">
                    <ImageIcon size={13} /> {event._count?.photos || 0} photos
                  </span>
                </div>

                <h3 className="event-card-title">{event.name}</h3>

                <div className="event-card-meta">
                  <div className="meta-item">
                    <Calendar size={14} />
                    <span>{new Date(event.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}</span>
                  </div>
                  <div className="meta-item">
                    <MapPin size={14} />
                    <span>{event.location}</span>
                  </div>
                </div>

                {event.description && (
                  <p className="event-card-desc">{event.description}</p>
                )}

                <div className="event-card-footer">
                  <Link
                    to={`/photographer/events/${event.id}`}
                    className="btn btn-primary btn-block btn-sm"
                  >
                    <span>Open Event</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <div className="icon-primary-circle">
                  <Plus size={20} className="text-primary" />
                </div>
                <h3>Create New Event</h3>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setIsModalOpen(false)}
                disabled={isCreating}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="modal-body">
              {formError && (
                <div className="alert alert-error mb-4">
                  <AlertCircle size={18} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="name">
                  Event Name *
                </label>
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rahul & Priya Wedding"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                  disabled={isCreating}
                />
              </div>

              <div className="grid-2-col">
                <div className="form-group">
                  <label className="form-label" htmlFor="date">
                    Event Date *
                  </label>
                  <input
                    id="date"
                    type="date"
                    className="form-input"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    disabled={isCreating}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="location">
                    Location *
                  </label>
                  <input
                    id="location"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Taj Palace, Delhi"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    required
                    disabled={isCreating}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className="form-input"
                  placeholder="Add notes, schedule, or photography guidelines for this event..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  disabled={isCreating}
                />
              </div>

              <div className="modal-footer mt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader size={16} className="spinner-icon" />
                      Creating...
                    </>
                  ) : (
                    'Create Event'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
