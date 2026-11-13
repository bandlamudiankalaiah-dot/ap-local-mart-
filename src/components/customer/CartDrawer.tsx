import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Tag,
  ArrowRight,
  Truck,
  Check,
  Sparkles
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { usePincode } from '../../context/PincodeContext';

interface CartDrawerProps {
  onOpenCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenCheckout }) => {
  const {
    items,
    itemCount,
    subtotal,
    totalDiscount,
    deliveryCharge,
    finalTotal,
    appliedCoupon,
    couponDiscount,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon
  } = useCart();

  const { currentPincode } = usePincode();
  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = codeToApply || couponInput;
    if (!code.trim()) return;
    setCouponLoading(true);
    setCouponMsg(null);
    const res = await applyCoupon(code.trim());
    setCouponLoading(false);
    setCouponMsg({ success: res.success, text: res.message });
    if (res.success) {
      setCouponInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-lg w-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Your Shopping Cart</h3>
              <p className="text-xs text-slate-500 font-medium">{itemCount} items in cart</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-red-600 hover:text-red-700 font-bold px-2 py-1 hover:bg-red-50 rounded-lg transition"
              >
                Clear Cart
              </button>
            )}
            <button
              id="close-cart-drawer"
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Free Delivery Bar */}
        <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200/70 text-xs flex items-center justify-between text-amber-950">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-700" />
            <span>
              {subtotal >= 499 ? (
                <strong className="text-emerald-700 font-bold">🎉 You qualify for FREE AP Delivery!</strong>
              ) : (
                <span>
                  Add <strong className="font-mono font-bold">₹{499 - subtotal}</strong> more for FREE AP Delivery!
                </span>
              )}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">PIN: {currentPincode}</span>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
              <h4 className="font-bold text-base text-slate-800">Your Cart is Empty</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Explore authentic Andhra pickles, handlooms, spices and everyday essentials to fill your basket.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="pt-3.5 first:pt-0 flex gap-3.5 items-start">
                <img
                  src={item.product.images[0]}
                  alt={item.product.title}
                  className="w-20 h-20 object-cover rounded-xl border border-slate-200 shrink-0"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug">
                      {item.product.title}
                    </h4>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-red-600 p-1 transition"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium">
                    Seller: <span className="text-slate-700 font-semibold">{item.product.sellerName}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1.5">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-sm text-slate-900 font-serif">
                        ₹{(item.product.sellingPrice * item.quantity).toLocaleString('en-IN')}
                      </span>
                      {item.product.originalPrice > item.product.sellingPrice && (
                        <span className="text-[10px] text-slate-400 line-through">
                          ₹{(item.product.originalPrice * item.quantity).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-slate-200 text-slate-700 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-mono font-bold text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-slate-200 text-slate-700 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer & Price Calculation Section */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/80 space-y-4">
            {/* Coupon Application Box */}
            <div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="cart-coupon-input"
                    type="text"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter Coupon (e.g. ANDHRA50)"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-amber-500"
                  />
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                <button
                  id="apply-coupon-btn"
                  onClick={() => handleApplyCoupon()}
                  disabled={couponLoading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>

              {/* Quick Coupon Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['ANDHRA50', 'UGADI2026', 'GODAVARI100'].map(code => (
                  <button
                    key={code}
                    onClick={() => handleApplyCoupon(code)}
                    className="px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold transition flex items-center gap-1"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-amber-700" />
                    <span>{code}</span>
                  </button>
                ))}
              </div>

              {couponMsg && (
                <p className={`text-xs mt-1.5 font-semibold ${couponMsg.success ? 'text-emerald-700' : 'text-red-600'}`}>
                  {couponMsg.text}
                </p>
              )}

              {appliedCoupon && (
                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                  <span className="font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    {appliedCoupon.code} applied (-₹{couponDiscount})
                  </span>
                  <button onClick={removeCoupon} className="text-red-600 hover:underline font-bold text-[11px]">
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Bill Details Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
              <div className="flex justify-between">
                <span>Item Subtotal ({itemCount} items)</span>
                <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Product Savings</span>
                  <span className="font-mono">-₹{totalDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                  <span className="font-mono">-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="font-mono font-semibold">
                  {deliveryCharge === 0 ? (
                    <span className="text-emerald-600 font-bold">FREE</span>
                  ) : (
                    `₹${deliveryCharge}`
                  )}
                </span>
              </div>

              <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-200 font-serif">
                <span>Final Total Amount</span>
                <span>₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Proceed to Checkout CTA */}
            <button
              id="proceed-to-checkout-btn"
              onClick={() => {
                setIsCartOpen(false);
                onOpenCheckout();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 transform active:scale-98"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
