import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { Category } from '../types';
import { CategoryIcon } from '../components/CategoryIcon';

export const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ categories: Category[] }>('/categories')
      .then((res) => setCategories(res.categories))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pt-16 pb-24">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-3 space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white shadow-sm border border-blue-100 flex items-center justify-center hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
          </button>
          <div>
            <h1 className="font-display font-extrabold text-lg text-slate-900">All Categories</h1>
            <p className="text-xs text-slate-500">Browse shops &amp; services by category</p>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/80 animate-pulse" />
            ))
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-2xl border border-blue-50 bg-white/95 shadow-card p-4"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/category/${cat.id}`)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: cat.bg_color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-6 h-6" color={cat.icon_color} />
                    </div>
                    <div>
                      <h2 className="font-bold text-base text-slate-900">{cat.name}</h2>
                      <p className="text-xs text-slate-500">{cat.shop_count || 0} shops nearby</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#2563EB]">Explore →</span>
                </button>

                {cat.subcategories && cat.subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                    {cat.subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() =>
                          navigate(`/explore?categoryId=${cat.id}&q=${encodeURIComponent(sub.name)}`)
                        }
                        className="px-3 py-1.5 rounded-full bg-slate-50 hover:bg-brand-50 hover:text-brand-700 text-xs font-medium text-slate-700 border border-slate-200/70"
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
