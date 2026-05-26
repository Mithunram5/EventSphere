import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center text-center px-4 font-sans">
      <span className="text-6xl mb-4">🔍</span>
      <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white sm:text-5xl">404 - Page Not Found</h1>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
        Sorry, the page you are looking for does not exist or has been relocated to another path.
      </p>
      <Link to="/" className="mt-8 gradient-btn rounded-xl px-5 py-3 text-sm">
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFound;
