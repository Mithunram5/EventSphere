import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';
import StatCard from '../components/dashboard/StatCard';
import { StatsSkeleton } from '../components/common/LoadingSkeleton';
import api from '../utils/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, users
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      toast.error('Failed to load platform analytics.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await api.get('/admin/users');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      toast.error('Failed to load user records.');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        toast.success('User role updated successfully.');
        fetchUsers(); // Refresh list
        fetchAdminStats(); // Refresh stats
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update role.';
      toast.error(msg);
    }
  };

  const handleBanUser = async (userId) => {
    if (!window.confirm('Are you sure you want to ban/delete this user? All their credentials will be removed.')) return;

    try {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.data.success) {
        toast.success('User deleted from platform.');
        fetchUsers(); // Refresh
        fetchAdminStats(); // Refresh stats
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Delete operation failed.';
      toast.error(msg);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 font-sans space-y-10 pb-20">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Admin Panel</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor transaction volumes, user distribution, and administer platform roles.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-850 gap-6">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === 'analytics'
              ? 'text-brand-500'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Platform Analytics
          {activeTab === 'analytics' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === 'users'
              ? 'text-brand-500'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          User Moderation Desk
          {activeTab === 'users' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab Contents: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-10">
          {loading || !stats ? (
            <StatsSkeleton />
          ) : (
            <>
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Users Registered"
                  value={stats.users.total}
                  icon={
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  }
                  colorClass="bg-sky-500"
                  trendText={`${stats.users.attendee} attendees, ${stats.users.organiser} organisers`}
                />
                <StatCard
                  title="Active Event Listings"
                  value={stats.events.total}
                  icon={
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                  colorClass="bg-purple-500"
                  trendText="Listed upcoming summits"
                />
                <StatCard
                  title="Gross Revenue Volume"
                  value={`₹${stats.bookings.revenue}`}
                  icon={
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  colorClass="bg-emerald-500"
                  trendText={`${stats.bookings.total} successful checkouts`}
                />
                <StatCard
                  title="Check-In Efficiency"
                  value={`${stats.tickets.checkInRate}%`}
                  icon={
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  }
                  colorClass="bg-pink-500"
                  trendText={`${stats.tickets.checkedIn} scanned barcodes`}
                />
              </div>

              {/* Monthly Revenue Chart */}
              {stats.trends && stats.trends.length > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors duration-200">
                  <h3 className="text-md font-bold text-slate-850 dark:text-white mb-6">Monthly Revenue Volume (INR)</h3>
                  <div className="h-80 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.trends}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                        <XAxis dataKey="month" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                        <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab Contents: Users */}
      {activeTab === 'users' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors duration-200">
          <h3 className="text-md font-bold text-slate-850 dark:text-white mb-6">User Accounts Registry</h3>

          {usersLoading ? (
            <div className="flex flex-col items-center gap-4 py-12 animate-pulse">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Loading users registry...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-2">Name</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Registration Date</th>
                    <th className="py-3 px-2">Current Role</th>
                    <th className="py-3 px-2 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item._id} className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/40 dark:hover:bg-slate-850/40 transition-colors">
                      <td className="py-4 px-2 font-bold text-slate-800 dark:text-slate-200">{item.name}</td>
                      <td className="py-4 px-2 text-slate-500 dark:text-slate-400">{item.email}</td>
                      <td className="py-4 px-2 text-slate-500 dark:text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-2">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          item.role === 'admin' 
                            ? 'bg-red-50 text-red-600 dark:bg-red-950/20' 
                            : item.role === 'organiser' 
                            ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/20' 
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          {/* Role Selector dropdown */}
                          <select
                            value={item.role}
                            onChange={(e) => handleRoleChange(item._id, e.target.value)}
                            className="bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg p-1.5 text-[10px] text-slate-700 dark:text-slate-300 font-semibold focus:outline-none"
                          >
                            <option value="attendee">Attendee</option>
                            <option value="organiser">Organiser</option>
                            <option value="admin">Admin</option>
                          </select>

                          {/* Ban Action */}
                          <button
                            onClick={() => handleBanUser(item._id)}
                            className="text-[10px] font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2 py-1.5 border border-red-100 rounded-lg dark:border-red-950/40 hover:bg-red-50/50"
                          >
                            Ban / Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
