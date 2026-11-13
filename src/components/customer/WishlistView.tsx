import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';

interface WishlistViewProps {
  onSelectProduct: (product: Product) => void;
  onNavigateHome: () => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({ onSelectProduct, onNavigateHome }) => {
  const { wishlistIds, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProducts().then(res => {
      setAllProducts(res.products || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const wishlistedProducts = allProducts.filter(p => wishlistIds.includes(p.id));

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading your saved items...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black font-serif text-slate-900">My Saved Wishlist</h2>
          <p className="text-xs text-slate-500">Items you loved and saved for later shopping</p>
        </div>
        <span className="px-3 py-1 bg-red-50 text-red-700 font-bold text-xs rounded-full border border-red-200">
          {wishlistedProducts.length} Saved Item{wishlistedProducts.length === 1 ? '' : 's'}
        </span>
      </div>

      {wishlistedProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8">
          <Heart className="w-14 h-14 mx-auto mb-3 text-slate-300 stroke-1" />
          <h3 className="text-lg font-bold text-slate-900">Your Wishlist is Empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            Tap the heart icon on any Andhra handloom, sweet, or craft to save it to your personal wishlist.
          </p>
          <button
            onClick={onNavigateHome}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Explore AndhraMart Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistedProducts.map(prod => (
            <div
              key={prod.id}
              onClick={() => onSelectProduct(prod)}
              className="group bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-3">
                  <img src={prod.images[0]} alt={prod.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(prod);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-red-600 hover:bg-white transition"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-[11px] font-bold text-amber-800 uppercase">{prod.brand}</span>
                <h4 className="font-bold text-xs text-slate-900 line-clamp-2 mt-0.5">{prod.title}</h4>
              </div>

              <div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="font-black font-serif text-base text-slate-900">₹{prod.sellingPrice}</span>
                  {prod.originalPrice > prod.sellingPrice && (
                    <span className="text-xs text-slate-400 line-through">₹{prod.originalPrice}</span>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(prod, 1);
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Move to Cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
