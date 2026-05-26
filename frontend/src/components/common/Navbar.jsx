import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import api from '../../utils/api';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Fetch user notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 45 seconds for a dynamic feel
    let interval;
    if (user) {
      interval = setInterval(fetchNotifications, 45000);
    }
    return () => clearInterval(interval);
  }, [user]);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await api.put(`/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications(prev =>
          prev.map(n => (n._id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          {/* Logo & Links */}
          <div className="flex">
            <Link to="/" className="flex shrink-0 items-center gap-2">
              <span className="gradient-bg flex h-9 w-9 items-center justify-center rounded-xl text-white font-extrabold shadow-md">
                ES
              </span>
              <span className="font-sans text-xl font-bold tracking-tight text-slate-800 dark:text-white">
                Event<span className="gradient-text">Sphere</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:ml-8 md:flex md:space-x-4 md:items-center">
              <Link
                to="/"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400'
                    : 'text-slate-600 hover:text-brand-500 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                Home
              </Link>
              <Link
                to="/events"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/events')
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400'
                    : 'text-slate-600 hover:text-brand-500 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                Browse Events
              </Link>

              {user && user.role === 'attendee' && (
                <>
                  <Link
                    to="/wishlist"
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive('/wishlist')
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400'
                        : 'text-slate-600 hover:text-brand-500 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    Wishlist
                  </Link>
                  <Link
                    to="/tickets"
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive('/tickets')
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400'
                        : 'text-slate-600 hover:text-brand-500 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    My Tickets
                  </Link>
                </>
              )}

              {user && user.role === 'organiser' && (
                <Link
                  to="/organiser-dashboard"
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive('/organiser-dashboard')
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400'
                      : 'text-slate-600 hover:text-brand-500 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  Organiser Panel
                </Link>
              )}

              {user && user.role === 'admin' && (
                <Link
                  to="/admin-dashboard"
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive('/admin-dashboard')
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400'
                      : 'text-slate-600 hover:text-brand-500 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </div>

          {/* Right Actions (Theme, Notification, Profile) */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Notification Bell Dropdown */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
                      <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">Alerts & Messages</span>
                      {unreadCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 font-medium">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">No updates or messages.</div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => handleMarkAsRead(notif._id)}
                            className={`p-3 text-xs border-b border-slate-100 dark:border-slate-800/40 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                              !notif.read ? 'bg-brand-50/30 dark:bg-brand-950/10 font-medium' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start gap-1">
                              <span className="text-slate-700 dark:text-slate-200">{notif.title}</span>
                              {!notif.read && (
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500 mt-1" />
                              )}
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 text-[11px] leading-relaxed">
                              {notif.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Dropdown */}
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                    />
                  ) : (
                    <div className="gradient-bg flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden z-50">
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-800/10">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                      >
                        My Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login?register=true"
                  className="gradient-btn rounded-lg px-3.5 py-1.5 text-sm font-semibold"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Icon */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                {mobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Options */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-200">
          <div className="space-y-1 px-2 pb-3 pt-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Home
            </Link>
            <Link
              to="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Browse Events
            </Link>

            {user && user.role === 'attendee' && (
              <>
                <Link
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Wishlist
                </Link>
                <Link
                  to="/tickets"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  My Tickets
                </Link>
              </>
            )}

            {user && user.role === 'organiser' && (
              <Link
                to="/organiser-dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Organiser Panel
              </Link>
            )}

            {user && user.role === 'admin' && (
              <Link
                to="/admin-dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Admin Panel
              </Link>
            )}

            {!user ? (
              <div className="mt-4 flex flex-col gap-2 px-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex justify-center rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/login?register=true"
                  onClick={() => setMobileMenuOpen(false)}
                  className="gradient-btn flex justify-center rounded-lg px-4 py-2 text-sm font-semibold"
                >
                  Register
                </Link>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="mt-4 flex w-full justify-center rounded-lg bg-red-50 dark:bg-red-950/20 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
