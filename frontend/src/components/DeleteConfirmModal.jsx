import React from 'react';
import { AlertTriangle, Trash2, X, Loader } from 'lucide-react';

export const DeleteConfirmModal = ({ isOpen, photo, isDeleting, onConfirm, onCancel }) => {
  if (!isOpen || !photo) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-container modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <div className="icon-danger-circle">
              <AlertTriangle size={20} className="text-danger" />
            </div>
            <h3>Delete Photo?</h3>
          </div>
          <button type="button" className="btn-close-modal" onClick={onCancel} disabled={isDeleting}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-desc">
            Are you sure you want to delete this photo? This will permanently remove the image
            from Cloudinary and your event gallery.
          </p>

          {photo.imageUrl && (
            <div className="delete-preview-box">
              <img src={photo.imageUrl} alt="Photo to delete" className="delete-preview-img" />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader size={16} className="spinner-icon" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Confirm Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
