import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import { photoApi } from '../api/photoApi';
import LightboxModal from '../components/LightboxModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import PhotoUploader from '../components/PhotoUploader';
import AiBadge from '../components/AiBadge';
import {
  ArrowLeft,
  Image as ImageIcon,
  Trash2,
  Maximize2,
  Upload,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle,
  Download,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const EventGalleryPage = () => {
  const { eventId } = useParams();

  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Upload drawer/section toggle
  const [showUploader, setShowUploader] = useState(false);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Delete modal state
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter & Refresh states
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadGallery();
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
        console.warn('AI status poll error:', pollErr);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [photos, eventId]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await photoApi.getEventPhotos(eventId);
      if (res.success && Array.isArray(res.data)) {
        setPhotos(res.data);
      }
    } finally {
      setIsRefreshing(false);
    }
  };


  const loadGallery = async () => {
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
      setError(err.message || 'Failed to load event photos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!photoToDelete) return;
    setIsDeleting(true);
    setError('');
    try {
      await photoApi.deletePhoto(photoToDelete.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photoToDelete.id));
      setPhotoToDelete(null);
      setSuccessMsg('Photo successfully removed.');
    } catch (err) {
      setError(err.message || 'Failed to delete photo.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadSuccess = (newPhotos) => {
    setPhotos((prev) => [...newPhotos, ...prev]);
    setShowUploader(false);
    setSuccessMsg(`Added ${newPhotos.length} new photo${newPhotos.length > 1 ? 's' : ''} to gallery.`);
  };

  if (isLoading) {
    return (
      <div className="page-content flex-center min-h-[400px]">
        <div className="spinner"></div>
        <p className="loading-text">Loading event gallery...</p>
      </div>
    );
  }

  return (
    <div className="gallery-page-container page-content">
      {/* Navigation Header */}
      <div className="gallery-page-header">
        <Link to={`/photographer/events/${eventId}`} className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Event Details</span>
        </Link>

        <div className="gallery-header-row">
          <div>
            <h1 className="page-title">{event?.name} — Gallery</h1>
            <p className="page-subtitle">
              {photos.length} Photo{photos.length !== 1 ? 's' : ''} in total
              {event?.date && ` • ${new Date(event.date).toLocaleDateString()}`}
              {event?.location && ` • ${event.location}`}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Refresh photo processing statuses"
            >
              <RefreshCw size={15} className={isRefreshing ? 'spin' : ''} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowUploader(!showUploader)}
            >
              <Upload size={18} />
              <span>{showUploader ? 'Close Uploader' : 'Upload More Photos'}</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        {photos.length > 0 && (
          <div className="gallery-filters">
            <button
              type="button"
              className={`filter-pill ${activeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveFilter('ALL')}
            >
              <span>All Photos</span>
              <span className="filter-pill-count">{photos.length}</span>
            </button>

            <button
              type="button"
              className={`filter-pill ${activeFilter === 'WITH_FACES' ? 'active' : ''}`}
              onClick={() => setActiveFilter('WITH_FACES')}
            >
              <Sparkles size={13} />
              <span>With Faces</span>
              <span className="filter-pill-count">{withFacesCount}</span>
            </button>

            <button
              type="button"
              className={`filter-pill ${activeFilter === 'NO_FACE' ? 'active' : ''}`}
              onClick={() => setActiveFilter('NO_FACE')}
            >
              <span>No Face</span>
              <span className="filter-pill-count">{noFaceCount}</span>
            </button>

            {processingCount > 0 && (
              <button
                type="button"
                className={`filter-pill ${activeFilter === 'PROCESSING' ? 'active' : ''}`}
                onClick={() => setActiveFilter('PROCESSING')}
              >
                <span className="spin">⏳</span>
                <span>Processing</span>
                <span className="filter-pill-count">{processingCount}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {successMsg && (
        <div className="alert alert-success mt-4">
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error mt-4">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Uploader Section (Collapsible) */}
      {showUploader && (
        <div className="mt-6 mb-8">
          <PhotoUploader
            eventId={eventId}
            onUploadSuccess={handleUploadSuccess}
          />
        </div>
      )}

      {/* Gallery Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="empty-state-card mt-8">
          <div className="empty-icon-circle">
            <ImageIcon size={40} className="text-muted" />
          </div>
          <h3>{photos.length === 0 ? 'Your gallery is empty' : 'No matching photos'}</h3>
          <p className="empty-desc">
            {photos.length === 0
              ? 'No photos have been uploaded for this event yet.'
              : 'No photos match the selected filter.'}
          </p>
          {photos.length === 0 ? (
            <button
              type="button"
              className="btn btn-primary mt-4"
              onClick={() => setShowUploader(true)}
            >
              <Upload size={18} />
              <span>Upload Photos Now</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary mt-4"
              onClick={() => setActiveFilter('ALL')}
            >
              <span>Show All Photos</span>
            </button>
          )}
        </div>
      ) : (
        <div className="gallery-grid mt-6">
          {filteredPhotos.map((photo, index) => (
            <div key={photo.id} className="gallery-card">
              <div
                className="gallery-image-container"
                onClick={() => setLightboxIndex(index)}
              >
                {/* AI Processing Status Badge */}
                <AiBadge photo={photo} className="ai-status-badge-overlay" />

                <img
                  src={photo.imageUrl}
                  alt={`Gallery photo ${index + 1}`}
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
                    title="Enlarge photo"
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
                    title="Delete photo"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="gallery-card-info">
                <span className="photo-index">Photo #{index + 1}</span>
                <span className="photo-time">
                  {new Date(photo.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}


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

export default EventGalleryPage;
