import { Router } from 'express';
import { db } from '../db.js';
import { optionalAuth } from '../middleware/auth.js';
import { formatWorkingHours, haversineKm, isShopOpenNow } from '../utils/geo.js';

const router = Router();

function enrichShop(shop, userLat, userLng, savedSet) {
  const coverRow = db.prepare(`
    SELECT image_url FROM shop_images WHERE shop_id = ? ORDER BY is_cover DESC, sort_order ASC, id ASC LIMIT 1
  `).get(shop.id);

  const activeOffer = db.prepare(`
    SELECT id, title, description, discount_badge, discount_percent, valid_until, image_url
    FROM offers
    WHERE shop_id = ? AND is_active = 1 AND is_moderated_removed = 0 AND datetime(valid_until) > datetime('now')
    ORDER BY discount_percent DESC, id DESC LIMIT 1
  `).get(shop.id);

  const services = db.prepare(`
    SELECT id, name, type, price FROM shop_services WHERE shop_id = ? AND is_active = 1 LIMIT 5
  `).all(shop.id);

  const distanceKm = haversineKm(userLat, userLng, shop.lat, shop.lng);
  const openNow = isShopOpenNow(shop.working_hours_json, shop.is_open_override);

  return {
    id: shop.id,
    vendorId: shop.vendor_id,
    name: shop.name,
    categoryId: shop.category_id,
    categoryName: shop.category_name,
    subcategoryId: shop.subcategory_id,
    subcategoryName: shop.subcategory_name,
    description: shop.description,
    address: shop.address,
    locality: shop.locality,
    city: shop.city,
    pincode: shop.pincode,
    lat: shop.lat,
    lng: shop.lng,
    phone: shop.phone,
    whatsapp: shop.whatsapp,
    rating: shop.rating,
    reviewCount: shop.review_count,
    workingHours: formatWorkingHours(shop.working_hours_json),
    openNow,
    isFeatured: Boolean(shop.is_featured),
    listingPriority: shop.listing_priority || 1,
    distanceKm,
    coverImage: coverRow?.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    activeOffer: activeOffer || null,
    services,
    isSaved: savedSet ? savedSet.has(shop.id) : false,
    createdAt: shop.created_at,
  };
}

function getSavedSet(userId) {
  if (!userId) return new Set();
  const rows = db.prepare('SELECT shop_id FROM saved_shops WHERE user_id = ?').all(userId);
  return new Set(rows.map((r) => r.shop_id));
}

function baseApprovedShopsQuery() {
  return `
    SELECT s.*,
      c.name AS category_name,
      sc.name AS subcategory_name,
      COALESCE((
        SELECT sp.listing_priority
        FROM vendor_subscriptions vs
        JOIN subscription_plans sp ON sp.id = vs.plan_id
        WHERE vs.vendor_id = s.vendor_id AND vs.status = 'active' AND datetime(vs.ends_at) > datetime('now')
        ORDER BY sp.listing_priority DESC LIMIT 1
      ), 1) AS listing_priority
    FROM shops s
    JOIN vendors v ON v.id = s.vendor_id
    JOIN categories c ON c.id = s.category_id
    LEFT JOIN subcategories sc ON sc.id = s.subcategory_id
    WHERE v.approval_status = 'approved' AND v.is_active = 1 AND c.is_active = 1
  `;
}

