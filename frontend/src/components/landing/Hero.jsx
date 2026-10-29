import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Hero = () => {
  const { isAuthenticated } = useAuth();
  const dashboardLink = isAuthenticated ? '/photographer/dashboard' : '/login';

  return (
    <section className="lp-hero-section">
      <div className="lp-hero-grid">
        {/* Left Column: Heading & Content */}
        <div className="lp-hero-content">
          <div className="lp-hero-eyebrow">
            <span className="lp-eyebrow-dot"></span>
            <span>PRIVATE PHOTO DISCOVERY FOR EVERY EVENT</span>
          </div>

          <h1 className="lp-hero-title">
            Every<br />
            moment<br />
            you were <span className="lp-accent-italic">in.</span>
          </h1>

          <p className="lp-hero-subtitle">
            PhotoDay finds the photographs that matter to each guest—without
            making anyone scroll through hundreds that don't.
          </p>

          <div className="lp-hero-actions">
            <Link to={dashboardLink} className="lp-btn-primary">
              <span>Open dashboard</span>
              <ArrowUpRight size={17} strokeWidth={2.2} />
            </Link>
            <a href="#how-it-works" className="lp-btn-secondary">
              See how it works
            </a>
          </div>

          <div className="lp-hero-trust">
            <span>NO APP FOR GUESTS</span>
            <span className="lp-trust-bullet">•</span>
            <span>ONE SELFIE</span>
            <span className="lp-trust-bullet">•</span>
            <span>PRIVATE BY EVENT</span>
          </div>
        </div>

        {/* Right Column: Arched Image Card with Floating Notification */}
        <div className="lp-hero-visual">
          <div className="lp-arch-card-wrapper">
            <div className="lp-arch-frame">
              <img
                src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85"
                alt="Bride holding elegant wedding bouquet at sunset"
                className="lp-arch-image"
                loading="eager"
              />
            </div>

            {/* Floating Notification Badge */}
            <div className="lp-floating-pill">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
                alt="Guest Selfie Avatar"
                className="lp-pill-avatar"
              />
              <div className="lp-pill-text">
                <span className="lp-pill-title">18 moments found</span>
                <span className="lp-pill-subtitle">Your private event gallery</span>
              </div>
              <div className="lp-pill-check">
                <Check size={13} strokeWidth={3} />
              </div>
            </div>
          </div>

          {/* Subtle Editorial Caption */}
          <div className="lp-hero-caption lp-serif-italic">
            A thousand photographs.<br />
            The right ones, instantly.
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
