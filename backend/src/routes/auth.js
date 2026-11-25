import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { name, email, phone, password } = req.body || {};
  if (!name || (!email && !phone)) {
    return res.status(400).json({ error: 'Name and email or phone are required' });
  }
  try {
    if (email) {
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
      if (existing) return res.status(409).json({ error: 'Email already registered' });
    }
    if (phone) {
      const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone.trim());
      if (existing) return res.status(409).json({ error: 'Phone number already registered' });
    }

    const passwordHash = password ? bcrypt.hashSync(password, 10) : null;
    const result = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, avatar_url)
      VALUES (?, ?, ?, ?, 'customer', ?)
    `).run(
      name.trim(),
      email ? email.trim().toLowerCase() : null,
      phone ? phone.trim() : null,
      passwordHash,
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80'
    );

    const user = db.prepare('SELECT id, name, email, phone, role, avatar_url, city, locality, lat, lng FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user || !user.password_hash) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (!user.is_active) {
    return res.status(403).json({ error: 'Account is deactivated. Contact support.' });
  }
  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = signToken(user);
  const { password_hash: _, ...safeUser } = user;
  res.json({ user: safeUser, token });
});

router.post('/otp/request', (req, res) => {
  const { phone } = req.body || {};
  if (!phone || phone.trim().length < 8) {
    return res.status(400).json({ error: 'Valid mobile number is required' });
  }
  const cleanPhone = phone.trim();
  // Generate 4-digit OTP (fixed 1234 in dev/demo if needed, or random 4-digit returned in demoCode)
  const code = '1234';
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)').run(cleanPhone, code, expiresAt);
  res.json({
    message: 'OTP sent successfully',
    phone: cleanPhone,
    demoOtp: code, // Exposed only for testing/demo when no SMS gateway is configured
  });
});

router.post('/otp/verify', (req, res) => {
  const { phone, code, name } = req.body || {};
  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and OTP code are required' });
  }
  const cleanPhone = phone.trim();
  const record = db.prepare(`
    SELECT * FROM otp_codes
    WHERE phone = ? AND code = ? AND verified = 0
    ORDER BY id DESC LIMIT 1
  `).get(cleanPhone, String(code).trim());

  if (!record || new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  db.prepare('UPDATE otp_codes SET verified = 1 WHERE id = ?').run(record.id);

  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(cleanPhone);
  if (!user) {
    const result = db.prepare(`
      INSERT INTO users (name, phone, role, avatar_url)
      VALUES (?, ?, 'customer', ?)
    `).run(
      name?.trim() || 'offby User',
      cleanPhone,
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80'
    );
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'Account is deactivated' });
  }

  const token = signToken(user);
  const { password_hash: _, ...safeUser } = user;
  res.json({ user: safeUser, token });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.put('/profile', requireAuth, (req, res) => {
  const { name, email, phone, avatar_url, password } = req.body || {};
  try {
    if (email) {
      const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.trim().toLowerCase(), req.user.id);
      if (existing) return res.status(409).json({ error: 'Email already in use' });
    }
    if (phone) {
      const existing = db.prepare('SELECT id FROM users WHERE phone = ? AND id != ?').get(phone.trim(), req.user.id);
      if (existing) return res.status(409).json({ error: 'Phone already in use' });
    }

    db.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        avatar_url = COALESCE(?, avatar_url)
      WHERE id = ?
    `).run(
      name?.trim() || null,
      email ? email.trim().toLowerCase() : null,
      phone ? phone.trim() : null,
      avatar_url || null,
      req.user.id
    );

    if (password && password.length >= 6) {
      const hash = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
    }

    const updated = db.prepare('SELECT id, name, email, phone, role, avatar_url, city, locality, lat, lng FROM users WHERE id = ?').get(req.user.id);
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/location', requireAuth, (req, res) => {
  const { city, locality, lat, lng } = req.body || {};
  if (!locality || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'Locality and coordinates are required' });
  }
  db.prepare(`
    UPDATE users SET city = ?, locality = ?, lat = ?, lng = ? WHERE id = ?
  `).run(city || 'Hyderabad', locality, Number(lat), Number(lng), req.user.id);
  const updated = db.prepare('SELECT id, name, email, phone, role, avatar_url, city, locality, lat, lng FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: updated });
});

export default router;
