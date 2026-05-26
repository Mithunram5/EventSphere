import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import EventCard from '../components/events/EventCard';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import api from '../utils/api';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await api.get('/wishlist');
      if (res.data.success) {
        setWishlist(res.data.wishlist);
      }
    } catch (err) {
      toast.error('Failed to load wishlist items.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleWishlistToggle = async (eventId) => {
    try {
      const res = await api.post('/wishlist/toggle', { eventId });
      if (res.data.success) {
        // Toggle deletes it on this page, so remove immediately
        setWishlist((prev) => prev.filter((item) => item.event?._id !== eventId));
        toast.success('Removed from wishlist successfully.');
      }
    } catch (error) {
      toast.error('Failed to update wishlist.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 font-sans pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Saved Wishlist</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Your bookmarked conferences, meetups, and summits.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : wishlist.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-16 text-center">
          <span className="text-4xl mb-4 block">💖</span>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Your Wishlist is Empty</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-6">
            Bookmark interesting events by clicking the heart button on cards.
          </p>
          <Link
            to="/events"
            className="gradient-btn rounded-xl px-5 py-2.5 text-xs font-bold"
          >
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {wishlist.map((item) => (
            item.event && (
              <EventCard
                key={item.event._id}
                event={item.event}
                isWishlisted={true}
                onWishlistToggle={handleWishlistToggle}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
