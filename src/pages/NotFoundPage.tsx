import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12">
      <h1 className="text-6xl font-bold text-blue-600">404</h1>
      <h2 className="mt-4 text-3xl font-semibold text-gray-900">Page Not Found</h2>
      <p className="mt-2 text-lg text-gray-600">The page you're looking for doesn't exist or has been moved.</p>
      <Link 
        to="/" 
        className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
};

export default NotFoundPage;