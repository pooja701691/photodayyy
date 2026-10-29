import React from 'react';
import { Image, QrCode, ScanFace } from 'lucide-react';

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="lp-how-section">
      {/* Section Header */}
      <div className="lp-how-header">
        <div>
          <div className="lp-how-eyebrow">A SIMPLER WAY TO SHARE</div>
          <h2 className="lp-how-title">
            From camera roll to<br />
            <span className="lp-accent-italic">their</span> camera roll.
          </h2>
        </div>
        <div>
          <p className="lp-how-desc">
            One thoughtful workflow for organizers, photographers, and every guest
            who wants the moments they were part of.
          </p>
        </div>
      </div>

      {/* 3 Step Cards */}
      <div className="lp-how-grid">
        {/* Step 1 */}
        <div className="lp-step-card">
          <div className="lp-step-number">01</div>
          <div className="lp-step-icon-wrap outline">
            <Image size={24} strokeWidth={1.8} />
          </div>
          <h3 className="lp-step-title">Upload the event</h3>
          <p className="lp-step-desc">
            Add the photographs once. PhotoDay quietly prepares each face for private discovery.
          </p>
        </div>

        {/* Step 2 */}
        <div className="lp-step-card">
          <div className="lp-step-number">02</div>
          <div className="lp-step-icon-wrap solid">
            <QrCode size={24} strokeWidth={2} />
          </div>
          <h3 className="lp-step-title">Place one QR</h3>
          <p className="lp-step-desc">
            Guests scan a beautiful event link and continue through the PhotoDay gallery.
          </p>
        </div>

        {/* Step 3 */}
        <div className="lp-step-card">
          <div className="lp-step-number">03</div>
          <div className="lp-step-icon-wrap outline">
            <ScanFace size={24} strokeWidth={1.8} />
          </div>
          <h3 className="lp-step-title">Send one selfie</h3>
          <p className="lp-step-desc">
            A clear selfie becomes a private key to their matching photographs—not anyone else's.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
