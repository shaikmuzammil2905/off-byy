import React from 'react';

export const OffbyLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const iconDim = size === 'sm' ? 28 : size === 'lg' ? 40 : 32;
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-[22px]';

  return (
    <div className="inline-flex items-center gap-1.5 select-none">
      <svg
        width={iconDim}
        height={iconDim}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="offbyPinGrad" x1="6" y1="4" x2="34" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="55%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
        </defs>
        <path
          d="M20 3C11.716 3 5 9.716 5 18C5 27.6 17.5 36.7 19.2 37.9C19.68 38.24 20.32 38.24 20.8 37.9C22.5 36.7 35 27.6 35 18C35 9.716 28.284 3 20 3Z"
          fill="url(#offbyPinGrad)"
        />
        <circle cx="19.5" cy="17.2" r="7.5" fill="white" />
        <circle cx="19.5" cy="17.2" r="4.8" fill="url(#offbyPinGrad)" />
        <path
          d="M25 22.5L29.5 27"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <div className="flex flex-col leading-none">
        <span className={`font-display font-extrabold tracking-tight ${textSize} text-[#1E3A8A]`}>
          off<span className="text-[#2563EB]">by</span>
        </span>
        <span className="text-[7px] font-bold tracking-[0.12em] text-[#334155] uppercase mt-0.5">
          LOCAL OFFERS SEARCH
        </span>
      </div>
    </div>
  );
};
