import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlistIds: string[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([
    'prod-pootharekulu-dryfruit-box',
    'prod-dharmavaram-silk-saree-red'
  ]);

  useEffect(() => {
    const uid = user?.id || 'user-customer-demo';
    api
      .getWishlist(uid)
      .then(res => {
        if (res.wishlistIds && Array.isArray(res.wishlistIds)) {
          setWishlistIds(res.wishlistIds);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  const toggleWishlist = (product: Product) => {
    const uid = user?.id || 'user-customer-demo';
    setWishlistIds(prev => {
      if (prev.includes(product.id)) {
        return prev.filter(id => id !== product.id);
      } else {
        return [...prev, product.id];
      }
    });
    api.toggleWishlistApi(product.id, uid).catch(() => {});
  };

  const isInWishlist = (productId: string) => {
    return wishlistIds.includes(productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        toggleWishlist,
        isInWishlist,
        wishlistCount: wishlistIds.length
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
