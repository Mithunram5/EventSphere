import React, { useState, useContext } from 'react';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
  const { user, updateProfile } = useContext(AuthContext);

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [shareLinkedIn, setShareLinkedIn] = useState(user?.shareLinkedIn || false);
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedinUrl || '');
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    setUpdating(true);
    try {
      const data = { name, bio, shareLinkedIn, linkedinUrl };
      if (password) data.password = password;

      const res = await updateProfile(data);
      if (res.success) {
        toast.success('Profile updated successfully!');
        setPassword('');
        setConfirmPassword('');
      } else {
        toast.error(res.error || 'Failed to update profile.');
      }
    } catch (err) {
      toast.error('Error saving updates.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 font-sans pb-20 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Profile Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your credentials and review account details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card Summary */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col items-center text-center space-y-4 h-fit transition-colors duration-200">
          <div className="gradient-bg flex h-20 w-20 items-center justify-center rounded-full text-3xl font-extrabold text-white shadow-md">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-white text-base">{user?.name}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{user?.email}</p>
          </div>
          <span className="inline-block rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            {user?.role} Role
          </span>
          {user?.bio && (
            <p className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-4 leading-relaxed">
              {user.bio}
            </p>
          )}
        </div>

        {/* Update Form */}
        <div className="md:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors duration-200">
          <form onSubmit={handleUpdate} className="space-y-4">
            <h3 className="text-md font-bold text-slate-800 dark:text-white mb-4">Edit Profile Info</h3>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Short Bio
              </label>
              <textarea
                rows={3}
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {user?.role === 'attendee' && (
              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white font-sans">Professional Networking Directory</h4>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="shareLinkedIn"
                    checked={shareLinkedIn}
                    onChange={(e) => setShareLinkedIn(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-200 text-brand-500 focus:ring-brand-500"
                  />
                  <label htmlFor="shareLinkedIn" className="text-xs text-slate-700 dark:text-slate-200 font-semibold select-none cursor-pointer">
                    Opt-in to share my LinkedIn with other attendees of this event
                  </label>
                </div>
                {shareLinkedIn && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      required={shareLinkedIn}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">Change Password (Optional)</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="gradient-btn rounded-xl px-6 py-3 text-sm font-bold shadow"
            >
              {updating ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
