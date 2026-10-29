import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicEventApi } from '../api/publicEventApi';
import LightboxModal from '../components/LightboxModal';
import {
  Camera,
  ArrowLeft,
  UploadCloud,
  RefreshCw,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Sparkles,
  Maximize2,
  Image as ImageIcon
} from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export const GuestFindPhotosPage = () => {
  const { eventId } = useParams();
  const fileInputRef = useRef(null);

  const [event, setEvent] = useState(null);
  const [uiState, setUiState] = useState('loading'); // 'loading' | 'success' | 'notFound' | 'private' | 'serverError'

  // Selfie selection states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Search execution states
  const [isSearching, setIsSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [matchedPhotos, setMatchedPhotos] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  // Clean up object URL on unmount or when previewUrl changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const loadEvent = async () => {
    if (!eventId) {
      setUiState('notFound');
      return;
    }

    setUiState('loading');
    setValidationError('');

    try {
      const res = await publicEventApi.getPublicEvent(eventId);
      if (res && res.success && res.data) {
        setEvent(res.data);
        setUiState('success');
      } else {
        setUiState('notFound');
      }
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

  const validateAndSelectFile = (file) => {
    setValidationError('');
    setSearchError('');
    setSearchDone(false);
    setMatchedPhotos([]);

    if (!file) return;

    // 1. Validate file type
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setValidationError('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    // 2. Validate file size (max 5 MB)
    if (file.size > MAX_FILE_SIZE) {
      setValidationError('Image size must be less than 5 MB.');
      return;
    }

    // Revoke previous URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
  };

  const handleRemoveSelfie = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError('');
    setSearchError('');
    setSearchDone(false);
    setMatchedPhotos([]);
  };

  const handleFindPhotosClick = async () => {
    if (!selectedFile) return;

    setIsSearching(true);
    setSearchError('');
    setSearchDone(false);

    try {
      const res = await publicEventApi.matchPhotos(eventId, selectedFile);
      if (res && res.success) {
        setMatchedPhotos(res.photos || []);
        setSearchDone(true);
      } else {
        setSearchError(res?.message || 'Matching failed. Please try again.');
      }
    } catch (err) {
      console.error('Selfie matching error:', err);
      setSearchError(err.message || 'Face detection failed. Please upload a clear selfie.');
    } finally {
      setIsSearching(false);
    }
  };

  // State 1: Loading Event Info
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

  // State 4: Server Error (500 or network failure)
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
    <div className="guest-page-container">
      {/* Header */}
      <header className="guest-page-header">
        <div className="guest-page-header-inner">
          <Link to={`/event/${eventId}`} className="guest-back-nav">
            <ArrowLeft size={18} />
            <span>Back to Event</span>
          </Link>

          <div className="guest-brand">
            <div className="guest-brand-logo">
              <Camera size={20} className="text-primary" />
            </div>
            <span className="guest-brand-text">Photoday</span>
          </div>

          <div style={{ width: 90 }}></div>
        </div>
      </header>

      {/* Main Container */}
      <main className="guest-page-main">
        {isSearching ? (
          <div className="guest-page-state-box">
            <div className="spinner"></div>
            <h2 className="state-message mt-4">Finding your photos...</h2>
            <p className="state-subtext">Searching for matching faces in {event.name}...</p>
          </div>
        ) : searchDone ? (
          // Search Results View
          <div className="guest-match-results-container">
            <div className="guest-match-header">
              <div>
                <h1 className="guest-match-title">Your Photos 🎉</h1>
                <p className="guest-match-count">
                  We found {matchedPhotos.length} {matchedPhotos.length === 1 ? 'photo' : 'photos'} for you.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm flex items-center gap-1"
                onClick={() => {
                  setSearchDone(false);
                  handleRemoveSelfie();
                }}
              >
                <RefreshCw size={15} />
                <span>Try Another Selfie</span>
              </button>
            </div>

            {matchedPhotos.length === 0 ? (
              <div className="guest-gallery-empty-card">
                <div className="empty-icon-circle">
                  <ImageIcon size={38} className="text-muted" />
                </div>
                <h2 className="state-message">We couldn't find any matching photos.</h2>
                <p className="state-subtext">
                  We scanned this event's photos but couldn't find a confident match with your selfie.
                  Try taking a clear, front-facing selfie in good lighting.
                </p>
                <button
                  type="button"
                  className="btn btn-primary mt-4 flex items-center gap-2 mx-auto"
                  onClick={() => {
                    setSearchDone(false);
                    handleRemoveSelfie();
                  }}
                >
                  <RefreshCw size={16} />
                  <span>Try Another Selfie</span>
                </button>
              </div>
            ) : (
              <div className="guest-gallery-grid">
                {matchedPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="guest-gallery-item"
                    onClick={() => setLightboxIndex(index)}
                  >
                    <img
                      src={photo.imageUrl}
                      alt={`Matched photo ${index + 1}`}
                      loading="lazy"
                      className="guest-gallery-img"
                    />

                    {/* Similarity score badge */}
                    {photo.matchScore && (
                      <div className="guest-match-badge" title={`AI Confidence: ${(photo.matchScore * 100).toFixed(1)}%`}>
                        <Sparkles size={12} className="text-warning" />
                        <span>{Math.round(photo.matchScore * 100)}% Match</span>
                      </div>
                    )}

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
          </div>
        ) : (
          // Selfie Upload Form View
          <div className="guest-selfie-card">
            <div className="guest-selfie-header">
              <h1 className="guest-selfie-title">Find My Photos</h1>
              <p className="guest-selfie-event-name">{event.name}</p>
            </div>

            <p className="guest-selfie-subtitle">
              Upload a clear selfie to find your photos from this event.
            </p>

            {/* Error Banners */}
            {validationError && (
              <div className="alert alert-error mb-4">
                <AlertCircle size={18} />
                <span>{validationError}</span>
              </div>
            )}

            {searchError && (
              <div className="alert alert-error mb-4">
                <AlertCircle size={18} />
                <span>{searchError}</span>
              </div>
            )}

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />

            {!previewUrl ? (
              // Upload Dropzone
              <div
                className={`guest-selfie-dropzone ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="guest-selfie-icon-circle">
                  <UploadCloud size={32} className="text-primary" />
                </div>
                <p className="guest-dropzone-main-text">
                  Tap to upload or drag and drop your selfie here
                </p>
                <p className="guest-dropzone-sub-text">
                  JPG, PNG, or WebP • Max 5 MB
                </p>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm mt-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <span>Browse Files</span>
                </button>
              </div>
            ) : (
              // Preview Box
              <div className="guest-selfie-preview-box">
                <div className="guest-selfie-img-wrapper">
                  <img
                    src={previewUrl}
                    alt="Selected selfie preview"
                    className="guest-selfie-preview-img"
                  />
                  <div className="guest-selfie-check-badge">
                    <CheckCircle2 size={18} className="text-success" />
                  </div>
                </div>

                <div className="guest-selfie-file-info">
                  <p className="guest-selfie-filename">{selectedFile?.name}</p>
                  <p className="guest-selfie-filesize">
                    {(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>

                <div className="guest-selfie-controls">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm flex items-center gap-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSearching}
                    title="Select a different photo"
                  >
                    <RefreshCw size={15} />
                    <span>Replace Selfie</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger btn-sm flex items-center gap-1"
                    onClick={handleRemoveSelfie}
                    disabled={isSearching}
                    title="Remove selfie"
                  >
                    <Trash2 size={15} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="guest-selfie-submit-group mt-6">
              <button
                type="button"
                className={`btn-guest-action ${
                  selectedFile && !isSearching ? 'btn-guest-gallery' : 'btn-guest-disabled'
                }`}
                disabled={!selectedFile || isSearching}
                onClick={handleFindPhotosClick}
              >
                {isSearching ? (
                  <>
                    <div className="spinner-icon spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                    <span>Analyzing & Matching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Find My Photos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Lightbox for search results */}
      {lightboxIndex !== null && matchedPhotos.length > 0 && (
        <LightboxModal
          photos={matchedPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIndex) => setLightboxIndex(newIndex)}
        />
      )}
    </div>
  );
};

export default GuestFindPhotosPage;
