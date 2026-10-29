import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import { photoApi } from '../api/photoApi';
import PhotoUploader from '../components/PhotoUploader';
import LightboxModal from '../components/LightboxModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import QrCodeModal from '../components/QrCodeModal';
import AiBadge from '../components/AiBadge';
import {
  ArrowLeft,
  Image as ImageIcon,
  Power,
  Trash2,
  QrCode,
  Maximize2,
  AlertCircle,
  CheckCircle,
  Plus,
  Share2,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const EventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const uploadSectionRef = useRef(null);

  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Upload view toggle
  const [showUploader, setShowUploader] = useState(false);

  // Public Toggle state
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);

  // QR Modal state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Delete Modal state
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  // Polling for AI processing updates if any photo is PENDING or PROCESSING
  useEffect(() => {
    const hasUnfinished = photos.some(
      (p) => p.aiStatus === 'PENDING' || p.aiStatus === 'PROCESSING'
    );

    if (!hasUnfinished) return;

    const interval = setInterval(async () => {
      try {
        const res = await photoApi.getEventPhotos(eventId);
        if (res.success && Array.isArray(res.data)) {
          setPhotos(res.data);
        }
      } catch (pollErr) {
        console.warn('AI status poll error in EventDetailPage:', pollErr);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [photos, eventId]);


  const loadEventData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [eventRes, photosRes] = await Promise.all([
        eventApi.getEventDetails(eventId),
        photoApi.getEventPhotos(eventId),
      ]);

      if (eventRes.success && eventRes.data) {
        setEvent(eventRes.data);
      }
      if (photosRes.success && Array.isArray(photosRes.data)) {
        setPhotos(photosRes.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load event details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublic = async () => {
    if (!event) return;
    setIsTogglingPublic(true);
    setActionSuccess('');
    setError('');

    const nextState = !event.isPublic;
    try {
      const res = await eventApi.togglePublic(eventId, nextState);
      if (res.success && res.data) {
        setEvent(res.data);
        setActionSuccess(
          nextState
            ? 'Public access enabled! Guests can now view the event gallery via QR code or public link.'
            : 'Public access disabled. The event is now private.'
        );
      }
    } catch (err) {
      setError(err.message || 'Failed to update public access.');
    } finally {
      setIsTogglingPublic(false);
    }
  };

  const handleUploadSuccess = (newPhotos) => {
    setPhotos((prev) => [...newPhotos, ...prev]);
    setActionSuccess('Photographs added successfully!');
    setShowUploader(false);
  };

  const handleDeleteConfirm = async () => {
    if (!photoToDelete) return;
    setIsDeleting(true);
    setError('');
    try {
      await photoApi.deletePhoto(photoToDelete.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photoToDelete.id));
      setPhotoToDelete(null);
      setActionSuccess('Photograph removed successfully.');
    } catch (err) {
      setError(err.message || 'Failed to delete photo.');
    } finally {
      setIsDeleting(false);
    }
  };

  const scrollToUpload = () => {
    setShowUploader(true);
    setTimeout(() => {
      uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="page-content flex-center min-h-[400px]">
        <div className="spinner"></div>
        <p className="loading-text">Loading event...</p>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="page-content">
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
        <Link to="/photographer/events" className="btn btn-secondary mt-4">
          <ArrowLeft size={16} />
          <span>Back to All Events</span>
        </Link>
      </div>
    );
  }

  const formattedDate = event?.date
    ? new Date(event.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="event-detail-page page-content">
      {/* 1. Back navigation matching reference screenshot: ← All events */}
      <div className="event-nav-crumb">
        <Link to="/photographer/events" className="crumb-back-link">
          <ArrowLeft size={16} />
          <span>All events</span>
        </Link>
      </div>

      {actionSuccess && (
        <div className="alert alert-success mt-3 mb-2">
          <CheckCircle size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error mt-3 mb-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Main Event Header matching reference screenshot */}
      <div className="event-main-header">
        <div className="event-header-left-col">
          {/* Status badge & Date row */}
          <div className="event-status-row">
            <span className="status-pill-ready">
              <span className="pill-dot"></span>
              <span>READY</span>
            </span>
            <span className="event-header-date">{formattedDate}</span>
          </div>

          {/* Event title */}
          <h1 className="event-hero-title">{event.name}</h1>

          {/* Photos count subtitle */}
          <p className="event-photos-received">
            {photos.length} of {photos.length} photographs received
          </p>
        </div>

        {/* Action Buttons Row matching reference screenshot */}
        <div className="event-header-actions-col">
          {/* Primary CTA: Add photographs */}
          <button
            type="button"
            className="btn-purple-pill"
            onClick={scrollToUpload}
          >
            <ImageIcon size={18} />
            <span>Add photographs</span>
          </button>

          {/* Secondary CTA: Public access on/off pill */}
          <button
            type="button"
            className={`btn-public-access-pill ${event.isPublic ? 'active' : ''}`}
            onClick={handleTogglePublic}
            disabled={isTogglingPublic}
            title={event.isPublic ? 'Public access is ON (Click to disable)' : 'Public access is OFF (Click to enable)'}
          >
            <Power size={16} className={event.isPublic ? 'text-success' : 'text-muted'} />
            <span>Public access {event.isPublic ? 'on' : 'off'}</span>
          </button>

          {/* QR Code button */}
          <button
            type="button"
            className="btn-pill-subtle"
            onClick={() => setIsQrModalOpen(true)}
            title="Generate QR code for guests"
          >
            <QrCode size={16} />
            <span>QR</span>
          </button>

          {/* Delete Event/Photo Action */}
          <button
            type="button"
            className="btn-icon-subtle-danger"
            onClick={() => {
              if (photos.length > 0) {
                setPhotoToDelete(photos[0]);
              } else {
                alert('This event has no photos to delete.');
              }
            }}
            title="Delete photo"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* 3. Processing Progress Card matching reference screenshot */}
      {(() => {
        const totalUploaded = photos.length;
        const processingCount = photos.filter(
          (p) => p.aiStatus === 'PENDING' || p.aiStatus === 'PROCESSING'
        ).length;
        const completedCount = photos.filter(
          (p) => p.aiStatus === 'COMPLETED' || p.aiStatus === 'NO_FACE'
        ).length;
        const failedCount = photos.filter((p) => p.aiStatus === 'FAILED').length;
        const progressPercent = totalUploaded === 0 ? 0 : Math.round((completedCount / totalUploaded) * 100);
        const strokeDashoffset = totalUploaded === 0 ? 314.16 : 314.16 - (314.16 * progressPercent) / 100;

        let title = 'Your event is ready to share.';
        let description = 'Guests can now use the public event link to find their moments.';

        if (processingCount > 0) {
          title = 'AI is analyzing photographs...';
          description = `${processingCount} photograph${processingCount > 1 ? 's are' : ' is'} being processed for face detection and vector embeddings.`;
        } else if (totalUploaded === 0) {
          title = 'No photographs uploaded yet.';
          description = 'Upload event photographs to automatically trigger AI face detection and indexing.';
        } else if (failedCount > 0 && completedCount === 0) {
          title = 'AI processing encountered issues.';
          description = 'Some photographs could not be processed by the AI worker.';
        }

        return (
          <div className="processing-progress-card">
            {/* Left column */}
            <div className="progress-card-left">
              <span className="progress-eyebrow">PROCESSING PROGRESS</span>
              <h2 className="progress-title">{title}</h2>
              <p className="progress-description">{description}</p>
            </div>

            {/* Center column: Circular progress gauge */}
            <div className="progress-card-center">
              <div className="circular-progress-wrapper">
                <svg className="circular-progress-svg" viewBox="0 0 120 120">
                  <circle
                    className="progress-circle-bg"
                    cx="60"
                    cy="60"
                    r="50"
                  />
                  <circle
                    className="progress-circle-fill"
                    cx="60"
                    cy="60"
                    r="50"
                    strokeDasharray="314.16"
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="progress-circle-content">
                  <span className="progress-percent">
                    {progressPercent}%
                  </span>
                  <span className="progress-complete-label">
                    {processingCount > 0 ? 'PROCESSING' : 'COMPLETE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right column: 2x2 statistics with dividers */}
            <div className="progress-card-right">
              <div className="stat-quad-grid">
                <div className="stat-quad-item right-border bottom-border">
                  <span className="stat-quad-number">{totalUploaded}</span>
                  <span className="stat-quad-label">UPLOADED</span>
                </div>

                <div className="stat-quad-item bottom-border">
                  <span className={`stat-quad-number ${processingCount > 0 ? 'text-amber-500' : ''}`}>
                    {processingCount}
                  </span>
                  <span className="stat-quad-label">PROCESSING</span>
                </div>

                <div className="stat-quad-item right-border">
                  <span className="stat-quad-number">{completedCount}</span>
                  <span className="stat-quad-label">COMPLETED</span>
                </div>

                <div className="stat-quad-item">
                  <span className={`stat-quad-number ${failedCount > 0 ? 'text-red-500' : ''}`}>
                    {failedCount}
                  </span>
                  <span className="stat-quad-label">FAILED</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}


      {/* 4. Upload Area (Collapsible / Triggered by "Add photographs") */}
      <div ref={uploadSectionRef} className="mt-8">
        {showUploader && (
          <div className="mb-6">
            <PhotoUploader
              eventId={event.id}
              onUploadSuccess={handleUploadSuccess}
            />
          </div>
        )}
      </div>

      {/* 5. Photos Gallery Grid Section */}
      <div className="event-gallery-section mt-8">
        <div className="section-header-clean">
          <div>
            <h3 className="section-title-clean">Event Photographs ({photos.length})</h3>
            <p className="section-subtitle-clean">
              All high-resolution photographs uploaded for this event
            </p>
          </div>

          <div className="flex gap-2">
            {!showUploader && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowUploader(true)}
              >
                <Plus size={16} />
                <span>Upload Photos</span>
              </button>
            )}

            <Link
              to={`/photographer/events/${event.id}/gallery`}
              className="btn btn-secondary btn-sm"
            >
              <span>View Full Gallery</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="empty-state-card mt-4">
            <div className="empty-icon-circle">
              <ImageIcon size={36} className="text-muted" />
            </div>
            <h3>No photographs yet</h3>
            <p className="empty-desc">
              Click "Add photographs" above to start uploading images for this event.
            </p>
          </div>
        ) : (
          <div className="gallery-grid mt-4">
            {photos.map((photo, index) => (
              <div key={photo.id} className="gallery-card">
                <div
                  className="gallery-image-container"
                  onClick={() => setLightboxIndex(index)}
                >
                  {/* AI Status Badge Overlay */}
                  <AiBadge photo={photo} className="ai-status-badge-overlay" />

                  <img
                    src={photo.imageUrl}
                    alt={`Event photograph ${index + 1}`}
                    loading="lazy"
                    className="gallery-image"
                  />
                  <div className="gallery-overlay">
                    <button
                      type="button"
                      className="btn-overlay-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(index);
                      }}
                      title="View full image"
                    >
                      <Maximize2 size={18} />
                    </button>
                    <button
                      type="button"
                      className="btn-overlay-action btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhotoToDelete(photo);
                      }}
                      title="Delete photograph"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        event={event}
        onClose={() => setIsQrModalOpen(false)}
        onTogglePublic={handleTogglePublic}
      />

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <LightboxModal
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIndex) => setLightboxIndex(newIndex)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!photoToDelete}
        photo={photoToDelete}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPhotoToDelete(null)}
      />
    </div>
  );
};

export default EventDetailPage;
