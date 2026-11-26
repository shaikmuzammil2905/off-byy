import React from 'react';

export const OffbyLogo: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const heightClass =
    size === 'sm' ? 'h-10' : size === 'lg' ? 'h-16' : 'h-14 sm:h-16';

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <img
        src="/assets/logo.png"
        alt="offby — Local Offers Search"
        className={`${heightClass} w-auto object-contain pointer-events-none drop-shadow-sm`}
      />
    </div>
  );
};
