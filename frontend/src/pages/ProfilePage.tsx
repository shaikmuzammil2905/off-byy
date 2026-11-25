import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronRight,
  Edit3,
  FileText,
  Heart,
  HelpCircle,
  LogIn,
  LogOut,
  MapPin,
  Shield,
  ShieldCheck,
  Store,
  X,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useApp } from '../context/AppContext';
import { LocationModal } from './LocationModal';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, location, logout, refreshUser, showToast } = useApp();

  const [editOpen, setEditOpen] = useState(searchParams.get('edit') === '1');
  const [locOpen, setLocOpen] = useState(false);
  const [infoModal, setInfoModal] = useState<{ title: string; body: string } | null>(null);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (searchParams.get('edit') === '1' && user) {
      setEditOpen(true);
    }
  }, [searchParams, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          email: email || undefined,
          phone: phone || undefined,
          password: password || undefined,
        }),
      });
      await refreshUser();
      showToast('Profile updated successfully');
      setEditOpen(false);
      setPassword('');
      setSearchParams({});
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] pb-24 safe-top">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto bg-white min-h-screen shadow-sm">
        <header className="px-4 pt-4 pb-3 border-b border-slate-100">
          <h1 className="font-display font-bold text-xl text-slate-900">Profile</h1>
        </header>

        <main className="px-4 py-4 space-y-5">
          {user ? (
            <div className="bg-gradient-to-br from-[#1D4ED8] to-[#0EA5E9] text-white rounded-2xl p-5 shadow-md">
              <div className="flex items-center gap-4">
                <img
                  src={
                    user.avatar_url ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80'
                  }
                  alt={user.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white/60"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="font-display font-bold text-lg truncate">{user.name}</h2>
                  {user.phone && <p className="text-xs text-blue-100">{user.phone}</p>}
                  {user.email && <p className="text-xs text-blue-100 truncate">{user.email}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="mt-4 w-full py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold flex items-center justify-center gap-1.5 backdrop-blur-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          ) : (
            <div className="bg-brand-50 rounded-2xl border border-brand-100 p-5 text-center">
              <h2 className="font-bold text-base text-slate-900">Welcome to offby</h2>
              <p className="text-xs text-slate-600 mt-1">
                Sign in with Mobile OTP or Email to manage your profile and saved shops.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-4 px-6 py-2.5 rounded-xl bg-[#1D4ED8] text-white text-xs font-bold inline-flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Register</span>
              </button>
            </div>
          )}

          {/* Account & Navigation */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card divide-y divide-slate-100">
            <button
              type="button"
              onClick={() => setLocOpen(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-brand-600" />
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-900">My Location</div>
                  <div className="text-xs text-slate-500">
                    {location.locality}, {location.city}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/saved')}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-[#DC2626]" />
                <span className="text-sm font-semibold text-slate-900">Saved Shops</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/vendor')}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-emerald-600" />
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-900">Vendor Application</div>
                  <div className="text-xs text-slate-500">Register or manage your shop</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-900">Admin Panel</div>
                  <div className="text-xs text-slate-500">Platform management & approvals</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Legal & Support */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card divide-y divide-slate-100">
            <button
              type="button"
              onClick={() =>
                setInfoModal({
                  title: 'Privacy Policy',
                  body: 'offby collects only your selected location, profile contact details, and saved shop preferences to show relevant nearby offers. Your data is never sold to third parties.',
                })
              }
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-slate-500" />
                <span className="text-sm font-semibold text-slate-900">Privacy Policy</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() =>
                setInfoModal({
                  title: 'Terms & Conditions',
                  body: 'Offers displayed on offby are published directly by verified local vendors. Please verify offer validity and terms at the shop counter before billing.',
                })
              }
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-500" />
                <span className="text-sm font-semibold text-slate-900">Terms & Conditions</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() =>
                setInfoModal({
                  title: 'Help & Support',
                  body: 'Need assistance? Email us at support@offby.in or call our local partner desk between 9:00 AM and 8:00 PM IST.',
                })
              }
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-slate-500" />
                <span className="text-sm font-semibold text-slate-900">Help & Support</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {user && (
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="w-full py-3.5 rounded-2xl bg-rose-50 text-[#DC2626] font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-100"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </main>
      </div>

      <LocationModal open={locOpen} onClose={() => setLocOpen(false)} />

      {/* Edit Profile Modal */}
      {editOpen && user && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Edit Profile</h3>
              <button
                type="button"
                onClick={() => {
                  setEditOpen(false);
                  setSearchParams({});
                }}
                className="p-1.5 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Mobile Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                New Password (optional)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep unchanged"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-[#1D4ED8] text-white font-bold text-sm"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Info Modal */}
      {infoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">{infoModal.title}</h3>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">{infoModal.body}</p>
            <button
              type="button"
              onClick={() => setInfoModal(null)}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
