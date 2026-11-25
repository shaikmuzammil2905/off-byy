import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Heart,
  MapPin,
  Megaphone,
  MessageCircle,
  Navigation,
  Phone,
  Star,
  Tag,
  X,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { Shop } from '../types';
import { useApp } from '../context/AppContext';

export const ShopDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { location, savedIds, toggleSaveShop } = useApp();

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiFetch<{ shop: Shop }>(`/shops/${id}?lat=${location.lat}&lng=${location.lng}`)
      .then((res) => {
        setShop(res.shop);
        setActiveImgIdx(0);
      })
      .catch(() => setShop(null))
      .finally(() => setLoading(false));
  }, [id, location.lat, location.lng]);

  if (loading) {
    return (
      <div className="max-w-md md:max-w-2xl mx-auto bg-white min-h-screen p-4 space-y-4">
        <div className="h-60 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-6 w-2/3 bg-slate-100 rounded animate-pulse" />
        <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="font-bold text-lg text-slate-900">Shop not found</h2>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 px-5 py-2.5 rounded-full bg-brand-600 text-white text-sm font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const gallery =
    shop.images && shop.images.length > 0
      ? shop.images.map((im) => im.image_url)
      : [shop.coverImage];
  const isSaved = savedIds.has(shop.id) || shop.isSaved;

  const whatsappUrl = `https://wa.me/${shop.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Hi ${shop.name}, I found your offer on offby and would like to know more!`
  )}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lng}`;

  return (
    <div className="min-h-screen bg-[#F4F7FC] pb-36 safe-top">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto bg-white min-h-screen shadow-sm relative">
        {/* Hero Image */}
        <div className="relative h-64 sm:h-72 bg-slate-900">
          <img
            src={gallery[activeImgIdx]}
            alt={shop.name}
            onClick={() => setLightboxOpen(true)}
            className="w-full h-full object-cover cursor-zoom-in"
          />
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/95 shadow-md flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-slate-800" />
          </button>

          <button
            type="button"
            onClick={() => toggleSaveShop(shop.id)}
            aria-label={isSaved ? 'Unsave shop' : 'Save shop'}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/95 shadow-md flex items-center justify-center"
          >
            <Heart
              className={`w-5 h-5 ${
                isSaved ? 'text-[#DC2626] fill-[#DC2626]' : 'text-slate-700'
              }`}
            />
          </button>

          <span className="absolute bottom-3 right-3 bg-slate-900/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {activeImgIdx + 1}/{gallery.length}
          </span>
        </div>

        {/* Thumbnails */}
        {gallery.length > 1 && (
          <div className="flex gap-2 px-4 pt-3 overflow-x-auto no-scrollbar">
            {gallery.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImgIdx(idx)}
                className={`w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                  idx === activeImgIdx ? 'border-brand-600' : 'border-transparent opacity-75'
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Shop Info */}
        <div className="px-4 pt-4 pb-6 space-y-5">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-slate-900">{shop.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {shop.categoryName} {shop.subcategoryName ? `• ${shop.subcategoryName}` : ''}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 text-sm">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-bold text-slate-900">{shop.rating.toFixed(1)}</span>
              <span className="text-slate-500">({shop.reviewCount} reviews)</span>
            </div>

            {shop.description && (
              <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">{shop.description}</p>
            )}

            <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <MapPin className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
                  <span>{shop.address}</span>
                </div>
                <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0">
                  {shop.distanceKm} km
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className={`font-bold ${shop.openNow ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {shop.openNow ? 'Open Now' : 'Closed'}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-700">{shop.workingHours}</span>
              </div>
            </div>
          </div>

          {/* Services */}
          {shop.services && shop.services.length > 0 && (
            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-2.5">Services</h2>
              <div className="flex flex-wrap gap-2">
                {shop.services.map((sv) => (
                  <span
                    key={sv.id}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800"
                  >
                    <span>{sv.name}</span>
                    {sv.price && <span className="text-brand-600">• {sv.price}</span>}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Active Offers */}
          {shop.offers && shop.offers.length > 0 && (
            <section className="space-y-2.5">
              {shop.offers.map((offer) => (
                <div
                  key={offer.id}
                  className="rounded-2xl bg-rose-50/80 border border-rose-200 p-4 flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-[#DC2626] text-white flex items-center justify-center flex-shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#DC2626]">Active Offer</span>
                      <span className="text-[11px] font-bold bg-[#DC2626] text-white px-2 py-0.5 rounded-full">
                        {offer.discount_badge}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 mt-0.5">{offer.title}</h3>
                    {offer.description && (
                      <p className="text-xs text-slate-600 mt-1">{offer.description}</p>
                    )}
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      Valid till {new Date(offer.valid_until).toLocaleDateString()}
                      {offer.terms ? ` • ${offer.terms}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Latest Updates */}
          {shop.updates && shop.updates.length > 0 && (
            <section>
              <h2 className="font-display font-bold text-base text-slate-900 mb-2.5 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-brand-600" />
                <span>Latest Update</span>
              </h2>
              <div className="space-y-2.5">
                {shop.updates.map((upd) => (
                  <div
                    key={upd.id}
                    className="rounded-2xl bg-slate-50 border border-slate-100 p-3 flex items-center gap-3"
                  >
                    {upd.image_url && (
                      <img
                        src={upd.image_url}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-800 font-medium">{upd.message}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {new Date(upd.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Sticky Contact Bar positioned cleanly above BottomNav (bottom-16) */}
      <div className="fixed bottom-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2.5">
        <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto grid grid-cols-3 gap-2.5">
          <a
            href={`tel:${shop.phone}`}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#1D4ED8] text-white text-xs font-bold shadow-sm hover:bg-brand-800"
          >
            <Phone className="w-4 h-4" />
            <span>Call</span>
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#16A34A] text-white text-xs font-bold shadow-sm hover:bg-emerald-700"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-50"
          >
            <Navigation className="w-4 h-4 text-[#1D4ED8]" />
            <span>Directions</span>
          </a>
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={gallery[activeImgIdx]}
            alt={shop.name}
            className="max-w-full max-h-[85vh] rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
};
