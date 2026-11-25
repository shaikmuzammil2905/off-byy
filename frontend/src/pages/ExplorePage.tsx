import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronDown,
  Clock,
  LayoutGrid,
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
import { ShopCard } from '../components/ShopCard';
import { LocationModal } from './LocationModal';

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { location, recentSearches, addRecentSearch } = useApp();
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
    <div className="min-h-screen bg-[#F4F7FC] pb-24 safe-top">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto bg-white min-h-screen shadow-sm">
        {/* Header */}
        <header className="px-4 pt-4 pb-3 bg-white sticky top-0 z-30 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h1 className="font-display font-bold text-xl text-slate-900">Explore</h1>
            <button
              type="button"
              onClick={() => setLocOpen(true)}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#1D4ED8]"
            >
              <MapPin className="w-4 h-4" />
              <span>{location.locality}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="mt-3 relative">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 focus-within:border-brand-500 focus-within:bg-white transition-colors">
              <Search className="w-[18px] h-[18px] text-slate-400 flex-shrink-0" />
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
                <Mic className="w-[18px] h-[18px] text-slate-400 flex-shrink-0" />
              )}
            </div>

            {/* Recent Searches Dropdown */}
            {showSuggestions && recentSearches.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-40">
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

          {/* Filter Dropdown Row */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar">
            <div className="relative flex-shrink-0">
              <LayoutGrid className="w-3.5 h-3.5 text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                aria-label="Category filter"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="appearance-none bg-[#1D4ED8] text-white text-xs font-semibold pl-8 pr-7 py-2 rounded-full cursor-pointer focus:outline-none"
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
                className="appearance-none bg-white border border-slate-200 text-slate-800 text-xs font-semibold pl-8 pr-7 py-2 rounded-full cursor-pointer focus:outline-none"
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
                className="w-16 px-2.5 py-1.5 text-xs border border-slate-200 rounded-full"
              />
            )}

            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              aria-label="Advanced filters"
              className="flex-shrink-0 w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-700" />
            </button>
          </div>

          {/* Sort Pills */}
          <div className="flex items-center gap-2 mt-2.5">
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
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    active
                      ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* Results */}
        <main className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-slate-500">
              {total} {total === 1 ? 'shop' : 'shops'} found near you
            </p>
            {(categoryId !== 'all' || openNow || hasBestOffer || minRating !== '0') && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="space-y-3">
            {loading && page === 1 ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
              ))
            ) : shops.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800">No shops match your search</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Try increasing the distance filter or clearing your search keywords.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    resetFilters();
                  }}
                  className="mt-4 px-5 py-2 rounded-full bg-brand-600 text-white text-xs font-semibold"
                >
                  Show All Nearby Shops
                </button>
              </div>
            ) : (
              shops.map((shop) => <ShopCard key={shop.id} shop={shop} />)
            )}
          </div>

          {hasMore && (
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  fetchShops(next, true);
                }}
                disabled={loading}
                className="px-6 py-2.5 rounded-full bg-brand-50 text-brand-700 text-xs font-bold hover:bg-brand-100"
              >
                {loading ? 'Loading...' : 'Load More Shops'}
              </button>
            </div>
          )}
        </main>
      </div>

      <LocationModal open={locOpen} onClose={() => setLocOpen(false)} />

      {/* Advanced Filters Modal */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center">
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
