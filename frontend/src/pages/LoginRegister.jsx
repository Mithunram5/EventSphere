import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

const LoginRegister = () => {
  const { login, register, user, loading } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab state
  const [isRegister, setIsRegister] = useState(searchParams.get('register') === 'true');

  // Input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('attendee'); // attendee, organiser, admin
  const [formLoading, setFormLoading] = useState(false);

  // Sync tab state with query parameter changes
  useEffect(() => {
    setIsRegister(searchParams.get('register') === 'true');
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!email || !password || (isRegister && !name)) {
      toast.error('Please fill in all required fields!');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters!');
      return;
    }

    setFormLoading(true);

    try {
      if (isRegister) {
        const res = await register(name, email, password, role);
        if (res.success) {
          toast.success('Registration successful! Welcome aboard.');
        } else {
          toast.error(res.error || 'Registration failed.');
        }
      } else {
        const res = await login(email, password);
        if (res.success) {
          toast.success('Signed in successfully.');
        } else {
          toast.error(res.error || 'Invalid credentials.');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSampleLogin = async (roleKey) => {
    const presetMap = {
      attendee: { email: 'attendee@eventsphere.com', password: 'password123' },
      organiser: { email: 'organiser@eventsphere.com', password: 'password123' },
      admin: { email: 'admin@eventsphere.com', password: 'password123' },
    };

    const preset = presetMap[roleKey];
    if (!preset) return;

    setFormLoading(true);
    try {
      const res = await login(preset.email, preset.password);
      if (res.success) {
        toast.success(`Logged in as ${roleKey} sample user.`);
      } else {
        toast.error(res.error || 'Sample login failed.');
      }
    } catch (err) {
      toast.error('Unable to perform sample login right now.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl transition-colors duration-200 glow-effect"
      >
        {/* Title */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">
            {isRegister ? 'Create your Account' : 'Sign in to EventSphere'}
          </h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isRegister ? 'Join our ticketing & event platform' : 'Welcome back! Log in to access your dashboard'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className={`flex-1 rounded-lg py-2 text-center text-xs font-bold transition-all ${
              !isRegister
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => navigate('/login?register=true')}
            className={`flex-1 rounded-lg py-2 text-center text-xs font-bold transition-all ${
              isRegister
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Role selector (Register tab only) */}
          {isRegister && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Join As
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'attendee', name: 'Attendee', desc: 'Browse & Buy' },
                  { id: 'organiser', name: 'Organiser', desc: 'Host & Sell' },
                  { id: 'admin', name: 'Admin', desc: 'Moderate' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id)}
                    className={`rounded-xl border p-2.5 text-center transition-all ${
                      role === item.id
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <p className="text-xs font-bold">{item.name}</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={formLoading}
            className="gradient-btn w-full rounded-xl py-3.5 text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {formLoading ? (
              <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : isRegister ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Sample login shortcuts */}
        {!isRegister && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 font-semibold">
              Or jump in with a sample role
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                disabled={formLoading}
                onClick={() => handleSampleLogin('attendee')}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-3 py-2 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-all"
              >
                Attendee Demo
              </button>
              <button
                type="button"
                disabled={formLoading}
                onClick={() => handleSampleLogin('organiser')}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-3 py-2 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-all"
              >
                Organiser Demo
              </button>
              <button
                type="button"
                disabled={formLoading}
                onClick={() => handleSampleLogin('admin')}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-3 py-2 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-all"
              >
                Admin Demo
              </button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Demo credentials are pre-seeded in the backend and safe to use for testing flows like checkout, check-in, refunds, and AI tools.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default LoginRegister;
