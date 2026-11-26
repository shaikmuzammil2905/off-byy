import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { Category, Shop } from '../types';
import { useApp } from '../context/AppContext';
import { ShopCard } from '../components/ShopCard';
import { CategoryIcon } from '../components/CategoryIcon';

export const CategoryPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { location } = useApp();

  const [category, setCategory] = useState<Category | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedSub, setSelectedSub] = useState<string>('all');
  const [sort, setSort] = useState<'nearest' | 'best_offer' | 'latest'>('nearest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ categories: Category[] }>('/categories')
      .then((res) => {
        const found = res.categories.find((c) => String(c.id) === String(id) || c.slug === id);
        setCategory(found || null);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      categoryId: category ? String(category.id) : String(id),
      subcategoryId: selectedSub,
      lat: String(location.lat),
      lng: String(location.lng),
      sort,
      maxDistance: '25',
    });
    apiFetch<{ shops: Shop[] }>(`/shops?${params.toString()}`)
      .then((res) => setShops(res.shops))
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  }, [id, category?.id, selectedSub, sort, location.lat, location.lng]);

  return (
    <div className="min-h-screen pt-16 pb-24">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white shadow-sm border border-blue-100 flex items-center justify-center hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
          </button>
          <div className="flex items-center gap-2.5">
            {category && (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: category.bg_color }}
              >
                <CategoryIcon name={category.icon} className="w-5 h-5" color={category.icon_color} />
              </div>
            )}
            <div>
              <h1 className="font-display font-bold text-xl text-slate-900">
                {category?.name || 'Category'}
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-brand-600" />
                <span>Near {location.locality}, {location.city}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Subcategory Pills */}
        {category?.subcategories && category.subcategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedSub('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex-shrink-0 transition-colors ${
                selectedSub === 'all'
                  ? 'bg-[#1D4ED8] text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-blue-100'
              }`}
            >
              All {category.name}
            </button>
            {category.subcategories.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedSub(String(sub.id))}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex-shrink-0 transition-colors ${
                  selectedSub === String(sub.id)
                    ? 'bg-[#1D4ED8] text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-blue-100'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* Sort Pills */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">
            {shops.length} {shops.length === 1 ? 'shop' : 'shops'} found
          </span>
          <div className="flex gap-1.5">
            {[
              { id: 'nearest', label: 'Nearest' },
              { id: 'best_offer', label: 'Best Offer' },
              { id: 'latest', label: 'Latest' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSort(s.id as any)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                  sort === s.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shops List */}
        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/80 animate-pulse" />
            ))
          ) : shops.length === 0 ? (
            <div className="bg-white/90 rounded-2xl p-8 text-center border border-blue-100">
              <p className="font-bold text-slate-800 text-sm">No shops in this category yet</p>
              <button
                type="button"
                onClick={() => navigate('/explore')}
                className="mt-3 px-4 py-2 rounded-full bg-[#1D4ED8] text-white text-xs font-bold"
              >
                Explore All Shops
              </button>
            </div>
          ) : (
            shops.map((shop) => <ShopCard key={shop.id} shop={shop} />)
          )}
        </div>
      </div>
    </div>
  );
};
