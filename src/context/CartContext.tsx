import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, Coupon } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  totalDiscount: number;
  deliveryCharge: number;
  finalTotal: number;
  appliedCoupon: Coupon | null;
  couponDiscount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number, selectedVariant?: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  refreshCart: () => Promise<void>;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshCart = async () => {
    try {
      const res = await api.getCart(user?.id);
      if (res.items) {
        setItems(res.items);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    refreshCart();
  }, [user?.id]);

  const addToCart = async (product: Product, quantity = 1, selectedVariant?: string) => {
    setLoading(true);
    try {
      await api.addToCart(product.id, quantity, selectedVariant, user?.id);
      await refreshCart();
      setIsCartOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    try {
      await api.updateCartItem(cartItemId, quantity, user?.id);
      await refreshCart();
    } catch (e) {
      console.error(e);
    }
  };

  const removeItem = async (cartItemId: string) => {
    try {
      await api.removeCartItem(cartItemId, user?.id);
      await refreshCart();
    } catch (e) {
      console.error(e);
    }
  };

  const clearCart = async () => {
    try {
      await api.clearCart(user?.id);
      setItems([]);
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const subtotal = items.reduce((sum, i) => sum + (i.product.sellingPrice * i.quantity), 0);
  const totalDiscount = items.reduce((sum, i) => sum + ((i.product.originalPrice - i.product.sellingPrice) * i.quantity), 0);
  const deliveryCharge = subtotal > 499 || items.length === 0 ? 0 : 49;
  const finalTotal = Math.max(0, subtotal - couponDiscount + deliveryCharge);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.validateCoupon(code, subtotal);
      if (res.success && res.coupon) {
        setAppliedCoupon(res.coupon);
        setCouponDiscount(res.discount);
        return { success: true, message: `Coupon "${code.toUpperCase()}" applied! Saved ₹${res.discount}` };
      } else {
        return { success: false, message: res.error || 'Failed to apply coupon' };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Invalid coupon code' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  return (
    <CartContext.Provider
      value={{
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
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        refreshCart,
        loading
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
