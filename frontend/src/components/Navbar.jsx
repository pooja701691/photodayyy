import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, Calendar, LayoutDashboard, LogOut, User } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to={isAuthenticated ? '/photographer/dashboard' : '/'} className="nav-brand">
          <div className="brand-icon">
            <Camera size={22} className="text-primary" />
          </div>
          <span className="brand-name">Photo<span className="text-gradient">-Dey</span></span>
        </Link>

        {isAuthenticated && (
          <div className="nav-links">
            <NavLink
              to="/photographer/dashboard"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/photographer/events"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Calendar size={18} />
              <span>My Events</span>
            </NavLink>
          </div>
        )}

        <div className="nav-right">
          {isAuthenticated ? (
            <div className="user-profile-menu">
              <div className="user-badge" title={user?.email}>
                <div className="avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
                </div>
                <div className="user-info">
                  <span className="user-name">{user?.name}</span>
                  <span className="user-role">{user?.role || 'Photographer'}</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="btn-icon-logout"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={18} />
                <span className="logout-text">Logout</span>
              </button>
            </div>
          ) : (
            <div className="guest-nav-actions">
              <Link to="/login" className="btn btn-secondary btn-sm">
                Photographer Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
