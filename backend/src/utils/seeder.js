const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Event = require('../models/Event');

const seedDatabase = async () => {
  try {
    // 1. Check if database already has users or events to avoid duplication
    const userCount = await User.countDocuments();
    const eventCount = await Event.countDocuments();

    if (userCount > 0 || eventCount > 0) {
      console.log('Database already initialized with data. Skipping seeder.');
      return;
    }

    console.log('Seeding database with professional sample data...');

    // 2. Create Users
    // NOTE: Pre-save hooks will encrypt these passwords automatically.
    const organiser = new User({
      name: 'Alice Organiser',
      email: 'organiser@eventsphere.com',
      password: 'password123',
      role: 'organiser',
      bio: 'Senior Director of Technology Conferences and summits, specializing in developer ecosystem community meetups.',
      profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150'
    });
    await organiser.save();

    const attendee = new User({
      name: 'Bob Attendee',
      email: 'attendee@eventsphere.com',
      password: 'password123',
      role: 'attendee',
      bio: 'Product manager and full-stack software engineer interested in automation and generative AI frameworks.',
      profileImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150'
    });
    await attendee.save();

    const admin = new User({
      name: 'Admin Director',
      email: 'admin@eventsphere.com',
      password: 'password123',
      role: 'admin',
      bio: 'EventSphere Platforms Chief Administrator.',
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'
    });
    await admin.save();

    console.log('Users seeded successfully:');
    console.log('- Organiser: organiser@eventsphere.com (password123)');
    console.log('- Attendee: attendee@eventsphere.com (password123)');
    console.log('- Admin: admin@eventsphere.com (password123)');

    // 3. Create Events
    const events = [
      {
        title: 'Global AI & Technology Summit 2026',
        description: 'Join developers, engineers, and researchers worldwide for a deep dive into neural networks, generative modeling, and automated agent orchestration. This edition focuses on real-world industrial systems, featuring keynotes, interactive panels, and collaborative workshops.\n\nLearn how organizations leverage AI to build scalable systems, deploy autonomous software engineers, and establish robust safety guardrails.',
        bulletPoints: [
          'Master agentic workflow paradigms',
          'Deploy foundation models locally',
          'Network with industry leaders',
          'Collaborative open-source workshop blocks'
        ],
        category: 'Tech',
        venue: 'Metropolitan Convention Center',
        city: 'San Francisco',
        dateTime: new Date('2026-09-15T09:00:00.000Z'),
        bannerImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800',
        organiser: organiser._id,
        ticketTypes: [
          { name: 'General Admission', price: 1500, capacity: 200, available: 200 },
          { name: 'VIP Experience', price: 5000, capacity: 50, available: 50 },
          { name: 'Early Bird Pass', price: 999, capacity: 100, available: 100 }
        ],
        schedule: [
          {
            sessionTitle: 'Keynote: Next Generation Agentic Workflows',
            timeSlot: '09:00 AM - 10:30 AM',
            speaker: 'Dr. Clara Alvarez',
            duration: '90'
          },
          {
            sessionTitle: 'Interactive Workshop: Prompting Patterns at Scale',
            timeSlot: '11:00 AM - 12:30 PM',
            speaker: 'Marcus Vance',
            duration: '90'
          },
          {
            sessionTitle: 'Panel: Safety & Ethics in Foundation Models',
            timeSlot: '02:00 PM - 03:30 PM',
            speaker: 'Panel Experts',
            duration: '90'
          }
        ]
      },
      {
        title: 'Underground Indie Music Festival',
        description: 'An immersive outdoor music festival spotlighting the finest independent artists across synthwave, shoegaze, and indie rock genres. Enjoy local gourmet food trucks, artisan craft markets, and interactive art installations under the stars.\n\nLineup details will be shared on our social channels.',
        bulletPoints: [
          '15+ independent live artists',
          'Local food trucks and breweries',
          'Interactive light and art exhibits'
        ],
        category: 'Music',
        venue: 'Sylvan Outdoor Amphitheater',
        city: 'Austin',
        dateTime: new Date('2026-10-05T17:00:00.000Z'),
        bannerImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
        organiser: organiser._id,
        ticketTypes: [
          { name: 'Standard Pass', price: 500, capacity: 500, available: 500 },
          { name: 'VIP Backstage Access', price: 2500, capacity: 50, available: 50 }
        ],
        schedule: [
          {
            sessionTitle: 'Acoustic Welcoming Set',
            timeSlot: '05:00 PM - 06:30 PM',
            speaker: 'The Echoes',
            duration: '90'
          },
          {
            sessionTitle: 'Main Stage Synthwave Headliner',
            timeSlot: '08:00 PM - 10:00 PM',
            speaker: 'LaserHeart',
            duration: '120'
          }
        ]
      },
      {
        title: 'National Esports Championship Finals',
        description: 'Watch the top 8 teams battle live in the arena for the ultimate championship crown. High-octane matches, professional commentary, and official merchandise booths. This event includes the standard VIP experience alongside a free early RSVP reservation category.',
        bulletPoints: [
          'Grand final championship matches',
          'Cosplay contest showcase',
          'Professional game casting & analysis'
        ],
        category: 'Sports',
        venue: 'Arena Hall One',
        city: 'Chicago',
        dateTime: new Date('2026-11-20T14:00:00.000Z'),
        bannerImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800',
        organiser: organiser._id,
        ticketTypes: [
          { name: 'Standard Tier', price: 300, capacity: 300, available: 300 },
          { name: 'VIP Ring-side Seats', price: 1200, capacity: 80, available: 80 },
          { name: 'Free Early RSVP Pass', price: 0, capacity: 150, available: 150 }
        ],
        schedule: [
          {
            sessionTitle: 'Quarterfinals & Semifinals Broadcast',
            timeSlot: '02:00 PM - 05:00 PM',
            speaker: 'Shoutcaster Team',
            duration: '180'
          },
          {
            sessionTitle: 'Grand Finals Bo5 Battle',
            timeSlot: '06:00 PM - 09:30 PM',
            speaker: 'Finalist Teams',
            duration: '210'
          }
        ]
      }
    ];

    for (const evData of events) {
      const newEvent = new Event(evData);
      await newEvent.save();
    }

    console.log('Events seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;
