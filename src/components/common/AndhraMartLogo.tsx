import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface AndhraMartLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  showTagline?: boolean;
}

export const AndhraMartLogo: React.FC<AndhraMartLogoProps> = ({
  size = 'md',
  variant = 'dark',
  showTagline = true
}) => {
  const { language } = useLanguage();

  const sizeClasses = {
    sm: { icon: 'w-7 h-7', title: 'text-lg', sub: 'text-[9px]' },
    md: { icon: 'w-9 h-9', title: 'text-2xl', sub: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', title: 'text-3xl', sub: 'text-xs' },
    xl: { icon: 'w-16 h-16', title: 'text-4xl', sub: 'text-sm' }
  };

  const textColor = variant === 'light' ? 'text-white' : 'text-slate-900';
  const subColor = variant === 'light' ? 'text-amber-300' : 'text-amber-800';

  return (
    <div className="flex items-center gap-2.5 select-none group cursor-pointer">
      {/* Original Andhra-inspired Emblem: Sun-Temple Arch + Sacred Kalasam + Modern Shopping Basket */}
      <div
        className={`${sizeClasses[size].icon} relative flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 shadow-md shadow-orange-500/20 text-white transition-transform group-hover:scale-105 duration-200`}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5"
        >
          {/* Temple Arch Outline */}
          <path
            d="M8 38V22C8 13.1634 15.1634 6 24 6C32.8366 6 40 13.1634 40 22V38"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Kalasam / Auspicious Spire */}
          <path
            d="M24 2V6M21 4H27"
            stroke="#FEF08A"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Shopping Bag Base with Andhra Rice Grain / Mango motif */}
          <path
            d="M14 26C14 23 18 21 24 21C30 21 34 23 34 26V36C34 39.3137 31.3137 42 28 42H20C16.6863 42 14 39.3137 14 36V26Z"
            fill="white"
            fillOpacity="0.95"
          />
          {/* Telugu 'Aa' / Lettermark stylized motif inside */}
          <path
            d="M20 30C20 28 22 26 24 26C26 26 28 28 28 30C28 33 24 35 24 37"
            stroke="#EA580C"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="24" cy="38" r="1.5" fill="#DC2626" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-tight font-serif ${sizeClasses[size].title} ${textColor}`}>
            Andhra<span className="text-amber-700">Mart</span>
          </span>
          <span className="bg-amber-100 text-amber-900 border border-amber-300/80 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
            AP
          </span>
        </div>

        {showTagline && (
          <div className="flex items-center gap-1 mt-0.5 leading-none">
            <span className={`font-medium tracking-wider uppercase ${sizeClasses[size].sub} ${subColor}`}>
              {language === 'te' ? 'ఆంధ్రప్రదేశ్ షాపింగ్ మార్కెట్‌ప్లేస్' : 'Andhra Pradesh Shopping Marketplace'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
