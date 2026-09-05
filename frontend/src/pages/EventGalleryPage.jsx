import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import { photoApi } from '../api/photoApi';
import LightboxModal from '../components/LightboxModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import PhotoUploader from '../components/PhotoUploader';
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
  Download
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

  useEffect(() => {
    loadGallery();
  }, [eventId]);

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
      {photos.length === 0 ? (
        <div className="empty-state-card mt-8">
          <div className="empty-icon-circle">
            <ImageIcon size={40} className="text-muted" />
          </div>
          <h3>Your gallery is empty</h3>
          <p className="empty-desc">
            No photos have been uploaded for this event yet.
          </p>
          <button
            type="button"
            className="btn btn-primary mt-4"
            onClick={() => setShowUploader(true)}
          >
            <Upload size={18} />
            <span>Upload Photos Now</span>
          </button>
        </div>
      ) : (
        <div className="gallery-grid mt-6">
          {photos.map((photo, index) => (
            <div key={photo.id} className="gallery-card">
              <div
                className="gallery-image-container"
                onClick={() => setLightboxIndex(index)}
              >
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
