import React from 'react';

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-2">
            <span className="gradient-bg flex h-7 w-7 items-center justify-center rounded-lg text-white font-extrabold text-xs shadow-md">
              ES
            </span>
            <span className="font-sans text-md font-bold tracking-tight text-slate-800 dark:text-white">
              Event<span className="gradient-text">Sphere</span>
            </span>
          </div>

          {/* Slogan */}
          <p className="text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
            Designed & Built with ❤️ for the Hackathon. 🚀
          </p>

          {/* Project Details */}
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} EventSphere. Open Source.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