router.get('/categories', (_req, res) => {
  const categories = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM shops s JOIN vendors v ON v.id = s.vendor_id WHERE s.category_id = c.id AND v.approval_status = 'approved' AND v.is_active = 1) AS shop_count
    FROM categories c
    WHERE c.is_active = 1
    ORDER BY c.sort_order ASC, c.id ASC
  `).all();

  const subs = db.prepare('SELECT * FROM subcategories WHERE is_active = 1 ORDER BY id ASC').all();
  const subMap = new Map();
  for (const s of subs) {
    if (!subMap.has(s.category_id)) subMap.set(s.category_id, []);
    subMap.get(s.category_id).push(s);
  }

  res.json({
    categories: categories.map((c) => ({
      ...c,
      subcategories: subMap.get(c.id) || [],
    })),
  });
});

router.get('/locations', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  let rows = db.prepare('SELECT * FROM locations WHERE is_active = 1 ORDER BY city ASC, locality ASC').all();
  if (q) {
    rows = rows.filter(
      (r) =>
        r.locality.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        (r.pincode && r.pincode.includes(q))
    );
  }
  res.json({ locations: rows });
});

router.get('/home', optionalAuth, (req, res) => {
  const lat = Number(req.query.lat) || req.user?.lat || 17.4948;
  const lng = Number(req.query.lng) || req.user?.lng || 78.3996;
  const savedSet = getSavedSet(req.user?.id);

  const banners = db.prepare('SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order ASC, id ASC').all();
  const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, id ASC').all();

  const rawShops = db.prepare(baseApprovedShopsQuery()).all();
  const shops = rawShops.map((s) => enrichShop(s, lat, lng, savedSet));

  const nearbyOffers = [...shops]
    .filter((s) => s.activeOffer)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 8);

  const latestOffers = db.prepare(`
    SELECT o.*, s.name AS shop_name, s.locality, s.city, s.lat, s.lng, c.name AS category_name,
      (SELECT image_url FROM shop_images si WHERE si.shop_id = s.id ORDER BY si.is_cover DESC, si.id ASC LIMIT 1) AS shop_cover
    FROM offers o
    JOIN shops s ON s.id = o.shop_id
    JOIN vendors v ON v.id = s.vendor_id
    JOIN categories c ON c.id = s.category_id
    WHERE o.is_active = 1 AND o.is_moderated_removed = 0 AND datetime(o.valid_until) > datetime('now')
      AND v.approval_status = 'approved' AND v.is_active = 1
    ORDER BY o.created_at DESC, o.id DESC LIMIT 6
  `).all().map((o) => ({
    ...o,
    distanceKm: haversineKm(lat, lng, o.lat, o.lng),
    isSaved: savedSet.has(o.shop_id),
  }));

  const recentShops = [...shops]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  const popularShops = [...shops]
    .sort((a, b) => (b.listingPriority - a.listingPriority) || (b.rating * Math.log10(b.reviewCount + 10) - a.rating * Math.log10(a.reviewCount + 10)))
    .slice(0, 6);

  const recommendedServices = db.prepare(`
    SELECT ss.*, s.name AS shop_name, s.locality, s.lat, s.lng, c.name AS category_name,
      (SELECT image_url FROM shop_images si WHERE si.shop_id = s.id ORDER BY si.is_cover DESC, si.id ASC LIMIT 1) AS shop_cover
    FROM shop_services ss
    JOIN shops s ON s.id = ss.shop_id
    JOIN vendors v ON v.id = s.vendor_id
    JOIN categories c ON c.id = s.category_id
    WHERE ss.is_active = 1 AND v.approval_status = 'approved' AND v.is_active = 1
    ORDER BY ss.id DESC LIMIT 8
  `).all().map((item) => ({
    ...item,
    distanceKm: haversineKm(lat, lng, item.lat, item.lng),
  }));

  const latestUpdates = db.prepare(`
    SELECT u.*, s.name AS shop_name, s.locality, s.lat, s.lng,
      (SELECT image_url FROM shop_images si WHERE si.shop_id = s.id ORDER BY si.is_cover DESC, si.id ASC LIMIT 1) AS shop_cover
    FROM shop_updates u
    JOIN shops s ON s.id = u.shop_id
    JOIN vendors v ON v.id = s.vendor_id
    WHERE u.is_active = 1 AND v.approval_status = 'approved' AND v.is_active = 1
    ORDER BY u.created_at DESC, u.id DESC LIMIT 6
  `).all().map((u) => ({
    ...u,
    distanceKm: haversineKm(lat, lng, u.lat, u.lng),
  }));

  res.json({
    banners,
    categories,
    nearbyOffers,
    latestOffers,
    recentShops,
    popularShops,
    recommendedServices,
    latestUpdates,
  });
});

router.get('/shops', optionalAuth, (req, res) => {
  const {
    q = '',
    categoryId,
    subcategoryId,
    maxDistance,
    lat = req.user?.lat || 17.4948,
    lng = req.user?.lng || 78.3996,
    openNow,
    hasBestOffer,
    minRating,
    hasLatestOffer,
    serviceType,
    sort = 'nearest',
    page = 1,
    limit = 20,
  } = req.query;

  const savedSet = getSavedSet(req.user?.id);
  const rawShops = db.prepare(baseApprovedShopsQuery()).all();
  let shops = rawShops.map((s) => enrichShop(s, Number(lat), Number(lng), savedSet));

  const query = q.trim().toLowerCase();
  if (query) {
    shops = shops.filter((s) => {
      const inName = s.name.toLowerCase().includes(query);
      const inDesc = s.description.toLowerCase().includes(query);
      const inCat = s.categoryName.toLowerCase().includes(query) || (s.subcategoryName || '').toLowerCase().includes(query);
      const inLoc = s.locality.toLowerCase().includes(query) || s.address.toLowerCase().includes(query);
      const inOffer = s.activeOffer && (s.activeOffer.title.toLowerCase().includes(query) || s.activeOffer.description.toLowerCase().includes(query) || s.activeOffer.discount_badge.toLowerCase().includes(query));
      const inServices = s.services.some((sv) => sv.name.toLowerCase().includes(query));
      return inName || inDesc || inCat || inLoc || inOffer || inServices;
    });
  }

  if (categoryId && categoryId !== 'all') {
    shops = shops.filter((s) => String(s.categoryId) === String(categoryId));
  }
  if (subcategoryId && subcategoryId !== 'all') {
    shops = shops.filter((s) => String(s.subcategoryId) === String(subcategoryId));
  }
  if (maxDistance && Number(maxDistance) > 0) {
    shops = shops.filter((s) => s.distanceKm <= Number(maxDistance));
  }
  if (openNow === 'true' || openNow === '1') {
    shops = shops.filter((s) => s.openNow);
  }
  if (hasBestOffer === 'true' || hasBestOffer === '1' || hasLatestOffer === 'true' || hasLatestOffer === '1') {
    shops = shops.filter((s) => Boolean(s.activeOffer));
  }
  if (minRating && Number(minRating) > 0) {
    shops = shops.filter((s) => s.rating >= Number(minRating));
  }
  if (serviceType && serviceType !== 'all') {
    shops = shops.filter((s) => s.services.some((sv) => sv.type === serviceType));
  }

  if (sort === 'latest') {
    shops.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === 'best_offer') {
    shops.sort((a, b) => (b.activeOffer?.discount_percent || 0) - (a.activeOffer?.discount_percent || 0) || a.distanceKm - b.distanceKm);
  } else {
    shops.sort((a, b) => a.distanceKm - b.distanceKm || b.listingPriority - a.listingPriority);
  }

  const total = shops.length;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Math.min(50, Number(limit)));
  const start = (pageNum - 1) * limitNum;
  const paginated = shops.slice(start, start + limitNum);

  res.json({
    total,
    page: pageNum,
    limit: limitNum,
    hasMore: start + limitNum < total,
    shops: paginated,
  });
});

router.get('/shops/:id', optionalAuth, (req, res) => {
  const lat = Number(req.query.lat) || req.user?.lat || 17.4948;
  const lng = Number(req.query.lng) || req.user?.lng || 78.3996;
  const savedSet = getSavedSet(req.user?.id);

  const shopRow = db.prepare(`${baseApprovedShopsQuery()} AND s.id = ?`).get(req.params.id);
  if (!shopRow) {
    return res.status(404).json({ error: 'Shop not found' });
  }

  const shop = enrichShop(shopRow, lat, lng, savedSet);
  const images = db.prepare('SELECT * FROM shop_images WHERE shop_id = ? ORDER BY is_cover DESC, sort_order ASC, id ASC').all(shop.id);
  const services = db.prepare('SELECT * FROM shop_services WHERE shop_id = ? AND is_active = 1 ORDER BY id ASC').all(shop.id);
  const offers = db.prepare(`
    SELECT * FROM offers
    WHERE shop_id = ? AND is_active = 1 AND is_moderated_removed = 0 AND datetime(valid_until) > datetime('now')
    ORDER BY discount_percent DESC, id DESC
  `).all(shop.id);
  const updates = db.prepare(`
    SELECT * FROM shop_updates WHERE shop_id = ? AND is_active = 1 ORDER BY created_at DESC, id DESC
  `).all(shop.id);

  res.json({
    shop: {
      ...shop,
      workingHoursRaw: (() => {
        try {
          return JSON.parse(shopRow.working_hours_json);
        } catch {
          return { open: '09:00', close: '21:00' };
        }
      })(),
      images,
      services,
      offers,
      updates,
    },
  });
});

router.get('/offers', optionalAuth, (req, res) => {
  const {
    q = '',
    categoryId,
    maxDistance,
    lat = req.user?.lat || 17.4948,
    lng = req.user?.lng || 78.3996,
    sort = 'best_offer',
  } = req.query;

  const savedSet = getSavedSet(req.user?.id);

  let rows = db.prepare(`
    SELECT o.*, s.id AS shop_id, s.name AS shop_name, s.locality, s.city, s.address, s.lat, s.lng,
      s.category_id, c.name AS category_name, sc.name AS subcategory_name,
      (SELECT image_url FROM shop_images si WHERE si.shop_id = s.id ORDER BY si.is_cover DESC, si.id ASC LIMIT 1) AS shop_cover
    FROM offers o
    JOIN shops s ON s.id = o.shop_id
    JOIN vendors v ON v.id = s.vendor_id
    JOIN categories c ON c.id = s.category_id
    LEFT JOIN subcategories sc ON sc.id = s.subcategory_id
    WHERE o.is_active = 1
      AND o.is_moderated_removed = 0
      AND datetime(o.valid_until) > datetime('now')
      AND v.approval_status = 'approved'
      AND v.is_active = 1
      AND c.is_active = 1
  `).all().map((o) => ({
    ...o,
    distanceKm: haversineKm(Number(lat), Number(lng), o.lat, o.lng),
    isSaved: savedSet.has(o.shop_id),
  }));

  const query = q.trim().toLowerCase();
  if (query) {
    rows = rows.filter(
      (o) =>
        o.title.toLowerCase().includes(query) ||
        o.description.toLowerCase().includes(query) ||
        o.shop_name.toLowerCase().includes(query) ||
        o.category_name.toLowerCase().includes(query) ||
        o.discount_badge.toLowerCase().includes(query)
    );
  }

  if (categoryId && categoryId !== 'all') {
    rows = rows.filter((o) => String(o.category_id) === String(categoryId));
  }

  if (maxDistance && Number(maxDistance) > 0) {
    rows = rows.filter((o) => o.distanceKm <= Number(maxDistance));
  }

  if (sort === 'nearest') {
    rows.sort((a, b) => a.distanceKm - b.distanceKm);
  } else if (sort === 'latest') {
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else {
    rows.sort((a, b) => b.discount_percent - a.discount_percent || a.distanceKm - b.distanceKm);
  }

  res.json({ total: rows.length, offers: rows });
});

export default router;
