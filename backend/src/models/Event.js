const mongoose = require('mongoose');

const ticketTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
  },
  available: {
    type: Number,
    required: true,
  }
});

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
    },
    bulletPoints: [String], // bullet points for AI generation
    category: {
      type: String,
      required: [true, 'Event category is required'],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
    },
    dateTime: {
      type: Date,
      required: [true, 'Event date and time is required'],
    },
    bannerImage: {
      type: String,
      default: '',
    },
    ticketTypes: [ticketTypeSchema],
    totalCapacity: {
      type: Number,
      required: true,
      default: 0
    },
    totalAvailable: {
      type: Number,
      required: true,
      default: 0
    },
    organiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    schedule: [
      {
        sessionTitle: String,
        timeSlot: String,
        speaker: String,
        duration: String, // in minutes
      }
    ]
  },
  {
    timestamps: true,
  }
);

// Pre-save to calculate total capacity and available seats
eventSchema.pre('save', function (next) {
  if (this.ticketTypes && this.ticketTypes.length > 0) {
    this.totalCapacity = this.ticketTypes.reduce((acc, curr) => acc + curr.capacity, 0);
    // If saving the event for the first time, available equals capacity
    if (this.isNew) {
      this.ticketTypes.forEach(t => {
        t.available = t.capacity;
      });
    }
    this.totalAvailable = this.ticketTypes.reduce((acc, curr) => acc + curr.available, 0);
  }
  next();
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
