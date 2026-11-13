import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  MapPin,
  Globe,
  Bell,
  Store,
  ShieldCheck,
  ChevronDown,
  LogOut,
  Package,
  Sparkles,
  HelpCircle,
  Menu,
  X
} from 'lucide-react';
import { AndhraMartLogo } from './AndhraMartLogo';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePincode } from '../../context/PincodeContext';
import { api } from '../../services/api';
import { Product } from '../../types';

interface HeaderProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenNotifications: () => void;
  onSelectCategory: (categoryId?: string) => void;
  activeView: 'home' | 'products' | 'orders' | 'wishlist' | 'seller' | 'admin' | 'profile';
  setActiveView: (view: 'home' | 'products' | 'orders' | 'wishlist' | 'seller' | 'admin' | 'profile') => void;
  onSearch: (query: string) => void;
  selectedCategory?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onOpenNotifications,
  onSelectCategory,
  activeView,
  setActiveView,
  onSearch,
  selectedCategory
}) => {
  const { user, isAuthenticated, logout, switchRoleQuick, role } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const { language, toggleLanguage, t } = useLanguage();
  const { currentPincode, pincodeInfo, setIsPincodeModalOpen } = usePincode();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      api.getSearchSuggestions(searchQuery)
        .then(res => {
          setSuggestions(res.suggestions || []);
          setSuggestedProducts(res.products || []);
        })
        .catch(() => {});
    } else {
      setSuggestions([]);
      setSuggestedProducts([]);
    }
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch(searchQuery);
    if (activeView !== 'products' && activeView !== 'home') {
      setActiveView('products');
    }
  };

  const handleSuggestionClick = (text: string) => {
    setSearchQuery(text);
    setShowSuggestions(false);
    onSearch(text);
    if (activeView !== 'products' && activeView !== 'home') {
      setActiveView('products');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
      {/* Top Banner: Regional Welcome + Quick Switchers */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-900 to-amber-950 text-amber-100 text-xs px-4 py-1.5 font-medium">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 text-[10px] font-bold tracking-wider">
              {language === 'te' ? 'ఉగాది ఆఫర్లు' : 'UGADI FESTIVAL'}
            </span>
            <span className="truncate">
              {language === 'te'
                ? 'ఆంధ్రప్రదేశ్ వ్యాప్తంగా ఉచిత డెలివరీ & 100% అసలైన ఉత్పత్తులు!'
                : '100% Authentic GI Tagged Andhra Specialities & Handlooms directly from master artisans.'}
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto text-[11px]">
            {/* Quick Demo Role Switcher */}
            <div className="flex items-center gap-1 bg-black/20 rounded-md px-2 py-0.5 border border-white/10">
              <span className="text-amber-300 font-semibold">Portal:</span>
              <button
                id="portal-customer-btn"
                onClick={() => {
                  switchRoleQuick('customer');
                  setActiveView('home');
                }}
                className={`px-1.5 py-0.5 rounded transition ${role === 'customer' && activeView !== 'seller' && activeView !== 'admin' ? 'bg-amber-500 text-white font-bold' : 'hover:text-white'}`}
              >
                Customer
              </button>
              <span className="text-white/30">|</span>
              <button
                id="portal-seller-btn"
                onClick={() => {
                  switchRoleQuick('seller');
                  setActiveView('seller');
                }}
                className={`px-1.5 py-0.5 rounded transition ${activeView === 'seller' ? 'bg-orange-500 text-white font-bold' : 'hover:text-white'}`}
              >
                Seller Hub
              </button>
              <span className="text-white/30">|</span>
              <button
                id="portal-admin-btn"
                onClick={() => {
                  switchRoleQuick('admin');
                  setActiveView('admin');
                }}
                className={`px-1.5 py-0.5 rounded transition ${activeView === 'admin' ? 'bg-red-600 text-white font-bold' : 'hover:text-white'}`}
              >
                Admin
              </button>
            </div>

            {/* Language Toggle */}
            <button
              id="header-lang-toggle"
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded border border-amber-400/20 font-bold transition"
              title="Switch Telugu / English"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Mobile Menu Button */}
        <button
          id="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Logo */}
        <div
          id="brand-logo-btn"
          onClick={() => {
            setActiveView('home');
            onSelectCategory(undefined);
          }}
        >
          <AndhraMartLogo size="md" />
        </div>

        {/* Pincode / Location Selector */}
        <button
          id="header-pincode-btn"
          onClick={() => setIsPincodeModalOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-amber-50/70 border border-slate-200/90 rounded-lg text-left transition group"
        >
          <div className="p-1 rounded-full bg-amber-100 text-amber-700 group-hover:scale-110 transition">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-xs leading-tight">
            <span className="text-slate-500 text-[10px] font-medium">{t('deliverTo')}</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              {pincodeInfo?.city || 'Vijayawada'} <span className="text-amber-700 font-mono text-[11px]">{currentPincode}</span>
            </span>
          </div>
        </button>

        {/* Global Live Search Bar */}
        <div ref={searchContainerRef} className="flex-1 max-w-2xl relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-24 py-2.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-amber-500/15 transition-all shadow-inner-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />

            <button
              id="search-submit-btn"
              type="submit"
              className="absolute right-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold text-xs rounded-lg transition shadow-xs flex items-center gap-1"
            >
              <span>Search</span>
            </button>
          </form>

          {/* Search Autocomplete & Suggestions Dropdown */}
          {showSuggestions && (suggestions.length > 0 || suggestedProducts.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
              {suggestions.length > 0 && (
                <div className="p-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Suggestions
                  </div>
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(item)}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-900 rounded-md flex items-center gap-2 transition"
                    >
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              )}

              {suggestedProducts.length > 0 && (
                <div className="p-2 bg-slate-50/50">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Matching Products
                  </div>
                  {suggestedProducts.map(prod => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        handleSuggestionClick(prod.title);
                      }}
                      className="p-2 hover:bg-white rounded-lg flex items-center gap-3 cursor-pointer transition border border-transparent hover:border-slate-200"
                    >
                      <img src={prod.images[0]} alt={prod.title} className="w-10 h-10 object-cover rounded-md border border-slate-200" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-800 truncate">{prod.title}</div>
                        <div className="text-[11px] text-amber-800 font-bold">₹{prod.sellingPrice} <span className="text-slate-400 line-through font-normal text-[10px]">₹{prod.originalPrice}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Notifications */}
          <button
            id="notifications-btn"
            onClick={onOpenNotifications}
            className="p-2 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white"></span>
          </button>

          {/* Wishlist */}
          <button
            id="header-wishlist-btn"
            onClick={() => setActiveView('wishlist')}
            className="hidden sm:flex items-center gap-1.5 p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition relative"
            title="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* User Account / Auth Dropdown */}
          <div ref={accountMenuRef} className="relative">
            <button
              id="header-account-btn"
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-100 rounded-xl text-slate-700 transition"
            >
              {isAuthenticated && user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover border border-amber-400" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                  <User className="w-4 h-4" />
                </div>
              )}
              <div className="hidden xl:flex flex-col text-left text-xs leading-tight">
                <span className="text-[10px] text-slate-400">{isAuthenticated ? 'Namaskaram,' : 'Hello,'}</span>
                <span className="font-bold text-slate-800 truncate max-w-[90px]">
                  {isAuthenticated ? (user?.name?.split(' ')[0] || 'Account') : 'Sign In'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Account Dropdown Menu */}
            {isAccountMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 divide-y divide-slate-100 text-xs">
                {isAuthenticated ? (
                  <div className="px-4 py-2">
                    <p className="font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-slate-500 text-[11px] truncate">{user?.email || user?.phone}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-[9px] rounded uppercase">
                      {user?.role} Account
                    </span>
                  </div>
                ) : (
                  <div className="px-4 py-2 flex flex-col gap-1.5">
                    <button
                      id="account-login-btn"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        onOpenAuth('login');
                      }}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-center transition"
                    >
                      Login / Sign Up
                    </button>
                    <p className="text-[11px] text-slate-400 text-center">Get started with OTP or email</p>
                  </div>
                )}

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      setActiveView('orders');
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <Package className="w-4 h-4 text-amber-600" />
                    <span>My Orders & Live Tracking</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      setActiveView('wishlist');
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <Heart className="w-4 h-4 text-red-500" />
                    <span>My Wishlist ({wishlistCount})</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      setActiveView('profile');
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Saved Addresses & Profile</span>
                  </button>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      setActiveView('seller');
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-amber-50 flex items-center gap-2.5 font-medium"
                  >
                    <Store className="w-4 h-4 text-orange-600" />
                    <span>Seller Dashboard</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      setActiveView('admin');
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-red-50 flex items-center gap-2.5 font-medium"
                  >
                    <ShieldCheck className="w-4 h-4 text-red-600" />
                    <span>Admin Control Center</span>
                  </button>
                </div>

                {isAuthenticated && (
                  <div className="py-1">
                    <button
                      id="account-logout-btn"
                      onClick={() => {
                        logout();
                        setIsAccountMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2.5 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Button */}
          <button
            id="header-cart-btn"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-sm hover:shadow transition relative"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">{t('cart')}</span>
            {itemCount > 0 && (
              <span className="bg-white text-orange-700 font-extrabold text-xs px-1.5 py-0.2 rounded-full shadow-xs">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sub-Header / Quick Category Ribbon */}
      <nav className="bg-slate-50 border-t border-slate-200/60 overflow-x-auto scrollbar-none py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
          <button
            id="cat-all-btn"
            onClick={() => {
              onSelectCategory(undefined);
              setActiveView('products');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition ${!selectedCategory && activeView === 'products' ? 'bg-amber-600 text-white shadow-xs' : 'hover:bg-slate-200/70'}`}
          >
            <span>{t('allCategories')}</span>
          </button>

          <button
            id="cat-ap-btn"
            onClick={() => {
              onSelectCategory('cat-ap-special');
              setActiveView('products');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition ${selectedCategory === 'cat-ap-special' ? 'bg-amber-600 text-white border-amber-600 shadow-xs' : 'bg-amber-100/70 border-amber-300 text-amber-950 hover:bg-amber-200/70'}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700 fill-amber-700" />
            <span className="font-bold">{t('andhraSpecials')}</span>
          </button>

          <button
            id="cat-handloom-btn"
            onClick={() => {
              onSelectCategory('cat-handlooms');
              setActiveView('products');
            }}
            className={`px-3 py-1 rounded-full transition ${selectedCategory === 'cat-handlooms' ? 'bg-amber-600 text-white' : 'hover:bg-slate-200/70'}`}
          >
            {t('handlooms')}
          </button>

          <button
            id="cat-sweets-btn"
            onClick={() => {
              onSelectCategory('cat-sweets-snacks');
              setActiveView('products');
            }}
            className={`px-3 py-1 rounded-full transition ${selectedCategory === 'cat-sweets-snacks' ? 'bg-amber-600 text-white' : 'hover:bg-slate-200/70'}`}
          >
            {t('picklesSweets')}
          </button>

          <button
            id="cat-spices-btn"
            onClick={() => {
              onSelectCategory('cat-groceries');
              setActiveView('products');
            }}
            className={`px-3 py-1 rounded-full transition ${selectedCategory === 'cat-groceries' ? 'bg-amber-600 text-white' : 'hover:bg-slate-200/70'}`}
          >
            {t('spices')}
          </button>

          <button
            id="cat-tech-btn"
            onClick={() => {
              onSelectCategory('cat-electronics');
              setActiveView('products');
            }}
            className={`px-3 py-1 rounded-full transition ${selectedCategory === 'cat-electronics' ? 'bg-amber-600 text-white' : 'hover:bg-slate-200/70'}`}
          >
            {t('electronics')}
          </button>

          <div className="ml-auto hidden md:flex items-center gap-2 text-[11px] text-slate-500 font-normal">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {t('expressDelivery')}
            </span>
          </div>
        </div>
      </nav>
    </header>
  );
};
