import React from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { GlobalHeader } from './components/GlobalHeader';
import { BottomNav } from './components/BottomNav';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { OffersPage } from './pages/OffersPage';
import { SavedPage } from './pages/SavedPage';
import { ProfilePage } from './pages/ProfilePage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryPage } from './pages/CategoryPage';
import { ShopDetailsPage } from './pages/ShopDetailsPage';
import { LoginPage } from './pages/LoginPage';
import { VendorPortal } from './pages/vendor/VendorPortal';
import { AdminPanel } from './pages/admin/AdminPanel';

const AppShell: React.FC = () => {
  const location = useLocation();
  const { toast } = useApp();

  const isPortal =
    location.pathname.startsWith('/vendor') ||
    location.pathname.startsWith('/admin');

  return (
    <>
      {!isPortal && <GlobalHeader />}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/category/:id" element={<CategoryPage />} />
        <Route path="/shop/:id" element={<ShopDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/vendor" element={<VendorPortal />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>

      {!isPortal && <BottomNav />}

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </BrowserRouter>
  );
}
