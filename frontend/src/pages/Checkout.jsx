import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const Checkout = () => {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const eventId = searchParams.get('eventId');
  const ticketTypeName = searchParams.get('ticketType');
  const quantity = parseInt(searchParams.get('quantity')) || 1;
  const itemsParam = searchParams.get('items');

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Parse items
  let selectedItems = [];
  if (itemsParam) {
    selectedItems = itemsParam
      .split(',')
      .map((part) => {
        const [name, qty] = part.split(':');
        return { ticketTypeName: decodeURIComponent(name), quantity: parseInt(qty) || 0 };
      })
      .filter((i) => i.quantity > 0);
  } else if (ticketTypeName) {
    selectedItems = [{ ticketTypeName, quantity }];
  }

  useEffect(() => {
    if (!eventId || selectedItems.length === 0) {
      toast.error('Invalid checkout request.');
      navigate('/events');
      return;
    }

    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/events/${eventId}`);
        if (res.data.success) {
          setEvent(res.data.event);
        }
      } catch (err) {
        toast.error('Failed to load event details for checkout.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Creating Booking Summary...</p>
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

  // Calculate pricing breakdown
  let ticketSubtotal = 0;
  let itemsDetail = [];
  let invalidItem = false;

  for (const item of selectedItems) {
    const ticketObj = event.ticketTypes.find((t) => t.name === item.ticketTypeName);
    if (!ticketObj) {
      invalidItem = true;
      break;
    }
    const itemTotal = ticketObj.price * item.quantity;
    ticketSubtotal += itemTotal;
    itemsDetail.push({
      name: item.ticketTypeName,
      quantity: item.quantity,
      price: ticketObj.price,
      total: itemTotal,
    });
  }

  if (invalidItem || itemsDetail.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50 dark:bg-slate-950 h-[80vh] flex flex-col justify-center items-center">
        <p className="text-slate-800 dark:text-white font-bold">Invalid ticket category selected.</p>
        <Link to={`/events/${eventId}`} className="mt-4 gradient-btn rounded-xl px-5 py-2.5 text-sm">
          Select Ticket Again
        </Link>
      </div>
    );
  }

  const convenienceFee = ticketSubtotal > 0 ? 40 : 0; // ₹40 flat convenience charge for paid orders
  const gstAmount = ticketSubtotal > 0 ? parseFloat((ticketSubtotal * 0.18).toFixed(2)) : 0; // 18% GST
  const totalAmount = ticketSubtotal + convenienceFee + gstAmount;

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      // 1. Create order on the backend
      const orderRes = await api.post('/bookings/order', {
        eventId,
        items: selectedItems,
      });

      if (!orderRes.data.success) {
        toast.error('Failed to initialize booking order.');
        setCheckoutLoading(false);
        return;
      }

      const { isFree, isMock, orderId } = orderRes.data;

      // Scenario A: Free tickets registration (Bypass payments)
      if (isFree) {
        const verifyRes = await api.post('/bookings/verify', {
          eventId,
          items: selectedItems,
          razorpayOrderId: orderId,
          isFree: true,
        });

        if (verifyRes.data.success) {
          toast.success('Registration successful!');
          navigate('/tickets');
        } else {
          toast.error(verifyRes.data.message || 'Free ticket registration failed.');
        }
        setCheckoutLoading(false);
        return;
      }

      // Scenario B: Sandbox Simulation Mode (No Razorpay key in ENV)
      if (isMock) {
        toast.loading('Simulating payment sandbox...', { id: 'mock-pay' });
        setTimeout(async () => {
          try {
            const verifyRes = await api.post('/bookings/verify', {
              eventId,
              items: selectedItems,
              razorpayOrderId: orderId,
              razorpayPaymentId: `pay_mock_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
              razorpaySignature: `sig_mock_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
              isMock: true,
            });

            if (verifyRes.data.success) {
              toast.success('Simulated payment successful! Tickets generated.', { id: 'mock-pay' });
              navigate('/tickets');
            } else {
              toast.error('Mock verification failed.', { id: 'mock-pay' });
            }
          } catch (err) {
            toast.error('Simulated checkout validation failed.', { id: 'mock-pay' });
          } finally {
            setCheckoutLoading(false);
          }
        }, 1500);
        return;
      }

      // Scenario C: Real Razorpay Sandbox Modal Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: totalAmount * 100, // in paisa
        currency: 'INR',
        name: 'EventSphere Platforms',
        description: `Booking for ${event.title}`,
        image: '/favicon.svg',
        order_id: orderId,
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/bookings/verify', {
              eventId,
              items: selectedItems,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              toast.success('Payment verified! Tickets booked.');
              navigate('/tickets');
            } else {
              toast.error('Payment verification failed.');
            }
          } catch (err) {
            toast.error('Verification query failed.');
          } finally {
            setCheckoutLoading(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#0ea5e9',
        },
        modal: {
          ondismiss: function () {
            toast.error('Payment checkout cancelled.');
            setCheckoutLoading(false);
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (error) {
      const msg = error.response?.data?.message || 'Checkout failed.';
      toast.error(msg);
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 font-sans pb-20">
      <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-6">Booking checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Event summary details */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4 transition-colors duration-200">
            <h3 className="text-md font-bold text-slate-800 dark:text-white">Review Event Details</h3>

            <div className="flex gap-4">
              <img
                src={event.bannerImage.startsWith('http') ? event.bannerImage : `http://localhost:5000${event.bannerImage}`}
                alt={event.title}
                className="h-16 w-24 rounded-lg object-cover bg-slate-100 dark:bg-slate-850 shrink-0"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=200';
                }}
              />
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 px-2 py-0.5 rounded-full">
                  {event.category}
                </span>
                <h4 className="font-bold text-sm text-slate-800 dark:text-white mt-1 leading-snug">{event.title}</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                  {new Date(event.dateTime).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  at{' '}
                  {new Date(event.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <svg className="h-4.5 w-4.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>
                {event.ruleOnline ? 'Online Event' : `${event.venue}, ${event.city}`}
              </span>
            </div>
          </div>

          {/* Attendee Details Form */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4 transition-colors duration-200">
            <h3 className="text-md font-bold text-slate-800 dark:text-white">Attendee Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Name</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">{user?.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Email</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Billing summary details */}
        <div className="md:col-span-1">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6 transition-colors duration-200">
            <h3 className="text-md font-bold text-slate-800 dark:text-white">Order Summary</h3>

            <div className="space-y-3.5 text-xs">
              {itemsDetail.map((item, idx) => (
                <div key={idx} className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-white">₹{item.total}</span>
                </div>
              ))}

              {ticketSubtotal > 0 && (
                <>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Convenience Charge</span>
                    <span className="font-semibold text-slate-800 dark:text-white">₹{convenienceFee}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>GST Tax (18%)</span>
                    <span className="font-semibold text-slate-800 dark:text-white">₹{gstAmount}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between font-bold text-slate-800 dark:text-white text-base pt-4 border-t border-slate-200 dark:border-slate-800">
                <span>Payable Amount:</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="gradient-btn w-full rounded-xl py-3.5 text-sm font-bold shadow transition-all flex items-center justify-center gap-2"
            >
              {checkoutLoading ? (
                <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : ticketSubtotal === 0 ? (
                'Confirm Free RSVP'
              ) : (
                'Pay Now with Razorpay'
              )}
            </button>

            {ticketSubtotal > 0 && (
              <p className="text-[9px] text-center text-slate-400 dark:text-slate-500 font-semibold">
                By booking, you agree to our refund terms. Refund claims can be filed directly from the ticket dashboard.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
