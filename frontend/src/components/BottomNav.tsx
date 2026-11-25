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
    <nav
      aria-label="Customer bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200/80 shadow-nav safe-bottom"
    >
      <div className="max-w-md mx-auto md:max-w-2xl lg:max-w-4xl flex items-center justify-around h-16 px-2">
        {TABS.map((tab) => {
          const active = isTabActive(tab.path);
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                active ? 'text-[#1D4ED8]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon
                className={`w-[22px] h-[22px] transition-transform ${
                  active ? 'scale-105' : ''
                }`}
                fill={active && tab.label === 'Saved' ? '#1D4ED8' : 'none'}
                strokeWidth={active ? 2.4 : 1.9}
              />
              <span className={`text-[11px] ${active ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
