import React, { useState, useEffect } from 'react';
import { X, QrCode, Copy, Check, Download, ExternalLink, AlertCircle } from 'lucide-react';
import QRCodeLib from 'qrcode';
import { eventApi } from '../api/eventApi';

export const QrCodeModal = ({ isOpen, event, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const publicUrl = `${window.location.origin}/public/events/${event?.id}`;

  useEffect(() => {
    if (!isOpen || !event) return;

    let isMounted = true;
    setIsLoading(true);
    setError('');

    const generateQr = async () => {
      try {
        // First try backend QR API
        const res = await eventApi.getEventQr(event.id);
        if (isMounted && res.success && res.data?.qrCodeDataUrl) {
          setQrDataUrl(res.data.qrCodeDataUrl);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Backend QR fetch failed, generating client-side fallback:', err.message);
      }

      // Client-side fallback using QRCode library
      try {
        const url = await QRCodeLib.toDataURL(publicUrl, {
          width: 320,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        if (isMounted) {
          setQrDataUrl(url);
          setIsLoading(false);
        }
      } catch (clientErr) {
        if (isMounted) {
          setError('Failed to generate QR code.');
          setIsLoading(false);
        }
      }
    };

    generateQr();

    return () => {
      isMounted = false;
    };
  }, [isOpen, event, publicUrl]);

  if (!isOpen || !event) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy to clipboard:', e);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${event.name.toLowerCase().replace(/\s+/g, '_')}_qr_code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <div className="icon-primary-circle">
              <QrCode size={20} className="text-primary" />
            </div>
            <div>
              <h3>Public Event QR Code</h3>
              <p className="modal-subtitle">{event.name}</p>
            </div>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body text-center">
          {!event.isPublic && (
            <div className="alert alert-warning mb-4">
              <AlertCircle size={18} />
              <span>Public access is currently disabled for this event. Enable public access so guests can view the gallery.</span>
            </div>
          )}

          {isLoading ? (
            <div className="qr-loading-container">
              <div className="spinner"></div>
              <p className="mt-2 text-muted">Generating QR code...</p>
            </div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : (
            <div className="qr-display-container">
              <div className="qr-image-card">
                <img src={qrDataUrl} alt={`QR Code for ${event.name}`} className="qr-code-img" />
              </div>
              <p className="qr-hint">
                Scan with any smartphone camera to open the public gallery.
              </p>
            </div>
          )}

          {/* Public Link Section */}
          <div className="public-url-box mt-4">
            <label className="input-label text-left">Public Gallery Link</label>
            <div className="url-copy-group">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="form-input readonly-input"
              />
              <button
                type="button"
                className={`btn ${copied ? 'btn-success' : 'btn-secondary'} btn-copy`}
                onClick={handleCopyUrl}
                title="Copy public URL"
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer justify-between">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm flex items-center gap-1"
          >
            <ExternalLink size={16} />
            Preview Public Page
          </a>

          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDownloadQr}
              disabled={!qrDataUrl || isLoading}
            >
              <Download size={16} />
              Download QR (PNG)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrCodeModal;
