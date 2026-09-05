import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import {
  Calendar,
  Image as ImageIcon,
  Plus,
  Search,
  MapPin,
  Globe,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader
} from 'lucide-react';

export const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Event Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const navigate = useNavigate();

  const location = useLocation();

  useEffect(() => {
    fetchEvents();
    if (location.search.includes('create=true')) {
      setIsModalOpen(true);
    }
  }, [location.search]);

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

  const filteredEvents = events.filter((ev) => {
    const query = searchQuery.toLowerCase();
    return (
      ev.name.toLowerCase().includes(query) ||
      ev.location.toLowerCase().includes(query) ||
      (ev.description && ev.description.toLowerCase().includes(query))
    );
  });

  return (
    <div className="events-page-container page-content">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">My Events</h1>
          <p className="page-subtitle">View and manage all your photography events and client galleries</p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-filter-bar mt-6">
        <div className="input-with-icon search-input-box">
          <Search size={18} className="input-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search events by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert-error mt-4">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="loading-state-card mt-8">
          <div className="spinner"></div>
          <p>Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state-card mt-8">
          <div className="empty-icon-circle">
            <Calendar size={40} className="text-muted" />
          </div>
          <h3>No events found</h3>
          <p className="empty-desc">
            You have not created any events yet. Click below to create your first event!
          </p>
          <button
            type="button"
            className="btn btn-primary mt-4"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={18} />
            <span>Create Event</span>
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="empty-state-card mt-8">
          <p>No events matched your search query "{searchQuery}".</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm mt-3"
            onClick={() => setSearchQuery('')}
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="events-grid mt-6">
          {filteredEvents.map((event) => (
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
                  placeholder="Add details about schedule, dress code, or event highlights..."
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

export default EventsPage;
