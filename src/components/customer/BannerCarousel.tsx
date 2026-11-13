import React, { useState, useEffect } from 'react';
import { Banner } from '../../types';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface BannerCarouselProps {
  banners: Banner[];
  onBannerClick: (categoryId: string) => void;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners, onBannerClick }) => {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners || banners.length === 0) return null;

  const current = banners[currentIndex];

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 bg-slate-900 text-white min-h-[300px] sm:min-h-[360px] flex items-center">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={current.image}
          alt={current.title}
          className="w-full h-full object-cover object-center opacity-35 scale-105 transition-transform duration-1000"
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${current.bgGradient} opacity-90 mix-blend-multiply`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
      </div>

      {/* Slide Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 py-8 sm:py-12 w-full flex flex-col justify-center items-start">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] sm:text-xs font-black uppercase tracking-wider mb-3 shadow-md">
          <Sparkles className="w-3.5 h-3.5 fill-current text-amber-900" />
          <span>{current.badge}</span>
        </div>

        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black font-serif tracking-tight text-white max-w-2xl leading-tight mb-2 drop-shadow-md">
          {current.title}
        </h2>

        {language === 'te' && current.taglineTe && (
          <p className="text-amber-300 font-bold text-base sm:text-xl mb-1">
            {current.taglineTe}
          </p>
        )}

        <p className="text-slate-100 text-sm sm:text-lg max-w-xl mb-6 font-medium leading-relaxed drop-shadow-xs">
          {current.subtitle}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id={`banner-cta-${current.id}`}
            onClick={() => onBannerClick(current.category)}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm rounded-xl transition transform active:scale-95 shadow-lg flex items-center gap-2"
          >
            <span>{current.ctaText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <span className="hidden sm:inline text-xs text-amber-200/90 font-medium">
            ⚡ Express delivery across all 26 AP Districts
          </span>
        </div>
      </div>

      {/* Nav Arrows */}
      {banners.length > 1 && (
        <>
          <button
            id="banner-prev-btn"
            onClick={() => setCurrentIndex((currentIndex - 1 + banners.length) % banners.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition border border-white/10"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            id="banner-next-btn"
            onClick={() => setCurrentIndex((currentIndex + 1) % banners.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition border border-white/10"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all ${currentIndex === idx ? 'w-8 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/70'}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
