import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, Lock, Mail, AlertCircle, ArrowRight, Loader, CheckCircle } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/photographer/dashboard';

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (isAuthenticated) {
      navigate('/photographer/dashboard', { replace: true });
    }

    // Check if redirected due to expired session
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('expired') === 'true') {
      setNotice('Your session has expired. Please log in again.');
    } else if (location.state?.registered) {
      setNotice('Registration successful! Please log in with your credentials.');
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!email.trim() || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-container">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-brand-logo">
            <Camera size={32} className="text-primary" />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Log in to manage your events, photos, and client galleries</p>
        </div>

        {notice && (
          <div className="alert alert-info mb-4">
            <CheckCircle size={18} />
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="photographer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="password">
                Password
              </label>
            </div>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader size={18} className="spinner-icon" />
                Signing in...
              </>
            ) : (
              <>
                <span>Login</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
