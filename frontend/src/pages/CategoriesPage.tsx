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
    <div className="min-h-screen bg-[#F4F7FC] pb-24 safe-top">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto bg-white min-h-screen shadow-sm">
        <header className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-slate-100 sticky top-0 bg-white z-20">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h1 className="font-display font-bold text-lg text-slate-900">All Categories</h1>
            <p className="text-xs text-slate-500">Browse shops & services by category</p>
          </div>
        </header>

        <main className="p-4 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-2xl border border-slate-100 bg-white shadow-card p-4"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/explore?categoryId=${cat.id}`)}
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
                  <span className="text-xs font-semibold text-brand-600">Explore →</span>
                </button>

                {cat.subcategories && cat.subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                    {cat.subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => navigate(`/explore?categoryId=${cat.id}&q=${encodeURIComponent(sub.name)}`)}
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
        </main>
      </div>
    </div>
  );
};
