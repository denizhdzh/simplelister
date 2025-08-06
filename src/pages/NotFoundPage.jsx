import React from 'react';
import { Link } from 'react-router-dom';
import { SmileyXEyes } from '@phosphor-icons/react'; // Optional: Add an icon

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-gray-50 dark:bg-gray-900">
      <SmileyXEyes size={64} className="text-gray-400 dark:text-gray-500 mb-4" />
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">404 - Page Not Found</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
        Oops! The page you are looking for does not exist.
      </p>
      <Link 
        to="/"
        className="px-6 py-2 bg-black dark:bg-gray-700 text-white dark:text-gray-100 rounded-md hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
      >
        Go Back Home
      </Link>
    </div>
  );
}

export default NotFoundPage; 