# 🌌 EventSphere — End-to-End Event Management & Ticketing Platform

EventSphere is a professional-grade, high-fidelity event management and ticketing platform designed for **Attendees**, **Organisers**, and **Admins**. It features dynamic event discovery, real-time ticket checkout with **Razorpay (real-time test mode + sandbox fallback)**, secure QR-code ticket generation/validation, manual and digital check-ins, professional networking directories, organiser payout simulation desk, and four distinct AI workflows powered by the **Google Gemini API** (recommendations, description writer, schedule optimizer, and event assistant chatbot).

---

## 🚀 Tech Stack

### Frontend
- **Framework:** React.js (Vite configuration)
- **Routing:** React Router DOM (with protected route guards based on user roles)
- **Styling:** Tailwind CSS v4 (with premium dark mode support and custom Outfit/Inter fonts)
- **State Management:** React Context API (`AuthContext` for auth/profile, `ThemeContext` for light/dark mode)
- **Charts:** Recharts (for clean administrative dashboard analytics)
- **QR Codes:** `qrcode.react` (for dynamic browser-side ticket generation)
- **Notifications:** React Hot Toast
- **API Client:** Axios (configured with request interceptors for JWT injection)

### Backend
- **Runtime:** Node.js (Express.js)
- **Database:** MongoDB Atlas (via Mongoose schemas)
- **Authentication:** JSON Web Tokens (JWT) + custom Express role-based authorization middlewares
- **Encryption:** `bcryptjs` (password hashing)
- **Uploads:** Multer (multipart handling) + Cloudinary API integrations (with file system uploads fallback)
- **Payments:** Razorpay Node SDK (sandbox-proof order creation and signature validation)
- **AI Processing:** Google Gen AI SDK (Gemini 1.5 Flash models)

---

## 📦 Directory Structure

```
EventSphere/
├── backend/
│   ├── src/
│   │   ├── config/          # DB & Cloudinary connection instances
│   │   ├── controllers/     # Route controller logics (Auth, Event, Booking, AI, etc.)
│   │   ├── middleware/      # Auth validator, role checker, global error handlers
│   │   ├── models/          # User, Event, Booking, Review, Notification models
│   │   ├── routes/          # Express API route endpoints
│   │   ├── utils/           # Gemini AI helpers, QR utility, Database Seeder
│   │   └── server.js        # Backend entry point (Port 5000)
│   ├── package.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/      # Common components (Navbar, Footer, ProtectedRoutes)
    │   ├── context/         # AuthContext & ThemeContext
    │   ├── pages/           # High-fidelity dashboard & listing screens
    │   ├── utils/           # Axios API configuration client
    │   ├── App.jsx          # Router paths & Toaster setup
    │   └── index.css        # Tailwind v4 imports and theme variables
    ├── package.json
    └── .env
```

---

## 🎨 Feature Walkthrough

### 1. User Roles & Dashboards
- **Attendee:** Can search/filter events, manage a personal wishlist, RSVP to free events or purchase paid tickets, view QR codes, network with other attendees, ask the AI assistant questions, and generate an AI-optimized event schedule/itinerary.
- **Organiser:** Can create new events, write rich event copy using the **AI description writer**, view real-time registrations, export attendees to CSV, process refund requests, simulate payouts, and process check-ins via manual ticket code verification.
- **Admin:** Monitors global stats (registrations, revenue, user signups), modifies user roles (promotes to organiser/admin), and bans accounts.

### 2. Payments & Booking Flows
- Multi-ticket checkout allowing booking different ticket types (e.g. VIP and General) in one transaction.
- Dynamic ticket pricing with convenience fees and GST calculations.
- Integrated **Razorpay SDK payment modal** for test cards.
- **Sandbox Fallback:** If Razorpay API keys are missing in `.env`, the system automatically runs a secure simulation of a mock transaction, completing registration and issuing tickets instantly.

### 3. Google Gemini AI Workflows
- **Smart AI Event Assistant:** Instant Q&A chatbot located directly on the event details page to answer queries regarding venue, schedule, or pricing categories.
- **AI Event Description Writer:** Generates cohesive descriptions for organisers using a bullet point list input.
- **AI Recommendation Engine:** Analyzes viewed categories and past registrations to recommend similar events.
- **AI Schedule Planner:** Sorts event schedule lists and optimizes speaker time blocks dynamically.

