import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  Flame,
  Heart,
  LayoutGrid,
  MapPin,
  Mic,
  Search,
  Tag,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { Category, Offer } from '../types';
import { useApp } from '../context/AppContext';

export const OffersPage: React.FC = () => {
  const navigate = useNavigate();
  const { location, savedIds, toggleSaveShop } = useApp();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [maxDistance, setMaxDistance] = useState('10');
  const [sort, setSort] = useState('best_offer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ categories: Category[] }>('/categories')
      .then((res) => setCategories(res.categories))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      q: query,
      categoryId,
      maxDistance,
      lat: String(location.lat),
      lng: String(location.lng),
      sort,
    });
    apiFetch<{ offers: Offer[] }>(`/offers?${params.toString()}`)
      .then((res) => setOffers(res.offers))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query, categoryId, maxDistance, sort, location.lat, location.lng]);

  return (
    <div className="min-h-screen pt-[76px] pb-24">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-3 space-y-3.5">
        {/* Header Row matching image copy 7.png */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#2563EB]" />
              <h1 className="font-display font-extrabold text-xl text-slate-900">Best Offers</h1>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 pl-3">
              Active deals near {location.locality}, {location.city}
            </p>
          </div>
          <span className="bg-rose-50 border border-rose-200 text-[#DC2626] text-xs font-extrabold px-3 py-1 rounded-full inline-flex items-center gap-1 shadow-xs">
            <Flame className="w-3.5 h-3.5 fill-[#DC2626]" />
            <span>{offers.length} Active</span>
          </span>
        </div>

        {/* Animated Offers Hero Banner matching image copy 7.png */}
        <div className="relative rounded-3xl overflow-hidden shadow-md min-h-[146px] flex items-center">
          <img
            src="/assets/hero-offers.jpg"
            alt="Today's Best Local Offers"
            className="absolute inset-0 w-full h-full object-cover object-right animate-hero-bg"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1E40AF]/95 via-[#1D4ED8]/65 to-transparent" />
          <div className="relative z-10 p-4 max-w-[65%]">
            <h2 className="font-display font-extrabold text-lg leading-tight text-white">
              Today&apos;s Best Local Offers
            </h2>
            <p className="text-[11px] text-blue-100 mt-1">
              Exclusive deals from nearby shops &amp; services.
            </p>
            <span className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-[#1D4ED8] text-xs font-extrabold shadow">
              <span>Grab Offers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Blue-bordered Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#2563EB] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search offers, discounts or shops..."
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/95 border-2 border-[#3B82F6]/60 text-sm focus:outline-none focus:border-[#2563EB]"
          />
          <Mic className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="relative flex-shrink-0">
            <LayoutGrid className="w-3.5 h-3.5 text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="appearance-none bg-[#1D4ED8] text-white text-xs font-bold pl-8 pr-7 py-2 rounded-full shadow-sm"
            >
              <option value="all" className="bg-white text-slate-900">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-white text-slate-900">{c.name}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-white absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative flex-shrink-0">
            <MapPin className="w-3.5 h-3.5 text-[#1D4ED8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={maxDistance}
              onChange={(e) => setMaxDistance(e.target.value)}
              className="appearance-none bg-white/95 border border-blue-100 text-slate-800 text-xs font-bold pl-8 pr-7 py-2 rounded-full shadow-sm"
            >
              <option value="2">Within 2 km</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="20">Within 20 km</option>
              <option value="0">Any distance</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {[
            { id: 'best_offer', label: 'Highest Discount' },
            { id: 'nearest', label: 'Nearest' },
            { id: 'latest', label: 'Latest' },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSort(s.id)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-bold border shadow-sm ${
                sort === s.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white/95 text-slate-700 border-blue-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Offer Cards matching image copy 7.png */}
        <div className="space-y-3">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/80 animate-pulse" />
            ))
          ) : offers.length === 0 ? (
            <div className="bg-white/95 rounded-2xl text-center py-12 border border-blue-100">
              <Tag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-800">No active offers found</p>
              <p className="text-xs text-slate-500 mt-1">Try widening your distance or category.</p>
            </div>
          ) : (
            offers.map((offer) => {
              const saved = savedIds.has(offer.shop_id) || offer.isSaved;
              return (
                <div
                  key={offer.id}
                  onClick={() => navigate(`/shop/${offer.shop_id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/shop/${offer.shop_id}`)}
                  className="bg-white/95 rounded-2xl border border-blue-50 shadow-card p-3 flex gap-3.5 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="relative w-28 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    <img
                      src={offer.image_url || offer.shop_cover}
                      alt={offer.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1.5 left-1.5 bg-[#DC2626] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
                      {offer.discount_badge}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                          {offer.title}
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveShop(offer.shop_id);
                          }}
                          className="p-1 -mr-1 -mt-1"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              saved ? 'text-[#DC2626] fill-[#DC2626]' : 'text-slate-400'
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-brand-700 mt-0.5 truncate">
                        {offer.shop_name} • {offer.category_name}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-600" />
                        <span>
                          {offer.distanceKm} km • {offer.locality}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-[10.5px] font-semibold text-slate-600">
                        <Calendar className="w-3 h-3 text-brand-600" />
                        Valid till {new Date(offer.valid_until).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#1D4ED8] text-white text-[11px] font-bold shadow-xs">
                        <span>View Offer</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
