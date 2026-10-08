'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  href?: string;
  variant?: 'horizontal' | 'badge' | 'full-image';
  theme?: 'dark' | 'light';
}

export function BrandLogo({
  className = '',
  size = 'md',
  showText = true,
  href = '/',
  variant = 'horizontal',
  theme = 'dark'
}: BrandLogoProps) {
  // Dimension definitions
  const dimensions = {
    sm: { symbol: 28, textAACOM: 'text-lg', textSOFT: 'text-lg' },
    md: { symbol: 38, textAACOM: 'text-xl sm:text-2xl', textSOFT: 'text-xl sm:text-2xl' },
    lg: { symbol: 48, textAACOM: 'text-2xl sm:text-3xl', textSOFT: 'text-2xl sm:text-3xl' },
    xl: { symbol: 64, textAACOM: 'text-3xl sm:text-4xl', textSOFT: 'text-3xl sm:text-4xl' }
  }[size];

  const isLight = theme === 'light';

  const content = (
    <div className={`inline-flex items-center gap-3 group select-none ${className}`}>
      {/* Official AACOMSOFT Symbol with subtle glow */}
      <div className="relative flex items-center justify-center">
        <div className={`absolute inset-0 rounded-xl blur-md transition-all duration-300 ${isLight ? 'bg-teal-500/10 group-hover:bg-teal-500/20' : 'bg-teal-400/20 group-hover:bg-teal-400/35'}`} />
        <div className={`relative p-1.5 rounded-xl transition-all duration-300 group-hover:scale-105 ${
          isLight
            ? 'bg-white border border-slate-200/90 shadow-md group-hover:border-teal-400/60'
            : 'bg-slate-900/90 border border-slate-700/60 shadow-lg shadow-teal-950/40 group-hover:border-teal-500/50'
        }`}>
          <Image
            src="/aacomsoft-symbol.png"
            alt="AACOMSOFT"
            width={dimensions.symbol}
            height={dimensions.symbol}
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Official Typographic Wordmark */}
      {showText && (
        <div className="flex items-baseline tracking-tight font-sans">
          <span className={`${dimensions.textAACOM} font-black transition-colors duration-200 ${
            isLight
              ? 'text-teal-700 group-hover:text-teal-600'
              : 'text-white group-hover:text-teal-300'
          }`}>
            AACOM
          </span>
          <span className={`${dimensions.textSOFT} font-light tracking-wide ml-1.5 transition-colors duration-200 ${
            isLight
              ? 'text-slate-500 group-hover:text-slate-800'
              : 'text-slate-300 group-hover:text-slate-100'
          }`}>
            SOFT
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
