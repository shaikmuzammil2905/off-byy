import bcrypt from 'bcryptjs';
import { db, initSchema } from './db.js';

export function ensureSeeded() {
  const existing = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c;
  if (existing > 0) return;

  console.log('Seeding offby database...');
  const futureDate = (days) => new Date(Date.now() + days * 86400000).toISOString();

  // 1. Categories & Subcategories
  const categoryData = [
    { name: 'Food', slug: 'food', icon: 'Utensils', bg: '#FFF7ED', ic: '#EA580C', order: 1, subs: ['Restaurants', 'Cafe', 'Bakery'] },
    { name: 'Fashion', slug: 'fashion', icon: 'Shirt', bg: '#EEF2FF', ic: '#4F46E5', order: 2, subs: ['Clothing', 'Footwear'] },
    { name: 'Beauty', slug: 'beauty', icon: 'Sparkles', bg: '#FDF2F8', ic: '#DB2777', order: 3, subs: ['Salon', 'Spa'] },
    { name: 'Electronics', slug: 'electronics', icon: 'Headphones', bg: '#EFF6FF', ic: '#1D4ED8', order: 4, subs: ['Mobiles', 'Computers'] },
    { name: 'Grocery', slug: 'grocery', icon: 'ShoppingCart', bg: '#F0FDF4', ic: '#16A34A', order: 5, subs: ['Supermarket'] },
    { name: 'Services', slug: 'services', icon: 'Wrench', bg: '#F0F9FF', ic: '#0284C7', order: 6, subs: ['Home Services', 'Repair Services', 'Medical & Pharmacy', 'Education', 'Fitness', 'Other Services'] },
  ];

  const catMap = {};
  const subMap = {};

  for (const c of categoryData) {
    const res = db.prepare(`
      INSERT INTO categories (name, slug, icon, bg_color, icon_color, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(c.name, c.slug, c.icon, c.bg, c.ic, c.order);
    catMap[c.slug] = res.lastInsertRowid;
    for (const s of c.subs) {
      const sSlug = s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const sRes = db.prepare('INSERT INTO subcategories (category_id, name, slug) VALUES (?, ?, ?)').run(res.lastInsertRowid, s, sSlug);
      subMap[s] = sRes.lastInsertRowid;
    }
  }

  // 2. Locations
  const locations = [
    ['Hyderabad', 'Kukatpally', '500072', 17.4948, 78.3996],
    ['Hyderabad', 'KPHB', '500085', 17.4933, 78.3914],
    ['Hyderabad', 'Madhapur', '500081', 17.4486, 78.3908],
    ['Hyderabad', 'Hitech City', '500081', 17.4435, 78.3772],
    ['Hyderabad', 'Miyapur', '500049', 17.4968, 78.3614],
    ['Hyderabad', 'Ameerpet', '500016', 17.4375, 78.4483],
    ['Hyderabad', 'Banjara Hills', '500034', 17.4156, 78.4347],
  ];
  for (const [city, locality, pincode, lat, lng] of locations) {
    db.prepare('INSERT INTO locations (city, locality, pincode, lat, lng) VALUES (?, ?, ?, ?, ?)').run(city, locality, pincode, lat, lng);
  }

  // 3. Banners
  const banners = [
    ['Discover deals near you', 'Find nearby shops, great offers and local services instantly.', 'LOCAL DEALS', 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 55%, #0EA5E9 100%)', 'offers', '', 1],
    ['Weekend Mega Discounts', 'Up to 40% OFF on Electronics, Fashion & Dining around Kukatpally.', 'UP TO 40% OFF', 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 60%, #06B6D4 100%)', 'explore', '', 2],
    ['Fresh Cafés & Salons', 'Book local services & claim instant walk-in offers today.', 'TRENDING NOW', 'linear-gradient(135deg, #0F172A 0%, #1D4ED8 65%, #38BDF8 100%)', 'offers', '', 3],
  ];
  for (const b of banners) {
    db.prepare('INSERT INTO banners (title, subtitle, badge_text, bg_gradient, link_type, link_value, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)').run(...b);
  }

  // 4. Subscription Plans
  const freePlanId = db.prepare(`
    INSERT INTO subscription_plans (name, plan_type, price, duration_days, benefits_json, listing_priority)
    VALUES ('Free Starter', 'free', 0, 365, ?, 1)
  `).run(JSON.stringify(['Standard shop listing', 'Up to 2 active offers', 'Real-time shop updates'])).lastInsertRowid;

  const premiumPlanId = db.prepare(`
    INSERT INTO subscription_plans (name, plan_type, price, duration_days, benefits_json, listing_priority)
    VALUES ('Growth Premium', 'premium', 999, 30, ?, 3)
  `).run(JSON.stringify(['Priority search ranking', 'Unlimited offers & updates', 'Featured home badge', 'Dedicated support'])).lastInsertRowid;

  // 5. Users (Admin & Demo Customer)
  const adminHash = bcrypt.hashSync('Admin@123', 10);
  db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, avatar_url)
    VALUES ('offby Admin', 'admin@offby.in', '+919000000001', ?, 'admin', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80')
  `).run(adminHash);

  const userHash = bcrypt.hashSync('User@123', 10);
  const rohitId = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, avatar_url, city, locality, lat, lng)
    VALUES ('Rohit Kumar', 'rohit@offby.in', '+919876543210', ?, 'customer', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', 'Hyderabad', 'Kukatpally', 17.4948, 78.3996)
  `).run(userHash).lastInsertRowid;

  // Notifications
  db.prepare("INSERT INTO notifications (user_id, title, body) VALUES (NULL, 'Flat 20% OFF at Bean & Brew Café', 'Claim your beverage discount in Kukatpally today!')").run();
  db.prepare("INSERT INTO notifications (user_id, title, body) VALUES (NULL, 'TechWorld Electronics Mega Sale', 'Up to 40% OFF on laptops, mobiles & accessories at KPHB.')").run();

  // 6. Vendors, Shops, Images, Services, Offers, Updates
  const vendorHash = bcrypt.hashSync('Vendor@123', 10);

  const shopsData = [
    {
      owner: 'Arjun Reddy',
      email: 'beanbrew@offby.in',
      phone: '+919848011111',
      whatsapp: '919848011111',
      name: 'Bean & Brew Café',
      cat: 'food',
      sub: 'Cafe',
      desc: 'Artisan coffee, specialty cold brews, fresh pastries, and cozy workspace seating in the heart of Kukatpally.',
      address: 'Plot No. 12, Vivekananda Nagar, Kukatpally, Hyderabad - 500072',
      locality: 'Kukatpally',
      lat: 17.4982,
      lng: 78.4025,
      rating: 4.6,
      reviews: 328,
      hours: { open: '08:00', close: '23:00' },
      featured: 1,
      planId: premiumPlanId,
      images: [
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
        'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80',
      ],
      services: [
        ['Beverages', 'product', '₹120+'],
        ['Snacks', 'product', '₹150+'],
        ['Desserts', 'product', '₹180+'],
      ],
      offer: {
        title: 'Flat 20% OFF on all Beverages',
        desc: 'Valid on all hot coffees, cold brews, and signature coolers.',
        badge: '20% OFF',
        pct: 20,
        terms: 'Valid on dine-in & takeaway orders above ₹249.',
        days: 15,
      },
      update: {
        msg: 'New Filter Coffee & Cold Brew now available! ☕✨',
        img: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80',
      },
    },
    {
      owner: 'Vikram Sharma',
      email: 'pizzacorner@offby.in',
      phone: '+919848022222',
      whatsapp: '919848022222',
      name: 'Pizza Corner',
      cat: 'food',
      sub: 'Restaurants',
      desc: 'Wood-fired pizzas, gourmet burgers, cheesy garlic bread, and refreshing shakes.',
      address: 'Shop 4, Main Road, Kukatpally, Hyderabad - 500072',
      locality: 'Kukatpally',
      lat: 17.4910,
      lng: 78.3955,
      rating: 4.5,
      reviews: 214,
      hours: { open: '11:00', close: '23:30' },
      featured: 1,
      planId: premiumPlanId,
      images: [
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
      ],
      services: [
        ['Pizza', 'product', '₹199+'],
        ['Burger', 'product', '₹149+'],
        ['Beverages', 'product', '₹79+'],
      ],
      offer: {
        title: 'Flat 30% OFF on Medium & Large Pizzas',
        desc: 'Enjoy handcrafted crust pizzas with 30% instant discount.',
        badge: '30% OFF',
        pct: 30,
        terms: 'Applicable on all Medium & Large classic pizzas.',
        days: 20,
      },
      update: {
        msg: 'Introducing Truffle Mushroom & Peri-Peri Paneer Pizzas this week!',
        img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
      },
    },
    {
      owner: 'Meera Nair',
      email: 'styleplus@offby.in',
      phone: '+919848033333',
      whatsapp: '919848033333',
      name: 'StylePlus Fashion',
      cat: 'fashion',
      sub: 'Clothing',
      desc: 'Trendy men, women, and kids wear with seasonal ethnic & western collections.',
      address: '2nd Floor, Kukatpally Plaza, Hyderabad - 500072',
      locality: 'Kukatpally',
      lat: 17.4865,
      lng: 78.4045,
      rating: 4.4,
      reviews: 168,
      hours: { open: '10:00', close: '21:30' },
      featured: 1,
      planId: freePlanId,
      images: [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
        'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80',
      ],
      services: [
        ['Men Wear', 'product', '₹599+'],
        ['Women Wear', 'product', '₹699+'],
        ['Kids Wear', 'product', '₹399+'],
      ],
      offer: {
        title: 'Buy 1 Get 1 on Selected Clothing',
        desc: 'Mix and match across casual shirts, kurtis, and denim.',
        badge: 'Buy 1 Get 1',
        pct: 50,
        terms: 'Lower priced item is free. Valid on marked racks.',
        days: 12,
      },
      update: {
        msg: 'Festive & Summer Linen collection just arrived in store!',
        img: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&q=80',
      },
    },
    {
      owner: 'Priya Verma',
      email: 'glowshine@offby.in',
      phone: '+919848044444',
      whatsapp: '919848044444',
      name: 'Glow & Shine Salon',
      cat: 'beauty',
      sub: 'Salon',
      desc: 'Unisex hair studio, skincare facials, bridal makeup, and relaxing spa treatments.',
      address: 'Road No. 3, Bhagyanagar Colony, Kukatpally, Hyderabad - 500072',
      locality: 'Kukatpally',
      lat: 17.4822,
      lng: 78.3910,
      rating: 4.8,
      reviews: 245,
      hours: { open: '09:30', close: '21:00' },
      featured: 1,
      planId: premiumPlanId,
      images: [
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
      ],
      services: [
        ['Hair Styling', 'service', '₹350+'],
        ['Skin & Facial', 'service', '₹999+'],
        ['Beauty Care', 'service', '₹499+'],
      ],
      offer: {
        title: 'Flat 25% OFF on Salon Services',
        desc: 'Applicable on haircuts, keratin, facials, and grooming packages.',
        badge: '25% OFF',
        pct: 25,
        terms: 'Prior appointment recommended on weekends.',
        days: 25,
      },
      update: {
        msg: 'Book a Hydra-Facial this week and get a complimentary hair spa!',
        img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
      },
    },
    {
      owner: 'Karthik Rao',
      email: 'techworld@offby.in',
      phone: '+919848055555',
      whatsapp: '919848055555',
      name: 'TechWorld Electronics',
      cat: 'electronics',
      sub: 'Mobiles',
      desc: 'Authorized dealer for smartphones, laptops, headphones, smartwatches, and genuine accessories.',
      address: 'Phase 1, KPHB Colony, Hyderabad - 500085',
      locality: 'KPHB',
      lat: 17.4900,
      lng: 78.3790,
      rating: 4.5,
      reviews: 192,
      hours: { open: '10:00', close: '21:30' },
      featured: 1,
      planId: premiumPlanId,
      images: [
        'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80',
        'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80',
      ],
      services: [
        ['Mobiles', 'product', '₹9,999+'],
        ['Laptops', 'product', '₹32,990+'],
        ['Accessories', 'product', '₹299+'],
      ],
      offer: {
        title: 'Up to 40% OFF on Selected Items',
        desc: 'Mega savings on TWS earbuds, laptop bags, SSDs, and flagship phones.',
        badge: 'Up to 40%',
        pct: 40,
        terms: 'Limited stock offer. GST invoice provided.',
        days: 10,
      },
      update: {
        msg: 'Zero-cost EMI now available on all 5G smartphones & laptops!',
        img: '',
      },
    },
    {
      owner: 'Suresh Gupta',
      email: 'freshmart@offby.in',
      phone: '+919848066666',
      whatsapp: '919848066666',
      name: 'FreshMart Supermarket',
      cat: 'grocery',
      sub: 'Supermarket',
      desc: 'Farm-fresh fruits, organic vegetables, daily dairy, and household essentials.',
      address: 'MIG 42, KPHB Road, Hyderabad - 500085',
      locality: 'KPHB',
      lat: 17.4960,
      lng: 78.3870,
      rating: 4.3,
      reviews: 150,
      hours: { open: '07:00', close: '22:00' },
      featured: 0,
      planId: freePlanId,
      images: [
        'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
      ],
      services: [
        ['Fresh Produce', 'product', 'Daily'],
        ['Home Delivery', 'service', 'Free > ₹499'],
      ],
      offer: {
        title: 'Flat 15% OFF on Organic Groceries',
        desc: 'Save 15% on pulses, cold-pressed oils, and fresh fruits.',
        badge: '15% OFF',
        pct: 15,
        terms: 'Valid every day before 6 PM.',
        days: 18,
      },
      update: {
        msg: 'Fresh Alphonso mangoes and organic greens stocked this morning!',
        img: '',
      },
    },
    {
      owner: 'Ramesh Babu',
      email: 'quickfix@offby.in',
      phone: '+919848077777',
      whatsapp: '919848077777',
      name: 'QuickFix Home Services',
      cat: 'services',
      sub: 'Home Services',
      desc: 'Certified AC repair, plumbing, electrical maintenance, and appliance servicing at your doorstep.',
      address: 'Shop 9, Madhapur Main Rd, Hyderabad - 500081',
      locality: 'Madhapur',
      lat: 17.4520,
      lng: 78.3912,
      rating: 4.7,
      reviews: 118,
      hours: { open: '08:00', close: '20:00' },
      featured: 0,
      planId: freePlanId,
      images: [
        'https://images.unsplash.com/photo-1581578731548-c6464?w=800&q=80'.replace('c6464', 'c646416f8b6f'),
      ],
      services: [
        ['AC Servicing', 'service', '₹499'],
        ['Plumbing & Electrical', 'service', '₹299+'],
      ],
      offer: {
        title: '20% OFF on First AC Service',
        desc: 'Complete jet-wash AC cleaning & gas checkup.',
        badge: '20% OFF',
        pct: 20,
        terms: 'Includes 30-day service warranty.',
        days: 30,
      },
      update: {
        msg: 'Same-day technician visit available across Kukatpally & Madhapur!',
        img: '',
      },
    },
  ];

  const savedShopIds = [];

  for (let i = 0; i < shopsData.length; i++) {
    const s = shopsData[i];
    const uId = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, city, locality, lat, lng)
      VALUES (?, ?, ?, ?, 'vendor', 'Hyderabad', ?, ?, ?)
    `).run(s.owner, s.email, s.phone, vendorHash, s.locality, s.lat, s.lng).lastInsertRowid;

    const vId = db.prepare(`
      INSERT INTO vendors (user_id, owner_name, business_name, email, phone, whatsapp, approval_status, verification_doc_url)
      VALUES (?, ?, ?, ?, ?, ?, 'approved', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80')
    `).run(uId, s.owner, s.name, s.email, s.phone, s.whatsapp).lastInsertRowid;

    const shopId = db.prepare(`
      INSERT INTO shops (vendor_id, name, category_id, subcategory_id, description, address, locality, city, pincode, lat, lng, phone, whatsapp, rating, review_count, working_hours_json, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Hyderabad', '500072', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(vId, s.name, catMap[s.cat], subMap[s.sub], s.desc, s.address, s.locality, s.lat, s.lng, s.phone, s.whatsapp, s.rating, s.reviews, JSON.stringify(s.hours), s.featured).lastInsertRowid;

    if (i < 3) savedShopIds.push(shopId);

    s.images.forEach((url, idx) => {
      db.prepare('INSERT INTO shop_images (shop_id, image_url, is_cover, sort_order) VALUES (?, ?, ?, ?)').run(shopId, url, idx === 0 ? 1 : 0, idx);
    });

    for (const [svName, svType, svPrice] of s.services) {
      db.prepare('INSERT INTO shop_services (shop_id, name, type, price) VALUES (?, ?, ?, ?)').run(shopId, svName, svType, svPrice);
    }

    db.prepare(`
      INSERT INTO offers (shop_id, title, description, discount_badge, discount_percent, terms, valid_until)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(shopId, s.offer.title, s.offer.desc, s.offer.badge, s.offer.pct, s.offer.terms, futureDate(s.offer.days));

    db.prepare('INSERT INTO shop_updates (shop_id, message, image_url) VALUES (?, ?, ?)').run(shopId, s.update.msg, s.update.img);

    db.prepare(`
      INSERT INTO vendor_subscriptions (vendor_id, plan_id, status, ends_at)
      VALUES (?, ?, 'active', ?)
    `).run(vId, s.planId, futureDate(30));
  }

  // Save 3 shops for Rohit Kumar
  for (const sid of savedShopIds) {
    db.prepare('INSERT INTO saved_shops (user_id, shop_id) VALUES (?, ?)').run(rohitId, sid);
  }

  // Add 1 Pending Vendor so Admin approval workflow is immediately testable
  const pendingUserId = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, city, locality, lat, lng)
    VALUES ('Ananya Kapoor', 'urbanthreads@offby.in', '+919848099999', ?, 'vendor', 'Hyderabad', 'Kukatpally', 17.4930, 78.4010)
  `).run(vendorHash).lastInsertRowid;

  const pendingVendorId = db.prepare(`
    INSERT INTO vendors (user_id, owner_name, business_name, email, phone, whatsapp, approval_status, verification_doc_url)
    VALUES (?, 'Ananya Kapoor', 'Urban Threads Boutique', 'urbanthreads@offby.in', '+919848099999', '919848099999', 'pending', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80')
  `).run(pendingUserId).lastInsertRowid;

  const pendingShopId = db.prepare(`
    INSERT INTO shops (vendor_id, name, category_id, subcategory_id, description, address, locality, city, pincode, lat, lng, phone, whatsapp, working_hours_json)
    VALUES (?, 'Urban Threads Boutique', ?, ?, 'Designer ethnic wear and custom tailoring.', 'Road No. 1, Kukatpally, Hyderabad', 'Kukatpally', 'Hyderabad', '500072', 17.4930, 78.4010, '+919848099999', '919848099999', '{"open":"10:00","close":"21:00"}')
  `).run(pendingVendorId, catMap['fashion'], subMap['Clothing']).lastInsertRowid;

  db.prepare('INSERT INTO shop_images (shop_id, image_url, is_cover) VALUES (?, ?, 1)').run(
    pendingShopId,
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80'
  );

  console.log('Seed complete!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  initSchema();
  ensureSeeded();
}
