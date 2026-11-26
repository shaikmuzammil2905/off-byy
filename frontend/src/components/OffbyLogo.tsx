import React from 'react';

export const OffbyLogo: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const heightClass =
    size === 'sm' ? 'h-9' : size === 'lg' ? 'h-14' : 'h-11';

  return (
    <div className={`inline-flex items-center justify-center select-none overflow-hidden ${className}`}>
      <img
        src="/assets/logo.png"
        alt="offby — Local Offers Search"
        className={`${heightClass} w-auto object-contain mix-blend-multiply scale-125 pointer-events-none`}
      />
    </div>
  );
};
