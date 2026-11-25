import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  CreditCard,
  LayoutGrid,
  LogOut,
  MapPin,
  ShieldCheck,
  Store,
  Tag,
  Trash2,
  Users,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { OffbyLogo } from '../../components/OffbyLogo';

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, loginWithToken, logout, showToast } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [tab, setTab] = useState<'dashboard' | 'vendors' | 'users' | 'categories' | 'offers' | 'subscriptions' | 'locations'>('dashboard');
  const [metrics, setMetrics] = useState<any>(null);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorStatusFilter, setVendorStatusFilter] = useState('all');
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [vendorSubs, setVendorSubs] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const [newCat, setNewCat] = useState({ name: '', icon: 'Tag', bgColor: '#EFF6FF', iconColor: '#1D4ED8' });
  const [newPlan, setNewPlan] = useState({ name: '', planType: 'premium', price: '499', durationDays: '30', listingPriority: '2' });
  const [assignData, setAssignData] = useState({ vendorId: '', planId: '' });
  const [newLoc, setNewLoc] = useState({ city: 'Hyderabad', locality: '', pincode: '', lat: '17.45', lng: '78.40' });

  const loadAll = async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const [dRes, vRes, uRes, cRes, oRes, sRes, lRes] = await Promise.all([
        apiFetch<any>('/admin/dashboard'),
        apiFetch<any>(`/admin/vendors?q=${encodeURIComponent(vendorSearch)}&status=${vendorStatusFilter}`),
        apiFetch<any>(`/admin/users?q=${encodeURIComponent(userSearch)}`),
        apiFetch<any>('/admin/categories'),
        apiFetch<any>('/admin/offers'),
        apiFetch<any>('/admin/subscriptions'),
        apiFetch<any>('/admin/locations'),
      ]);
      setMetrics(dRes.metrics);
      setCategoryStats(dRes.categoryStats);
      setVendors(vRes.vendors);
      setUsers(uRes.users);
      setCategories(cRes.categories);
      setOffers(oRes.offers);
      setPlans(sRes.plans);
      setVendorSubs(sRes.vendorSubscriptions);
      setLocations(lRes.locations);
      if (vRes.vendors.length && !assignData.vendorId) {
        setAssignData((prev) => ({ ...prev, vendorId: String(vRes.vendors[0].id) }));
      }
      if (sRes.plans.length && !assignData.planId) {
        setAssignData((prev) => ({ ...prev, planId: String(sRes.plans[0].id) }));
      }
    } catch {}
  };

  useEffect(() => {
    loadAll();
  }, [user, vendorSearch, vendorStatusFilter, userSearch]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await apiFetch<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.user.role !== 'admin') {
        setAuthError('Admin privileges required.');
        return;
      }
      loginWithToken(res.token, res.user);
      showToast('Signed in to Admin Panel');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-card border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <OffbyLogo size="md" />
            <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
              Admin
            </span>
          </div>
          <h1 className="font-display font-bold text-xl text-slate-900 text-center">
            Admin Panel Login
          </h1>
          {authError && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 text-xs font-medium text-rose-700">
              {authError}
            </div>
          )}
          <form onSubmit={handleAdminLogin} className="mt-5 space-y-3.5">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin Email"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#1D4ED8] text-white font-bold text-sm"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@offby.in');
                setPassword('Admin@123');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
            >
              Fill Demo Admin Credentials
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-5">
            <OffbyLogo size="sm" />
            <span className="text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>
          <nav className="flex md:flex-col gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'vendors', label: 'Vendors', icon: Store },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'categories', label: 'Categories', icon: LayoutGrid },
              { id: 'offers', label: 'Offers Moderation', icon: Tag },
              { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
              { id: 'locations', label: 'Locations', icon: MapPin },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id as any)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold flex-shrink-0 transition-colors ${
                    tab === item.id
                      ? 'bg-[#1D4ED8] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden md:flex flex-col gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
          >
            Customer App
          </button>
          <button
            type="button"
            onClick={logout}
            className="w-full py-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
        <div className="flex items-center justify-between md:hidden">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs font-bold text-brand-700"
          >
            ← Customer App
          </button>
          <button
            type="button"
            onClick={logout}
            className="text-xs font-bold text-rose-600"
          >
            Logout
          </button>
        </div>

        {tab === 'dashboard' && metrics && (
          <div className="space-y-6">
            <h1 className="font-display font-bold text-2xl text-slate-900">
              Platform Overview & Reports
            </h1>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Total Users', val: metrics.totalUsers, color: 'text-brand-700 bg-brand-50' },
                { label: 'Total Vendors', val: metrics.totalVendors, color: 'text-indigo-700 bg-indigo-50' },
                { label: 'Active Offers', val: metrics.activeOffers, color: 'text-emerald-700 bg-emerald-50' },
                { label: 'Active Subscriptions', val: metrics.activeSubscriptions, color: 'text-sky-700 bg-sky-50' },
                { label: 'Pending Approvals', val: metrics.pendingVendors, color: 'text-amber-700 bg-amber-50' },
                { label: 'Blocked Vendors', val: metrics.blockedVendors, color: 'text-rose-700 bg-rose-50' },
              ].map((m) => (
                <div key={m.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card">
                  <div className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${m.color}`}>
                    {m.label}
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-3">{m.val}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card">
              <h2 className="font-bold text-base text-slate-900 mb-4">Shops by Category</h2>
              <div className="space-y-3">
                {categoryStats.map((cs) => (
                  <div key={cs.name} className="flex items-center gap-3">
                    <span className="w-28 text-xs font-semibold text-slate-700">{cs.name}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1D4ED8] rounded-full"
                        style={{ width: `${Math.min(100, cs.shops * 20)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-900 w-8 text-right">{cs.shops}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'vendors' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="font-display font-bold text-xl text-slate-900">Vendor Management</h1>
              <div className="flex gap-2">
                <input
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  placeholder="Search vendors..."
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                />
                <select
                  value={vendorStatusFilter}
                  onChange={(e) => setVendorStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {vendors.map((v) => (
                <div key={v.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{v.business_name}</h3>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        v.approval_status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                        v.approval_status === 'pending' ? 'bg-amber-50 text-amber-700' :
                        'bg-rose-50 text-rose-700'
                      }`}>
                        {v.approval_status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Owner: {v.owner_name} • {v.phone} • {v.category_name || 'Uncategorized'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Plan: {v.plan_name || 'None'} • {v.locality}, {v.city}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {v.approval_status !== 'approved' && (
                      <button
                        type="button"
                        onClick={async () => {
                          await apiFetch(`/admin/vendors/${v.id}/status`, {
                            method: 'PATCH',
                            body: JSON.stringify({ approvalStatus: 'approved', isActive: true }),
                          });
                          showToast(`${v.business_name} approved`);
                          loadAll();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                      >
                        Approve
                      </button>
                    )}
                    {v.approval_status === 'pending' && (
                      <button
                        type="button"
                        onClick={async () => {
                          await apiFetch(`/admin/vendors/${v.id}/status`, {
                            method: 'PATCH',
                            body: JSON.stringify({ approvalStatus: 'rejected' }),
                          });
                          showToast(`${v.business_name} rejected`);
                          loadAll();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold"
                      >
                        Reject
                      </button>
                    )}
                    {v.approval_status !== 'blocked' ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await apiFetch(`/admin/vendors/${v.id}/status`, {
                            method: 'PATCH',
                            body: JSON.stringify({ approvalStatus: 'blocked', isActive: false }),
                          });
                          showToast(`${v.business_name} blocked`);
                          loadAll();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold"
                      >
                        Block
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          await apiFetch(`/admin/vendors/${v.id}/status`, {
                            method: 'PATCH',
                            body: JSON.stringify({ approvalStatus: 'approved', isActive: true }),
                          });
                          showToast(`${v.business_name} unblocked`);
                          loadAll();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold"
                      >
                        Unblock
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="font-display font-bold text-xl text-slate-900">User Management</h1>
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users..."
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs"
              />
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card divide-y divide-slate-100">
              {users.map((u) => (
                <div key={u.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-slate-900">
                      {u.name}{' '}
                      <span className="ml-1.5 text-[10px] uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {u.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {u.email || u.phone} • {u.locality}, {u.city}
                    </p>
                  </div>
                  {u.role !== 'admin' && (
                    <button
                      type="button"
                      onClick={async () => {
                        await apiFetch(`/admin/users/${u.id}/active`, {
                          method: 'PATCH',
                          body: JSON.stringify({ isActive: !u.is_active }),
                        });
                        loadAll();
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        u.is_active ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'categories' && (
          <div className="space-y-4">
            <h1 className="font-display font-bold text-xl text-slate-900">Category Management</h1>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await apiFetch('/admin/categories', { method: 'POST', body: JSON.stringify(newCat) });
                setNewCat({ name: '', icon: 'Tag', bgColor: '#EFF6FF', iconColor: '#1D4ED8' });
                showToast('Category added');
                loadAll();
              }}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card flex flex-wrap gap-2"
            >
              <input
                required
                value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                placeholder="New Category Name"
                className="flex-1 min-w-[160px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#1D4ED8] text-white text-xs font-bold"
              >
                Add Category
              </button>
            </form>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-card divide-y divide-slate-100">
              {categories.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-slate-900">{c.name}</span>
                    <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await apiFetch(`/admin/categories/${c.id}`, {
                          method: 'PUT',
                          body: JSON.stringify({ isActive: !c.is_active }),
                        });
                        loadAll();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-700"
                    >
                      {c.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await apiFetch(`/admin/categories/${c.id}`, { method: 'DELETE' });
                        loadAll();
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'offers' && (
          <div className="space-y-4">
            <h1 className="font-display font-bold text-xl text-slate-900">Offer Moderation</h1>
            <div className="space-y-3">
              {offers.map((o) => (
                <div key={o.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-[#DC2626] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {o.discount_badge}
                      </span>
                      <span className="font-bold text-sm text-slate-900">{o.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {o.shop_name} • Valid till {new Date(o.valid_until).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await apiFetch(`/admin/offers/${o.id}/moderate`, {
                        method: 'PATCH',
                        body: JSON.stringify({ isModeratedRemoved: !o.is_moderated_removed }),
                      });
                      loadAll();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      o.is_moderated_removed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {o.is_moderated_removed ? 'Restore' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'subscriptions' && (
          <div className="space-y-6">
            <h1 className="font-display font-bold text-xl text-slate-900">Subscription Management</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await apiFetch('/admin/subscriptions/plans', {
                    method: 'POST',
                    body: JSON.stringify({
                      ...newPlan,
                      price: Number(newPlan.price),
                      durationDays: Number(newPlan.durationDays),
                      listingPriority: Number(newPlan.listingPriority),
                      benefits: ['Priority listing', 'Featured badge'],
                    }),
                  });
                  setNewPlan({ name: '', planType: 'premium', price: '499', durationDays: '30', listingPriority: '2' });
                  showToast('Subscription plan created');
                  loadAll();
                }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card space-y-3"
              >
                <h2 className="font-bold text-base text-slate-900">Create Subscription Plan</h2>
                <input
                  required
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  placeholder="Plan Name"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                    placeholder="Price ₹"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                  <input
                    type="number"
                    value={newPlan.durationDays}
                    onChange={(e) => setNewPlan({ ...newPlan, durationDays: e.target.value })}
                    placeholder="Days"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                  <input
                    type="number"
                    value={newPlan.listingPriority}
                    onChange={(e) => setNewPlan({ ...newPlan, listingPriority: e.target.value })}
                    placeholder="Priority"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 rounded-xl bg-[#1D4ED8] text-white text-xs font-bold">
                  Create Plan
                </button>
              </form>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await apiFetch('/admin/subscriptions/assign', {
                    method: 'POST',
                    body: JSON.stringify({
                      vendorId: Number(assignData.vendorId),
                      planId: Number(assignData.planId),
                    }),
                  });
                  showToast('Plan assigned to vendor');
                  loadAll();
                }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card space-y-3"
              >
                <h2 className="font-bold text-base text-slate-900">Assign Plan to Vendor</h2>
                <select
                  value={assignData.vendorId}
                  onChange={(e) => setAssignData({ ...assignData, vendorId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.business_name}</option>
                  ))}
                </select>
                <select
                  value={assignData.planId}
                  onChange={(e) => setAssignData({ ...assignData, planId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                  ))}
                </select>
                <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">
                  Assign Subscription
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card">
              <h2 className="font-bold text-base text-slate-900 mb-3">Active Vendor Subscriptions</h2>
              <div className="divide-y divide-slate-100">
                {vendorSubs.map((vs) => (
                  <div key={vs.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{vs.business_name}</span>
                      <span className="ml-2 text-brand-700 font-semibold">{vs.plan_name}</span>
                    </div>
                    <span className="text-slate-500">
                      {vs.status} • Ends {new Date(vs.ends_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'locations' && (
          <div className="space-y-4">
            <h1 className="font-display font-bold text-xl text-slate-900">Location Management</h1>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await apiFetch('/admin/locations', { method: 'POST', body: JSON.stringify(newLoc) });
                setNewLoc({ city: 'Hyderabad', locality: '', pincode: '', lat: '17.45', lng: '78.40' });
                showToast('Location added');
                loadAll();
              }}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card flex flex-wrap gap-2"
            >
              <input
                required
                value={newLoc.locality}
                onChange={(e) => setNewLoc({ ...newLoc, locality: e.target.value })}
                placeholder="Locality (e.g. Gachibowli)"
                className="flex-1 min-w-[160px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
              <input
                value={newLoc.pincode}
                onChange={(e) => setNewLoc({ ...newLoc, pincode: e.target.value })}
                placeholder="Pincode"
                className="w-28 px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#1D4ED8] text-white text-xs font-bold">
                Add Location
              </button>
            </form>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-card divide-y divide-slate-100">
              {locations.map((l) => (
                <div key={l.id} className="p-4 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-bold text-slate-900">{l.locality}</span>, {l.city}{' '}
                    <span className="text-xs text-slate-400">{l.pincode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await apiFetch(`/admin/locations/${l.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ isActive: !l.is_active }),
                      });
                      loadAll();
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      l.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {l.is_active ? 'Active' : 'Inactive'}
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