### 4. Community & Collaboration
- **Attendee Networking:** Opt-in to share your LinkedIn with other attendees of the same event in a clean professional networking panel.
- **Post-event Feedback:** Seamlessly rate and review past events from the Ticket Dashboard which populate the public event page.

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- MongoDB Atlas cluster URL

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret_signing_key
   JWT_EXPIRE=7d

   # Cloudinary (Optional - uploads fall back to local disk storage if left empty)
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=

   # Razorpay (Optional - enters sandbox payment simulation if left empty)
   RAZORPAY_KEY_ID=
   RAZORPAY_KEY_SECRET=

   # Google Gemini API Key (Optional - uses mock generation fallbacks if left empty)
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id_if_configured
   ```

---

## 🏃 Running the Application

To run the full stack locally:

### Start the Backend
```bash
cd backend
npm run dev
```
*The server will start on [http://localhost:5000](http://localhost:5000) with nodemon, and automatically seed sample data if the DB is empty.*

### Start the Frontend
```bash
cd frontend
npm run dev
```
*Vite dev server will host the frontend on [http://localhost:5173](http://localhost:5173).*

---

## 🔑 Sample Login Accounts (Pre-seeded)

The backend ships with three ready-to-use demo users created by the database seeder (`backend/src/utils/seeder.js`). Use these to explore flows without registering manually:

- **Attendee Demo**
  - Email: `attendee@eventsphere.com`
  - Password: `password123`
  - Best for: browsing & filtering events, adding to wishlist, multi-ticket checkout (free and paid), viewing QR tickets, networking opt-in, post-event feedback, and AI schedule optimisation.

- **Organiser Demo**
  - Email: `organiser@eventsphere.com`
  - Password: `password123`
  - Best for: creating and editing events (name, date/time, venue, category, description, banner), managing ticket tiers, tracking registrations/revenue/check-ins, exporting attendee CSV, processing refund requests, and simulating organiser payouts.

- **Admin Demo**
  - Email: `admin@eventsphere.com`
  - Password: `password123`
  - Best for: reviewing admin dashboards and exercising elevated access across attendee and organiser views.

On the `/login` screen you can either enter these credentials manually, or simply click the **“Attendee Demo / Organiser Demo / Admin Demo”** buttons for one-click sample logins.

---

## 🔌 API Documentation

### Auth Module (`/api/auth`)
- `POST /register` - Registers a new user.
- `POST /login` - Issues a JWT token on successful login.
- `GET /profile` - Fetches profile details of the authorized user.
- `PUT /profile` - Updates user metadata, wishlist, and networking configurations.

### Events Module (`/api/events`)
- `GET /` - Fetches all events with query filters (city, category, dates, search).
- `GET /:id` - Fetches full details of a specific event.
- `POST /` - Creates a new event.
- `PUT /:id` - Modifies event details.
- `DELETE /:id` - Deletes event.
- `POST /upload` - Uploads custom banners (multipart handler).

### Bookings Module (`/api/bookings`)
- `POST /order` - Standard multi-ticket order initialization.
- `POST /verify` - Confirms Razorpay signatures and generates attendee tickets.
- `GET /user` - Lists bookings registered to the attendee.
- `GET /event/:eventId/attendees` - Lists all registrations for an organiser's event.
- `GET /event/:eventId/networking` - Lists opted-in attendee networking profiles.
- `POST /ticket/:ticketId/refund-request` - Submits a refund claim.
- `PUT /ticket/:ticketId/refund-process` - Allows organisers to approve/reject claims.
- `POST /checkin` - Validates ticket ID codes.

### AI Module (`/api/ai`)
- `POST /ask-assistant` - Real-time event Q&A chatbot assistant.
- `POST /generate-description` - Invokes Gemini to turn event bullet points into copy paragraphs.
- `GET /recommendations` - Lists user recommendations.
- `POST /optimize-schedule` - Re-arranges event itinerary plans.
