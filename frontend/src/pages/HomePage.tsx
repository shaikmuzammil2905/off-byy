import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  Crosshair,
  MapPin,
  Mic,
  Search,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { Banner, Category, Offer, Shop, ShopUpdate } from '../types';
import { useApp } from '../context/AppContext';
import { OffbyLogo } from '../components/OffbyLogo';
import { CategoryIcon } from '../components/CategoryIcon';
import { ShopCard } from '../components/ShopCard';
import { LocationModal } from './LocationModal';

interface HomeData {
  banners: Banner[];
  categories: Category[];
  nearbyOffers: Shop[];
  latestOffers: Offer[];
  recentShops: Shop[];
  popularShops: Shop[];
  recommendedServices: any[];
  latestUpdates: ShopUpdate[];
}

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, location, setLocation, showToast } = useApp();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [locOpen, setLocOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiFetch<HomeData>(`/home?lat=${location.lat}&lng=${location.lng}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [location.lat, location.lng]);

  useEffect(() => {
    if (!data?.banners?.length) return;
    const timer = setInterval(() => {
      setBannerIdx((i) => (i + 1) % data.banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [data?.banners?.length]);

  const handleQuickGPS = () => {
    if (!navigator.geolocation) {
      setLocOpen(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          city: 'Hyderabad',
          locality: 'Current Location',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        showToast('Updated to your current GPS location');
      },
      () => setLocOpen(true)
    );
  };

  const activeBanner = data?.banners?.[bannerIdx];

  return (
    <div className="min-h-screen bg-[#F4F7FC] pb-24 safe-top">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto bg-white min-h-screen shadow-sm">
        {/* Top Header */}
        <header className="px-4 pt-3 pb-3 bg-white sticky top-0 z-30 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              aria-label="Notifications"
              className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center relative"
            >
              <Bell className="w-5 h-5 text-slate-700" />
              <span className="w-2 h-2 bg-[#DC2626] rounded-full absolute top-2.5 right-2.5" />
            </button>

            <OffbyLogo size="md" />

            <button
              type="button"
              onClick={() => navigate('/profile')}
              aria-label="User profile"
              className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center overflow-hidden"
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
              ) : (
                <UserIcon className="w-5 h-5 text-slate-700" />
              )}
            </button>
          </div>

          {/* Location Selector Row */}
          <div className="flex items-center justify-between mt-2.5">
            <button
              type="button"
              onClick={() => setLocOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 hover:text-brand-700"
            >
              <MapPin className="w-4 h-4 text-[#2563EB]" />
              <span>
                {location.locality}, {location.city}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={handleQuickGPS}
              title="Detect current location"
              aria-label="Detect current location"
              className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center hover:bg-brand-100"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar */}
          <button
            type="button"
            onClick={() => navigate('/explore?focus=1')}
            className="mt-3 w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/90 text-left hover:border-brand-300 transition-colors"
          >
            <Search className="w-[18px] h-[18px] text-slate-400 flex-shrink-0" />
            <span className="flex-1 text-sm text-slate-400 truncate">
              Search shops, services or offers
            </span>
            <Mic className="w-[18px] h-[18px] text-slate-400 flex-shrink-0" />
          </button>
        </header>

        <main className="px-4 py-4 space-y-6">
          {/* Hero Promotional Banner Carousel */}
          {activeBanner && (
            <section aria-label="Promotions">
              <div
                onClick={() => navigate(activeBanner.link_type === 'explore' ? '/explore' : '/offers')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/offers')}
                style={{ background: activeBanner.bg_gradient }}
                className="relative rounded-2xl p-5 text-white overflow-hidden shadow-md cursor-pointer transition-all"
              >
                <div className="relative z-10 max-w-[65%]">
                  <h1 className="font-display font-extrabold text-[21px] leading-tight">
                    {activeBanner.title}
                  </h1>
                  <p className="text-xs text-blue-100 mt-1.5 leading-relaxed">
                    {activeBanner.subtitle}
                  </p>
                </div>

                {/* Decorative Pin + Bag + % Graphic matching reference */}
                <div className="absolute right-3 bottom-2 top-2 w-28 flex items-center justify-center pointer-events-none">
                  <div className="relative w-24 h-24">
                    <div className="absolute right-2 top-0 w-14 h-14 rounded-full bg-sky-300/30 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-white drop-shadow" />
                    </div>
                    <div className="absolute left-2 bottom-1 w-14 h-14 rounded-2xl bg-amber-400 shadow-lg flex items-center justify-center rotate-6">
                      <span className="font-display font-black text-2xl text-white">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dots */}
              <div className="flex items-center justify-center gap-1.5 mt-2.5">
                {data.banners.map((b, idx) => (
                  <button
                    key={b.id}
                    type="button"
                    aria-label={`Slide ${idx + 1}`}
                    onClick={() => setBannerIdx(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === bannerIdx ? 'w-5 bg-[#2563EB]' : 'w-1.5 bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Browse Categories */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-[17px] text-slate-900">
                Browse Categories
              </h2>
              <button
                type="button"
                onClick={() => navigate('/categories')}
                className="text-xs font-semibold text-[#2563EB] hover:underline"
              >
                View All
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {data?.categories.slice(0, 6).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => navigate(`/explore?categoryId=${cat.id}`)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-100 shadow-card hover:shadow-md active:scale-95 transition-all"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
                      style={{ backgroundColor: cat.bg_color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-6 h-6" color={cat.icon_color} />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 truncate w-full text-center">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Nearby Offers For You */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-[17px] text-slate-900">
                Nearby Offers for You
              </h2>
              <button
                type="button"
                onClick={() => navigate('/offers')}
                className="text-xs font-semibold text-[#2563EB] hover:underline"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
                ))
              ) : (
                data?.nearbyOffers.slice(0, 5).map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))
              )}
            </div>
          </section>

          {/* Latest Offers Carousel */}
          {data && data.latestOffers.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-[17px] text-slate-900">
                  Latest Offers
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/offers')}
                  className="text-xs font-semibold text-[#2563EB] hover:underline"
                >
                  See All
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {data.latestOffers.map((offer) => (
                  <div
                    key={offer.id}
                    onClick={() => navigate(`/shop/${offer.shop_id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/shop/${offer.shop_id}`)}
                    className="flex-shrink-0 w-64 rounded-2xl bg-gradient-to-br from-rose-50 to-white border border-rose-100 p-3.5 shadow-card cursor-pointer hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="bg-[#DC2626] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        {offer.discount_badge}
                      </span>
                      <span className="text-[11px] text-slate-500">{offer.distanceKm} km</span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 mt-2 line-clamp-1">
                      {offer.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 truncate">{offer.shop_name}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Valid till {new Date(offer.valid_until).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Popular Shops Near You */}
          {data && data.popularShops.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-[17px] text-slate-900">
                  Popular Shops Near You
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/explore')}
                  className="text-xs font-semibold text-[#2563EB] hover:underline"
                >
                  Explore
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {data.popularShops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} variant="compact" />
                ))}
              </div>
            </section>
          )}

          {/* Recently Added Shops */}
          {data && data.recentShops.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-[17px] text-slate-900">
                  Recently Added Shops
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/explore?sort=latest')}
                  className="text-xs font-semibold text-[#2563EB] hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {data.recentShops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} variant="compact" />
                ))}
              </div>
            </section>
          )}

          {/* Recommended Services */}
          {data && data.recommendedServices.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-[17px] text-slate-900">
                  Recommended Services
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/explore')}
                  className="text-xs font-semibold text-[#2563EB] hover:underline"
                >
                  Explore
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {data.recommendedServices.slice(0, 4).map((sv) => (
                  <button
                    key={sv.id}
                    type="button"
                    onClick={() => navigate(`/shop/${sv.shop_id}`)}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-left hover:border-brand-300 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-brand-700 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="truncate">{sv.name}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 truncate">{sv.shop_name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {sv.price || sv.category_name} • {sv.distanceKm} km
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Latest Shop Updates */}
          {data && data.latestUpdates.length > 0 && (
            <section className="pb-2">
              <h2 className="font-display font-bold text-[17px] text-slate-900 mb-3">
                Latest Shop Updates
              </h2>
              <div className="space-y-2.5">
                {data.latestUpdates.slice(0, 4).map((u) => (
                  <div
                    key={u.id}
                    onClick={() => navigate(`/shop/${u.shop_id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/shop/${u.shop_id}`)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/70"
                  >
                    <img
                      src={u.image_url || u.shop_cover}
                      alt={u.shop_name || 'Shop update'}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-slate-200"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-brand-700 truncate">
                          {u.shop_name}
                        </span>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {u.distanceKm} km
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-0.5 line-clamp-2">{u.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      <LocationModal open={locOpen} onClose={() => setLocOpen(false)} />

      {/* Notifications Drawer */}
      {notifOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-start justify-center pt-14 px-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-4 shadow-2xl">
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
                <p className="text-xs font-bold text-brand-800">Flat 20% OFF at Bean & Brew Café</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Claim your beverage discount in {location.locality} today!
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-800">TechWorld Electronics Mega Sale</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Up to 40% OFF on laptops, mobiles & accessories at KPHB.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
