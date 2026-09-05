import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, Lock, Mail, User, AlertCircle, ArrowRight, Loader } from 'lucide-react';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/photographer/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Register photographer
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      // 2. Automatically log them in for a seamless experience
      try {
        await login(email.trim(), password);
        navigate('/photographer/dashboard', { replace: true });
      } catch (loginErr) {
        // Fallback to login page if auto-login fails
        navigate('/login', { state: { registered: true } });
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
          <h1 className="auth-title">Create Photographer Account</h1>
          <p className="auth-subtitle">Host your events, upload high-res photos, and generate instant QR guest galleries</p>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name
            </label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="e.g. Alex Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

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
            <label className="form-label" htmlFor="password">
              Password (min. 6 characters)
            </label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
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
                Creating Account...
              </>
            ) : (
              <>
                <span>Register</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
