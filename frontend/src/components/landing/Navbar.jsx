import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, ArrowUpRight, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <nav className="lp-navbar">
      <div className="lp-nav-container">
        {/* Brand */}
        <Link to="/" className="lp-logo-link">
          <div className="lp-logo-badge">
            <Camera size={20} strokeWidth={2.2} />
          </div>
          <span>PhotoDay</span>
        </Link>

        {/* Center Links */}
        <div className="lp-nav-links">
          <a href="#how-it-works" className="lp-nav-link">How it works</a>
          <a href="#for-organizers" className="lp-nav-link">For organizers</a>
          <a href="#privacy" className="lp-nav-link">Privacy</a>
        </div>

        {/* Right Actions */}
        <div className="lp-nav-right">
          <Link to={isAuthenticated ? '/photographer/dashboard' : '/login'} className="lp-nav-account">
            Account
          </Link>
          <Link to={isAuthenticated ? '/photographer/dashboard' : '/login'} className="lp-btn-dashboard">
            <span>Dashboard</span>
            <ArrowUpRight size={15} strokeWidth={2.2} />
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            className="lp-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Menu */}
      {mobileMenuOpen && (
        <div className="lp-mobile-menu">
          <div className="lp-mobile-nav-list">
            <a
              href="#how-it-works"
              className="lp-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              How it works
            </a>
            <a
              href="#for-organizers"
              className="lp-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              For organizers
            </a>
            <a
              href="#privacy"
              className="lp-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Privacy
            </a>
            <Link
              to={isAuthenticated ? '/photographer/dashboard' : '/login'}
              className="lp-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Account
            </Link>
            <Link
              to={isAuthenticated ? '/photographer/dashboard' : '/login'}
              className="lp-btn-dashboard"
              style={{ justifyContent: 'center', marginTop: '8px' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Dashboard</span>
              <ArrowUpRight size={15} strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
