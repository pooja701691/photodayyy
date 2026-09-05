import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

export const LightboxModal = ({ photos = [], currentIndex = 0, onClose, onNavigate }) => {
  const currentPhoto = photos[currentIndex];

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
        </div>

        <div className="lightbox-actions">
          <a
            href={currentPhoto.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={`photo_${currentPhoto.id}.jpg`}
            className="lightbox-btn"
            title="Open/Download original"
          >
            <Download size={20} />
          </a>
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
          <img
            src={currentPhoto.imageUrl}
            alt={`Photo ${currentIndex + 1}`}
            className="lightbox-image"
          />
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
