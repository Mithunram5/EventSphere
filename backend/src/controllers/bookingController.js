const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const { generateTicketCode } = require('../utils/qrGenerator');

// Initialize Razorpay SDK if keys are valid
const hasRazorpayKeys = 
  process.env.RAZORPAY_KEY_ID && 
  process.env.RAZORPAY_KEY_ID !== 'rzp_test_placeholder' &&
  process.env.RAZORPAY_KEY_SECRET &&
  process.env.RAZORPAY_KEY_SECRET !== 'rzp_test_secret_placeholder';

let razorpay = null;
if (hasRazorpayKeys) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('Razorpay Gateway Connected');
  } catch (err) {
    console.error('Error connecting Razorpay:', err);
  }
} else {
  console.log('Razorpay operating in mock checkout mode.');
}

/**
 * @desc    Create a payment order
 * @route   POST /api/bookings/order
 * @access  Private (Attendee)
 */
const createOrder = async (req, res, next) => {
  try {
    const { eventId, ticketTypeName, quantity } = req.body;
    const qty = parseInt(quantity) || 1;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Find ticket type
    const ticketType = event.ticketTypes.find((t) => t.name === ticketTypeName);
    if (!ticketType) {
      return res.status(400).json({ success: false, message: 'Invalid ticket type' });
    }

    // Check availability
    if (ticketType.available < qty) {
      return res.status(400).json({
        success: false,
        message: `Only ${ticketType.available} tickets available for ${ticketTypeName}`,
      });
    }

    const amount = ticketType.price * qty;

    // Free Ticket shortcut: skip Razorpay, generate order directly
    if (amount === 0) {
      const mockOrderId = `order_free_${crypto.randomBytes(6).toString('hex')}`;
      return res.status(200).json({
        success: true,
        isFree: true,
        orderId: mockOrderId,
        amount: 0,
        currency: 'INR',
      });
    }

    // If Razorpay is configured
    if (razorpay) {
      const options = {
        amount: amount * 100, // in paisa
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      return res.status(200).json({
        success: true,
        isFree: false,
        orderId: order.id,
        amount: order.amount / 100,
        currency: order.currency,
      });
    }

    // Razorpay fallback/mock mode
    const mockOrderId = `order_mock_${crypto.randomBytes(6).toString('hex')}`;
    return res.status(200).json({
      success: true,
      isFree: false,
      isMock: true,
      orderId: mockOrderId,
      amount,
      currency: 'INR',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify payment signature & create booking
 * @route   POST /api/bookings/verify
 * @access  Private (Attendee)
 */
const verifyPayment = async (req, res, next) => {
  try {
    const {
      eventId,
      ticketTypeName,
      quantity,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      isFree,
      isMock,
    } = req.body;
    const qty = parseInt(quantity) || 1;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const ticketType = event.ticketTypes.find((t) => t.name === ticketTypeName);
    if (!ticketType) {
      return res.status(400).json({ success: false, message: 'Invalid ticket type' });
    }

    // If it's a paid order, verify payment signature
    if (!isFree) {
      if (razorpay && !isMock) {
        const body = razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
          .update(body.toString())
          .digest('hex');

        if (expectedSignature !== razorpaySignature) {
          return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
        }
      } else {
        console.log('Verifying simulated payment for mock checkout');
      }
    }

    // Double check availability
    if (ticketType.available < qty) {
      return res.status(400).json({ success: false, message: 'Tickets no longer available' });
    }

    // Decrement ticket availability
    ticketType.available -= qty;
    event.totalAvailable = event.ticketTypes.reduce((acc, curr) => acc + curr.available, 0);
    await event.save();

    // Create the booking entry
    const booking = new Booking({
      user: req.user._id,
      event: eventId,
      totalAmount: ticketType.price * qty,
      razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId || 'pay_free_or_mock',
      razorpaySignature: razorpaySignature || 'sig_free_or_mock',
      status: 'paid',
    });

    await booking.save();

    // Generate individual tickets
    const tickets = [];
    for (let i = 0; i < qty; i++) {
      const ticket = new Ticket({
        booking: booking._id,
        user: req.user._id,
        event: eventId,
        ticketType: ticketTypeName,
        price: ticketType.price,
        ticketCode: generateTicketCode(),
        status: 'active',
      });
      await ticket.save();
      tickets.push(ticket._id);
    }

    // Link tickets to booking
    booking.tickets = tickets;
    await booking.save();

    // Send a notification
    await Notification.create({
      user: req.user._id,
      title: 'Booking Confirmed!',
      message: `Successfully booked ${qty} x ${ticketTypeName} ticket(s) for the event '${event.title}'.`,
    });

    res.status(201).json({
      success: true,
      message: 'Booking completed successfully',
      bookingId: booking._id,
      ticketsCount: tickets.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendee bookings/tickets
 * @route   GET /api/bookings/my-tickets
 * @access  Private (Attendee)
 */
const getAttendeeTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ user: req.user._id })
      .populate('event', 'title venue city dateTime bannerImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendee registration roster for an event
 * @route   GET /api/bookings/event/:eventId/attendees
 * @access  Private (Organiser/Admin)
 */
const getEventAttendees = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check ownership
    if (event.organiser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view attendee roster' });
    }

    const tickets = await Ticket.find({ event: req.params.eventId })
      .populate('user', 'name email bio profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Scan and check-in ticket manually
 * @route   POST /api/bookings/check-in
 * @access  Private (Organiser/Admin)
 */
const checkInTicket = async (req, res, next) => {
  try {
    const { ticketCode } = req.body;

    const ticket = await Ticket.findOne({ ticketCode }).populate('event');
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Authorisation: check if user is organiser of the event
    if (ticket.event.organiser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to check-in attendees for this event' });
    }

    if (ticket.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Ticket is invalid. Current status is '${ticket.status}'`,
      });
    }

    if (ticket.checkedIn) {
      return res.status(400).json({
        success: false,
        message: 'Ticket already scanned. Check-in rejected.',
        checkedInAt: ticket.checkedInAt,
      });
    }

    // Check in the ticket
    ticket.checkedIn = true;
    ticket.checkedInAt = new Date();
    await ticket.save();

    // Create confirmation notification for Attendee
    await Notification.create({
      user: ticket.user,
      title: 'Checked In!',
      message: `You have successfully checked in to '${ticket.event.title}' using ticket ${ticketCode}. Enjoy!`,
    });

    res.status(200).json({
      success: true,
      message: 'Attendee checked-in successfully',
      ticket: {
        ticketCode: ticket.ticketCode,
        ticketType: ticket.ticketType,
        checkedIn: ticket.checkedIn,
        checkedInAt: ticket.checkedInAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request ticket cancellation/refund
 * @route   POST /api/bookings/ticket/:ticketId/refund-request
 * @access  Private (Attendee)
 */
const requestRefund = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId).populate('event');
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Check user ownership
    if (ticket.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to refund this ticket' });
    }

    if (ticket.checkedIn) {
      return res.status(400).json({ success: false, message: 'Cannot refund a ticket that has already been checked-in' });
    }

    if (ticket.status !== 'active') {
      return res.status(400).json({ success: false, message: `Ticket is already '${ticket.status}'` });
    }

    // Update status
    ticket.status = 'refund_requested';
    await ticket.save();

    // Notify organiser
    await Notification.create({
      user: ticket.event.organiser,
      title: 'Refund Request Received',
      message: `An attendee has requested a refund for '${ticket.event.title}' (Ticket: ${ticket.ticketCode}).`,
    });

    res.status(200).json({
      success: true,
      message: 'Refund request submitted successfully',
      ticket,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve or Reject refund request
 * @route   PUT /api/bookings/ticket/:ticketId/refund-process
 * @access  Private (Organiser/Admin)
 */
const processRefund = async (req, res, next) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    
    const ticket = await Ticket.findById(req.params.ticketId).populate('event');
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Verify ownership
    if (ticket.event.organiser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to process refunds for this event' });
    }

    if (ticket.status !== 'refund_requested') {
      return res.status(400).json({ success: false, message: 'No active refund request found for this ticket' });
    }

    if (action === 'approve') {
      ticket.status = 'refunded';
      await ticket.save();

      // Release ticket slot
      const event = await Event.findById(ticket.event._id);
      const ticketType = event.ticketTypes.find(t => t.name === ticket.ticketType);
      if (ticketType) {
        ticketType.available += 1;
        event.totalAvailable = event.ticketTypes.reduce((acc, curr) => acc + curr.available, 0);
        await event.save();
      }

      // Update Booking status if all tickets in it are refunded
      const booking = await Booking.findById(ticket.booking);
      if (booking) {
        const siblingTickets = await Ticket.find({ booking: booking._id });
        const allRefunded = siblingTickets.every(t => t.status === 'refunded');
        if (allRefunded) {
          booking.status = 'refunded';
          await booking.save();
        } else {
          booking.status = 'refund_requested'; // partial
          await booking.save();
        }
      }

      // Notify attendee
      await Notification.create({
        user: ticket.user,
        title: 'Refund Approved',
        message: `Your refund request for '${event.title}' (Ticket: ${ticket.ticketCode}) was approved.`,
      });

    } else if (action === 'reject') {
      ticket.status = 'active';
      await ticket.save();

      // Notify attendee
      await Notification.create({
        user: ticket.user,
        title: 'Refund Rejected',
        message: `Your refund request for '${ticket.event.title}' (Ticket: ${ticket.ticketCode}) was rejected by the organiser.`,
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Use approve or reject' });
    }

    res.status(200).json({
      success: true,
      message: `Refund request successfully ${action}d`,
      ticket,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getAttendeeTickets,
  getEventAttendees,
  checkInTicket,
  requestRefund,
  processRefund,
};
