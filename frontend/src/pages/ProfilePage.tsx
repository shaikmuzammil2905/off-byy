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
    <div className="min-h-screen pt-[76px] pb-24">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-3 space-y-4">
        {/* Header Row matching image copy 9.png */}
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-[#2563EB]" />
            <h1 className="font-display font-extrabold text-xl text-slate-900">Profile</h1>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 pl-3">
            Manage your account, shops and preferences.
          </p>
        </div>

        {/* Hero Welcome / Signed-In Card matching image copy 9.png */}
        {user ? (
          <div className="relative rounded-3xl overflow-hidden shadow-md p-5 text-white">
            <img
              src="/assets/hero-deals.png"
              alt="Profile"
              className="absolute inset-0 w-full h-full object-cover object-right animate-hero-bg opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1E40AF]/95 via-[#1D4ED8]/85 to-[#0EA5E9]/75" />
            <div className="relative z-10 flex items-center gap-4">
              <img
                src={
                  user.avatar_url ||
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80'
                }
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white/70"
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
              className="relative z-10 mt-4 w-full py-2.5 rounded-xl bg-white text-[#1D4ED8] text-xs font-extrabold flex items-center justify-center gap-1.5 shadow"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>
        ) : (
          <div className="relative rounded-3xl overflow-hidden shadow-md min-h-[154px] flex items-center">
            <img
              src="/assets/hero-profile.jpg"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/assets/hero-deals.png';
              }}
              alt="Welcome to offby"
              className="absolute inset-0 w-full h-full object-cover object-right animate-hero-bg"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1E40AF]/95 via-[#1D4ED8]/70 to-transparent" />
            <div className="relative z-10 p-5 max-w-[66%]">
              <h2 className="font-display font-extrabold text-xl text-white leading-tight">
                Welcome to offby
              </h2>
              <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                Sign in with Mobile OTP or Email to manage your profile and saved shops.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-3 px-4 py-2 rounded-full bg-white text-[#1D4ED8] text-xs font-extrabold inline-flex items-center gap-1.5 shadow"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            </div>
          </div>
        )}

        {/* Account & Navigation Card matching image copy 9.png */}
        <div className="bg-white/95 rounded-2xl border border-blue-50 shadow-card divide-y divide-slate-100">
          <button
            type="button"
            onClick={() => setLocOpen(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-blue-50/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900">My Location</div>
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
            className="w-full flex items-center justify-between p-4 hover:bg-blue-50/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#DC2626] flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900">Saved Shops</div>
                <div className="text-xs text-slate-500">Your favourite shops and services</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/vendor')}
            className="w-full flex items-center justify-between p-4 hover:bg-blue-50/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900">Vendor Application</div>
                <div className="text-xs text-slate-500">Register or manage your shop</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="w-full flex items-center justify-between p-4 hover:bg-blue-50/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900">Admin Panel</div>
                <div className="text-xs text-slate-500">Platform management &amp; approvals</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Legal & Support Card matching image copy 9.png */}
        <div className="bg-white/95 rounded-2xl border border-blue-50 shadow-card divide-y divide-slate-100">
          <button
            type="button"
            onClick={() =>
              setInfoModal({
                title: 'Privacy Policy',
                body: 'offby collects only your selected location, profile contact details, and saved shop preferences to show relevant nearby offers. Your data is never sold to third parties.',
              })
            }
            className="w-full flex items-center justify-between p-4 hover:bg-blue-50/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900">Privacy Policy</div>
                <div className="text-xs text-slate-500">Your data and privacy</div>
              </div>
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
            className="w-full flex items-center justify-between p-4 hover:bg-blue-50/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900">Terms &amp; Conditions</div>
                <div className="text-xs text-slate-500">App usage terms and guidelines</div>
              </div>
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
            className="w-full flex items-center justify-between p-4 hover:bg-blue-50/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900">Help &amp; Support</div>
                <div className="text-xs text-slate-500">Get assistance and resolve your queries</div>
              </div>
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
            className="w-full py-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-[#DC2626] font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-100"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        )}
      </div>

      <LocationModal open={locOpen} onClose={() => setLocOpen(false)} />

      {/* Edit Profile Modal */}
      {editOpen && user && (
        <div className="fixed inset-0 z-[70] bg-slate-900/50 flex items-end sm:items-center justify-center">
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
        <div className="fixed inset-0 z-[70] bg-slate-900/50 flex items-center justify-center p-4">
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
