import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

// Dashboard metrics & reports
router.get('/dashboard', (_req, res) => {
  const totalUsers = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'customer'").get().c;
  const totalVendors = db.prepare('SELECT COUNT(*) AS c FROM vendors').get().c;
  const approvedVendors = db.prepare("SELECT COUNT(*) AS c FROM vendors WHERE approval_status = 'approved'").get().c;
  const pendingVendors = db.prepare("SELECT COUNT(*) AS c FROM vendors WHERE approval_status = 'pending'").get().c;
  const blockedVendors = db.prepare("SELECT COUNT(*) AS c FROM vendors WHERE approval_status = 'blocked'").get().c;
  const activeOffers = db.prepare("SELECT COUNT(*) AS c FROM offers WHERE is_active = 1 AND is_moderated_removed = 0 AND datetime(valid_until) > datetime('now')").get().c;
  const expiredOffers = db.prepare("SELECT COUNT(*) AS c FROM offers WHERE datetime(valid_until) <= datetime('now')").get().c;
  const activeSubscriptions = db.prepare("SELECT COUNT(*) AS c FROM vendor_subscriptions WHERE status = 'active' AND datetime(ends_at) > datetime('now')").get().c;
  const totalSaved = db.prepare('SELECT COUNT(*) AS c FROM saved_shops').get().c;
  const totalUpdates = db.prepare('SELECT COUNT(*) AS c FROM shop_updates WHERE is_active = 1').get().c;

  const categoryStats = db.prepare(`
    SELECT c.name, COUNT(s.id) AS shops
    FROM categories c
    LEFT JOIN shops s ON s.category_id = c.id
    GROUP BY c.id
    ORDER BY shops DESC
  `).all();

  res.json({
    metrics: {
      totalUsers,
      totalVendors,
      approvedVendors,
      pendingVendors,
      blockedVendors,
      activeOffers,
      expiredOffers,
      activeSubscriptions,
      totalSaved,
      totalUpdates,
    },
    categoryStats,
  });
});

// Vendors management
router.get('/vendors', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  const status = req.query.status || 'all';
  let rows = db.prepare(`
    SELECT v.*, s.id AS shop_id, s.name AS shop_name, s.locality, s.city, s.address, c.name AS category_name,
      (SELECT sp.name FROM vendor_subscriptions vs JOIN subscription_plans sp ON sp.id = vs.plan_id WHERE vs.vendor_id = v.id ORDER BY vs.id DESC LIMIT 1) AS plan_name,
      (SELECT vs.status FROM vendor_subscriptions vs WHERE vs.vendor_id = v.id ORDER BY vs.id DESC LIMIT 1) AS subscription_status
    FROM vendors v
    LEFT JOIN shops s ON s.vendor_id = v.id
    LEFT JOIN categories c ON c.id = s.category_id
    ORDER BY v.created_at DESC, v.id DESC
  `).all();

  if (status !== 'all') {
    rows = rows.filter((r) => r.approval_status === status);
  }
  if (q) {
    rows = rows.filter(
      (r) =>
        r.business_name.toLowerCase().includes(q) ||
        r.owner_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.includes(q)
    );
  }
  res.json({ vendors: rows });
});

router.patch('/vendors/:id/status', (req, res) => {
  const { approvalStatus, isActive, rejectionReason } = req.body || {};
  const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  db.prepare(`
    UPDATE vendors SET
      approval_status = COALESCE(?, approval_status),
      is_active = COALESCE(?, is_active),
      rejection_reason = COALESCE(?, rejection_reason)
    WHERE id = ?
  `).run(
    approvalStatus || null,
    isActive !== undefined ? (isActive ? 1 : 0) : null,
    rejectionReason ?? null,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
  res.json({ vendor: updated });
});

// Users management
router.get('/users', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  let users = db.prepare('SELECT id, name, email, phone, role, city, locality, is_active, created_at FROM users ORDER BY created_at DESC, id DESC').all();
  if (q) {
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q))
    );
  }
  res.json({ users });
});

router.patch('/users/:id/active', (req, res) => {
  const { isActive } = req.body || {};
  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, req.params.id);
  const user = db.prepare('SELECT id, name, email, phone, role, is_active FROM users WHERE id = ?').get(req.params.id);
  res.json({ user });
});

