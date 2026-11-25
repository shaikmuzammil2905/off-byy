import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { requireAuth, requireRole, signToken } from '../middleware/auth.js';

const router = Router();

// Vendor registration (creates user with role='vendor', vendor with approval_status='pending', and initial shop)
router.post('/register', (req, res) => {
  const {
    ownerName,
    businessName,
    categoryId,
    subcategoryId,
    description,
    phone,
    whatsapp,
    email,
    password,
    address,
    locality,
    city,
    pincode,
    lat,
    lng,
    shopImages,
    verificationDocUrl,
  } = req.body || {};

  if (!ownerName || !businessName || !categoryId || !phone || !email || !password || !address) {
    return res.status(400).json({ error: 'All required vendor and shop fields must be provided' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR phone = ?').get(cleanEmail, phone.trim());
  if (existingUser) {
    return res.status(409).json({ error: 'A user with this email or phone already exists' });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    const userRes = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, city, locality, lat, lng)
      VALUES (?, ?, ?, ?, 'vendor', ?, ?, ?, ?)
    `).run(
      ownerName.trim(),
      cleanEmail,
      phone.trim(),
      hash,
      city || 'Hyderabad',
      locality || 'Kukatpally',
      Number(lat) || 17.4948,
      Number(lng) || 78.3996
    );

    const userId = userRes.lastInsertRowid;

    const vendorRes = db.prepare(`
      INSERT INTO vendors (user_id, owner_name, business_name, email, phone, whatsapp, approval_status, verification_doc_url)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(
      userId,
      ownerName.trim(),
      businessName.trim(),
      cleanEmail,
      phone.trim(),
      (whatsapp || phone).trim(),
      verificationDocUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80'
    );

    const vendorId = vendorRes.lastInsertRowid;

    const shopRes = db.prepare(`
      INSERT INTO shops (vendor_id, name, category_id, subcategory_id, description, address, locality, city, pincode, lat, lng, phone, whatsapp, working_hours_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      vendorId,
      businessName.trim(),
      Number(categoryId),
      subcategoryId ? Number(subcategoryId) : null,
      description || '',
      address.trim(),
      locality || 'Kukatpally',
      city || 'Hyderabad',
      pincode || '500072',
      Number(lat) || 17.4948,
      Number(lng) || 78.3996,
      phone.trim(),
      (whatsapp || phone).trim(),
      JSON.stringify({ open: '09:00', close: '21:00' })
    );

    const shopId = shopRes.lastInsertRowid;
    const imgs = Array.isArray(shopImages) && shopImages.length > 0
      ? shopImages
      : ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80'];

    imgs.forEach((url, idx) => {
      db.prepare('INSERT INTO shop_images (shop_id, image_url, is_cover, sort_order) VALUES (?, ?, ?, ?)').run(
        shopId,
        url,
        idx === 0 ? 1 : 0,
        idx
      );
    });

    // Assign default Free plan (pending activation once approved)
    const freePlan = db.prepare("SELECT id, duration_days FROM subscription_plans WHERE plan_type = 'free' LIMIT 1").get();
    if (freePlan) {
      const endsAt = new Date(Date.now() + freePlan.duration_days * 86400000).toISOString();
      db.prepare(`
        INSERT INTO vendor_subscriptions (vendor_id, plan_id, status, ends_at)
        VALUES (?, ?, 'active', ?)
      `).run(vendorId, freePlan.id, endsAt);
    }

    const user = db.prepare('SELECT id, name, email, phone, role, city, locality, lat, lng FROM users WHERE id = ?').get(userId);
    const token = signToken(user);

    res.status(201).json({
      message: 'Vendor registration submitted and is pending admin approval.',
      user,
      token,
      approvalStatus: 'pending',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware to load vendor & enforce approved status for management routes
function loadVendor(req, res, next) {
  const vendor = db.prepare('SELECT * FROM vendors WHERE user_id = ?').get(req.user.id);
  if (!vendor) {
    return res.status(404).json({ error: 'Vendor profile not found' });
  }
  req.vendor = vendor;
  req.shop = db.prepare('SELECT * FROM shops WHERE vendor_id = ?').get(vendor.id);
  next();
}

function requireApprovedVendor(req, res, next) {
  if (req.vendor.approval_status !== 'approved' || !req.vendor.is_active) {
    return res.status(403).json({
      error: `Vendor access restricted. Current status: ${req.vendor.approval_status}`,
      approvalStatus: req.vendor.approval_status,
    });
  }
  next();
}

router.get('/dashboard', requireAuth, requireRole('vendor'), loadVendor, (req, res) => {
  const subscription = db.prepare(`
    SELECT vs.*, sp.name AS plan_name, sp.plan_type, sp.price, sp.duration_days, sp.benefits_json, sp.listing_priority
    FROM vendor_subscriptions vs
    JOIN subscription_plans sp ON sp.id = vs.plan_id
    WHERE vs.vendor_id = ?
    ORDER BY vs.id DESC LIMIT 1
  `).get(req.vendor.id);

  const images = req.shop ? db.prepare('SELECT * FROM shop_images WHERE shop_id = ? ORDER BY is_cover DESC, sort_order ASC').all(req.shop.id) : [];
  const services = req.shop ? db.prepare('SELECT * FROM shop_services WHERE shop_id = ? ORDER BY id DESC').all(req.shop.id) : [];
  const offers = req.shop ? db.prepare('SELECT * FROM offers WHERE shop_id = ? ORDER BY id DESC').all(req.shop.id) : [];
  const updates = req.shop ? db.prepare('SELECT * FROM shop_updates WHERE shop_id = ? ORDER BY created_at DESC, id DESC').all(req.shop.id) : [];

  res.json({
    vendor: req.vendor,
    shop: req.shop,
    subscription: subscription
      ? {
          ...subscription,
          benefits: (() => {
            try {
              return JSON.parse(subscription.benefits_json);
            } catch {
              return [];
            }
          })(),
        }
      : null,
    images,
    services,
    offers,
    updates,
  });
});

router.put('/shop', requireAuth, requireRole('vendor'), loadVendor, requireApprovedVendor, (req, res) => {
  const {
    name,
    categoryId,
    subcategoryId,
    description,
    address,
    locality,
    city,
    pincode,
    lat,
    lng,
    phone,
    whatsapp,
    workingHours,
    isOpenOverride,
  } = req.body || {};

  db.prepare(`
    UPDATE shops SET
      name = COALESCE(?, name),
      category_id = COALESCE(?, category_id),
      subcategory_id = COALESCE(?, subcategory_id),
      description = COALESCE(?, description),
      address = COALESCE(?, address),
      locality = COALESCE(?, locality),
      city = COALESCE(?, city),
      pincode = COALESCE(?, pincode),
      lat = COALESCE(?, lat),
      lng = COALESCE(?, lng),
      phone = COALESCE(?, phone),
      whatsapp = COALESCE(?, whatsapp),
      working_hours_json = COALESCE(?, working_hours_json),
      is_open_override = ?
    WHERE id = ?
  `).run(
    name || null,
    categoryId ? Number(categoryId) : null,
    subcategoryId ? Number(subcategoryId) : null,
    description ?? null,
    address || null,
    locality || null,
    city || null,
    pincode || null,
    lat !== undefined ? Number(lat) : null,
    lng !== undefined ? Number(lng) : null,
    phone || null,
    whatsapp || null,
    workingHours ? JSON.stringify(workingHours) : null,
    isOpenOverride === undefined ? req.shop.is_open_override : isOpenOverride,
    req.shop.id
  );

  const updated = db.prepare('SELECT * FROM shops WHERE id = ?').get(req.shop.id);
  res.json({ shop: updated });
});

router.post('/shop/images', requireAuth, requireRole('vendor'), loadVendor, requireApprovedVendor, (req, res) => {
  const { imageUrl, isCover } = req.body || {};
  if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });
  if (isCover) {
    db.prepare('UPDATE shop_images SET is_cover = 0 WHERE shop_id = ?').run(req.shop.id);
  }
  const result = db.prepare('INSERT INTO shop_images (shop_id, image_url, is_cover) VALUES (?, ?, ?)').run(
    req.shop.id,
    imageUrl.trim(),
    isCover ? 1 : 0
  );
  const image = db.prepare('SELECT * FROM shop_images WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ image });
});

router.delete('/shop/images/:imageId', requireAuth, requireRole('vendor'), loadVendor, requireApprovedVendor, (req, res) => {
  db.prepare('DELETE FROM shop_images WHERE id = ? AND shop_id = ?').run(req.params.imageId, req.shop.id);
  res.json({ deleted: true });
});

router.post('/services', requireAuth, requireRole('vendor'), loadVendor, requireApprovedVendor, (req, res) => {
  const { name, type = 'service', price = '', description = '' } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Service/product name is required' });
  const result = db.prepare('INSERT INTO shop_services (shop_id, name, type, price, description) VALUES (?, ?, ?, ?, ?)').run(
    req.shop.id,
    name.trim(),
    type === 'product' ? 'product' : 'service',
    price,
    description
  );
  const service = db.prepare('SELECT * FROM shop_services WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ service });
});

router.delete('/services/:serviceId', requireAuth, requireRole('vendor'), loadVendor, requireApprovedVendor, (req, res) => {
  db.prepare('DELETE FROM shop_services WHERE id = ? AND shop_id = ?').run(req.params.serviceId, req.shop.id);
  res.json({ deleted: true });
});

router.post('/offers', requireAuth, requireRole('vendor'), loadVendor, requireApprovedVendor, (req, res) => {
  const { title, description = '', discountBadge, discountPercent = 0, terms = '', imageUrl = '', validUntil } = req.body || {};
  if (!title || !discountBadge || !validUntil) {
    return res.status(400).json({ error: 'Title, discount badge, and validity date are required' });
  }
  const result = db.prepare(`
    INSERT INTO offers (shop_id, title, description, discount_badge, discount_percent, terms, image_url, valid_until)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.shop.id, title.trim(), description, discountBadge.trim(), Number(discountPercent) || 0, terms, imageUrl, validUntil);
  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ offer });
});

router.put('/offers/:offerId', requireAuth, requireRole('vendor'), loadVendor, requireApprovedVendor, (req, res) => {
  const { title, description, discountBadge, discountPercent, terms, imageUrl, validUntil, isActive } = req.body || {};
  db.prepare(`
    UPDATE offers SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      discount_badge = COALESCE(?, discount_badge),
      discount_percent = COALESCE(?, discount_percent),
      terms = COALESCE(?, terms),
      image_url = COALESCE(?, image_url),
      valid_until = COALESCE(?, valid_until),
      is_active = COALESCE(?, is_active)
    WHERE id = ? AND shop_id = ?
  `).run(
    title || null,
    description ?? null,
    discountBadge || null,
    discountPercent !== undefined ? Number(discountPercent) : null,
    terms ?? null,
    imageUrl ?? null,
    validUntil || null,
    isActive !== undefined ? (isActive ? 1 : 0) : null,
    req.params.offerId,
    req.shop.id
  );
  const offer = db.prepare('SELECT * FROM offers WHERE id = ? AND shop_id = ?').get(req.params.offerId, req.shop.id);
  res.json({ offer });
});

router.delete('/offers/:offerId', requireAuth, requireRole('vendor'), loadVendor, requireApprovedVendor, (req, res) => {
  db.prepare('DELETE FROM offers WHERE id = ? AND shop_id = ?').run(req.params.offerId, req.shop.id);
  res.json({ deleted: true });
});

router.post('/updates', requireAuth, requireRole('vendor'), loadVendor, requireApprovedVendor, (req, res) => {
  const { message, imageUrl = '' } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Update message is required' });
  const result = db.prepare('INSERT INTO shop_updates (shop_id, message, image_url) VALUES (?, ?, ?)').run(
    req.shop.id,
    message.trim(),
    imageUrl
  );
  const update = db.prepare('SELECT * FROM shop_updates WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ update });
});

router.put('/updates/:updateId', requireAuth, requireRole('vendor'), loadVendor, requireApprovedVendor, (req, res) => {
  const { message, imageUrl, isActive } = req.body || {};
  db.prepare(`
    UPDATE shop_updates SET
      message = COALESCE(?, message),
      image_url = COALESCE(?, image_url),
      is_active = COALESCE(?, is_active)
    WHERE id = ? AND shop_id = ?
  `).run(message || null, imageUrl ?? null, isActive !== undefined ? (isActive ? 1 : 0) : null, req.params.updateId, req.shop.id);
  const update = db.prepare('SELECT * FROM shop_updates WHERE id = ? AND shop_id = ?').get(req.params.updateId, req.shop.id);
  res.json({ update });
});

router.delete('/updates/:updateId', requireAuth, requireRole('vendor'), loadVendor, requireApprovedVendor, (req, res) => {
  db.prepare('DELETE FROM shop_updates WHERE id = ? AND shop_id = ?').run(req.params.updateId, req.shop.id);
  res.json({ deleted: true });
});

export default router;
