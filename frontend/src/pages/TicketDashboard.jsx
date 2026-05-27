import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import { ListSkeleton } from '../components/common/LoadingSkeleton';
import api from '../utils/api';

const TicketDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal control states
  const [selectedTicketForQR, setSelectedTicketForQR] = useState(null);
  const [selectedEventForAI, setSelectedEventForAI] = useState(null);
  
  // AI schedule states
  const [aiSchedule, setAiSchedule] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Feedback states
  const [selectedEventForFeedback, setSelectedEventForFeedback] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackComment.trim()) {
      toast.error('Feedback comment cannot be empty!');
      return;
    }

    setFeedbackSubmitting(true);
    try {
      const res = await api.post('/reviews', {
        eventId: selectedEventForFeedback._id,
        rating: feedbackRating,
        comment: feedbackComment
      });

      if (res.data.success) {
        toast.success('Thank you! Your feedback has been recorded.');
        setSelectedEventForFeedback(null);
        setFeedbackComment('');
        setFeedbackRating(5);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings/my-tickets');
      if (res.data.success) {
        setTickets(res.data.tickets);
      }
    } catch (err) {
      toast.error('Failed to load tickets.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const handleRequestRefund = async (ticketId) => {
    if (!window.confirm('Are you sure you want to cancel this ticket and request a refund?')) return;

    try {
      const res = await api.post(`/bookings/ticket/${ticketId}/refund-request`);
      if (res.data.success) {
        toast.success('Refund request submitted successfully!');
        fetchMyTickets(); // Reload
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Refund request failed.';
      toast.error(msg);
    }
  };

  // Natively print the ticket structure
  const handlePrintTicket = (ticket) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const eventDate = new Date(ticket.event.dateTime).toLocaleString();
    const qrSvgElement = document.getElementById(`qr-svg-${ticket._id}`);
    const qrSvgHtml = qrSvgElement ? qrSvgElement.outerHTML : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket - ${ticket.event.title}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; padding: 40px; margin: 0; color: #1e293b; }
            .ticket { background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); max-width: 600px; margin: 0 auto; overflow: hidden; border: 1px solid #e2e8f0; }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%); color: #ffffff; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
            .header p { margin: 5px 0 0 0; opacity: 0.9; font-size: 13px; font-weight: 500; }
            .body { padding: 30px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
            .label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 2px; }
            .value { font-size: 14px; font-weight: 600; color: #334155; }
            .qr-container { text-align: center; margin-top: 30px; padding-top: 25px; border-t: 2px dashed #cbd5e1; }
            .qr-svg { display: inline-block; margin-bottom: 10px; }
            .code { font-family: monospace; font-size: 16px; font-weight: bold; letter-spacing: 1px; color: #0284c7; }
            .footer { text-align: center; font-size: 10px; color: #94a3b8; padding: 20px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h1>${ticket.event.title}</h1>
              <p>Official Eventsphere Entry Pass</p>
            </div>
            <div class="body">
              <div class="grid">
                <div>
                  <div class="label">Attendee Name</div>
                  <div class="value">${ticket.user?.name || 'Attendee Holder'}</div>
                </div>
                <div>
                  <div class="label">Ticket Category</div>
                  <div class="value">${ticket.ticketType}</div>
                </div>
                <div>
                  <div class="label">Venue Location</div>
                  <div class="value">${ticket.event.venue}, ${ticket.event.city}</div>
                </div>
                <div>
                  <div class="label">Event Date & Time</div>
                  <div class="value">${eventDate}</div>
                </div>
              </div>
              <div class="qr-container">
                <div class="qr-svg">${qrSvgHtml}</div>
                <div class="code">${ticket.ticketCode}</div>
              </div>
            </div>
            <div class="footer">
              Please present this QR barcode at the gate for scanning verification.
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopyTicketCode = async () => {
    if (!selectedTicketForQR) return;
    try {
      await navigator.clipboard.writeText(selectedTicketForQR.ticketCode);
      toast.success('Ticket code copied.');
    } catch {
      toast.error('Could not copy ticket code.');
    }
  };

  const handleDownloadQR = () => {
    if (!selectedTicketForQR) return;
    const svgEl = document.getElementById(`qr-svg-${selectedTicketForQR._id}`);
    if (!svgEl) {
      toast.error('QR not available for download.');
      return;
    }

    const svgContent = svgEl.outerHTML;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_${selectedTicketForQR.ticketCode}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    toast.success('QR downloaded.');
  };

  // AI smart schedule builder
  const handleLoadAISchedule = async (eventObj) => {
    setSelectedEventForAI(eventObj);
    setAiSchedule([]);
    setAiLoading(true);

    try {
      const res = await api.post('/ai/optimize-schedule', {
        sessions: eventObj.schedule,
      });

      if (res.data.success) {
        setAiSchedule(res.data.schedule);
      } else {
        toast.error('Could not construct AI timeline.');
      }
    } catch (err) {
      toast.error('AI optimizer failed.');
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 font-sans pb-20 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Ticket Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your booked tickets, download entry passes, or preview AI schedules.
        </p>
      </div>

      {loading ? (
        <ListSkeleton count={3} />
      ) : tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-16 text-center">
          <span className="text-4xl mb-4 block">🎟️</span>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Tickets Booked</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-6">
            You haven't purchased any tickets yet. Browse events to secure your seats.
          </p>
          <a
            href="/events"
            className="gradient-btn rounded-xl px-5 py-2.5 text-xs font-bold"
          >
            Find Events
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {tickets.map((ticket) => {
            const isRefundable = ticket.status === 'active' && new Date(ticket.event.dateTime) > new Date();
            
            return (
              <div
                key={ticket._id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center transition-colors duration-200"
              >
                {/* QR helper hidden block for printing */}
                <div className="hidden">
                  <QRCodeSVG
                    id={`qr-svg-${ticket._id}`}
                    value={ticket.ticketCode}
                    size={160}
                    level="H"
                  />
                </div>

                {/* Left side: Event banner and text */}
                <div className="flex gap-4 items-start">
                  <img
                    src={ticket.event.bannerImage.startsWith('http') ? ticket.event.bannerImage : `http://localhost:5000${ticket.event.bannerImage}`}
                    alt={ticket.event.title}
                    className="h-16 w-20 md:h-20 md:w-28 rounded-xl object-cover bg-slate-100 shrink-0 border"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=200';
                    }}
                  />
                  <div className="space-y-1.5">
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {ticket.ticketType}
                      </span>

                      {/* Status Badges */}
                      {ticket.status === 'active' && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400">
                          Active Pass
                        </span>
                      )}
                      {ticket.status === 'refund_requested' && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400">
                          Refund Pending
                        </span>
                      )}
                      {ticket.status === 'refunded' && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400">
                          Refunded / Cancelled
                        </span>
                      )}
                      
                      {ticket.checkedIn && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400">
                          Checked-In
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-800 dark:text-white leading-snug">{ticket.event.title}</h3>
                    
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {new Date(ticket.event.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold truncate max-w-xs md:max-w-md">
                      📍 {ticket.event.venue}, {ticket.event.city}
                    </p>
                  </div>
                </div>

                {/* Right side: Action triggers */}
                <div className="flex flex-wrap gap-2 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                  {/* AI Schedule (if sessions are defined) */}
                  {ticket.event.schedule && ticket.event.schedule.length > 0 && ticket.status === 'active' && (
                    <button
                      onClick={() => handleLoadAISchedule(ticket.event)}
                      className="text-xs font-semibold px-4 py-2 border border-purple-200 hover:border-purple-300 bg-purple-50/30 text-purple-600 dark:border-purple-800/40 dark:bg-purple-950/10 dark:text-purple-400 rounded-xl"
                    >
                      ✨ Smart Schedule
                    </button>
                  )}

                  {ticket.status === 'active' && (
                    <>
                      <button
                        onClick={() => setSelectedTicketForQR(ticket)}
                        className="text-xs font-semibold px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
                      >
                        Show QR
                      </button>
                      <button
                        onClick={() => handlePrintTicket(ticket)}
                        className="text-xs font-semibold px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-sm"
                      >
                        Print Pass
                      </button>
                    </>
                  )}

                  {new Date(ticket.event.dateTime) < new Date() && ticket.status === 'active' && (
                    <button
                      onClick={() => setSelectedEventForFeedback(ticket.event)}
                      className="text-xs font-semibold px-4 py-2 border border-emerald-250 hover:bg-emerald-50/20 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400 rounded-xl"
                    >
                      📝 Post Feedback
                    </button>
                  )}

                  {isRefundable && (
                    <button
                      onClick={() => handleRequestRefund(ticket._id)}
                      className="text-xs font-semibold px-4 py-2 border border-red-200 hover:border-red-300 text-red-600 dark:border-red-950/20 dark:text-red-400 rounded-xl"
                    >
                      Request Refund
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Display QR Entry Pass */}
      <Modal
        isOpen={!!selectedTicketForQR}
        onClose={() => setSelectedTicketForQR(null)}
        title="Event Entrance Pass"
      >
        {selectedTicketForQR && (
          <div className="flex flex-col items-center text-center space-y-6">
            <div>
              <h4 className="font-extrabold text-slate-800 dark:text-white text-base">
                {selectedTicketForQR.event.title}
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
                Category: {selectedTicketForQR.ticketType} Pass
              </p>
            </div>

            {/* QR Block */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white p-6 shadow-inner glow-effect">
              <QRCodeSVG
                value={selectedTicketForQR.ticketCode}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleCopyTicketCode}
                className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
              >
                Copy code
              </button>
              <button
                type="button"
                onClick={handleDownloadQR}
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-sm transition-colors"
              >
                Download QR
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Ticket Code</p>
              <p className="text-sm font-bold text-brand-600 dark:text-brand-400 font-mono tracking-wider">
                {selectedTicketForQR.ticketCode}
              </p>
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-xs leading-normal">
              Present this code to the gate organiser. Manual check-ins can scan or input this string to record check-in.
            </p>
          </div>
        )}
      </Modal>

      {/* Modal 2: AI smart schedule optimizer results */}
      <Modal
        isOpen={!!selectedEventForAI}
        onClose={() => setSelectedEventForAI(null)}
        title="✨ AI Smart Schedule Optimizer"
      >
        {selectedEventForAI && (
          <div className="space-y-6">
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 p-4 rounded-2xl">
              <h4 className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                Optimal Session Sequence
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Gemini AI has optimized the workshops order to avoid conflict breaks and ensure maximum session engagement.
              </p>
            </div>

            {aiLoading ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Gemini sequencing timeline...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {aiSchedule.map((session, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white font-extrabold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <h4 className="font-bold text-xs text-slate-800 dark:text-white">{session.sessionTitle}</h4>
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full">
                          {session.timeSlot}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Presented by: <span className="font-semibold text-slate-700 dark:text-slate-300">{session.speaker || 'Guest Speaker'}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        Duration: {session.duration} minutes
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
      {/* Modal 3: Post Event Feedback Form */}
      <Modal
        isOpen={!!selectedEventForFeedback}
        onClose={() => setSelectedEventForFeedback(null)}
        title="Leave Event Feedback"
      >
        {selectedEventForFeedback && (
          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Event</h4>
              <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedEventForFeedback.title}</p>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Rating
              </label>
              <div className="flex gap-1.5 text-slate-350 dark:text-slate-700 text-2xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    className={`transition-colors hover:text-amber-400 ${
                      star <= feedbackRating ? 'text-amber-400' : ''
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Comments & Suggestions
              </label>
              <textarea
                rows={3}
                placeholder="How was your overall experience at this event? Let us know."
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-850 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={feedbackSubmitting}
              className="gradient-btn w-full rounded-xl py-3 text-xs font-bold shadow flex items-center justify-center gap-1.5"
            >
              {feedbackSubmitting ? (
                <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Submit Feedback Form'
              )}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default TicketDashboard;
