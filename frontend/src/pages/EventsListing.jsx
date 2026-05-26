import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import FilterSidebar from '../components/events/FilterSidebar';
import EventCard from '../components/events/EventCard';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import api from '../utils/api';

const EventsListing = () => {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState([]);

  // Initialize filters from URL parameters if present
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || 'All',
    city: searchParams.get('city') || 'All',
    pricing: searchParams.get('pricing') || 'All',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
  });

  // Sync state filters back to URL parameters
  useEffect(() => {
    const activeParams = {};
    Object.keys(filters).forEach((key) => {
      if (filters[key] && filters[key] !== 'All') {
        activeParams[key] = filters[key];
      }
    });
    setSearchParams(activeParams);
  }, [filters, setSearchParams]);

  // Fetch events based on current filters
  const fetchFilteredEvents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category !== 'All') queryParams.append('category', filters.category);
      if (filters.city !== 'All') queryParams.append('city', filters.city);
      if (filters.pricing !== 'All') queryParams.append('pricing', filters.pricing);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const res = await api.get(`/events?${queryParams.toString()}`);
      if (res.data.success) {
        setEvents(res.data.events);
      }
    } catch (err) {
      toast.error('Failed to load events. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendee wishlist
  const fetchWishlist = async () => {
    if (!user || user.role !== 'attendee') return;
    try {
      const res = await api.get('/wishlist');
      if (res.data.success) {
        setWishlistIds(res.data.wishlist.map((item) => item.event?._id));
      }
    } catch (err) {
      console.error('Error loading wishlist:', err);
    }
  };

  useEffect(() => {
    fetchFilteredEvents();
  }, [filters]);

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'All',
      city: 'All',
      pricing: 'All',
      startDate: '',
      endDate: '',
    });
    setSearchParams({});
  };

  const handleWishlistToggle = async (eventId) => {
    if (!user) {
      toast.error('Please log in to wishlist events!');
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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Explore Events</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Search for conferences, concerts, meetups, and workshops happening around the country.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Sidebar */}
        <div className="lg:col-span-1">
          <FilterSidebar
            filters={filters}
            setFilters={setFilters}
            clearFilters={clearFilters}
          />
        </div>

        {/* Right Event Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Direct Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search event title, description or keyword..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 pl-11 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
            />
            <svg
              className="absolute left-4 top-3.5 h-5 w-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-16 text-center">
              <span className="text-4xl mb-4 block">🔍</span>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Events Found</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-6">
                We couldn't find any events matching your selected filter parameters.
              </p>
              <button
                onClick={clearFilters}
                className="gradient-btn rounded-xl px-5 py-2.5 text-xs font-bold"
              >
                Clear Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </div>
      </div>
    </div>
  );
};

export default EventsListing;
