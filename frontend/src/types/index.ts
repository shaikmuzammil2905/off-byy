export interface User {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: 'customer' | 'vendor' | 'admin';
  avatar_url?: string | null;
  city?: string;
  locality?: string;
  lat?: number;
  lng?: number;
}

export interface LocationOption {
  id?: number;
  city: string;
  locality: string;
  pincode?: string;
  lat: number;
  lng: number;
  is_active?: number;
}

export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  is_active: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  bg_color: string;
  icon_color: string;
  sort_order: number;
  is_active: number;
  shop_count?: number;
  subcategories?: Subcategory[];
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  badge_text: string;
  bg_gradient: string;
  link_type: string;
  link_value: string;
}

export interface Offer {
  id: number;
  shop_id: number;
  title: string;
  description: string;
  discount_badge: string;
  discount_percent: number;
  terms?: string;
  image_url?: string;
  valid_from?: string;
  valid_until: string;
  is_active: number;
  shop_name?: string;
  locality?: string;
  city?: string;
  category_name?: string;
  shop_cover?: string;
  distanceKm?: number;
  isSaved?: boolean;
}

export interface ShopService {
  id: number;
  shop_id: number;
  name: string;
  type: 'service' | 'product';
  price?: string;
  description?: string;
}

export interface ShopImage {
  id: number;
  shop_id: number;
  image_url: string;
  is_cover: number;
  sort_order: number;
}

export interface ShopUpdate {
  id: number;
  shop_id: number;
  message: string;
  image_url?: string;
  created_at: string;
  shop_name?: string;
  locality?: string;
  shop_cover?: string;
  distanceKm?: number;
}

export interface Shop {
  id: number;
  vendorId: number;
  name: string;
  categoryId: number;
  categoryName: string;
  subcategoryId?: number;
  subcategoryName?: string;
  description: string;
  address: string;
  locality: string;
  city: string;
  pincode?: string;
  lat: number;
  lng: number;
  phone: string;
  whatsapp: string;
  rating: number;
  reviewCount: number;
  workingHours: string;
  workingHoursRaw?: { open: string; close: string };
  openNow: boolean;
  isFeatured: boolean;
  distanceKm: number;
  coverImage: string;
  activeOffer?: {
    id?: number;
    title: string;
    description?: string;
    discount_badge: string;
    discount_percent?: number;
    valid_until?: string;
  } | null;
  services: ShopService[];
  images?: ShopImage[];
  offers?: Offer[];
  updates?: ShopUpdate[];
  isSaved: boolean;
  createdAt?: string;
}
