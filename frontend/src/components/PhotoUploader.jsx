import React, { useState, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { photoApi } from '../api/photoApi';

export const PhotoUploader = ({ eventId, onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFilesSelected = (newFiles) => {
    setError('');
    setSuccessMsg('');

    const validFiles = Array.from(newFiles).filter((file) => {
      if (!file.type.startsWith('image/')) {
        setError('Only image files (JPG, PNG, WEBP, etc.) are allowed.');
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Each photo must be under 10MB.');
        return false;
      }
      return true;
    });

    const combined = [...files, ...validFiles].slice(0, 15);
    if (files.length + validFiles.length > 15) {
      setError('You can upload a maximum of 15 photos at a time.');
    }

    setFiles(combined);

    // Generate local preview URLs
    const newPreviews = combined.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one photo to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError('');
    setSuccessMsg('');

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('photos', file);
    });

    try {
      const res = await photoApi.uploadPhotos(eventId, formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      if (res.success) {
        setSuccessMsg(`Successfully uploaded ${res.data.length} photo${res.data.length > 1 ? 's' : ''}!`);
        setFiles([]);
        setPreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (onUploadSuccess) onUploadSuccess(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload photos. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="photo-uploader-card">
      <div className="card-header">
        <h3 className="card-title">Upload Event Photos</h3>
        <span className="card-badge">Up to 15 photos (Max 10MB each)</span>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${files.length > 0 ? 'has-files' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/*"
          className="hidden-file-input"
          onChange={(e) => {
            if (e.target.files) handleFilesSelected(e.target.files);
          }}
          disabled={isUploading}
        />

        <div className="drop-zone-content">
          <div className="upload-icon-circle">
            <UploadCloud size={32} className="text-primary" />
          </div>
          <p className="drop-zone-text">
            <strong>Click to upload</strong> or drag and drop photos here
          </p>
          <span className="drop-zone-subtext">JPG, PNG, WEBP supported</span>
        </div>
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="preview-section">
          <div className="preview-header">
            <h4>Selected Photos ({files.length}/15)</h4>
            <button
              type="button"
              className="btn-text text-danger"
              onClick={() => {
                setFiles([]);
                setPreviews([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              disabled={isUploading}
            >
              Clear All
            </button>
          </div>

          <div className="preview-grid">
            {previews.map((preview, index) => (
              <div key={index} className="preview-item">
                <img src={preview} alt={`Upload preview ${index + 1}`} />
                {!isUploading && (
                  <button
                    type="button"
                    className="btn-remove-preview"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    title="Remove photo"
                  >
                    <X size={14} />
                  </button>
                )}
                <span className="preview-index">#{index + 1}</span>
              </div>
            ))}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="progress-container">
              <div className="progress-bar-wrapper">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="progress-stats">
                <span>Uploading to Cloudinary & saving records...</span>
                <span>{uploadProgress}%</span>
              </div>
            </div>
          )}

          {/* Upload Action Button */}
          <div className="uploader-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={isUploading || files.length === 0}
            >
              {isUploading ? (
                <>
                  <Loader size={18} className="spinner-icon" />
                  Uploading {files.length} Photo{files.length > 1 ? 's' : ''}...
                </>
              ) : (
                <>
                  <UploadCloud size={18} />
                  Upload {files.length} Photo{files.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUploader;
