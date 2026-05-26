import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Pages
import Home from './pages/Home';
import LoginRegister from './pages/LoginRegister';
import EventsListing from './pages/EventsListing';
import EventDetails from './pages/EventDetails';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import TicketDashboard from './pages/TicketDashboard';
import OrganiserDashboard from './pages/OrganiserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
          <Toaster
            position="top-center"
            toastOptions={{
              className: 'dark:bg-slate-900 dark:text-white dark:border-slate-800 dark:border font-sans text-xs font-bold rounded-xl shadow-lg',
              duration: 4000,
            }}
          />
          <Navbar />
          
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginRegister />} />
              <Route path="/events" element={<EventsListing />} />
              <Route path="/events/:id" element={<EventDetails />} />

              {/* Private Attendee Routes */}
              <Route
                path="/wishlist"
                element={
                  <ProtectedRoute allowedRoles={['attendee', 'admin']}>
                    <Wishlist />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute allowedRoles={['attendee', 'admin']}>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tickets"
                element={
                  <ProtectedRoute allowedRoles={['attendee', 'admin']}>
                    <TicketDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['attendee', 'organiser', 'admin']}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Private Organiser Routes */}
              <Route
                path="/organiser-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['organiser', 'admin']}>
                    <OrganiserDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Private Admin Routes */}
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Unauthorized Redirect Fallback */}
              <Route
                path="/unauthorized"
                element={
                  <div className="flex h-[80vh] flex-col items-center justify-center text-center font-sans">
                    <span className="text-5xl mb-4">🔐</span>
                    <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">Permission Denied</h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                      You are not authorized to access this section of EventSphere with your current account role.
                    </p>
                    <a href="/" className="mt-6 gradient-btn rounded-xl px-5 py-2.5 text-xs">
                      Back to Homepage
                    </a>
                  </div>
                }
              />

              {/* Catch-all 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
