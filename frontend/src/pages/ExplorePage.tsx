import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  Clock,
  Gift,
  Heart,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  Mic,
  Search,
  SlidersHorizontal,
  Tag,
  X,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { Category, Shop } from '../types';
import { useApp } from '../context/AppContext';
import { LocationModal } from './LocationModal';

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { location, recentSearches, addRecentSearch, savedIds, toggleSaveShop } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || 'all');
  const [maxDistance, setMaxDistance] = useState(searchParams.get('distance') || '5');
  const [customDistance, setCustomDistance] = useState('');
  const [sort, setSort] = useState(searchParams.get('sort') || 'nearest');
  const [openNow, setOpenNow] = useState(false);
  const [hasBestOffer, setHasBestOffer] = useState(false);
  const [minRating, setMinRating] = useState('0');
  const [serviceType, setServiceType] = useState('all');

  const [categories, setCategories] = useState<Category[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const [locOpen, setLocOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [mapView, setMapView] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (searchParams.get('focus') === '1') {
      inputRef.current?.focus();
    }
  }, [searchParams]);

  useEffect(() => {
    apiFetch<{ categories: Category[] }>('/categories')
      .then((res) => setCategories(res.categories))
      .catch(() => {});
  }, []);

  const fetchShops = async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const dist = maxDistance === 'custom' ? customDistance : maxDistance;
      const params = new URLSearchParams({
        q: query,
        categoryId,
        maxDistance: dist || '0',
        lat: String(location.lat),
        lng: String(location.lng),
        sort,
        openNow: openNow ? '1' : '0',
        hasBestOffer: hasBestOffer ? '1' : '0',
        minRating,
        serviceType,
        page: String(pageNum),
        limit: '10',
      });
      const res = await apiFetch<{ total: number; shops: Shop[]; hasMore: boolean }>(
        `/shops?${params.toString()}`
      );
      setTotal(res.total);
      setHasMore(res.hasMore);
      setShops((prev) => (append ? [...prev, ...res.shops] : res.shops));
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchShops(1, false);
  }, [query, categoryId, maxDistance, customDistance, sort, openNow, hasBestOffer, minRating, serviceType, location.lat, location.lng]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) addRecentSearch(query.trim());
    setShowSuggestions(false);
  };

  const resetFilters = () => {
    setCategoryId('all');
    setMaxDistance('5');
    setCustomDistance('');
    setOpenNow(false);
    setHasBestOffer(false);
    setMinRating('0');
    setServiceType('all');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen pt-16 pb-24">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-3 space-y-3.5">
        {/* Explore Header Row matching image copy 6.png */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-[#2563EB]" />
            <h1 className="font-display font-extrabold text-xl text-slate-900">Explore</h1>
          </div>
          <button
            type="button"
            onClick={() => setLocOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/95 border border-blue-100 shadow-sm text-xs font-bold text-[#1D4ED8]"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{location.locality}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Blue-bordered Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/95 border-2 border-[#3B82F6]/60 focus-within:border-[#2563EB] shadow-sm transition-colors">
            <Search className="w-[18px] h-[18px] text-[#2563EB] flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shops, services or offers"
              className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {query ? (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            ) : (
              <Mic className="w-[18px] h-[18px] text-slate-500 flex-shrink-0" />
            )}
          </div>

          {showSuggestions && recentSearches.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-blue-100 p-3 z-40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase text-slate-400">
                  Recent & Popular Searches
                </span>
                <button
                  type="button"
                  onClick={() => setShowSuggestions(false)}
                  className="text-xs text-slate-500"
                >
                  Close
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setQuery(item);
                      setShowSuggestions(false);
                    }}
                    className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-xs font-medium text-slate-700"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="relative flex-shrink-0">
            <LayoutGrid className="w-3.5 h-3.5 text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              aria-label="Category filter"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="appearance-none bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white text-xs font-bold pl-8 pr-7 py-2 rounded-full shadow-sm cursor-pointer focus:outline-none"
            >
              <option value="all" className="bg-white text-slate-900">
                All Categories
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-white text-slate-900">
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-white absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative flex-shrink-0">
            <MapPin className="w-3.5 h-3.5 text-[#1D4ED8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              aria-label="Distance filter"
              value={maxDistance}
              onChange={(e) => setMaxDistance(e.target.value)}
              className="appearance-none bg-white/95 border border-blue-100 text-slate-800 text-xs font-bold pl-8 pr-7 py-2 rounded-full shadow-sm cursor-pointer focus:outline-none"
            >
              <option value="1">Within 1 km</option>
              <option value="2">Within 2 km</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="20">Within 20 km</option>
              <option value="0">Any Distance</option>
              <option value="custom">Custom km</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {maxDistance === 'custom' && (
            <input
              type="number"
              min={1}
              max={100}
              value={customDistance}
              onChange={(e) => setCustomDistance(e.target.value)}
              placeholder="km"
              className="w-16 px-2.5 py-1.5 text-xs bg-white border border-blue-100 rounded-full"
            />
          )}

          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            aria-label="Advanced filters"
            className="flex-shrink-0 w-9 h-9 rounded-full border border-blue-100 bg-white/95 shadow-sm flex items-center justify-center hover:bg-blue-50"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-700" />
          </button>
        </div>

        {/* Sort Pills */}
        <div className="flex items-center gap-2">
          {[
            { id: 'latest', label: 'Latest', icon: Clock },
            { id: 'nearest', label: 'Nearest', icon: MapPin },
            { id: 'best_offer', label: 'Best Offer', icon: Tag },
          ].map((item) => {
            const active = sort === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSort(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  active
                    ? 'bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-sm'
                    : 'bg-white/95 text-slate-700 border-blue-100 hover:bg-blue-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Animated Explore Hero Banner matching image copy 6.png */}
        <div
          onClick={() => navigate('/offers')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/offers')}
          className="relative rounded-3xl overflow-hidden shadow-md cursor-pointer min-h-[144px] flex items-center"
        >
          <img
            src="/assets/hero-deals.png"
            alt="Explore Nearby Shops & Offers"
            className="absolute inset-0 w-full h-full object-cover object-right animate-hero-bg"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1E40AF]/95 via-[#1D4ED8]/70 to-transparent" />
          <div className="relative z-10 p-4 max-w-[65%]">
            <h2 className="font-display font-extrabold text-lg leading-tight text-white">
              Explore Nearby Shops & Offers
            </h2>
            <p className="text-[11px] text-blue-100 mt-1">
              Great deals, top services and local businesses near you.
            </p>
            <span className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-[#1D4ED8] text-xs font-extrabold shadow">
              <span>Find Offers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Results Count + Map View Toggle */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">
            {total} {total === 1 ? 'shop' : 'shops'} found near you
          </p>
          <button
            type="button"
            onClick={() => setMapView((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-blue-100 shadow-sm text-xs font-bold text-[#1D4ED8]"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>{mapView ? 'List View' : 'Map View'}</span>
          </button>
        </div>

        {mapView && (
          <div className="bg-white/95 rounded-2xl border border-blue-100 p-4 shadow-card space-y-2">
            <div className="text-xs font-bold text-slate-900">
              Nearby Shop Pins around {location.locality}
            </div>
            <div className="flex flex-wrap gap-2">
              {shops.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => navigate(`/shop/${s.id}`)}
                  className="px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 text-xs font-semibold inline-flex items-center gap-1 hover:bg-brand-100"
                >
                  <MapPin className="w-3 h-3" />
                  <span>{s.name} ({s.distanceKm} km)</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Shop Cards matching image copy 6.png */}
        <div className="space-y-3">
          {loading && page === 1 ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/80 animate-pulse" />
            ))
          ) : shops.length === 0 ? (
            <div className="bg-white/95 rounded-2xl text-center py-12 px-4 border border-blue-100">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800">No shops match your search</h3>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  resetFilters();
                }}
                className="mt-4 px-5 py-2 rounded-full bg-[#1D4ED8] text-white text-xs font-bold"
              >
                Show All Nearby Shops
              </button>
            </div>
          ) : (
            shops.map((shop) => {
              const saved = savedIds.has(shop.id) || shop.isSaved;
              return (
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
                        <h3 className="font-bold text-[15px] text-slate-900 truncate">
                          {shop.name}
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveShop(shop.id);
                          }}
                          aria-label={saved ? 'Remove from saved' : 'Save shop'}
                          className="p-1 -mr-1 -mt-1"
                        >
                          <Heart
                            className={`w-[18px] h-[18px] ${
                              saved ? 'text-[#DC2626] fill-[#DC2626]' : 'text-slate-400'
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {shop.categoryName}
                        {shop.subcategoryName ? ` • ${shop.subcategoryName}` : ''}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#2563EB] flex-shrink-0" />
                        <span className="truncate">
                          {shop.distanceKm} km • {shop.locality}
                        </span>
                      </div>
                    </div>

                    {shop.activeOffer && (
                      <div className="mt-2 bg-[#EFF6FF] text-[#1D4ED8] text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 truncate">
                          <Gift className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{shop.activeOffer.title}</span>
                        </span>
                        <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center flex-shrink-0">
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {hasMore && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                const next = page + 1;
                setPage(next);
                fetchShops(next, true);
              }}
              disabled={loading}
              className="px-6 py-2.5 rounded-full bg-white text-brand-700 border border-blue-200 text-xs font-bold shadow-sm hover:bg-brand-50"
            >
              {loading ? 'Loading...' : 'Load More Shops'}
            </button>
          </div>
        )}
      </div>

      <LocationModal open={locOpen} onClose={() => setLocOpen(false)} />

      {/* Advanced Filters Modal */}
      {filterOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Advanced Filters</h3>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 cursor-pointer">
                <span className="text-sm font-semibold text-slate-800">Open Now Only</span>
                <input
                  type="checkbox"
                  checked={openNow}
                  onChange={(e) => setOpenNow(e.target.checked)}
                  className="w-4 h-4 accent-brand-600"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 cursor-pointer">
                <span className="text-sm font-semibold text-slate-800">Has Active Offer</span>
                <input
                  type="checkbox"
                  checked={hasBestOffer}
                  onChange={(e) => setHasBestOffer(e.target.checked)}
                  className="w-4 h-4 accent-brand-600"
                />
              </label>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Minimum Rating
                </label>
                <div className="flex gap-2">
                  {['0', '4.0', '4.5'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setMinRating(r)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${
                        minRating === r
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {r === '0' ? 'Any' : `${r}★ & above`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Offering Type
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'product', label: 'Products' },
                    { id: 'service', label: 'Services' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setServiceType(t.id)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${
                        serviceType === t.id
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  resetFilters();
                  setFilterOpen(false);
                }}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="flex-1 py-3 rounded-xl bg-[#1D4ED8] text-white text-sm font-bold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
