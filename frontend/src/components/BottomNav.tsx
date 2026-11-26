import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Tag, Heart, User } from 'lucide-react';

const TABS = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Explore', path: '/explore', icon: Search },
  { label: 'Offers', path: '/offers', icon: Tag },
  { label: 'Saved', path: '/saved', icon: Heart },
  { label: 'Profile', path: '/profile', icon: User },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isTabActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <footer
      aria-label="Customer bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
    >
      <div className="max-w-md mx-auto md:max-w-2xl lg:max-w-4xl bg-white/95 backdrop-blur-md border-t border-blue-100 shadow-nav rounded-t-2xl">
        <nav className="flex items-center justify-around h-[68px] px-2">
          {TABS.map((tab) => {
            const active = isTabActive(tab.path);
            const Icon = tab.icon;
            return (
              <button
                key={tab.path}
                type="button"
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center justify-center transition-all ${
                  active
                    ? 'bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] text-white px-4 py-1.5 rounded-2xl shadow-md shadow-blue-500/30'
                    : 'text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl'
                }`}
              >
                <Icon
                  className="w-5 h-5"
                  fill={active && (tab.label === 'Saved' || tab.label === 'Home' || tab.label === 'Profile' || tab.label === 'Offers') ? 'currentColor' : 'none'}
                  strokeWidth={active ? 2.2 : 1.9}
                />
                <span className={`text-[11px] mt-0.5 ${active ? 'font-bold' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </footer>
  );
};
