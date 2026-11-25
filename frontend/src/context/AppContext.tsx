import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, getAuthToken, setAuthToken } from '../lib/api';
import { LocationOption, User } from '../types';

interface AppContextType {
  user: User | null;
  loadingAuth: boolean;
  location: LocationOption;
  setLocation: (loc: LocationOption) => void;
  loginWithToken: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  savedIds: Set<number>;
  toggleSaveShop: (shopId: number) => Promise<boolean>;
  recentSearches: string[];
  addRecentSearch: (q: string) => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const DEFAULT_LOCATION: LocationOption = {
  city: 'Hyderabad',
  locality: 'Kukatpally',
  pincode: '500072',
  lat: 17.4948,
  lng: 78.3996,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [location, setLocationState] = useState<LocationOption>(() => {
    try {
      const saved = localStorage.getItem('offby_location');
      return saved ? JSON.parse(saved) : DEFAULT_LOCATION;
    } catch {
      return DEFAULT_LOCATION;
    }
  });
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('offby_recent_searches');
      return saved ? JSON.parse(saved) : ['Bean & Brew', 'Pizza', 'Salon', '20% OFF'];
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const loadSaved = async () => {
    if (!getAuthToken()) {
      setSavedIds(new Set());
      return;
    }
    try {
      const res = await apiFetch<{ savedShops: { id: number }[] }>('/saved');
      setSavedIds(new Set(res.savedShops.map((s) => s.id)));
    } catch {
      // Ignore if not customer
    }
  };

  const refreshUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoadingAuth(false);
      return;
    }
    try {
      const res = await apiFetch<{ user: User }>('/auth/me');
      setUser(res.user);
      await loadSaved();
    } catch {
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const setLocation = (loc: LocationOption) => {
    setLocationState(loc);
    localStorage.setItem('offby_location', JSON.stringify(loc));
    if (user && getAuthToken()) {
      apiFetch('/auth/location', {
        method: 'PUT',
        body: JSON.stringify(loc),
      }).catch(() => {});
    }
  };

  const loginWithToken = (token: string, u: User) => {
    setAuthToken(token);
    setUser(u);
    loadSaved();
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setSavedIds(new Set());
    showToast('Signed out successfully');
  };

  const toggleSaveShop = async (shopId: number): Promise<boolean> => {
    if (!user) {
      showToast('Please sign in to save favourite shops');
      return false;
    }
    try {
      const res = await apiFetch<{ saved: boolean }>(`/saved/${shopId}`, { method: 'POST' });
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (res.saved) next.add(shopId);
        else next.delete(shopId);
        return next;
      });
      showToast(res.saved ? 'Added to Saved Shops' : 'Removed from Saved Shops');
      return res.saved;
    } catch (err: any) {
      showToast(err.message || 'Could not update saved shops');
      return false;
    }
  };

  const addRecentSearch = (q: string) => {
    const clean = q.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const next = [clean, ...prev.filter((x) => x.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
      localStorage.setItem('offby_recent_searches', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loadingAuth,
        location,
        setLocation,
        loginWithToken,
        logout,
        refreshUser,
        savedIds,
        toggleSaveShop,
        recentSearches,
        addRecentSearch,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
