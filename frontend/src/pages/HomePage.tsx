import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  Crosshair,
  HeartPulse,
  LayoutGrid,
  MapPin,
  Mic,
  QrCode,
  Search,
  Star,
  Tag,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { Banner, Category, Offer, Shop, ShopUpdate } from '../types';
import { useApp } from '../context/AppContext';
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
  const { location, setLocation, showToast } = useApp();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [locOpen, setLocOpen] = useState(false);

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
    <div className="min-h-screen pt-[76px] pb-24">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-3 space-y-5">
        {/* Location Pill + GPS Detect */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setLocOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 border border-blue-100 shadow-sm text-xs font-bold text-slate-800 hover:border-brand-300"
          >
            <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>
              {location.locality}, {location.city}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          <button
            type="button"
            onClick={handleQuickGPS}
            title="Detect current location"
            aria-label="Detect current location"
            className="w-9 h-9 rounded-full bg-white/95 border border-blue-100 shadow-sm text-brand-700 flex items-center justify-center hover:bg-brand-50"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* Blue-bordered Search Bar */}
        <button
          type="button"
          onClick={() => navigate('/explore?focus=1')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/95 border-2 border-[#3B82F6]/60 shadow-sm text-left hover:border-[#2563EB] transition-colors"
        >
          <Search className="w-[18px] h-[18px] text-[#2563EB] flex-shrink-0" />
          <span className="flex-1 text-sm text-slate-500 truncate">
            Search shops, services or offers
          </span>
          <Mic className="w-[18px] h-[18px] text-slate-500 flex-shrink-0" />
        </button>

        {/* Animated Hero Banner using image copy 2.png */}
        <section aria-label="Promotions">
          <div
            onClick={() =>
              navigate(activeBanner?.link_type === 'explore' ? '/explore' : '/offers')
            }
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/offers')}
            className="relative rounded-3xl overflow-hidden shadow-lg cursor-pointer min-h-[168px] sm:min-h-[190px] flex items-center"
          >
            <img
              src="/assets/hero-deals.png"
              alt="Discover Great Deals Near You"
              className="absolute inset-0 w-full h-full object-cover object-right animate-hero-bg"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1E40AF]/95 via-[#1D4ED8]/70 to-transparent" />
            <div
              aria-hidden="true"
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer pointer-events-none"
            />

            <div className="relative z-10 p-5 max-w-[65%] sm:max-w-[55%]">
              <h1 className="font-display font-extrabold text-[21px] sm:text-2xl leading-tight text-white drop-shadow-sm">
                {activeBanner?.title || 'Discover Great Deals Near You'}
              </h1>
              <p className="text-xs text-blue-100 mt-1.5 leading-relaxed line-clamp-2">
                {activeBanner?.subtitle ||
                  'Find nearby shops, exclusive offers & local services instantly.'}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#1D4ED8] text-xs font-extrabold shadow-md">
                <span>Explore Offers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Dots */}
          {data?.banners && data.banners.length > 0 && (
            <div className="flex items-center justify-center gap-1.5 mt-2.5">
              {data.banners.map((b, idx) => (
                <button
                  key={b.id}
                  type="button"
                  aria-label={`Slide ${idx + 1}`}
                  onClick={() => setBannerIdx(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === bannerIdx ? 'w-6 bg-[#2563EB]' : 'w-1.5 bg-blue-200'
                  }`}
                />
              ))}
            </div>
          )}
        </section>

        {/* Browse Categories — 4x2 Grid matching image copy 4.png */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#2563EB]" />
              <h2 className="font-display font-extrabold text-[17px] text-slate-900">
                Browse Categories
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/categories')}
              className="text-xs font-bold text-[#2563EB] inline-flex items-center gap-1 hover:underline"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-4 gap-2.5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/80 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2.5">
              {data?.categories.slice(0, 6).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => navigate(`/category/${cat.id}`)}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/95 border border-blue-50 shadow-card hover:shadow-md active:scale-95 transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1.5 shadow-xs"
                    style={{ backgroundColor: cat.bg_color }}
                  >
                    <CategoryIcon name={cat.icon} className="w-6 h-6" color={cat.icon_color} />
                  </div>
                  <span className="text-[11.5px] font-bold text-slate-800 truncate w-full text-center">
                    {cat.name}
                  </span>
                </button>
              ))}

              {/* Health card (opens Services / Medical & Pharmacy) */}
              <button
                type="button"
                onClick={() => {
                  const servicesCat = data?.categories.find((c) => c.slug === 'services');
                  navigate(servicesCat ? `/category/${servicesCat.id}` : '/categories');
                }}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/95 border border-blue-50 shadow-card hover:shadow-md active:scale-95 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1.5 bg-[#FFF1F2]">
                  <HeartPulse className="w-6 h-6 text-[#E11D48]" />
                </div>
                <span className="text-[11.5px] font-bold text-slate-800 truncate w-full text-center">
                  Health
                </span>
              </button>

              {/* More card (opens All Categories page) */}
              <button
                type="button"
                onClick={() => navigate('/categories')}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/95 border border-blue-50 shadow-card hover:shadow-md active:scale-95 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1.5 bg-[#EFF6FF]">
                  <LayoutGrid className="w-6 h-6 text-[#2563EB]" />
                </div>
                <span className="text-[11.5px] font-bold text-slate-800 truncate w-full text-center">
                  More
                </span>
              </button>
            </div>
          )}
        </section>

        {/* Nearby Offers for You — 3-column horizontal cards matching image copy 5.png */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#2563EB]" />
              <h2 className="font-display font-extrabold text-[17px] text-slate-900">
                Nearby Offers for You
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/offers')}
              className="text-xs font-bold text-[#2563EB] inline-flex items-center gap-1 hover:underline"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {data?.nearbyOffers.slice(0, 3).map((shop) => (
              <div
                key={shop.id}
                onClick={() => navigate(`/shop/${shop.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/shop/${shop.id}`)}
                className="bg-white/95 rounded-2xl border border-blue-50 shadow-card overflow-hidden cursor-pointer hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative h-24 sm:h-28 bg-slate-100">
                  <img
                    src={shop.coverImage}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1.5 left-1.5 bg-white/95 text-slate-900 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 shadow-sm">
                    <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                    {shop.rating.toFixed(1)}
                  </span>
                  {shop.activeOffer && (
                    <span className="absolute bottom-1.5 right-1.5 bg-[#DC2626] text-white text-[9.5px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                      {shop.activeOffer.discount_badge}
                    </span>
                  )}
                </div>
                <div className="p-2 flex items-center justify-between gap-1 flex-1">
                  <div className="min-w-0">
                    <h3 className="font-bold text-[11.5px] text-slate-900 truncate">
                      {shop.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 truncate">
                      {shop.locality} • {shop.distanceKm} km
                    </p>
                  </div>
                  <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Action Strip matching image copy 5.png */}
        <section className="grid grid-cols-4 gap-2 bg-white/95 rounded-2xl p-3 border border-blue-100 shadow-card">
          {[
            { label: 'Scan & Save', icon: QrCode, color: 'text-slate-700', path: '/offers' },
            { label: "Today's Deals", icon: Tag, color: 'text-[#2563EB]', path: '/offers' },
            { label: 'Near Me', icon: MapPin, color: 'text-[#2563EB]', path: '/explore?sort=nearest' },
            { label: 'Top Rated', icon: Star, color: 'text-[#2563EB]', path: '/explore?sort=best_offer' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center gap-1 py-1 hover:bg-blue-50/70 rounded-xl transition-colors"
              >
                <Icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-[10.5px] font-bold text-slate-800 text-center">
                  {item.label}
                </span>
              </button>
            );
          })}
        </section>

        {/* Popular Shops Near You */}
        {data && data.popularShops.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-[#2563EB]" />
                <h2 className="font-display font-extrabold text-[17px] text-slate-900">
                  Popular Shops Near You
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/explore')}
                className="text-xs font-bold text-[#2563EB] hover:underline"
              >
                Explore →
              </button>
            </div>
            <div className="space-y-3">
              {data.popularShops.slice(0, 4).map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          </section>
        )}

        {/* Latest Updates */}
        {data && data.latestUpdates.length > 0 && (
          <section className="pb-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-5 rounded-full bg-[#2563EB]" />
              <h2 className="font-display font-extrabold text-[17px] text-slate-900">
                Latest Shop Updates
              </h2>
            </div>
            <div className="space-y-2.5">
              {data.latestUpdates.slice(0, 3).map((u) => (
                <div
                  key={u.id}
                  onClick={() => navigate(`/shop/${u.shop_id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/shop/${u.shop_id}`)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/95 border border-blue-50 shadow-card cursor-pointer hover:shadow-md"
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
      </div>

      <LocationModal open={locOpen} onClose={() => setLocOpen(false)} />
    </div>
  );
};
