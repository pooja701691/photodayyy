import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const FinalCTA = () => {
  const { isAuthenticated } = useAuth();
  const dashboardLink = isAuthenticated ? '/photographer/dashboard' : '/login';

  return (
    <section className="lp-cta-section">
      <div className="lp-cta-card">
        <h2 className="lp-cta-title">
          Every moment<br />
          you were <span className="lp-accent-italic">in.</span>
        </h2>
        <p className="lp-cta-subtitle">
          Join photographers and hosts delivering instant, effortless private galleries to every event guest.
        </p>

        <div className="lp-cta-actions">
          <Link to={dashboardLink} className="lp-btn-primary">
            <span>Open dashboard</span>
            <ArrowUpRight size={17} strokeWidth={2.2} />
          </Link>
          <Link to="/login" className="lp-btn-cta-secondary">
            Photographer Login
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
