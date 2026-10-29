import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, AlertCircle, Sparkles } from 'lucide-react';
import AiBadge from './AiBadge';

export const LightboxModal = ({ photos = [], currentIndex = 0, onClose, onNavigate }) => {
  const currentPhoto = photos[currentIndex];

  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setImgLoading(true);
    setImgError(false);
  }, [currentIndex, currentPhoto?.imageUrl]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [currentIndex, photos.length, onClose, onNavigate]);

  if (!currentPhoto) return null;

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (!currentPhoto?.imageUrl || isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await fetch(currentPhoto.imageUrl);
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `photoday_${currentPhoto.id || currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2500);
    } catch (err) {
      console.warn('Direct blob download failed, falling back to window open:', err);
      // Fallback
      window.open(currentPhoto.imageUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-header" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-info">
          <span className="lightbox-counter">
            {currentIndex + 1} of {photos.length}
          </span>
          {currentPhoto.createdAt && (
            <span className="lightbox-date">
              {new Date(currentPhoto.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )}
          {currentPhoto.aiStatus && <AiBadge photo={currentPhoto} showDetailed={true} />}
          {currentPhoto.matchScore && (
            <span className="lightbox-match-badge" title={`AI Confidence: ${Math.round(currentPhoto.matchScore * 100)}%`}>
              <Sparkles size={13} className="text-warning inline mr-1" />
              <span>{Math.round(currentPhoto.matchScore * 100)}% Match</span>
            </span>
          )}
        </div>

        <div className="lightbox-actions">
          <button
            type="button"
            onClick={handleDownload}
            className="lightbox-btn"
            disabled={isDownloading}
            title="Download photograph"
          >
            {isDownloading ? (
              <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            ) : (
              <Download size={20} />
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="lightbox-btn"
            title="Close (Esc)"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        {currentIndex > 0 && (
          <button
            type="button"
            className="lightbox-nav lightbox-prev"
            onClick={() => onNavigate(currentIndex - 1)}
            title="Previous photo"
          >
            <ChevronLeft size={36} />
          </button>
        )}

        <div className="lightbox-image-wrapper">
          {imgLoading && !imgError && (
            <div className="lightbox-image-loader">
              <div className="spinner"></div>
              <p className="mt-2 text-white" style={{ fontSize: '0.85rem' }}>Loading full image...</p>
            </div>
          )}

          {imgError ? (
            <div className="lightbox-error-box text-center">
              <AlertCircle size={40} className="text-danger" />
              <p className="mt-2 text-white font-medium">Failed to load image.</p>
              <a
                href={currentPhoto.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm mt-3"
              >
                Open directly
              </a>
            </div>
          ) : (
            <img
              src={currentPhoto.imageUrl}
              alt={`Photo ${currentIndex + 1}`}
              className={`lightbox-image ${imgLoading ? 'loading-hidden' : ''}`}
              onLoad={() => setImgLoading(false)}
              onError={() => {
                setImgLoading(false);
                setImgError(true);
              }}
            />
          )}
        </div>

        {currentIndex < photos.length - 1 && (
          <button
            type="button"
            className="lightbox-nav lightbox-next"
            onClick={() => onNavigate(currentIndex + 1)}
            title="Next photo"
          >
            <ChevronRight size={36} />
          </button>
        )}
      </div>
    </div>
  );
};

export default LightboxModal;
