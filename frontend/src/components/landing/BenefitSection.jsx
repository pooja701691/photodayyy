import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BenefitSection = () => {
  const { isAuthenticated } = useAuth();
  const dashboardLink = isAuthenticated ? '/photographer/dashboard' : '/login';

  return (
    <section id="for-organizers" className="lp-benefit-section">
      <div className="lp-benefit-grid">
        {/* Left Column: Arched Wedding Banquet Photo */}
        <div className="lp-benefit-visual">
          <div className="lp-benefit-arch">
            <img
              src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85"
              alt="Elegant wedding reception banquet table with flowers"
              className="lp-benefit-image"
              loading="lazy"
            />
          </div>
        </div>

        {/* Right Column: Editorial Text */}
        <div className="lp-benefit-content">
          <div className="lp-benefit-eyebrow">FOR ORGANIZERS</div>
          <h2 className="lp-benefit-title">
            More time in<br />
            the moment.<br />
            Less time<br />
            sending files.
          </h2>

          <p className="lp-benefit-desc">
            Photographers and event hosts spend countless hours manually sorting albums,
            creating shared links, and answering messages from guests searching for their pictures.
            PhotoDay automates discovery with privacy-first AI face matching, so you deliver a
            VIP experience without the manual headache.
          </p>

          <Link to={dashboardLink} className="lp-btn-primary">
            <span>See how it works</span>
            <ArrowUpRight size={17} strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BenefitSection;
