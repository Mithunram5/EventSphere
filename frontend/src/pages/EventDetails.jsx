import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Ticket Booking selection states
  const [selectedTicketType, setSelectedTicketType] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Review form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hasBoughtTicket, setHasBoughtTicket] = useState(false);

  const fetchEventAndReviews = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Event
      const eventRes = await api.get(`/events/${id}`);
      if (eventRes.data.success) {
        const ev = eventRes.data.event;
        setEvent(ev);
        // Pre-select first available ticket type
        if (ev.ticketTypes && ev.ticketTypes.length > 0) {
          setSelectedTicketType(ev.ticketTypes[0].name);
        }
      }

      // 2. Fetch Reviews
      const reviewsRes = await api.get(`/reviews/event/${id}`);
      if (reviewsRes.data.success) {
        setReviews(reviewsRes.data.reviews);
      }

      // 3. Fetch User Wishlist & Check Purchase eligibility
      if (user && user.role === 'attendee') {
        const wishRes = await api.get('/wishlist');
        if (wishRes.data.success) {
          setWishlistIds(wishRes.data.wishlist.map(w => w.event?._id));
        }

        // Verify if user bought a ticket to show review form
        const ticketRes = await api.get('/bookings/my-tickets');
        if (ticketRes.data.success) {
          const bought = ticketRes.data.tickets.some(t => t.event?._id === id);
          setHasBoughtTicket(bought);
        }
      }
    } catch (err) {
      toast.error('Failed to load event details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventAndReviews();
  }, [id, user]);

  const handleWishlistToggle = async () => {
    if (!user) {
      toast.error('Please log in to wishlist events!');
      navigate('/login');
      return;
    }

    try {
      const res = await api.post('/wishlist/toggle', { eventId: id });
      if (res.data.success) {
        if (res.data.isWishlisted) {
          setWishlistIds(prev => [...prev, id]);
          toast.success('Event saved to wishlist!');
        } else {
          setWishlistIds(prev => prev.filter(wishId => wishId !== id));
          toast.success('Event removed from wishlist!');
        }
      }
    } catch (error) {
      toast.error('Wishlist action failed.');
    }
  };

  const handleProceedCheckout = () => {
    if (!user) {
      toast.error('Please log in to buy tickets!');
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } });
      return;
    }

    if (user.role !== 'attendee') {
      toast.error('Only attendees can purchase tickets.');
      return;
    }

    if (!selectedTicketType) {
      toast.error('Please select a ticket type.');
      return;
    }

    navigate(
      `/checkout?eventId=${id}&ticketType=${encodeURIComponent(
        selectedTicketType
      )}&quantity=${selectedQuantity}`
    );
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Review comment cannot be empty!');
      return;
    }

    setReviewLoading(true);
    try {
      const res = await api.post('/reviews', {
        eventId: id,
        rating,
        comment,
      });

      if (res.data.success) {
        toast.success('Review posted successfully!');
        setComment('');
        setRating(5);
        // Refresh reviews list
        const reviewsRes = await api.get(`/reviews/event/${id}`);
        if (reviewsRes.data.success) {
          setReviews(reviewsRes.data.reviews);
        }
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to post review.';
      toast.error(msg);
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading event Details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20 bg-slate-50 dark:bg-slate-950 h-[80vh] flex flex-col justify-center items-center">
        <span className="text-4xl mb-4">⚠️</span>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Event Not Found</h3>
        <Link to="/events" className="mt-4 gradient-btn rounded-xl px-5 py-2.5 text-sm">
          Back to Listings
        </Link>
      </div>
    );
  }

  // Formatting date/time variables
  const formattedDate = new Date(event.dateTime).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = new Date(event.dateTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const selectedTicketObj = event.ticketTypes.find((t) => t.name === selectedTicketType);
  const isSoldOut = event.totalAvailable === 0;

  const isWishlisted = wishlistIds.includes(id);

  // Image upload URL fallback logic
  const bannerUrl = event.bannerImage.startsWith('http')
    ? event.bannerImage
    : event.bannerImage !== ''
    ? `http://localhost:5000${event.bannerImage}`
    : `https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 font-sans space-y-10 pb-20">
      {/* Banner & Cover */}
      <div className="relative h-64 md:h-[400px] w-full overflow-hidden rounded-3xl shadow-md bg-slate-200 dark:bg-slate-800">
        <img
          src={bannerUrl}
          alt={event.title}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
        
        {/* Banner Details */}
        <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4 text-white">
          <div className="space-y-2">
            <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              {event.category}
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">{event.title}</h1>
          </div>
          
          {(!user || user.role === 'attendee') && (
            <button
              onClick={handleWishlistToggle}
              className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all self-start md:self-auto"
            >
              <svg
                className={`h-4.5 w-4.5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'stroke-current fill-none'}`}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {isWishlisted ? 'Saved' : 'Wishlist'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Event Specs & Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Metadata Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col sm:flex-row gap-6 justify-between transition-colors duration-200">
            {/* Date Info */}
            <div className="flex gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-950/40 dark:text-brand-400 shrink-0">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Date and Time</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formattedDate}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-semibold">{formattedTime}</p>
              </div>
            </div>

            {/* Venue Info */}
            <div className="flex gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent-500 dark:bg-accent-950/20 dark:text-accent-400 shrink-0">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Location Venue</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{event.venue}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-semibold">{event.city}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">About the Event</h2>
            <div className="prose dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {event.description}
            </div>
          </div>

          {/* Schedule Plan (If added) */}
          {event.schedule && event.schedule.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Event Schedule Sessions</h2>
              <div className="relative border-l-2 border-brand-200 dark:border-brand-800 pl-6 ml-3 space-y-6">
                {event.schedule.map((item, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 ring-4 ring-white dark:ring-slate-900" />
                    <p className="text-xs font-bold text-brand-600 dark:text-brand-400">{item.timeSlot}</p>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{item.sessionTitle}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Speaker: <span className="font-semibold">{item.speaker || 'TBA'}</span> • {item.duration} minutes
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Organiser Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors duration-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
              Organised By
            </h3>
            <div className="flex items-start gap-4">
              {event.organiser?.profileImage ? (
                <img
                  src={event.organiser.profileImage}
                  alt={event.organiser.name}
                  className="h-12 w-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="gradient-bg flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white shadow-sm shrink-0">
                  {event.organiser?.name?.charAt(0).toUpperCase() || 'O'}
                </div>
              )}
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 dark:text-white">{event.organiser?.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {event.organiser?.bio || 'Experienced Event Organiser dedicated to bringing you the best summits and workshop conferences.'}
                </p>
              </div>
            </div>
          </div>

          {/* Reviews Module */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Attendee Reviews ({reviews.length})</h2>
            
            {/* List Reviews */}
            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  No reviews posted yet. Be the first to leave your feedback!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev._id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {rev.user?.profileImage ? (
                          <img
                            src={rev.user.profileImage}
                            alt={rev.user.name}
                            className="h-8 w-8 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="gradient-bg flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm">
                            {rev.user?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white">{rev.user?.name}</h4>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Rating score */}
                      <div className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            className={`h-4.5 w-4.5 ${i < rev.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Write a Review (Only for attendees who booked) */}
            {user && user.role === 'attendee' && hasBoughtTicket && (
              <form onSubmit={handleReviewSubmit} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Write a Review</h3>
                
                {/* Star rating picker */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    Rating Score
                  </label>
                  <div className="flex gap-1.5 text-slate-300 dark:text-slate-700">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl transition-colors hover:text-amber-400 ${
                          star <= rating ? 'text-amber-400' : ''
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment box */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Review Comment
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Share your experience attending this event..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="gradient-btn rounded-xl px-5 py-2.5 text-xs font-bold shadow"
                >
                  {reviewLoading ? 'Posting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Ticket Purchase selection */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6 transition-colors duration-200">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tickets Selection</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Select category & count</p>
            </div>

            {isSoldOut ? (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4 text-center">
                <span className="text-xl mb-1 block">🚫</span>
                <p className="text-xs font-bold text-red-600 dark:text-red-400">Sold Out</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  All tickets for this event have been sold out.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Ticket Types */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Ticket Type
                  </label>
                  {event.ticketTypes.map((ticket) => (
                    <button
                      key={ticket.name}
                      type="button"
                      disabled={ticket.available === 0}
                      onClick={() => {
                        setSelectedTicketType(ticket.name);
                        setSelectedQuantity(1);
                      }}
                      className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                        ticket.available === 0
                          ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200'
                          : selectedTicketType === ticket.name
                          ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold">{ticket.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                          {ticket.available} seats left
                        </p>
                      </div>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-white">
                        {ticket.price === 0 ? 'Free' : `₹${ticket.price}`}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Quantity */}
                {selectedTicketObj && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                      Quantity
                    </label>
                    <select
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(parseInt(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {Array.from({
                        length: Math.min(5, selectedTicketObj.available),
                      }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} {i + 1 === 1 ? 'ticket' : 'tickets'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Pricing Summary */}
                {selectedTicketObj && (
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-100 dark:border-slate-800/40 text-xs space-y-1">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Rate:</span>
                      <span>₹{selectedTicketObj.price} x {selectedQuantity}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-800 dark:text-white text-sm pt-1 border-t border-slate-200 dark:border-slate-800">
                      <span>Total Amount:</span>
                      <span>₹{selectedTicketObj.price * selectedQuantity}</span>
                    </div>
                  </div>
                )}

                {/* Checkout Trigger */}
                {(!user || user.role === 'attendee') && (
                  <button
                    onClick={handleProceedCheckout}
                    className="gradient-btn w-full rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Proceed to Register
                  </button>
                )}
                
                {user && user.role !== 'attendee' && (
                  <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-semibold bg-slate-50 dark:bg-slate-950 p-2 rounded-lg">
                    Logged in as '{user.role}'. Ticket purchases are only permitted on attendee accounts.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
