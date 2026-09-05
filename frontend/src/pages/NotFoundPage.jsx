import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="flex-center full-page-center">
      <div className="empty-state-card max-w-md text-center">
        <div className="empty-icon-circle">
          <Camera size={44} className="text-muted" />
        </div>
        <h1 className="text-3xl font-bold mt-4">404</h1>
        <h2 className="text-xl font-semibold mt-1">Page Not Found</h2>
        <p className="text-muted mt-2">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="btn btn-primary">
            <Home size={16} />
            <span>Go to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
