import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import EventCard from '../components/events/EventCard';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import api from '../utils/api';

const CATEGORIES = [
  { name: 'Tech', icon: '💻', count: '12+ Events' },
  { name: 'Music', icon: '🎵', count: '8+ Events' },
  { name: 'Sports', icon: '⚽', count: '5+ Events' },
  { name: 'Arts', icon: '🎨', count: '6+ Events' },
  { name: 'Food', icon: '🍔', count: '4+ Events' },
  { name: 'Business', icon: '📈', count: '10+ Events' },
];

const Home = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [aiRecs, setAiRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigate = useNavigate();

  // Fetch events & wishlist
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get general events
        const eventRes = await api.get('/events');
        if (eventRes.data.success) {
          // Slice top 3 for featured events
          setEvents(eventRes.data.events.slice(0, 3));
        }

        // Get user wishlist if attendee
        if (user && user.role === 'attendee') {
          const wishRes = await api.get('/wishlist');
          if (wishRes.data.success) {
            setWishlistIds(wishRes.data.wishlist.map(w => w.event?._id));
          }
        }
      } catch (err) {
        console.error('Home Page Loading Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Fetch AI Recommendations (requires user login)
  useEffect(() => {
    const fetchAIRecommendations = async () => {
      if (!user || user.role !== 'attendee') return;
      try {
        setLoadingRecs(true);
        const recRes = await api.get('/ai/recommendations');
        if (recRes.data.success) {
          setAiRecs(recRes.data.recommendations.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load AI Recommendations:', err);
      } finally {
        setLoadingRecs(false);
      }
    };

    fetchAIRecommendations();
  }, [user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/events');
    }
  };

  const handleWishlistToggle = async (eventId) => {
    if (!user) {
      toast.error('Please log in to wishlist events!');
      navigate('/login');
      return;
    }

    try {
      const res = await api.post('/wishlist/toggle', { eventId });
      if (res.data.success) {
        if (res.data.isWishlisted) {
          setWishlistIds((prev) => [...prev, eventId]);
          toast.success('Event saved to wishlist!');
        } else {
          setWishlistIds((prev) => prev.filter((id) => id !== eventId));
          toast.success('Event removed from wishlist!');
        }
      }
    } catch (error) {
      toast.error('Wishlist action failed.');
    }
  };

  return (
    <div className="space-y-16 pb-16 font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-brand-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-accent-500/10 blur-[120px]" />

        <div className="relative mx-auto max-w-5xl text-center space-y-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-extrabold sm:text-6xl tracking-tight leading-none"
          >
            Discover and Book <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-accent-400">
              Unforgettable Experiences
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mx-auto max-w-2xl text-slate-300 text-md sm:text-lg font-medium"
          >
            EventSphere is the premier end-to-end management and ticketing platform for attendees, organisers, and modern technology conferences.
          </motion.p>

          {/* Search Bar Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            onSubmit={handleSearchSubmit}
            className="mx-auto flex max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-700/30 p-1.5 shadow-xl"
          >
            <input
              type="text"
              placeholder="Search events, topics, or venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-0 bg-transparent px-4 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0"
            />
            <button
              type="submit"
              className="gradient-btn shrink-0 rounded-xl px-6 py-3 text-sm font-bold"
            >
              Search
            </button>
          </motion.form>
        </div>
      </section>

      {/* Category Shortcut Sections */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-2 md:flex-row md:items-end mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Categories</p>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Explore by Interest</h2>
          </div>
          <Link
            to="/events"
            className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500"
          >
            View All Categories →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat, idx) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(`/events?category=${cat.name}`)}
              className="group cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-center transition-all duration-300 hover:shadow-md hover:border-brand-500 dark:hover:border-accent-500"
            >
              <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform duration-200">{cat.icon}</span>
              <h4 className="font-bold text-sm text-slate-800 dark:text-white group-hover:text-brand-500 transition-colors">
                {cat.name}
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">
                {cat.count}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Recommendations (Attendee Exclusive) */}
      {user && user.role === 'attendee' && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-8">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
              ✨ Gemini AI
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Recommended For You</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Based on your wishlist preferences and registrations</p>
            </div>
          </div>

          {loadingRecs ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : aiRecs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
              <span className="text-2xl mb-2 block">🎯</span>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Recommendations Yet</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Add events to your wishlist or make a registration to help Gemini tailor matching events.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {aiRecs.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  isWishlisted={wishlistIds.includes(event._id)}
                  onWishlistToggle={handleWishlistToggle}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Featured Events List */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-end mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Featured</p>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Upcoming Events</h2>
          </div>
          <Link
            to="/events"
            className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500"
          >
            Browse All Events →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-3xl mb-2 block">📅</span>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No events scheduled. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                isWishlisted={wishlistIds.includes(event._id)}
                onWishlistToggle={handleWishlistToggle}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
