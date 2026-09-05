import React from 'react';
import { Sparkles, UserX, Loader2, AlertTriangle } from 'lucide-react';

export const AiBadge = ({ photo, className = '', showDetailed = false }) => {
  if (!photo) return null;

  const status = photo.aiStatus || 'PENDING';
  const faces = photo.facesCount ?? 0;

  if (status === 'COMPLETED') {
    if (faces > 0) {
      return (
        <span
          className={`ai-status-badge ai-badge-completed ${className}`}
          title={`${faces} face(s) detected and indexed in vector database`}
        >
          <Sparkles size={12} className="ai-badge-icon" />
          <span>{faces} {faces === 1 ? 'Face' : 'Faces'}{showDetailed ? ' Detected' : ''}</span>
        </span>
      );
    }
    return (
      <span
        className={`ai-status-badge ai-badge-noface ${className}`}
        title="No faces detected in this photograph"
      >
        <UserX size={12} className="ai-badge-icon" />
        <span>No Face</span>
      </span>
    );
  }

  if (status === 'NO_FACE') {
    return (
      <span
        className={`ai-status-badge ai-badge-noface ${className}`}
        title="No faces detected in this photograph"
      >
        <UserX size={12} className="ai-badge-icon" />
        <span>No Face</span>
      </span>
    );
  }

  if (status === 'PROCESSING' || status === 'PENDING') {
    return (
      <span
        className={`ai-status-badge ai-badge-processing ${className}`}
        title="AI worker is analyzing photo, detecting facial landmarks and generating embeddings..."
      >
        <Loader2 size={12} className="ai-badge-icon spin" />
        <span>{status === 'PROCESSING' ? 'AI Processing...' : 'AI Queued...'}</span>
      </span>
    );
  }

  if (status === 'FAILED') {
    return (
      <span
        className={`ai-status-badge ai-badge-failed ${className}`}
        title={photo.aiError || 'AI face analysis failed'}
      >
        <AlertTriangle size={12} className="ai-badge-icon" />
        <span>AI Failed</span>
      </span>
    );
  }

  return null;
};

export default AiBadge;
