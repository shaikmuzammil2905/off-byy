import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Heart,
  MapPin,
  Settings,
  Star,
  UserCheck,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useApp } from '../context/AppContext';
import { LocationModal } from './LocationModal';

interface SavedShopItem {
  id: number;
  name: string;
  categoryName: string;
  subcategoryName?: string;
  locality: string;
  city: string;
  distanceKm: number;
  coverImage: string;
  activeOffer?: { title: string; discount_badge: string } | null;
}

export const SavedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, location, toggleSaveShop } = useApp();
  const [savedShops, setSavedShops] = useState<SavedShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [locOpen, setLocOpen] = useState(false);

  const loadSaved = () => {
    if (!user) {
      setSavedShops([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiFetch<{ savedShops: SavedShopItem[] }>(
      `/saved?lat=${location.lat}&lng=${location.lng}`
    )
      .then((res) => setSavedShops(res.savedShops))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSaved();
  }, [user, location.lat, location.lng]);

  const handleRemove = async (e: React.MouseEvent, shopId: number) => {
    e.stopPropagation();
    await toggleSaveShop(shopId);
    setSavedShops((prev) => prev.filter((s) => s.id !== shopId));
  };

  return (
    <div className="min-h-screen pt-[76px] pb-[72px]">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-3 space-y-4">
        {/* Location Pill */}
        <button
          type="button"
          onClick={() => setLocOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 border border-blue-100 shadow-sm text-xs font-bold text-slate-800"
        >
          <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>
            {location.locality}, {location.city}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </button>

        {/* Header Row matching image copy 8.png */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#2563EB]" />
              <h1 className="font-display font-extrabold text-xl text-slate-900">Saved Shops</h1>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 pl-3">
              Your favourite shops, deals and services in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            aria-label="Settings"
            className="w-9 h-9 rounded-full bg-white/95 border border-blue-100 shadow-sm flex items-center justify-center hover:bg-blue-50"
          >
            <Settings className="w-4 h-4 text-slate-700" />
          </button>
        </div>

        {/* Animated Save Your Favorite Shops Banner matching image copy 8.png */}
        <div className="relative rounded-3xl overflow-hidden shadow-md min-h-[138px] flex items-center">
          <img
            src="/assets/hero-saved.jpg"
            alt="Save Your Favorite Shops"
            className="absolute inset-0 w-full h-full object-cover object-right animate-hero-bg"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1E40AF]/95 via-[#1D4ED8]/65 to-transparent" />
          <div className="relative z-10 p-4 max-w-[64%]">
            <h2 className="font-display font-extrabold text-lg leading-tight text-white">
              Save Your Favorite <span className="text-sky-300">Shops</span>
            </h2>
            <p className="text-[11px] text-blue-100 mt-1.5 leading-relaxed">
              Keep track of your loved shops and never miss their best offers.
            </p>
          </div>
        </div>

        {/* Account Options Card */}
        <div className="bg-white/95 rounded-2xl border border-blue-50 shadow-card divide-y divide-slate-100">
          <button
            type="button"
            onClick={() => setLocOpen(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-blue-50/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-[#1D4ED8] flex items-center justify-center">
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
            onClick={() => navigate('/profile?edit=1')}
            className="w-full flex items-center justify-between p-4 hover:bg-blue-50/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-[#1D4ED8] flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900">Manage Account</div>
                <div className="text-xs text-slate-500">Profile, email, password</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* My Saved Shops List */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#2563EB]" />
              <h2 className="font-display font-extrabold text-base text-slate-900">
                My Saved Shops ({savedShops.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="text-xs font-bold text-[#2563EB] inline-flex items-center gap-1 hover:underline"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {!user ? (
            <div className="bg-white/95 rounded-2xl border border-blue-100 p-6 text-center shadow-card">
              <Heart className="w-10 h-10 text-rose-400 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-slate-900">Sign in to view saved shops</h3>
              <p className="text-xs text-slate-500 mt-1">
                Save your favourite local shops and access them anytime.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-4 px-5 py-2.5 rounded-full bg-[#1D4ED8] text-white text-xs font-bold"
              >
                Sign In / Register
              </button>
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/80 animate-pulse" />
              ))}
            </div>
          ) : savedShops.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-white/95 border border-blue-100 shadow-card">
              <Heart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-slate-800">No saved shops yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tap the heart icon on any shop to save it here.
              </p>
              <button
                type="button"
                onClick={() => navigate('/explore')}
                className="mt-4 px-5 py-2 rounded-full bg-[#1D4ED8] text-white text-xs font-bold"
              >
                Explore Nearby Shops
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {savedShops.map((shop) => (
                <div
                  key={shop.id}
                  onClick={() => navigate(`/shop/${shop.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/shop/${shop.id}`)}
                  className="bg-white/95 rounded-2xl border border-blue-50 shadow-card p-3 flex gap-3.5 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="relative w-28 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    <img
                      src={shop.coverImage}
                      alt={shop.name}
                      className="w-full h-full object-cover"
                    />
                    {shop.activeOffer && (
                      <span className="absolute top-1.5 left-1.5 bg-[#DC2626] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
                        {shop.activeOffer.discount_badge}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm text-slate-900 truncate">
                          {shop.name}
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => handleRemove(e, shop.id)}
                          aria-label="Remove from saved"
                          className="p-1 -mr-1 -mt-1"
                        >
                          <Heart className="w-4 h-4 text-[#DC2626] fill-[#DC2626]" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {shop.categoryName}
                        {shop.subcategoryName ? ` • ${shop.subcategoryName}` : ''}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>
                          {shop.distanceKm} km • {shop.locality}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-[11px] font-bold text-slate-800">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        4.5
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#1D4ED8] text-white text-[11px] font-bold shadow-xs">
                        <span>View Offer</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <LocationModal open={locOpen} onClose={() => setLocOpen(false)} />
    </div>
  );
};
