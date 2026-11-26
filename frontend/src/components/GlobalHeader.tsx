import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User as UserIcon, X } from 'lucide-react';
import { OffbyLogo } from './OffbyLogo';
import { useApp } from '../context/AppContext';

export const GlobalHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user, location } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 safe-top">
        <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto relative bg-gradient-to-b from-[#E8F3FF]/95 via-white/95 to-white/90 backdrop-blur-md border-b border-blue-100/80 shadow-sm">
          {/* Subtle top blue wave highlight matching reference */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-[#2563EB] via-[#38BDF8] to-[#1D4ED8] opacity-90"
          />

          <div className="px-4 h-16 flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              aria-label="Notifications"
              className="w-10 h-10 rounded-full bg-white shadow-sm border border-blue-100 flex items-center justify-center relative hover:bg-blue-50 transition-colors"
            >
              <Bell className="w-5 h-5 text-slate-700" />
              <span className="w-2.5 h-2.5 bg-[#DC2626] rounded-full absolute top-2 right-2 ring-2 ring-white" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label="offby Home"
              className="flex items-center justify-center focus:outline-none"
            >
              <OffbyLogo size="md" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/profile')}
              aria-label="User profile"
              className="w-10 h-10 rounded-full bg-white shadow-sm border border-blue-100 flex items-center justify-center overflow-hidden hover:bg-blue-50 transition-colors"
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-5 h-5 text-slate-700" />
              )}
            </button>
          </div>
        </div>
      </header>

      {notifOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/50 flex items-start justify-center pt-16 px-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-4 shadow-2xl border border-blue-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Notifications</h3>
              <button
                type="button"
                onClick={() => setNotifOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto">
              <div className="p-3 rounded-xl bg-brand-50 border border-brand-100">
                <p className="text-xs font-bold text-brand-800">
                  Flat 20% OFF at Bean & Brew Café
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Claim your beverage discount in {location.locality} today!
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-800">
                  TechWorld Electronics Mega Sale
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Up to 40% OFF on laptops, mobiles & accessories at KPHB.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
