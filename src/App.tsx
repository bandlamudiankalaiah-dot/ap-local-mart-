import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { BannerCarousel } from './components/customer/BannerCarousel';
import { ProductCard } from './components/customer/ProductCard';
import { FilterSidebar } from './components/customer/FilterSidebar';
import { ProductDetailModal } from './components/customer/ProductDetailModal';
import { CartDrawer } from './components/customer/CartDrawer';
import { CheckoutModal } from './components/customer/CheckoutModal';
import { OrderHistoryView } from './components/customer/OrderHistoryView';
import { WishlistView } from './components/customer/WishlistView';
import { ProfileView } from './components/customer/ProfileView';
import { SellerDashboard } from './components/seller/SellerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PincodeModal } from './components/common/PincodeModal';
import { AuthModal } from './components/common/AuthModal';
import { NotificationsDrawer } from './components/common/NotificationsDrawer';
import { ReviewModal } from './components/common/ReviewModal';
import { ReturnModal } from './components/common/ReturnModal';

import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { PincodeProvider, usePincode } from './context/PincodeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import { Product, Category, Banner, FilterState, Order, Seller } from './types';
import { api } from './services/api';
import { getSocket } from './services/socket';
import './lib/firebase';
import {
  Sparkles,
  ArrowRight,
  Truck,
  ShieldCheck,
  Award,
  ChevronRight,
  TrendingUp,
  Flame,
  CheckCircle2,
  Layers,
  MapPin,
  Store
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { language, t } = useLanguage();
  const { role } = useAuth();
  const { setIsCartOpen } = useCart();
  const { currentPincode } = usePincode();

  // Navigation State
  const [activeView, setActiveView] = useState<'home' | 'products' | 'orders' | 'wishlist' | 'seller' | 'admin' | 'profile'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [stores, setStores] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'popularity',
    brands: []
  });

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [reviewingProduct, setReviewingProduct] = useState<Product | null>(null);
  const [returningOrder, setReturningOrder] = useState<Order | null>(null);
  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState<string | undefined>(undefined);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Initial API Data & Subscribe to Real-Time Socket.IO Events
  useEffect(() => {
    loadCatalogData();

    const socket = getSocket();
    const handleInventoryUpdated = (data: { productId: string; stock: number; product?: Product }) => {
      setProducts(prev =>
        prev.map(p => (p.id === data.productId ? { ...p, stock: data.stock } : p))
      );
      setSelectedProduct(prev =>
        prev && prev.id === data.productId ? { ...prev, stock: data.stock } : prev
      );
    };
    const handleProductCreated = (newProd: Product) => {
      setProducts(prev => {
        if (prev.some(p => p.id === newProd.id)) return prev;
        return [newProd, ...prev];
      });
    };
    const handleProductUpdated = (updatedProd: Product) => {
      setProducts(prev => prev.map(p => (p.id === updatedProd.id ? updatedProd : p)));
    };
    const handleProductDeleted = (data: { productId: string }) => {
      setProducts(prev => prev.filter(p => p.id !== data.productId));
    };
    const handleCategoryCreated = (newCat: Category) => {
      setCategories(prev => {
        if (prev.some(c => c.id === newCat.id)) return prev;
        return [...prev, newCat];
      });
    };

    socket.on('inventory:updated', handleInventoryUpdated);
    socket.on('product:created', handleProductCreated);
    socket.on('product:updated', handleProductUpdated);
    socket.on('product:deleted', handleProductDeleted);
    socket.on('category:created', handleCategoryCreated);

    return () => {
      socket.off('inventory:updated', handleInventoryUpdated);
      socket.off('product:created', handleProductCreated);
      socket.off('product:updated', handleProductUpdated);
      socket.off('product:deleted', handleProductDeleted);
      socket.off('category:created', handleCategoryCreated);
    };
  }, []);

  const loadCatalogData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, banRes, storeRes] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getBanners(),
        api.getStores()
      ]);
      setProducts(prodRes.products || []);
      setCategories(catRes.categories || []);
      setBanners(banRes.banners || []);
      setStores(storeRes.stores || []);
    } catch {
      // Fallbacks
    }
    setLoading(false);
  };

  // Sync category selection with filter
  const handleSelectCategory = (catId?: string) => {
    setSelectedCategory(catId);
    setSelectedStoreId(undefined);
    setFilters(prev => ({ ...prev, categoryId: catId }));
    setSearchQuery('');
  };

  const handleSelectStore = (sellerId?: string) => {
    setSelectedStoreId(sellerId);
    setSelectedCategory(undefined);
    setFilters(prev => ({ ...prev, categoryId: undefined }));
    setSearchQuery('');
    setActiveView('products');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({ ...prev, search: query }));
  };

  // Filtered & Sorted Products calculation
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Store filter
    if (selectedStoreId) {
      list = list.filter(p => p.sellerId === selectedStoreId);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          (p.sellerName && p.sellerName.toLowerCase().includes(q)) ||
          (p.originDistrict && p.originDistrict.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (filters.categoryId) {
      list = list.filter(p => p.categoryId === filters.categoryId);
    }

    // Andhra Special filter
    if (filters.andhraSpecialOnly) {
      list = list.filter(p => p.isAndhraSpecial);
    }

    // Price range
    if (filters.minPrice !== undefined) {
      list = list.filter(p => p.sellingPrice >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      list = list.filter(p => p.sellingPrice <= filters.maxPrice!);
    }

    // Rating
    if (filters.minRating !== undefined) {
      list = list.filter(p => p.rating >= filters.minRating!);
    }

    // Brands
    if (filters.brands && filters.brands.length > 0) {
      list = list.filter(p => filters.brands.includes(p.brand));
    }

    // In stock
    if (filters.inStockOnly) {
      list = list.filter(p => p.stock > 0);
    }

    // Sorting
    if (filters.sortBy === 'price-low-to-high') {
      list.sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (filters.sortBy === 'price-high-to-low') {
      list.sort((a, b) => b.sellingPrice - a.sellingPrice);
    } else if (filters.sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (filters.sortBy === 'discount') {
      list.sort((a, b) => b.discountPercent - a.discountPercent);
    }

    return list;
  }, [products, searchQuery, filters, selectedStoreId]);

  // Derived lists for Home page
  const andhraSpecialProducts = useMemo(() => products.filter(p => p.isAndhraSpecial), [products]);
  const bestSellers = useMemo(() => [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8), [products]);
  const trendingProducts = useMemo(() => [...products].sort((a, b) => b.rating - a.rating).slice(0, 8), [products]);

  // Available brands & districts for sidebar filter
  const availableBrands = useMemo(() => Array.from(new Set(products.map(p => p.brand))), [products]);
  const availableDistricts = useMemo(() => Array.from(new Set(products.map(p => p.originDistrict).filter(Boolean) as string[])), [products]);

  const handleOrderSuccess = (order: Order) => {
    setSelectedTrackingOrderId(order.id);
    setActiveView('orders');
    loadCatalogData();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-amber-500 selection:text-white">
      {/* Global Non-Blocking Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-amber-500/40 flex items-center gap-2.5 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        onSearch={handleSearch}
        onOpenAuth={mode => {
          setAuthMode(mode || 'login');
          setIsAuthOpen(true);
        }}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* VIEW 1: HOME PAGE */}
        {activeView === 'home' && (
          <div className="space-y-10 pb-16">
            {/* Hero Carousel Banner */}
            <section className="max-w-7xl mx-auto px-4 pt-4 sm:pt-6">
              <BannerCarousel
                banners={banners}
                onBannerClick={catId => {
                  handleSelectCategory(catId);
                  setActiveView('products');
                }}
              />
            </section>

            {/* Quick Categories Bar with Andhra Icons */}
            <section className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-700" />
                  <span>{language === 'te' ? 'ఆంధ్రప్రదేశ్ ప్రముఖ విభాగాలు' : 'Shop by Authentic AP Categories'}</span>
                </h3>
                <button
                  onClick={() => {
                    handleSelectCategory(undefined);
                    setActiveView('products');
                  }}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
                >
                  <span>View All Categories</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {categories.map(cat => (
                  <div
                    key={cat.id}
                    onClick={() => {
                      handleSelectCategory(cat.id);
                      setActiveView('products');
                    }}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-500 shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col items-center text-center group"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden mb-2 bg-amber-50 p-1 border border-amber-200/70 group-hover:scale-105 transition">
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover rounded-full" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 group-hover:text-amber-800 transition line-clamp-1">
                      {language === 'te' && cat.nameTe ? cat.nameTe : cat.name}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{cat.itemCount}+ Products</span>
                  </div>
                ))}
              </div>
            </section>

            {/* SHOP BY AP LOCAL STORES & FARMERS */}
            {stores.length > 0 && (
              <section className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        {language === 'te' ? 'ఆంధ్రప్రదేశ్ స్థానిక దుకాణాలు & రైతులు' : 'Shop by Verified AP Local Stores & Farmers'}
                      </h3>
                      <p className="text-xs text-slate-500">Browse store-wise products directly from Rythu Bazaars, Weavers & Local Artisans</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stores.map(st => (
                    <div
                      key={st.id}
                      onClick={() => handleSelectStore(st.id)}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-500 shadow-2xs hover:shadow-md transition cursor-pointer flex items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-800 transition">
                            {st.storeName || st.businessName}
                          </h4>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                            ★ {st.rating || 4.8}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                          <span>{st.district} District, Andhra Pradesh</span>
                        </p>
                        <p className="text-[11px] font-semibold text-amber-800">
                          {(st as any).productCount ?? products.filter(p => p.sellerId === st.id).length} Live Products Available →
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 group-hover:bg-amber-500 group-hover:text-slate-950 transition shrink-0">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ANDHRA SPECIALS SPOTLIGHT (GI Tagged Heritage Goods) */}
            <section className="max-w-7xl mx-auto px-4">
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-900 via-orange-950 to-amber-950 text-white shadow-xl relative overflow-hidden">
                {/* Background watermarks */}
                <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center">
                  <Sparkles className="w-96 h-96 text-amber-300" />
                </div>

                <div className="relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider mb-2">
                        <Sparkles className="w-3.5 h-3.5 fill-current text-amber-900" />
                        {language === 'te' ? 'జీఐ గుర్తింపు పొందిన వారసత్వం' : 'GI Certified Andhra Heritage'}
                      </div>
                      <h3 className="text-xl sm:text-3xl font-black font-serif text-white">
                        {language === 'te' ? 'ప్రత్యేకమైన ఆంధ్ర ఉత్పత్తులు' : 'Treasures of Andhra Pradesh'}
                      </h3>
                      <p className="text-xs sm:text-sm text-amber-200/80 mt-1 max-w-xl">
                        Kondapalli Toys, Atreyapuram Pootharekulu, Dharmavaram & Mangalagiri Sarees, Guntur Mirchi, and Araku Valley Coffee straight from local master artisans.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        handleSelectCategory('cat-ap-special');
                        setActiveView('products');
                      }}
                      className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl transition flex items-center gap-2 shadow-lg"
                    >
                      <span>Explore All AP Specials</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Horizontal Scroll / Grid of Andhra Specials */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {andhraSpecialProducts.slice(0, 4).map(prod => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        onSelect={p => setSelectedProduct(p)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* TRENDING ACROSS ANDHRA */}
            <section className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
                    <Flame className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {t('trendingNow')}
                    </h3>
                    <p className="text-xs text-slate-500">Highest selling products in Vijayawada, Vizag, Guntur & Tirupati</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleSelectCategory(undefined);
                    setActiveView('products');
                  }}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
                >
                  <span>See More</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {trendingProducts.slice(0, 4).map(prod => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onSelect={p => setSelectedProduct(p)}
                  />
                ))}
              </div>
            </section>

            {/* BEST SELLERS ACROSS 26 DISTRICTS */}
            <section className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {t('bestSellers')}
                    </h3>
                    <p className="text-xs text-slate-500">Top customer favorites with 4.8★+ verified reviews</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleSelectCategory(undefined);
                    setActiveView('products');
                  }}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {bestSellers.slice(0, 4).map(prod => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onSelect={p => setSelectedProduct(p)}
                  />
                ))}
              </div>
            </section>

            {/* Andhra District Highlights Banner */}
            <section className="max-w-7xl mx-auto px-4">
              <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <span className="text-[11px] font-bold tracking-widest text-amber-400 uppercase">
                    Direct Artisan Empowerment
                  </span>
                  <h4 className="text-xl sm:text-2xl font-black font-serif">
                    Support 10,000+ Andhra Handloom Weavers & Women SHGs
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Every order on AndhraMart directly sustains traditional craft clusters in Mangalagiri, Dharmavaram, Kondapalli, and Atreyapuram.
                  </p>
                </div>

                <button
                  onClick={() => {
                    handleSelectCategory('cat-handlooms');
                    setActiveView('products');
                  }}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-md whitespace-nowrap"
                >
                  Shop Handloom Sarees & Fabrics
                </button>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: PRODUCTS CATALOG (SEARCH / FILTER / BROWSE) */}
        {activeView === 'products' && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Breadcrumb & Results Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <button onClick={() => setActiveView('home')} className="hover:text-slate-700">Home</button>
                  <span>/</span>
                  <span className="font-semibold text-slate-700">
                    {selectedStoreId
                      ? stores.find(s => s.id === selectedStoreId)?.storeName || 'Local Store'
                      : filters.categoryId
                      ? categories.find(c => c.id === filters.categoryId)?.name
                      : 'All Products'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black font-serif text-slate-900">
                    {selectedStoreId
                      ? `${stores.find(s => s.id === selectedStoreId)?.storeName || 'AP Local Store'} Catalog`
                      : searchQuery
                      ? `Search Results for "${searchQuery}"`
                      : filters.categoryId
                      ? categories.find(c => c.id === filters.categoryId)?.name
                      : 'Andhra Marketplace Catalog'}
                  </h2>
                  {selectedStoreId && (
                    <button
                      onClick={() => setSelectedStoreId(undefined)}
                      className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg text-xs font-bold hover:bg-amber-200"
                    >
                      Clear Store Filter ×
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Showing {filteredProducts.length} items available for fast AP delivery to <strong className="font-mono text-amber-800">{currentPincode}</strong>
                </p>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-bold">Sort By:</span>
                <select
                  value={filters.sortBy}
                  onChange={e => setFilters({ ...filters, sortBy: e.target.value as any })}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 shadow-2xs"
                >
                  <option value="popularity">Popularity (Best Sellers)</option>
                  <option value="rating">Customer Rating (High to Low)</option>
                  <option value="price-low-to-high">Price: Low to High</option>
                  <option value="price-high-to-low">Price: High to Low</option>
                  <option value="discount">Biggest Savings (% Off)</option>
                </select>
              </div>
            </div>

            {/* Layout: Sidebar Filter + Products Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Filter Sidebar */}
              <div className="lg:col-span-3">
                <FilterSidebar
                  categories={categories}
                  filters={filters}
                  onFilterChange={newF => setFilters(newF)}
                  availableBrands={availableBrands}
                  availableDistricts={availableDistricts}
                />
              </div>

              {/* Right Column: Products Grid */}
              <div className="lg:col-span-9">
                {filteredProducts.length === 0 ? (
                  <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                    <Sparkles className="w-12 h-12 mx-auto text-slate-300" />
                    <h3 className="text-base font-bold text-slate-900">No matching products found</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Try clearing your search query or adjusting price and category filters.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilters({ sortBy: 'popularity', brands: [] });
                        setSelectedCategory(undefined);
                        setSelectedStoreId(undefined);
                      }}
                      className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      Clear All Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredProducts.map(prod => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        onSelect={p => setSelectedProduct(p)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: ORDERS & LIVE TRACKING */}
        {activeView === 'orders' && (
          <OrderHistoryView
            selectedOrderId={selectedTrackingOrderId}
            onRequestReturn={ord => setReturningOrder(ord)}
            onSelectProductForReview={prodId => {
              const prod = products.find(p => p.id === prodId);
              if (prod) setReviewingProduct(prod);
            }}
          />
        )}

        {/* VIEW 4: WISHLIST */}
        {activeView === 'wishlist' && (
          <WishlistView
            onSelectProduct={prod => setSelectedProduct(prod)}
            onNavigateHome={() => {
              handleSelectCategory(undefined);
              setActiveView('products');
            }}
          />
        )}

        {/* VIEW 5: USER PROFILE */}
        {activeView === 'profile' && <ProfileView />}

        {/* VIEW 6: SELLER DASHBOARD */}
        {activeView === 'seller' && <SellerDashboard categories={categories} />}

        {/* VIEW 7: ADMIN CONTROL CENTER */}
        {activeView === 'admin' && <AdminDashboard categories={categories} onRefreshCatalog={loadCatalogData} />}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={view => setActiveView(view as any)}
        onOpenCategory={catId => {
          handleSelectCategory(catId);
          setActiveView('products');
        }}
      />

      {/* MODALS & DRAWERS */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onOpenCheckoutDirect={() => {
          setSelectedProduct(null);
          setIsCheckoutOpen(true);
        }}
        onWriteReview={prod => setReviewingProduct(prod)}
      />

      <CartDrawer
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      <PincodeModal />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateOrders={() => setActiveView('orders')}
      />

      <ReviewModal
        product={reviewingProduct}
        isOpen={!!reviewingProduct}
        onClose={() => setReviewingProduct(null)}
        onSuccess={() => {
          loadCatalogData();
          showToast('Thank you! Your verified Andhra review has been submitted.');
        }}
      />

      <ReturnModal
        order={returningOrder}
        isOpen={!!returningOrder}
        onClose={() => setReturningOrder(null)}
        onSuccess={() => {
          setActiveView('orders');
          showToast('Return request submitted successfully. AP Logistics partner will contact you.');
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <PincodeProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <MainAppContent />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </PincodeProvider>
    </LanguageProvider>
  );
};

export default App;
