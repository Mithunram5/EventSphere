import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import StatCard from '../components/dashboard/StatCard';
import Modal from '../components/common/Modal';
import { ListSkeleton } from '../components/common/LoadingSkeleton';
import api from '../utils/api';

const CATEGORIES = ['Tech', 'Music', 'Sports', 'Arts', 'Food', 'Business', 'Education'];
const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune'];

const OrganiserDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    totalRevenue: 0,
    checkInCount: 0,
  });

  // Modal Control States
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState(null);
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [selectedEventForRoster, setSelectedEventForRoster] = useState(null);
  
  // Roster lists
  const [rosterTickets, setRosterTickets] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  // Manual Check-in code
  const [checkInCode, setCheckInCode] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);

  // AI Description states
  const [aiBulletPoints, setAiBulletPoints] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  // Payout states
  const [payoutInProgress, setPayoutInProgress] = useState(false);
  const [payoutsList, setPayoutsList] = useState([
    { id: 'PAY-897', date: '2026-05-10', amount: 8400, status: 'Completed' },
    { id: 'PAY-432', date: '2026-04-15', amount: 3200, status: 'Completed' }
  ]);

  const handlePayoutTrigger = () => {
    const amount = (stats.totalRevenue * 0.90).toFixed(2);
    if (parseFloat(amount) <= 0) {
      toast.error('Payout balance is too low to process.');
      return;
    }
    
    setPayoutInProgress(true);
    toast.loading('Simulating bank settlement transfer...', { id: 'payout-sim' });

    setTimeout(() => {
      const newPayout = {
        id: `PAY-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().slice(0, 10),
        amount: parseFloat(amount),
        status: 'Completed'
      };
      setPayoutsList(prev => [newPayout, ...prev]);
      setPayoutInProgress(false);
      toast.success(`Success! Payout settlement of ₹${amount} completed.`, { id: 'payout-sim' });
    }, 2000);
  };

  // Create/Edit Event Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Tech');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('Delhi');
  const [dateTime, setDateTime] = useState('');
  const [bannerImage, setBannerImage] = useState(null); // File upload
  const [bannerUrlPreview, setBannerUrlPreview] = useState(''); // Text field or preview
  
  // Ticket Types (Array of objects)
  const [ticketTypes, setTicketTypes] = useState([
    { name: 'General', price: 0, capacity: 50 },
    { name: 'VIP', price: 500, capacity: 10 },
  ]);

  // Event Schedule Sessions
  const [schedule, setSchedule] = useState([
    { sessionTitle: 'Registration & Welcome', timeSlot: '09:00 AM - 10:00 AM', speaker: 'Host', duration: '60' }
  ]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events/myevents');
      if (res.data.success) {
        setEvents(res.data.events);
        calculateStats(res.data.events);
      }
    } catch (err) {
      toast.error('Failed to load organiser events.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const calculateStats = async (myEvents) => {
    try {
      let regCount = 0;
      let revTotal = 0;
      let checkins = 0;

      // Aggregates attendee statistics by looping events
      for (const ev of myEvents) {
        const ticketRes = await api.get(`/bookings/event/${ev._id}/attendees`);
        if (ticketRes.data.success) {
          const tix = ticketRes.data.tickets;
          regCount += tix.length;
          tix.forEach(t => {
            if (t.status === 'active' || t.status === 'checked_in') {
              revTotal += t.price;
            }
            if (t.checkedIn) {
              checkins += 1;
            }
          });
        }
      }

      setStats({
        totalRegistrations: regCount,
        totalRevenue: revTotal,
        checkInCount: checkins,
      });
    } catch (error) {
      console.error('Stats aggregation error:', error);
    }
  };

  // Open modal to create event
  const openCreateModal = () => {
    setSelectedEventForEdit(null);
    setTitle('');
    setDescription('');
    setCategory('Tech');
    setVenue('');
    setCity('Delhi');
    setDateTime('');
    setBannerImage(null);
    setBannerUrlPreview('');
    setTicketTypes([
      { name: 'General', price: 0, capacity: 50 },
      { name: 'VIP', price: 500, capacity: 10 },
    ]);
    setSchedule([
      { sessionTitle: 'Registration & Welcome', timeSlot: '09:00 AM - 10:00 AM', speaker: 'Host', duration: '60' }
    ]);
    setEventModalOpen(true);
  };

  // Open modal to edit event
  const openEditModal = (event) => {
    setSelectedEventForEdit(event);
    setTitle(event.title);
    setDescription(event.description);
    setCategory(event.category);
    setVenue(event.venue);
    setCity(event.city);
    // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
    const formattedDate = new Date(event.dateTime).toISOString().slice(0, 16);
    setDateTime(formattedDate);
    setBannerImage(null);
    setBannerUrlPreview(event.bannerImage);
    setTicketTypes(event.ticketTypes.map(t => ({ name: t.name, price: t.price, capacity: t.capacity })));
    setSchedule(event.schedule || []);
    setEventModalOpen(true);
  };

  // Form handle for event creation/updates
  const handleSaveEvent = async (e) => {
    e.preventDefault();

    if (!title || !description || !venue || !dateTime) {
      toast.error('Please fill in all required fields!');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('venue', venue);
    formData.append('city', city);
    formData.append('dateTime', dateTime);
    formData.append('ticketTypes', JSON.stringify(ticketTypes));
    formData.append('schedule', JSON.stringify(schedule));

    if (bannerImage) {
      formData.append('bannerImage', bannerImage);
    } else {
      formData.append('bannerImage', bannerUrlPreview);
    }

    const loadToast = toast.loading('Saving event settings...');
    try {
      let res;
      if (selectedEventForEdit) {
        res = await api.put(`/events/${selectedEventForEdit._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/events', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data.success) {
        toast.success(selectedEventForEdit ? 'Event updated!' : 'Event created successfully!', { id: loadToast });
        setEventModalOpen(false);
        fetchDashboardData();
      }
    } catch (error) {
      toast.error('Failed to save event.', { id: loadToast });
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event? This cannot be undone.')) return;

    try {
      const res = await api.delete(`/events/${id}`);
      if (res.data.success) {
        toast.success('Event deleted successfully.');
        fetchDashboardData();
      }
    } catch (error) {
      toast.error('Delete failed.');
    }
  };

  // Open Roster
  const openRoster = async (event) => {
    setSelectedEventForRoster(event);
    setRosterTickets([]);
    setRosterModalOpen(true);
    setRosterLoading(true);

    try {
      const res = await api.get(`/bookings/event/${event._id}/attendees`);
      if (res.data.success) {
        setRosterTickets(res.data.tickets);
      }
    } catch (error) {
      toast.error('Failed to load roster.');
    } finally {
      setRosterLoading(false);
    }
  };

  // Manual Check-in Submit
  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!checkInCode.trim()) {
      toast.error('Please enter a ticket code!');
      return;
    }

    setCheckingIn(true);
    try {
      const res = await api.post('/bookings/check-in', { ticketCode: checkInCode });
      if (res.data.success) {
        toast.success(`Success! Attendee checked-in. Code: ${res.data.ticket.ticketCode}`);
        setCheckInCode('');
        
        // Refresh roster if currently viewable
        if (selectedEventForRoster) {
          const rosterRes = await api.get(`/bookings/event/${selectedEventForRoster._id}/attendees`);
          if (rosterRes.data.success) {
            setRosterTickets(rosterRes.data.tickets);
          }
        }
        fetchDashboardData(); // update statistics counts
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Check-in validation failed.';
      toast.error(msg);
    } finally {
      setCheckingIn(false);
    }
  };

  // Process refund (approve/reject)
  const handleRefundProcess = async (ticketId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this refund request?`)) return;

    try {
      const res = await api.put(`/bookings/ticket/${ticketId}/refund-process`, { action });
      if (res.data.success) {
        toast.success(`Refund successfully ${action}d!`);
        // Refresh Roster
        const rosterRes = await api.get(`/bookings/event/${selectedEventForRoster._id}/attendees`);
        if (rosterRes.data.success) {
          setRosterTickets(rosterRes.data.tickets);
        }
        fetchDashboardData();
      }
    } catch (error) {
      toast.error('Refund action failed.');
    }
  };

  // AI Description Generator (bullet points to copy)
  const handleGenerateAIDescription = async () => {
    if (!aiBulletPoints.trim()) {
      toast.error('Please enter some bullet points first!');
      return;
    }

    setAiGenerating(true);
    try {
      const bulletsArray = aiBulletPoints.split('\n').filter(b => b.trim() !== '');
      const res = await api.post('/ai/generate-description', { bulletPoints: bulletsArray });
      if (res.data.success) {
        setDescription(res.data.description);
        toast.success('Description generated with Gemini AI!');
      }
    } catch (error) {
      toast.error('AI generation failed. Using mock backup.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Export attendee roster as CSV
  const handleDownloadCSV = () => {
    if (rosterTickets.length === 0) {
      toast.error('No registrations found to export.');
      return;
    }

    const headers = ['Name', 'Email', 'Ticket Type', 'Price', 'Checked In', 'Scan Time', 'Booking Date'];
    const rows = rosterTickets.map(t => [
      t.user?.name || 'Unknown',
      t.user?.email || 'N/A',
      t.ticketType,
      t.price,
      t.checkedIn ? 'YES' : 'NO',
      t.checkedInAt ? new Date(t.checkedInAt).toLocaleString() : 'N/A',
      new Date(t.createdAt).toLocaleString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Roster_${selectedEventForRoster.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV downloaded successfully!');
  };

  // Helper arrays update functions
  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: '', price: 0, capacity: 50 }]);
  };

  const removeTicketType = (index) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  };

  const handleTicketTypeChange = (index, field, value) => {
    const updated = [...ticketTypes];
    updated[index][field] = field === 'name' ? value : parseInt(value) || 0;
    setTicketTypes(updated);
  };

  const addScheduleSession = () => {
    setSchedule([...schedule, { sessionTitle: '', timeSlot: '', speaker: '', duration: '60' }]);
  };

  const removeScheduleSession = (index) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const handleScheduleChange = (index, field, value) => {
    const updated = [...schedule];
    updated[index][field] = value;
    setSchedule(updated);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 font-sans space-y-12 pb-20">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Organiser Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Publish conferences, monitor sales revenue, scans tickets, and manage registrations.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="gradient-btn rounded-xl px-5 py-3 text-sm font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Event Listing
        </button>
      </div>

      {/* Stats Board */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Registrations"
            value={stats.totalRegistrations}
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            colorClass="bg-sky-500"
            trendText="Total cumulative attendee signups"
          />
          <StatCard
            title="Revenue Gathered"
            value={`₹${stats.totalRevenue}`}
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            colorClass="bg-emerald-500"
            trendText="Paid checkout collection"
          />
          <StatCard
            title="Check-In Rate"
            value={`${stats.totalRegistrations > 0 ? ((stats.checkInCount / stats.totalRegistrations) * 100).toFixed(1) : 0}%`}
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
            colorClass="bg-purple-500"
            trendText={`${stats.checkInCount} checked-in passes`}
          />
        </div>
      )}

      {/* Manual Check-in Module & Events List grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Events table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4 transition-colors duration-200">
            <h3 className="text-md font-bold text-slate-800 dark:text-white">Active Event Listings</h3>

            {loading ? (
              <ListSkeleton count={2} />
            ) : events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  You haven't posted any events yet. Click 'Create Event Listing' to begin.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
                      <th className="py-3 px-2">Event Title</th>
                      <th className="py-3 px-2">Date</th>
                      <th className="py-3 px-2">City</th>
                      <th className="py-3 px-2 text-center">Seats Left</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr key={ev._id} className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                        <td className="py-4 px-2 font-bold text-slate-800 dark:text-slate-200">{ev.title}</td>
                        <td className="py-4 px-2 text-slate-500 dark:text-slate-400">
                          {new Date(ev.dateTime).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-2 text-slate-500 dark:text-slate-400 capitalize">{ev.city}</td>
                        <td className="py-4 px-2 text-center text-slate-800 dark:text-slate-200 font-bold">
                          {ev.totalAvailable} / {ev.totalCapacity}
                        </td>
                        <td className="py-4 px-2 text-right space-x-2">
                          <button
                            onClick={() => openRoster(ev)}
                            className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
                          >
                            Roster
                          </button>
                          <button
                            onClick={() => openEditModal(ev)}
                            className="text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(ev._id)}
                            className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ticket check-in desk */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4 transition-colors duration-200 sticky top-24">
            <div>
              <h3 className="text-md font-bold text-slate-800 dark:text-white">Ticket Check-In Desk</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Input ticket barcodes for verification</p>
            </div>

            <form onSubmit={handleCheckInSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Enter Ticket Code (e.g. ES-2026-...)"
                value={checkInCode}
                onChange={(e) => setCheckInCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={checkingIn}
                className="gradient-btn w-full rounded-xl py-3 text-xs font-bold shadow flex items-center justify-center gap-1.5"
              >
                {checkingIn ? (
                  <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                    </svg>
                    Verify & Check In
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Payout Settlement Simulation Panel */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4 transition-colors duration-200">
            <div>
              <h3 className="text-md font-bold text-slate-800 dark:text-white">Organiser Payout Desk</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Simulate bank settlements</p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-100 dark:border-slate-800/40 text-xs space-y-1.5 font-sans">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Gross Earnings:</span>
                <span className="font-semibold text-slate-800 dark:text-white">₹{stats.totalRevenue}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Platform Commission (10%):</span>
                <span className="font-semibold text-slate-800 dark:text-white">₹{(stats.totalRevenue * 0.10).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800 dark:text-white text-sm pt-1.5 border-t border-slate-200 dark:border-slate-800">
                <span>Net Settlable Payout:</span>
                <span>₹{(stats.totalRevenue * 0.90).toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={payoutInProgress || stats.totalRevenue === 0}
              onClick={handlePayoutTrigger}
              className="gradient-btn w-full rounded-xl py-3 text-xs font-bold shadow flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {payoutInProgress ? (
                <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Trigger Payout Settlement'
              )}
            </button>
            
            {/* Historical settlements list */}
            {payoutsList.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Settlement History</p>
                <div className="space-y-1.5">
                  {payoutsList.map(p => (
                    <div key={p.id} className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{p.date} • {p.id}</span>
                      <span className="font-bold text-slate-800 dark:text-white">₹{p.amount.toFixed(2)} ({p.status})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal 1: Create & Edit Event details form */}
      <Modal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        title={selectedEventForEdit ? 'Edit Event Listing' : 'Publish New Event'}
      >
        <form onSubmit={handleSaveEvent} className="space-y-5">
          {/* Main Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Event Title *
              </label>
              <input
                type="text"
                placeholder="eg. Javascript Developers Summit 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                City *
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Venue Location Address *
              </label>
              <input
                type="text"
                placeholder="eg. Hall 4, Pragati Maidan"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Date & Time *
              </label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Banner Image File
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBannerImage(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100"
              />
            </div>
          </div>

          {/* AI Description Builder box */}
          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/20 dark:border-purple-800/40 dark:bg-purple-950/10 space-y-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400">✨ Gemini AI Copywriter</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Input raw bullet points (one per line) and let Gemini AI generate a polished description paragraph.
            </p>
            <textarea
              rows={2}
              placeholder="- Networking sessions&#10;- Keynotes by core developers&#10;- Hands-on workshops"
              value={aiBulletPoints}
              onChange={(e) => setAiBulletPoints(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={handleGenerateAIDescription}
              disabled={aiGenerating}
              className="px-3.5 py-1.5 text-[10px] font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              {aiGenerating ? 'Generating...' : 'Generate Description'}
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Event Description *
            </label>
            <textarea
              rows={4}
              placeholder="Describe what attendees can expect, topics, requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          {/* Ticket types sub-form */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Ticket Categories
              </label>
              <button
                type="button"
                onClick={addTicketType}
                className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
              >
                + Add Category
              </button>
            </div>

            {ticketTypes.map((ticket, index) => (
              <div key={index} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                <input
                  type="text"
                  placeholder="General"
                  value={ticket.name}
                  onChange={(e) => handleTicketTypeChange(index, 'name', e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-white focus:outline-none"
                  required
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={ticket.price}
                  onChange={(e) => handleTicketTypeChange(index, 'price', e.target.value)}
                  className="w-20 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-white focus:outline-none"
                  required
                />
                <input
                  type="number"
                  placeholder="Seats"
                  value={ticket.capacity}
                  onChange={(e) => handleTicketTypeChange(index, 'capacity', e.target.value)}
                  className="w-20 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-white focus:outline-none"
                  required
                />
                {ticketTypes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTicketType(index)}
                    className="text-red-500 hover:text-red-600 text-xs px-1 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Schedule sub-form */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Event Schedule Slots
              </label>
              <button
                type="button"
                onClick={addScheduleSession}
                className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
              >
                + Add Session
              </button>
            </div>

            {schedule.map((session, index) => (
              <div key={index} className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Session Title"
                    value={session.sessionTitle}
                    onChange={(e) => handleScheduleChange(index, 'sessionTitle', e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-white focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Time Slot (eg. 10:00 - 11:30)"
                    value={session.timeSlot}
                    onChange={(e) => handleScheduleChange(index, 'timeSlot', e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-white focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Speaker"
                    value={session.speaker}
                    onChange={(e) => handleScheduleChange(index, 'speaker', e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-white focus:outline-none"
                  />
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Min"
                      value={session.duration}
                      onChange={(e) => handleScheduleChange(index, 'duration', e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-800 dark:text-white focus:outline-none"
                    />
                    {schedule.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeScheduleSession(index)}
                        className="text-red-500 hover:text-red-650 text-xs font-bold px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="gradient-btn w-full rounded-xl py-3 text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            Publish Event Listing
          </button>
        </form>
      </Modal>

      {/* Modal 2: View Attendee Roster / Registrations list */}
      <Modal
        isOpen={rosterModalOpen}
        onClose={() => setRosterModalOpen(false)}
        title={selectedEventForRoster ? `Roster — ${selectedEventForRoster.title}` : 'Roster List'}
      >
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Signups Total</p>
              <h4 className="text-xl font-extrabold text-slate-850 dark:text-white">
                {rosterTickets.length} Attendees
              </h4>
            </div>
            <button
              onClick={handleDownloadCSV}
              className="text-xs font-bold px-3.5 py-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl shadow-sm flex items-center gap-1.5"
            >
              📥 Export CSV
            </button>
          </div>

          {rosterLoading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Fetching roster...</p>
            </div>
          ) : rosterTickets.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No registrations yet.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {rosterTickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center flex-wrap gap-4"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                      {ticket.user?.name || 'Unknown'}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{ticket.user?.email}</p>
                    <div className="flex gap-2 mt-2 items-center flex-wrap">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-950 px-2 py-0.5 rounded border">
                        {ticket.ticketType} Pass
                      </span>
                      {ticket.checkedIn ? (
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          Checked-In
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          Unscanned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions for Organisers: Refund Claim approves */}
                  {ticket.status === 'refund_requested' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRefundProcess(ticket._id, 'approve')}
                        className="text-[9px] font-bold bg-red-600 text-white px-2.5 py-1.5 rounded-lg shadow"
                      >
                        Approve Refund
                      </button>
                      <button
                        onClick={() => handleRefundProcess(ticket._id, 'reject')}
                        className="text-[9px] font-bold border border-slate-200 bg-white text-slate-700 px-2.5 py-1.5 rounded-lg shadow-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {ticket.status === 'refunded' && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-red-500">
                      Refunded
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default OrganiserDashboard;
