import React, { useState, useEffect } from 'react';
import { Product, Review, Seller } from '../../types';
import {
  X,
  Star,
  Heart,
  ShoppingBag,
  Zap,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  MapPin,
  Store,
  CheckCircle2,
  Share2,
  Clock,
  MessageSquarePlus
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePincode } from '../../context/PincodeContext';
import { api } from '../../services/api';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenCheckoutDirect?: () => void;
  onWriteReview?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onOpenCheckoutDirect,
  onWriteReview
}) => {
  const { addToCart, setIsCartOpen } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { language } = useLanguage();
  const { currentPincode, pincodeInfo, updatePincode } = usePincode();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [pinCheckInput, setPinCheckInput] = useState(currentPincode);
  const [pinMessage, setPinMessage] = useState<string | null>(null);
  const [checkingPin, setCheckingPin] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      setActiveImageIndex(0);
      setQuantity(1);
      api.getProduct(product.id)
        .then(res => {
          if (res.reviews) setReviews(res.reviews);
          if (res.seller) setSeller(res.seller);
        })
        .catch(() => {});

      api.getProductReviews(product.id)
        .then(res => {
          if (res.reviews) setReviews(res.reviews);
        })
        .catch(() => {});
    }
  }, [product]);

  if (!product) return null;

  const isFavorite = isInWishlist(product.id);

  const handleCheckPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingPin(true);
    setPinMessage(null);
    const res = await updatePincode(pinCheckInput);
    setCheckingPin(false);
    if (res.success && res.info) {
      setPinMessage(`Delivery available to ${res.info.city} in ${res.info.estimatedDays} day(s). Cash on Delivery available.`);
    } else {
      setPinMessage('Sorry, this pincode is currently unserviceable.');
    }
  };

  const handleBuyNow = async () => {
    await addToCart(product, quantity);
    onClose();
    if (onOpenCheckoutDirect) {
      onOpenCheckoutDirect();
    } else {
      setIsCartOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Close Button */}
        <button
          id="close-product-detail"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
          {/* Left Column: Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover object-center"
              />

              {product.isAndhraSpecial && (
                <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-md flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  Andhra Special
                </div>
              )}

              {product.discountPercent > 0 && (
                <div className="absolute bottom-3 left-3 bg-emerald-600 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-md">
                  {product.discountPercent}% SAVINGS
                </div>
              )}
            </div>

            {/* Thumbnail selector */}
            {product.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition ${activeImageIndex === idx ? 'border-amber-600 ring-2 ring-amber-400/20 scale-105' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-slate-600 font-medium">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                <ShieldCheck className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                <span>100% Genuine</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                <RotateCcw className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                <span>7-Day Return</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                <Truck className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                <span>AP Express Delivery</span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Info & Actions */}
          <div className="flex flex-col justify-between space-y-5">
            <div>
              {/* Brand & Origin */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  {product.brand}
                </span>
                {product.originDistrict && (
                  <span className="text-xs font-semibold text-slate-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    📍 Handcrafted in {product.originDistrict}, AP
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {language === 'te' && product.titleTe ? product.titleTe : product.title}
              </h1>

              {/* Rating row */}
              <div className="flex items-center gap-3 mt-2.5">
                <div className="flex items-center gap-1 bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-md text-xs">
                  <span>{product.rating.toFixed(1)}</span>
                  <Star className="w-3.5 h-3.5 fill-current" />
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {product.reviewCount} Verified AP Customer Ratings
                </span>
              </div>

              {/* Pricing Section */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-slate-950 font-serif">
                    ₹{product.sellingPrice.toLocaleString('en-IN')}
                  </span>
                  {product.originalPrice > product.sellingPrice && (
                    <>
                      <span className="text-base text-slate-400 line-through">
                        ₹{product.originalPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-sm font-bold text-emerald-600">
                        Save ₹{(product.originalPrice - product.sellingPrice).toLocaleString('en-IN')} ({product.discountPercent}% off)
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Inclusive of all local taxes & GST</p>
              </div>

              {/* Description */}
              <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">Description</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Specifications Table */}
              {product.specifications && product.specifications.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Product Specifications</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs divide-y divide-slate-200">
                    {product.specifications.map((spec, idx) => (
                      <div key={idx} className="grid grid-cols-3 p-2 bg-white even:bg-slate-50">
                        <span className="font-semibold text-slate-500">{spec.key}</span>
                        <span className="col-span-2 text-slate-800 font-medium">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pincode Delivery Checker */}
              <div className="mt-5 p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span>Check Delivery Speed & COD in your area</span>
                </div>

                <form onSubmit={handleCheckPincode} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={pinCheckInput}
                    onChange={e => setPinCheckInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit PIN code"
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                  <button
                    type="submit"
                    disabled={checkingPin}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition"
                  >
                    {checkingPin ? 'Checking...' : 'Check'}
                  </button>
                </form>

                {pinMessage && (
                  <p className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{pinMessage}</span>
                  </p>
                )}
              </div>

              {/* Seller Information Card */}
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{product.sellerName}</div>
                    <div className="text-[10px] text-slate-500">Verified Andhra Vendor • 4.8★ Rating</div>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                  KYC Verified
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              {/* Quantity selector */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">Quantity:</span>
                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-2.5 py-1 text-slate-700 hover:bg-slate-200 font-bold"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-mono font-bold text-slate-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-2.5 py-1 text-slate-700 hover:bg-slate-200 font-bold"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold">In Stock ({product.stock} units)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  id="detail-add-to-cart"
                  onClick={() => {
                    addToCart(product, quantity);
                  }}
                  className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                <button
                  id="detail-buy-now"
                  onClick={handleBuyNow}
                  className="py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Buy Now (Express)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="border-t border-slate-200 p-6 sm:p-8 bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Customer Ratings & Reviews</h3>
              <p className="text-xs text-slate-500">Real feedback from verified buyers across Andhra Pradesh</p>
            </div>
            {onWriteReview && (
              <button
                onClick={() => onWriteReview(product)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>Write a Review</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No reviews yet. Be the first to review this Andhra product!</p>
            ) : (
              reviews.map(rev => (
                <div key={rev.id} className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5 bg-emerald-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded">
                        <span>{rev.rating}</span>
                        <Star className="w-2.5 h-2.5 fill-current" />
                      </div>
                      <span className="font-bold text-xs text-slate-900">{rev.title}</span>
                    </div>
                    {rev.verifiedPurchase && (
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-1">
                    <span>{rev.userName} ({rev.userDistrict || 'Andhra Pradesh'})</span>
                    <span>•</span>
                    <span>{new Date(rev.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
