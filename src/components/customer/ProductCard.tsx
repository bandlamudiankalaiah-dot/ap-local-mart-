import React from 'react';
import { Product } from '../../types';
import { Heart, Star, ShoppingBag, Truck, Sparkles, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePincode } from '../../context/PincodeContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { language } = useLanguage();
  const { currentPincode, pincodeInfo } = usePincode();

  const isFavorite = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative bg-white border border-slate-200/90 hover:border-amber-400 rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-200 flex flex-col cursor-pointer"
    >
      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        <img
          src={product.images[0]}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {product.isAndhraSpecial && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black tracking-wide uppercase shadow-xs">
              <Sparkles className="w-3 h-3 fill-current" />
              AP Special
            </span>
          )}

          {product.originDistrict && (
            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-amber-300 text-[9px] font-bold tracking-tight">
              📍 {product.originDistrict}
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          id={`wishlist-toggle-${product.id}`}
          onClick={handleToggleWishlist}
          className={`absolute top-2.5 right-2.5 z-10 p-2 rounded-full backdrop-blur-xs transition ${isFavorite ? 'bg-red-50 text-red-600 shadow-xs' : 'bg-white/80 hover:bg-white text-slate-600 hover:text-red-600'}`}
          title="Save to Wishlist"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Discount Tag */}
        {product.discountPercent > 0 && (
          <div className="absolute bottom-2.5 left-2.5 bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded-md shadow-xs">
            {product.discountPercent}% OFF
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          {/* Brand & Rating row */}
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide truncate max-w-[140px]">
              {product.brand}
            </span>
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[11px]">
              <span>{product.rating.toFixed(1)}</span>
              <Star className="w-3 h-3 fill-current text-emerald-600" />
              <span className="text-[9px] text-slate-400 font-normal">({product.reviewCount})</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-amber-800 transition">
            {language === 'te' && product.titleTe ? product.titleTe : product.title}
          </h3>
        </div>

        <div>
          {/* Price Row */}
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-black text-slate-950 font-serif">
              ₹{product.sellingPrice.toLocaleString('en-IN')}
            </span>
            {product.originalPrice > product.sellingPrice && (
              <span className="text-xs text-slate-400 line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* AP Delivery estimate */}
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
            <Truck className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">
              Delivery to <strong className="text-slate-700 font-mono">{currentPincode}</strong> in {product.deliveryDays || 1} day
            </span>
          </div>

          {/* Add to Cart CTA Button */}
          <button
            id={`add-to-cart-${product.id}`}
            onClick={handleAddToCart}
            className="w-full mt-3 py-2 px-3 bg-slate-900 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
};
