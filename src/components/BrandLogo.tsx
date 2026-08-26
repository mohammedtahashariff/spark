import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showWordmark = true }) => {
  const heights = { sm: 'h-10', md: 'h-14', lg: 'h-28' };

  return (
    <div className="flex items-center gap-3 min-w-0">
      <img
        src="/spark-logo.png"
        alt="Spark Edutech"
        className={`${heights[size]} w-auto object-contain shrink-0 select-none`}
      />
      {showWordmark && (
        <div className="min-w-0 leading-tight">
          <p className="font-bold tracking-[0.22em] text-black dark:text-white text-sm">SPARK</p>
          <p className="text-[9px] font-semibold tracking-[0.28em] text-[#E50914] mt-0.5">EDUTECH</p>
          <p className="text-[8px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">DevLustro technologies pvt ltd</p>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
