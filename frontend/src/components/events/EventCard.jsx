import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';

const EventCard = ({ event, isWishlisted, onWishlistToggle }) => {
  const { user } = useContext(AuthContext);

  // Format date
  const eventDate = new Date(event.dateTime).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const eventTime = new Date(event.dateTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate price description
  const prices = event.ticketTypes.map((t) => t.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceText =
    minPrice === 0 && maxPrice === 0
      ? 'Free'
      : minPrice === maxPrice
      ? `₹${minPrice}`
      : `₹${minPrice} - ₹${maxPrice}`;

  // Image upload URL fallback logic
  const imageUrl = event.bannerImage.startsWith('http')
    ? event.bannerImage
    : event.bannerImage !== ''
    ? `http://localhost:5000${event.bannerImage}`
    : `https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=600`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-md glow-effect"
    >
      {/* Banner Image */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={imageUrl}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=600';
          }}
        />
        {/* Category Tag */}
        <span className="absolute top-3 left-3 rounded-full bg-white/95 dark:bg-slate-900/95 px-2.5 py-1 text-xs font-semibold tracking-wide text-brand-600 dark:text-brand-400 shadow-sm">
          {event.category}
        </span>

        {/* Wishlist Heart Icon (Visible only to attendees) */}
        {(!user || user.role === 'attendee') && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onWishlistToggle) onWishlistToggle(event._id);
            }}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/95 shadow-sm text-slate-400 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
          >
            <svg
              className={`h-5.5 w-5.5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'stroke-current fill-none'}`}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Details */}
      <Link to={`/events/${event._id}`} className="block p-5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1.5">
          <span>{eventDate}</span>
          <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span>{eventTime}</span>
        </div>

        <h3 className="line-clamp-1 font-sans text-lg font-bold text-slate-800 dark:text-white group-hover:text-brand-500 transition-colors">
          {event.title}
        </h3>

        <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 h-8 leading-normal">
          {event.description}
        </p>

        {/* Location & Ticket Price */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-4">
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 truncate max-w-[60%]">
            <svg className="h-4 w-4 text-slate-400 mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{event.city}</span>
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Tickets</p>
            <span className="text-sm font-bold text-slate-800 dark:text-white">
              {priceText}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default EventCard;
