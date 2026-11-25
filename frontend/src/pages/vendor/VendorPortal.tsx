import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Image as ImageIcon,
  LogOut,
  Megaphone,
  Plus,
  Store,
  Tag,
  Trash2,
  Wrench,
  XCircle,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { Category } from '../../types';
import { OffbyLogo } from '../../components/OffbyLogo';

export const VendorPortal: React.FC = () => {
  const navigate = useNavigate();
  const { user, loginWithToken, logout, showToast } = useApp();

  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Registration state
  const [categories, setCategories] = useState<Category[]>([]);
  const [reg, setReg] = useState({
    ownerName: '',
    businessName: '',
    categoryId: '',
    subcategoryId: '',
    description: '',
    phone: '',
    whatsapp: '',
    email: '',
    password: '',
    address: '',
    locality: 'Kukatpally',
    city: 'Hyderabad',
    pincode: '500072',
    lat: '17.4948',
    lng: '78.3996',
    shopImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    verificationDocUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80',
  });

  // Dashboard state
  const [dash, setDash] = useState<any>(null);
  const [loadingDash, setLoadingDash] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'shop' | 'services' | 'offers' | 'updates'>('overview');

  // Form states for approved vendor
  const [shopForm, setShopForm] = useState<any>({});
  const [newImgUrl, setNewImgUrl] = useState('');
  const [newService, setNewService] = useState({ name: '', type: 'service', price: '' });
  const [newOffer, setNewOffer] = useState({
    title: '',
    discountBadge: '',
    discountPercent: '20',
    description: '',
    terms: '',
    validUntil: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  });
  const [newUpdate, setNewUpdate] = useState({ message: '', imageUrl: '' });

  useEffect(() => {
    apiFetch<{ categories: Category[] }>('/categories')
      .then((res) => {
        setCategories(res.categories);
        if (res.categories.length > 0) {
          setReg((prev) => ({
            ...prev,
            categoryId: String(res.categories[0].id),
            subcategoryId: res.categories[0].subcategories?.[0]
              ? String(res.categories[0].subcategories[0].id)
              : '',
          }));
        }
      })
      .catch(() => {});
  }, []);

  const loadDashboard = async () => {
    if (!user || user.role !== 'vendor') return;
    setLoadingDash(true);
    try {
      const data = await apiFetch<any>('/vendor/dashboard');
      setDash(data);
      if (data.shop) {
        let hrs = { open: '09:00', close: '21:00' };
        try {
          hrs = JSON.parse(data.shop.working_hours_json);
        } catch {}
        setShopForm({
          name: data.shop.name,
          categoryId: String(data.shop.category_id),
          description: data.shop.description,
          address: data.shop.address,
          locality: data.shop.locality,
          city: data.shop.city,
          phone: data.shop.phone,
          whatsapp: data.shop.whatsapp,
          openTime: hrs.open || '09:00',
          closeTime: hrs.close || '21:00',
        });
      }
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setLoadingDash(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const handleVendorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await apiFetch<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (res.user.role !== 'vendor') {
        setAuthError('This account is not a vendor account.');
        return;
      }
      loginWithToken(res.token, res.user);
      showToast('Signed in to Vendor Portal');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleVendorRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await apiFetch<{ token: string; user: any }>('/vendor/register', {
        method: 'POST',
        body: JSON.stringify({
          ...reg,
          shopImages: [reg.shopImage],
        }),
      });
      loginWithToken(res.token, res.user);
      showToast('Vendor registration submitted for admin approval!');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/vendor/shop', {
        method: 'PUT',
        body: JSON.stringify({
          ...shopForm,
          workingHours: { open: shopForm.openTime, close: shopForm.closeTime },
        }),
      });
      showToast('Shop details updated');
      loadDashboard();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImgUrl.trim()) return;
    try {
      await apiFetch('/vendor/shop/images', {
        method: 'POST',
        body: JSON.stringify({ imageUrl: newImgUrl.trim() }),
      });
      setNewImgUrl('');
      showToast('Photo added');
      loadDashboard();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleDeleteImage = async (imgId: number) => {
    await apiFetch(`/vendor/shop/images/${imgId}`, { method: 'DELETE' });
    loadDashboard();
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/vendor/services', {
        method: 'POST',
        body: JSON.stringify(newService),
      });
      setNewService({ name: '', type: 'service', price: '' });
      showToast('Service/product added');
      loadDashboard();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/vendor/offers', {
        method: 'POST',
        body: JSON.stringify({
          ...newOffer,
          discountPercent: Number(newOffer.discountPercent),
          validUntil: new Date(newOffer.validUntil).toISOString(),
        }),
      });
      setNewOffer({
        title: '',
        discountBadge: '',
        discountPercent: '20',
        description: '',
        terms: '',
        validUntil: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      });
      showToast('Offer published!');
      loadDashboard();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/vendor/updates', {
        method: 'POST',
        body: JSON.stringify(newUpdate),
      });
      setNewUpdate({ message: '', imageUrl: '' });
      showToast('Shop update published!');
      loadDashboard();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // Auth Gate
  if (!user || user.role !== 'vendor') {
    const selectedCat = categories.find((c) => String(c.id) === reg.categoryId);
    return (
      <div className="min-h-screen bg-[#F4F7FC] p-4 py-8">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-card border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <OffbyLogo size="md" />
            <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
              Vendor App
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setAuthTab('login');
                setAuthError('');
              }}
              className={`py-2 rounded-lg text-xs font-bold ${
                authTab === 'login' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Vendor Login
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('register');
                setAuthError('');
              }}
              className={`py-2 rounded-lg text-xs font-bold ${
                authTab === 'register' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Register Shop
            </button>
          </div>

          {authError && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 text-xs font-medium text-rose-700">
              {authError}
            </div>
          )}

          {authTab === 'login' ? (
            <form onSubmit={handleVendorLogin} className="mt-5 space-y-4">
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Vendor Email"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
              />
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#1D4ED8] text-white font-bold text-sm"
              >
                Sign In to Vendor Dashboard
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginEmail('beanbrew@offby.in');
                  setLoginPassword('Vendor@123');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Fill Demo Vendor (Bean & Brew Café)
              </button>
            </form>
          ) : (
            <form onSubmit={handleVendorRegister} className="mt-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  required
                  value={reg.ownerName}
                  onChange={(e) => setReg({ ...reg, ownerName: e.target.value })}
                  placeholder="Owner Name *"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                <input
                  required
                  value={reg.businessName}
                  onChange={(e) => setReg({ ...reg, businessName: e.target.value })}
                  placeholder="Business / Shop Name *"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={reg.categoryId}
                  onChange={(e) => setReg({ ...reg, categoryId: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={reg.subcategoryId}
                  onChange={(e) => setReg({ ...reg, subcategoryId: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {selectedCat?.subcategories?.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <textarea
                rows={2}
                value={reg.description}
                onChange={(e) => setReg({ ...reg, description: e.target.value })}
                placeholder="Short business description"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  required
                  value={reg.phone}
                  onChange={(e) => setReg({ ...reg, phone: e.target.value })}
                  placeholder="Contact Number *"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                <input
                  required
                  value={reg.whatsapp}
                  onChange={(e) => setReg({ ...reg, whatsapp: e.target.value })}
                  placeholder="WhatsApp Number *"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="email"
                  required
                  value={reg.email}
                  onChange={(e) => setReg({ ...reg, email: e.target.value })}
                  placeholder="Email *"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                <input
                  type="password"
                  required
                  value={reg.password}
                  onChange={(e) => setReg({ ...reg, password: e.target.value })}
                  placeholder="Password *"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <input
                required
                value={reg.address}
                onChange={(e) => setReg({ ...reg, address: e.target.value })}
                placeholder="Complete Shop Address *"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  value={reg.locality}
                  onChange={(e) => setReg({ ...reg, locality: e.target.value })}
                  placeholder="Locality"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                <input
                  value={reg.city}
                  onChange={(e) => setReg({ ...reg, city: e.target.value })}
                  placeholder="City"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <input
                value={reg.shopImage}
                onChange={(e) => setReg({ ...reg, shopImage: e.target.value })}
                placeholder="Shop Cover Image URL"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />

              <input
                value={reg.verificationDocUrl}
                onChange={(e) => setReg({ ...reg, verificationDocUrl: e.target.value })}
                placeholder="Verification Document URL (GST / Trade License)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#1D4ED8] text-white font-bold text-sm"
              >
                Submit Vendor Registration
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (loadingDash || !dash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FC] text-sm text-slate-600">
        Loading Vendor Dashboard...
      </div>
    );
  }

  const { vendor, shop, subscription, images, services, offers, updates } = dash;

  // Approval Gate
  if (vendor.approval_status !== 'approved' || !vendor.is_active) {
    return (
      <div className="min-h-screen bg-[#F4F7FC] p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-card p-6 text-center space-y-4">
          {vendor.approval_status === 'pending' ? (
            <Clock className="w-12 h-12 text-amber-500 mx-auto" />
          ) : (
            <XCircle className="w-12 h-12 text-rose-600 mx-auto" />
          )}
          <h1 className="font-display font-bold text-xl text-slate-900">
            Account Status: <span className="capitalize">{vendor.approval_status}</span>
          </h1>
          <p className="text-sm text-slate-600">
            {vendor.approval_status === 'pending'
              ? 'Your vendor registration for ' + vendor.business_name + ' is under admin review. Once approved, you can manage your shop, offers, and updates.'
              : vendor.rejection_reason || 'Your vendor account is currently restricted. Please contact support@offby.in.'}
          </p>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
            >
              Customer App
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FC] pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100"
              title="Back to Customer App"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <h1 className="font-display font-bold text-base sm:text-lg text-slate-900">
                {shop?.name || vendor.business_name}
              </h1>
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approved Vendor</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

        <div className="max-w-5xl mx-auto px-4 flex gap-2 overflow-x-auto no-scrollbar pb-2.5">
          {[
            { id: 'overview', label: 'Overview & Plan', icon: CreditCard },
            { id: 'shop', label: 'Manage Shop', icon: Store },
            { id: 'services', label: 'Services', icon: Wrench },
            { id: 'offers', label: 'Offers', icon: Tag },
            { id: 'updates', label: 'Updates', icon: Megaphone },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold flex-shrink-0 ${
                  activeTab === t.id
                    ? 'bg-[#1D4ED8] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card space-y-3">
              <h2 className="font-bold text-base text-slate-900">Subscription Plan</h2>
              {subscription ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-extrabold text-brand-700">
                      {subscription.plan_name}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase">
                      {subscription.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Valid until: {new Date(subscription.ends_at).toLocaleDateString()} • Priority Level {subscription.listing_priority}
                  </p>
                  <ul className="space-y-1.5 pt-2 border-t border-slate-100">
                    {subscription.benefits?.map((b: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-xs text-slate-500">No active subscription assigned.</p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-brand-50">
                <div className="text-2xl font-extrabold text-brand-700">{offers.length}</div>
                <div className="text-xs font-semibold text-slate-600">Total Offers</div>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50">
                <div className="text-2xl font-extrabold text-emerald-700">{services.length}</div>
                <div className="text-xs font-semibold text-slate-600">Services / Products</div>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50">
                <div className="text-2xl font-extrabold text-amber-700">{updates.length}</div>
                <div className="text-xs font-semibold text-slate-600">Shop Updates</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-100">
                <div className="text-2xl font-extrabold text-slate-800">{images.length}</div>
                <div className="text-xs font-semibold text-slate-600">Gallery Photos</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <form
              onSubmit={handleSaveShop}
              className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-card space-y-3"
            >
              <h2 className="font-bold text-base text-slate-900">Edit Shop Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={shopForm.name || ''}
                  onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                  placeholder="Shop Name"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                <select
                  value={shopForm.categoryId || ''}
                  onChange={(e) => setShopForm({ ...shopForm, categoryId: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <textarea
                rows={3}
                value={shopForm.description || ''}
                onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                placeholder="Description"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
              <input
                value={shopForm.address || ''}
                onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                placeholder="Address"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={shopForm.phone || ''}
                  onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                  placeholder="Call Number"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                <input
                  value={shopForm.whatsapp || ''}
                  onChange={(e) => setShopForm({ ...shopForm, whatsapp: e.target.value })}
                  placeholder="WhatsApp Number"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Opens At</label>
                  <input
                    type="time"
                    value={shopForm.openTime || '09:00'}
                    onChange={(e) => setShopForm({ ...shopForm, openTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Closes At</label>
                  <input
                    type="time"
                    value={shopForm.closeTime || '21:00'}
                    onChange={(e) => setShopForm({ ...shopForm, closeTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#1D4ED8] text-white text-sm font-bold"
              >
                Save Shop Details
              </button>
            </form>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card space-y-3">
              <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-brand-600" />
                <span>Shop Gallery</span>
              </h2>
              <form onSubmit={handleAddImage} className="flex gap-2">
                <input
                  value={newImgUrl}
                  onChange={(e) => setNewImgUrl(e.target.value)}
                  placeholder="Paste image URL..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
                >
                  Add
                </button>
              </form>
              <div className="grid grid-cols-2 gap-2">
                {images.map((im: any) => (
                  <div key={im.id} className="relative group rounded-xl overflow-hidden h-24 bg-slate-100">
                    <img src={im.image_url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(im.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card space-y-4">
            <h2 className="font-bold text-base text-slate-900">Manage Services & Products</h2>
            <form onSubmit={handleAddService} className="flex flex-wrap gap-2">
              <input
                required
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                placeholder="Service or Product Name"
                className="flex-1 min-w-[180px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
              <select
                value={newService.type}
                onChange={(e) => setNewService({ ...newService, type: e.target.value })}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option value="service">Service</option>
                <option value="product">Product</option>
              </select>
              <input
                value={newService.price}
                onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                placeholder="Price (e.g. ₹299+)"
                className="w-36 px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#1D4ED8] text-white text-sm font-bold inline-flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </form>

            <div className="divide-y divide-slate-100">
              {services.map((sv: any) => (
                <div key={sv.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-slate-900">{sv.name}</span>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                      {sv.type}
                    </span>
                    {sv.price && <span className="ml-2 text-xs text-brand-700 font-bold">{sv.price}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await apiFetch(`/vendor/services/${sv.id}`, { method: 'DELETE' });
                      loadDashboard();
                    }}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <form
              onSubmit={handleCreateOffer}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card space-y-3"
            >
              <h2 className="font-bold text-base text-slate-900">Create New Offer</h2>
              <input
                required
                value={newOffer.title}
                onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                placeholder="Offer Title (e.g. Flat 20% OFF on Beverages)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  value={newOffer.discountBadge}
                  onChange={(e) => setNewOffer({ ...newOffer, discountBadge: e.target.value })}
                  placeholder="Badge (e.g. 20% OFF)"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                <input
                  type="number"
                  value={newOffer.discountPercent}
                  onChange={(e) => setNewOffer({ ...newOffer, discountPercent: e.target.value })}
                  placeholder="Discount %"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <textarea
                rows={2}
                value={newOffer.description}
                onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                placeholder="Offer description"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Valid Until</label>
                <input
                  type="date"
                  required
                  value={newOffer.validUntil}
                  onChange={(e) => setNewOffer({ ...newOffer, validUntil: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#1D4ED8] text-white text-sm font-bold"
              >
                Publish Offer
              </button>
            </form>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card space-y-3">
              <h2 className="font-bold text-base text-slate-900">Your Offers ({offers.length})</h2>
              <div className="space-y-2.5">
                {offers.map((o: any) => (
                  <div key={o.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-start justify-between gap-2">
                    <div>
                      <span className="bg-[#DC2626] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {o.discount_badge}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 mt-1">{o.title}</h3>
                      <p className="text-[11px] text-slate-500">
                        Valid till {new Date(o.valid_until).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await apiFetch(`/vendor/offers/${o.id}`, { method: 'DELETE' });
                        loadDashboard();
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'updates' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <form
              onSubmit={handlePostUpdate}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card space-y-3"
            >
              <h2 className="font-bold text-base text-slate-900">Post Real-Time Shop Update</h2>
              <textarea
                required
                rows={3}
                value={newUpdate.message}
                onChange={(e) => setNewUpdate({ ...newUpdate, message: e.target.value })}
                placeholder="Share new arrivals, flash deals or announcements..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
              <input
                value={newUpdate.imageUrl}
                onChange={(e) => setNewUpdate({ ...newUpdate, imageUrl: e.target.value })}
                placeholder="Optional image URL"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#1D4ED8] text-white text-sm font-bold"
              >
                Publish Update
              </button>
            </form>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card space-y-3">
              <h2 className="font-bold text-base text-slate-900">Published Updates</h2>
              {updates.map((u: any) => (
                <div key={u.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-800 font-medium">{u.message}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {new Date(u.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await apiFetch(`/vendor/updates/${u.id}`, { method: 'DELETE' });
                      loadDashboard();
                    }}
                    className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
