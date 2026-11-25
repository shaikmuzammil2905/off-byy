import React, { useEffect, useState } from 'react';
import { ArrowLeft, Crosshair, MapPin, Search } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { LocationOption } from '../types';
import { useApp } from '../context/AppContext';

export const LocationModal: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const { location, setLocation, showToast } = useApp();
  const [query, setQuery] = useState('');
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    if (!open) return;
    apiFetch<{ locations: LocationOption[] }>(`/locations?q=${encodeURIComponent(query)}`)
      .then((res) => setLocations(res.locations))
      .catch(() => {});
  }, [open, query]);

  if (!open) return null;

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser');
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetecting(false);
        setLocation({
          city: 'Hyderabad',
          locality: 'Current Location',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        showToast('Location updated using GPS');
        onClose();
      },
      () => {
        setDetecting(false);
        showToast('Location permission denied. Please select manually.');
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100"
            aria-label="Close location selector"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h2 className="font-bold text-lg text-slate-900">Select Location</h2>
            <p className="text-xs text-slate-500">
              Current: {location.locality}, {location.city}
            </p>
          </div>
        </div>

        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search locality, area or pincode..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={detecting}
          className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-brand-50 text-brand-700 font-semibold text-sm hover:bg-brand-100 transition-colors"
        >
          <Crosshair className={`w-5 h-5 ${detecting ? 'animate-spin' : ''}`} />
          <span>{detecting ? 'Detecting your location...' : 'Use my current GPS location'}</span>
        </button>

        <div className="mt-4 overflow-y-auto flex-1 space-y-1.5 pr-1">
          {locations.map((loc) => {
            const active = loc.locality === location.locality && loc.city === location.city;
            return (
              <button
                key={`${loc.city}-${loc.locality}`}
                type="button"
                onClick={() => {
                  setLocation(loc);
                  showToast(`Location set to ${loc.locality}, ${loc.city}`);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors ${
                  active ? 'bg-brand-600 text-white' : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin className={`w-4 h-4 ${active ? 'text-white' : 'text-brand-600'}`} />
                  <div>
                    <div className="font-semibold text-sm">{loc.locality}</div>
                    <div className={`text-xs ${active ? 'text-blue-100' : 'text-slate-500'}`}>
                      {loc.city} {loc.pincode ? `• ${loc.pincode}` : ''}
                    </div>
                  </div>
                </div>
                {active && <span className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full">Active</span>}
              </button>
            );
          })}
          {locations.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-8">No matching localities found</p>
          )}
        </div>
      </div>
    </div>
  );
};
