import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showWordmark = true }) => {
  const heights = { sm: 'h-8', md: 'h-11', lg: 'h-16' };

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="bg-white rounded-xl p-1 shadow-sm border border-slate-200/80 dark:border-zinc-800 flex items-center justify-center shrink-0">
        <img
          src="/spark-logo.png"
          alt="Spark Logo"
          className={`${heights[size]} w-auto object-contain select-none`}
        />
      </div>
      {showWordmark && (
        <div className="min-w-0 leading-tight hidden sm:block">
          <p className="text-[10px] font-bold tracking-[0.22em] text-rose-600 dark:text-rose-500 uppercase">Edutech Operations</p>
          <p className="text-[8px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">DevLustro technologies</p>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
