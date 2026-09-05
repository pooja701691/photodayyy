import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Camera,
  LayoutGrid,
  Layers,
  ShieldCheck,
  Calendar,
  LogOut,
  User as UserIcon,
  Sparkles
} from 'lucide-react';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determine if Events or Event detail is active
  const isEventsActive = location.pathname.startsWith('/photographer/events');

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand-wrapper">
        <div className="sidebar-brand-badge">
          <div className="sidebar-logo-icon">
            <Camera size={18} className="text-primary" />
          </div>
          <span className="sidebar-brand-name">PhotoDey</span>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="sidebar-nav-section">
        <span className="sidebar-eyebrow">WORKSPACE</span>

        <nav className="sidebar-nav-menu">
          <NavLink
            to="/photographer/dashboard"
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <LayoutGrid size={18} className="nav-icon" />
            <span className="nav-label">Overview</span>
          </NavLink>

          <NavLink
            to="/photographer/events"
            className={`sidebar-nav-item ${isEventsActive ? 'active' : ''}`}
          >
            <Layers size={18} className="nav-icon" />
            <span className="nav-label">Events</span>
          </NavLink>

          <div className="sidebar-nav-item disabled" title="Account Settings">
            <ShieldCheck size={18} className="nav-icon" />
            <span className="nav-label">Account & security</span>
          </div>
        </nav>
      </div>

      {/* Promo / Next Event Card */}
      <div className="sidebar-bottom-section">
        <div
          className="sidebar-promo-card"
          onClick={() => navigate('/photographer/events?create=true')}
          role="button"
          tabIndex={0}
        >
          <div className="promo-icon-wrapper">
            <Calendar size={18} className="text-primary" />
          </div>
          <h4 className="promo-title">Ready for the next event?</h4>
          <p className="promo-subtitle">
            Upload photographs and share one public QR.
          </p>
        </div>

        {/* User Profile Bar */}
        <div className="sidebar-user-card">
          <div className="user-avatar-circle">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
          </div>
          <div className="user-text-details">
            <span className="user-display-name">{user?.name || 'Photographer'}</span>
            <span className="user-display-email" title={user?.email}>
              {user?.email || 'photographer@example.com'}
            </span>
          </div>
          <button
            type="button"
            className="btn-sidebar-logout"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
