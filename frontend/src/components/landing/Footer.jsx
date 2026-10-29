import React from 'react';
import { Link } from 'react-router-dom';
import { Camera } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-container">
        <Link to="/" className="lp-logo-link">
          <div className="lp-logo-badge">
            <Camera size={18} strokeWidth={2.2} />
          </div>
          <span>PhotoDay</span>
        </Link>

        <div className="lp-footer-links">
          <a href="#how-it-works" className="lp-footer-link">How it works</a>
          <a href="#for-organizers" className="lp-footer-link">For organizers</a>
          <a href="#privacy" className="lp-footer-link">Privacy</a>
          <Link to="/login" className="lp-footer-link">Photographer Login</Link>
          <Link to="/register" className="lp-footer-link">Create Account</Link>
        </div>

        <div className="lp-footer-copyright">
          © {new Date().getFullYear()} PhotoDay. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
