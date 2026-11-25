import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Heart, MapPin, Search, Tag } from 'lucide-react';
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
    <div className="min-h-screen bg-[#F4F7FC] pb-24 safe-top">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto bg-white min-h-screen shadow-sm">
        <header className="px-4 pt-4 pb-3 bg-white sticky top-0 z-30 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-xl text-slate-900">Best Offers</h1>
              <p className="text-xs text-slate-500">
                Active deals near {location.locality}, {location.city}
              </p>
            </div>
            <span className="bg-rose-50 text-[#DC2626] text-xs font-bold px-3 py-1 rounded-full">
              {offers.length} Active
            </span>
          </div>

          <div className="mt-3 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search offers, discounts or shops..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar">
            <div className="relative flex-shrink-0">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="appearance-none bg-[#1D4ED8] text-white text-xs font-semibold pl-3.5 pr-7 py-2 rounded-full"
              >
                <option value="all" className="bg-white text-slate-900">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white text-slate-900">{c.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-white absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative flex-shrink-0">
              <select
                value={maxDistance}
                onChange={(e) => setMaxDistance(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-slate-800 text-xs font-semibold pl-3.5 pr-7 py-2 rounded-full"
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
                className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold border ${
                  sort === s.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </header>

        <main className="p-4 space-y-3">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
            ))
          ) : offers.length === 0 ? (
            <div className="text-center py-16">
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
                  className="bg-white rounded-2xl border border-slate-100 shadow-card p-3 flex gap-3.5 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="relative w-28 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    <img
                      src={offer.image_url || offer.shop_cover}
                      alt={offer.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1.5 left-1.5 bg-[#DC2626] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
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
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span>Valid till {new Date(offer.valid_until).toLocaleDateString()}</span>
                      <span className="font-semibold text-brand-600">View Offer →</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
};