// Categories & Subcategories
router.get('/categories', (_req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC, id ASC').all();
  const subcategories = db.prepare('SELECT * FROM subcategories ORDER BY id ASC').all();
  res.json({ categories, subcategories });
});

router.post('/categories', (req, res) => {
  const { name, icon = 'Tag', bgColor = '#EFF6FF', iconColor = '#1D4ED8', sortOrder = 0 } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Category name is required' });
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const result = db.prepare(`
    INSERT INTO categories (name, slug, icon, bg_color, icon_color, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name.trim(), slug, icon, bgColor, iconColor, Number(sortOrder) || 0);
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ category });
});

router.put('/categories/:id', (req, res) => {
  const { name, icon, bgColor, iconColor, sortOrder, isActive } = req.body || {};
  db.prepare(`
    UPDATE categories SET
      name = COALESCE(?, name),
      icon = COALESCE(?, icon),
      bg_color = COALESCE(?, bg_color),
      icon_color = COALESCE(?, icon_color),
      sort_order = COALESCE(?, sort_order),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(
    name || null,
    icon || null,
    bgColor || null,
    iconColor || null,
    sortOrder !== undefined ? Number(sortOrder) : null,
    isActive !== undefined ? (isActive ? 1 : 0) : null,
    req.params.id
  );
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  res.json({ category });
});

router.delete('/categories/:id', (req, res) => {
  const hasShops = db.prepare('SELECT COUNT(*) AS c FROM shops WHERE category_id = ?').get(req.params.id).c;
  if (hasShops > 0) {
    db.prepare('UPDATE categories SET is_active = 0 WHERE id = ?').run(req.params.id);
    return res.json({ deactivated: true, message: 'Category has linked shops so it was deactivated' });
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ deleted: true });
});

router.post('/subcategories', (req, res) => {
  const { categoryId, name } = req.body || {};
  if (!categoryId || !name) return res.status(400).json({ error: 'categoryId and name required' });
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const result = db.prepare('INSERT INTO subcategories (category_id, name, slug) VALUES (?, ?, ?)').run(Number(categoryId), name.trim(), slug);
  const subcategory = db.prepare('SELECT * FROM subcategories WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ subcategory });
});

// Offers & Updates Moderation
router.get('/offers', (_req, res) => {
  const offers = db.prepare(`
    SELECT o.*, s.name AS shop_name, v.business_name
    FROM offers o
    JOIN shops s ON s.id = o.shop_id
    JOIN vendors v ON v.id = s.vendor_id
    ORDER BY o.created_at DESC, o.id DESC
  `).all();
  res.json({ offers });
});

router.patch('/offers/:id/moderate', (req, res) => {
  const { isModeratedRemoved, isActive } = req.body || {};
  db.prepare(`
    UPDATE offers SET
      is_moderated_removed = COALESCE(?, is_moderated_removed),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(
    isModeratedRemoved !== undefined ? (isModeratedRemoved ? 1 : 0) : null,
    isActive !== undefined ? (isActive ? 1 : 0) : null,
    req.params.id
  );
  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(req.params.id);
  res.json({ offer });
});

router.get('/updates', (_req, res) => {
  const updates = db.prepare(`
    SELECT u.*, s.name AS shop_name
    FROM shop_updates u
    JOIN shops s ON s.id = u.shop_id
    ORDER BY u.created_at DESC, u.id DESC
  `).all();
  res.json({ updates });
});

router.patch('/updates/:id/moderate', (req, res) => {
  const { isActive } = req.body || {};
  db.prepare('UPDATE shop_updates SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, req.params.id);
  const update = db.prepare('SELECT * FROM shop_updates WHERE id = ?').get(req.params.id);
  res.json({ update });
});

// Subscription Plans & Assignments
router.get('/subscriptions', (_req, res) => {
  const plans = db.prepare('SELECT * FROM subscription_plans ORDER BY price ASC').all().map((p) => ({
    ...p,
    benefits: (() => {
      try {
        return JSON.parse(p.benefits_json);
      } catch {
        return [];
      }
    })(),
  }));

  const vendorSubscriptions = db.prepare(`
    SELECT vs.*, v.business_name, v.owner_name, sp.name AS plan_name, sp.plan_type, sp.price
    FROM vendor_subscriptions vs
    JOIN vendors v ON v.id = vs.vendor_id
    JOIN subscription_plans sp ON sp.id = vs.plan_id
    ORDER BY vs.created_at DESC
  `).all();

  res.json({ plans, vendorSubscriptions });
});

router.post('/subscriptions/plans', (req, res) => {
  const { name, planType = 'premium', price = 0, durationDays = 30, benefits = [], listingPriority = 2 } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Plan name required' });
  const result = db.prepare(`
    INSERT INTO subscription_plans (name, plan_type, price, duration_days, benefits_json, listing_priority)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name.trim(), planType, Number(price), Number(durationDays), JSON.stringify(benefits), Number(listingPriority));
  const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ plan });
});

