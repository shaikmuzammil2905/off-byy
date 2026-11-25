import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin } from 'lucide-react';
import { Shop } from '../types';
import { useApp } from '../context/AppContext';

export const ShopCard: React.FC<{ shop: Shop; variant?: 'list' | 'compact' }> = ({
  shop,
  variant = 'list',
}) => {
  const navigate = useNavigate();
  const { savedIds, toggleSaveShop } = useApp();
  const [animating, setAnimating] = useState(false);

  const isSaved = savedIds.has(shop.id) || shop.isSaved;

  const handleHeart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimating(true);
    await toggleSaveShop(shop.id);
    setTimeout(() => setAnimating(false), 300);
  };

  if (variant === 'compact') {
    return (
      <div
        onClick={() => navigate(`/shop/${shop.id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && navigate(`/shop/${shop.id}`)}
        className="flex-shrink-0 w-64 bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden cursor-pointer hover:shadow-md transition-all"
      >
        <div className="relative h-36 bg-slate-100">
          <img
            src={shop.coverImage}
            alt={shop.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          {shop.activeOffer && (
            <span className="absolute top-2.5 left-2.5 bg-[#DC2626] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              {shop.activeOffer.discount_badge}
            </span>
          )}
          <button
            type="button"
            onClick={handleHeart}
            aria-label={isSaved ? 'Remove from saved' : 'Save shop'}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm"
          >
            <Heart
              className={`w-4 h-4 ${animating ? 'animate-heart' : ''} ${
                isSaved ? 'text-[#DC2626] fill-[#DC2626]' : 'text-slate-600'
              }`}
            />
          </button>
        </div>
        <div className="p-3">
          <h3 className="font-bold text-[15px] text-slate-900 truncate">{shop.name}</h3>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {shop.categoryName} {shop.subcategoryName ? `• ${shop.subcategoryName}` : ''}
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-600 mt-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#2563EB] flex-shrink-0" />
            <span className="truncate">
              {shop.distanceKm} km • {shop.locality}
            </span>
          </div>
          {shop.activeOffer && (
            <div className="mt-2 bg-[#EFF6FF] text-[#1D4ED8] text-[11px] font-semibold px-2.5 py-1.5 rounded-lg truncate">
              {shop.activeOffer.title}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/shop/${shop.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/shop/${shop.id}`)}
      className="bg-white rounded-2xl border border-slate-100 shadow-card p-3 flex gap-3.5 cursor-pointer hover:shadow-md active:scale-[0.995] transition-all"
    >
      <div className="relative w-28 h-24 sm:w-32 sm:h-28 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
        <img
          src={shop.coverImage}
          alt={shop.name}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        {shop.activeOffer && (
          <span className="absolute top-1.5 left-1.5 bg-[#DC2626] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            {shop.activeOffer.discount_badge}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-[15px] text-slate-900 truncate">{shop.name}</h3>
            <button
              type="button"
              onClick={handleHeart}
              aria-label={isSaved ? 'Remove from saved' : 'Save shop'}
              className="p-1 -mr-1 -mt-1 rounded-full hover:bg-slate-100 flex-shrink-0"
            >
              <Heart
                className={`w-[18px] h-[18px] ${animating ? 'animate-heart' : ''} ${
                  isSaved ? 'text-[#DC2626] fill-[#DC2626]' : 'text-slate-400'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {shop.categoryName}
            {shop.subcategoryName ? ` • ${shop.subcategoryName}` : ''}
            {shop.services?.length > 0 ? ` • ${shop.services[0].name}` : ''}
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
            <MapPin className="w-3.5 h-3.5 text-[#2563EB] flex-shrink-0" />
            <span className="truncate">
              {shop.distanceKm} km • {shop.locality}
            </span>
          </div>
        </div>

        {shop.activeOffer && (
          <div className="mt-2 bg-[#EFF6FF] text-[#1D4ED8] text-[11.5px] font-semibold px-2.5 py-1 rounded-lg truncate">
            {shop.activeOffer.title}
          </div>
        )}
      </div>
    </div>
  );
};
