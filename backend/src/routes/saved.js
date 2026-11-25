import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { haversineKm } from '../utils/geo.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const lat = Number(req.query.lat) || req.user.lat || 17.4948;
  const lng = Number(req.query.lng) || req.user.lng || 78.3996;

  const rows = db.prepare(`
    SELECT s.*, c.name AS category_name, sc.name AS subcategory_name,
      (SELECT image_url FROM shop_images si WHERE si.shop_id = s.id ORDER BY si.is_cover DESC, si.id ASC LIMIT 1) AS cover_image,
      (SELECT title FROM offers o WHERE o.shop_id = s.id AND o.is_active = 1 AND o.is_moderated_removed = 0 AND datetime(o.valid_until) > datetime('now') ORDER BY o.discount_percent DESC LIMIT 1) AS active_offer_title,
      (SELECT discount_badge FROM offers o WHERE o.shop_id = s.id AND o.is_active = 1 AND o.is_moderated_removed = 0 AND datetime(o.valid_until) > datetime('now') ORDER BY o.discount_percent DESC LIMIT 1) AS active_offer_badge
    FROM saved_shops ss
    JOIN shops s ON s.id = ss.shop_id
    JOIN vendors v ON v.id = s.vendor_id
    JOIN categories c ON c.id = s.category_id
    LEFT JOIN subcategories sc ON sc.id = s.subcategory_id
    WHERE ss.user_id = ? AND v.approval_status = 'approved' AND v.is_active = 1
    ORDER BY ss.created_at DESC
  `).all(req.user.id);

  res.json({
    savedShops: rows.map((r) => ({
      id: r.id,
      name: r.name,
      categoryName: r.category_name,
      subcategoryName: r.subcategory_name,
      locality: r.locality,
      city: r.city,
      distanceKm: haversineKm(lat, lng, r.lat, r.lng),
      coverImage: r.cover_image,
      activeOffer: r.active_offer_title
        ? { title: r.active_offer_title, discount_badge: r.active_offer_badge }
        : null,
      isSaved: true,
    })),
  });
});

router.post('/:shopId', requireAuth, (req, res) => {
  const shopId = Number(req.params.shopId);
  const existing = db.prepare('SELECT id FROM saved_shops WHERE user_id = ? AND shop_id = ?').get(req.user.id, shopId);
  if (existing) {
    db.prepare('DELETE FROM saved_shops WHERE id = ?').run(existing.id);
    return res.json({ saved: false });
  }
  const shop = db.prepare('SELECT id FROM shops WHERE id = ?').get(shopId);
  if (!shop) return res.status(404).json({ error: 'Shop not found' });
  db.prepare('INSERT INTO saved_shops (user_id, shop_id) VALUES (?, ?)').run(req.user.id, shopId);
  res.json({ saved: true });
});

router.delete('/:shopId', requireAuth, (req, res) => {
  const shopId = Number(req.params.shopId);
  db.prepare('DELETE FROM saved_shops WHERE user_id = ? AND shop_id = ?').run(req.user.id, shopId);
  res.json({ saved: false });
});

router.get('/notifications/list', requireAuth, (req, res) => {
  const notifications = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT 20
  `).all(req.user.id);
  res.json({ notifications });
});

export default router;
