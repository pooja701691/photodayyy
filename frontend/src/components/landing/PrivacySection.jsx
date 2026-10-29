import React from 'react';
import { ShieldCheck, EyeOff, Lock } from 'lucide-react';

export const PrivacySection = () => {
  return (
    <section id="privacy" className="lp-privacy-section">
      <div className="lp-privacy-container">
        <div className="lp-privacy-header">
          <div className="lp-how-eyebrow">PRIVACY BY DESIGN</div>
          <h2 className="lp-privacy-title">Safe by default. Private for every guest.</h2>
        </div>

        <div className="lp-privacy-grid">
          <div className="lp-privacy-card">
            <div className="lp-privacy-icon">
              <ShieldCheck size={24} strokeWidth={2} />
            </div>
            <h3 className="lp-privacy-card-title">Event-Isolated Vectors</h3>
            <p className="lp-privacy-card-desc">
              Facial embeddings are indexed strictly inside the target event collection. No cross-event tracking or global facial databases.
            </p>
          </div>

          <div className="lp-privacy-card">
            <div className="lp-privacy-icon">
              <EyeOff size={24} strokeWidth={2} />
            </div>
            <h3 className="lp-privacy-card-title">In-Memory Matching</h3>
            <p className="lp-privacy-card-desc">
              Guest selfies are vectorized in memory to run the similarity query and are never stored publicly or shared with third parties.
            </p>
          </div>

          <div className="lp-privacy-card">
            <div className="lp-privacy-icon">
              <Lock size={24} strokeWidth={2} />
            </div>
            <h3 className="lp-privacy-card-title">Host Privacy Controls</h3>
            <p className="lp-privacy-card-desc">
              Organizers retain total control to toggle event galleries between public discovery and private mode with a single click.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrivacySection;