router.put('/subscriptions/plans/:id', (req, res) => {
  const { name, price, durationDays, benefits, listingPriority, isActive } = req.body || {};
  db.prepare(`
    UPDATE subscription_plans SET
      name = COALESCE(?, name),
      price = COALESCE(?, price),
      duration_days = COALESCE(?, duration_days),
      benefits_json = COALESCE(?, benefits_json),
      listing_priority = COALESCE(?, listing_priority),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(
    name || null,
    price !== undefined ? Number(price) : null,
    durationDays !== undefined ? Number(durationDays) : null,
    benefits ? JSON.stringify(benefits) : null,
    listingPriority !== undefined ? Number(listingPriority) : null,
    isActive !== undefined ? (isActive ? 1 : 0) : null,
    req.params.id
  );
  const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(req.params.id);
  res.json({ plan });
});

router.post('/subscriptions/assign', (req, res) => {
  const { vendorId, planId } = req.body || {};
  const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(planId);
  if (!plan) return res.status(404).json({ error: 'Plan not found' });
  db.prepare("UPDATE vendor_subscriptions SET status = 'cancelled' WHERE vendor_id = ? AND status = 'active'").run(vendorId);
  const endsAt = new Date(Date.now() + plan.duration_days * 86400000).toISOString();
  const result = db.prepare(`
    INSERT INTO vendor_subscriptions (vendor_id, plan_id, status, ends_at, assigned_by_admin_id)
    VALUES (?, ?, 'active', ?, ?)
  `).run(vendorId, planId, endsAt, req.user.id);
  const assigned = db.prepare('SELECT * FROM vendor_subscriptions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ subscription: assigned });
});

// Locations Management
router.get('/locations', (_req, res) => {
  res.json({ locations: db.prepare('SELECT * FROM locations ORDER BY city ASC, locality ASC').all() });
});

router.post('/locations', (req, res) => {
  const { city, locality, pincode = '', lat, lng } = req.body || {};
  if (!city || !locality || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'City, locality, lat, and lng are required' });
  }
  const result = db.prepare('INSERT INTO locations (city, locality, pincode, lat, lng) VALUES (?, ?, ?, ?, ?)').run(
    city.trim(),
    locality.trim(),
    pincode,
    Number(lat),
    Number(lng)
  );
  res.status(201).json({ location: db.prepare('SELECT * FROM locations WHERE id = ?').get(result.lastInsertRowid) });
});

router.patch('/locations/:id', (req, res) => {
  const { isActive } = req.body || {};
  db.prepare('UPDATE locations SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, req.params.id);
  res.json({ location: db.prepare('SELECT * FROM locations WHERE id = ?').get(req.params.id) });
});

// Banners Management
router.get('/banners', (_req, res) => {
  res.json({ banners: db.prepare('SELECT * FROM banners ORDER BY sort_order ASC, id ASC').all() });
});

router.post('/banners', (req, res) => {
  const { title, subtitle, badgeText = 'LIMITED OFFER', bgGradient, linkType = 'offers', linkValue = '' } = req.body || {};
  if (!title || !subtitle) return res.status(400).json({ error: 'Title and subtitle required' });
  const result = db.prepare(`
    INSERT INTO banners (title, subtitle, badge_text, bg_gradient, link_type, link_value)
    VALUES (?, ?, ?, COALESCE(?, 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 55%, #0EA5E9 100%)'), ?, ?)
  `).run(title, subtitle, badgeText, bgGradient || null, linkType, linkValue);
  res.status(201).json({ banner: db.prepare('SELECT * FROM banners WHERE id = ?').get(result.lastInsertRowid) });
});

router.delete('/banners/:id', (req, res) => {
  db.prepare('DELETE FROM banners WHERE id = ?').run(req.params.id);
  res.json({ deleted: true });
});

export default router;
