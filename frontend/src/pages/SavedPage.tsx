import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Edit3,
  Heart,
  MapPin,
  Settings,
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
    <div className="min-h-screen bg-[#F4F7FC] pb-24 safe-top">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto bg-white min-h-screen shadow-sm">
        {/* Header */}
        <header className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-slate-100">
          <h1 className="font-display font-bold text-xl text-slate-900">Saved Shops</h1>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            aria-label="Settings"
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
          >
            <Settings className="w-5 h-5 text-slate-700" />
          </button>
        </header>

        <main className="px-4 py-4 space-y-5">
          {/* Profile Summary Card */}
          {user ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-4">
              <div
                onClick={() => navigate('/profile')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/profile')}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={
                      user.avatar_url ||
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80'
                    }
                    alt={user.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-brand-100"
                  />
                  <div>
                    <h2 className="font-bold text-base text-slate-900">{user.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {user.phone || user.email}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/profile?edit=1');
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-[#1D4ED8] text-xs font-semibold"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Profile</span>
                    </button>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          ) : (
            <div className="bg-brand-50 rounded-2xl border border-brand-100 p-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-slate-900">Sign in to save shops</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Sync your favourite shops across devices.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-4 py-2 rounded-xl bg-[#1D4ED8] text-white text-xs font-bold"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Account Options */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card divide-y divide-slate-100">
            <button
              type="button"
              onClick={() => setLocOpen(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-50 text-[#1D4ED8] flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
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
              onClick={() => navigate('/profile?edit=1')}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-50 text-[#1D4ED8] flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-900">Manage Account</div>
                  <div className="text-xs text-slate-500">Profile, email, password</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Saved Shops List */}
          <section>
            <h2 className="font-display font-bold text-base text-slate-900 mb-3">
              My Saved Shops ({savedShops.length})
            </h2>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : savedShops.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-slate-100">
                <Heart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-sm text-slate-800">No saved shops yet</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tap the heart icon on any shop to save it here for quick access.
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
                    className="bg-white rounded-2xl border border-slate-100 shadow-card p-3 flex gap-3.5 cursor-pointer hover:shadow-md transition-all"
                  >
                    <img
                      src={shop.coverImage}
                      alt={shop.name}
                      className="w-24 h-24 rounded-xl object-cover flex-shrink-0 bg-slate-100"
                    />
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
                      {shop.activeOffer && (
                        <div className="mt-2 bg-[#EFF6FF] text-[#1D4ED8] text-[11px] font-semibold px-2.5 py-1 rounded-lg truncate">
                          {shop.activeOffer.title}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <LocationModal open={locOpen} onClose={() => setLocOpen(false)} />
    </div>
  );
};
