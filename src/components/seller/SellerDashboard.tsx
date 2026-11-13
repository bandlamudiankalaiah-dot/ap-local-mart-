import React, { useState, useEffect } from 'react';
import {
  Store,
  Package,
  DollarSign,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  Sparkles,
  Search,
  Filter,
  X
} from 'lucide-react';
import { Product, Order, Category, OrderStatus } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface SellerDashboardProps {
  categories: Category[];
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ categories }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'kyc'>('overview');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Add/Edit Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [titleTe, setTitleTe] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-ap-special');
  const [brand, setBrand] = useState('Godavari Ruchulu');
  const [originDistrict, setOriginDistrict] = useState('East Godavari');
  const [originalPrice, setOriginalPrice] = useState(600);
  const [sellingPrice, setSellingPrice] = useState(480);
  const [stock, setStock] = useState(50);
  const [description, setDescription] = useState('');
  const [isAndhraSpecial, setIsAndhraSpecial] = useState(true);
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&auto=format&fit=crop&q=80');

  // KYC form states
  const [panNumber, setPanNumber] = useState('ABCDE1234F');
  const [gstNumber, setGstNumber] = useState('37ABCDE1234F1Z5');
  const [bankAccount, setBankAccount] = useState('9848010029381');
  const [ifscCode, setIfscCode] = useState('SBIN0001234');
  const [kycStatus, setKycStatus] = useState<'VERIFIED' | 'PENDING' | 'REJECTED'>('VERIFIED');
  const [kycMsg, setKycMsg] = useState('');

  useEffect(() => {
    loadSellerData();
  }, []);

  const loadSellerData = async () => {
    setLoading(true);
    try {
      const [prodRes, ordRes, statsRes] = await Promise.all([
        api.getProducts(),
        api.getOrders(),
        api.getSellerStats()
      ]);
      setProducts(prodRes.products || []);
      setOrders(ordRes.orders || []);
      setStats(statsRes.stats || {
        totalGmv: 184500,
        totalOrders: 142,
        unitsSold: 289,
        activeProducts: (prodRes.products || []).length
      });
    } catch {
      // Fallbacks
    }
    setLoading(false);
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setTitle('');
    setTitleTe('');
    setCategoryId(categories[0]?.id || 'cat-ap-special');
    setBrand(user?.storeName || 'Godavari Artisans');
    setOriginDistrict('East Godavari');
    setOriginalPrice(500);
    setSellingPrice(399);
    setStock(30);
    setDescription('Authentic product handcrafted directly by local Andhra makers.');
    setIsAndhraSpecial(true);
    setImageUrl('https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80');
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setTitle(prod.title);
    setTitleTe(prod.titleTe || '');
    setCategoryId(prod.categoryId);
    setBrand(prod.brand);
    setOriginDistrict(prod.originDistrict || 'Andhra Pradesh');
    setOriginalPrice(prod.originalPrice);
    setSellingPrice(prod.sellingPrice);
    setStock(prod.stock);
    setDescription(prod.description);
    setIsAndhraSpecial(prod.isAndhraSpecial);
    setImageUrl(prod.images[0] || '');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData: any = {
      title,
      titleTe,
      categoryId,
      brand,
      originDistrict,
      originalPrice: Number(originalPrice),
      sellingPrice: Number(sellingPrice),
      discountPercent: Math.max(0, Math.round(((Number(originalPrice) - Number(sellingPrice)) / Number(originalPrice)) * 100)),
      stock: Number(stock),
      description,
      isAndhraSpecial,
      images: [imageUrl],
      sellerId: user?.id || 'seller-1',
      sellerName: user?.storeName || 'Godavari Ruchulu & Crafts'
    };

    if (editingProduct) {
      const res = await api.updateProduct(editingProduct.id, productData);
      if (res.success) {
        setProducts(prev => prev.map(p => (p.id === editingProduct.id ? res.product : p)));
      }
    } else {
      const res = await api.createProduct(productData);
      if (res.success) {
        setProducts(prev => [res.product, ...prev]);
      }
    }
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to remove this product listing?')) return;
    const res = await api.deleteProduct(id);
    if (res.success) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const res = await api.updateOrderStatus(orderId, status);
    if (res.success && res.order) {
      setOrders(prev => prev.map(o => (o.id === orderId ? res.order : o)));
    }
  };

  const handleSaveKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycStatus('VERIFIED');
    setKycMsg('Seller KYC verified and certified for Andhra Pradesh marketplace selling.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Seller Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500 text-white shadow-xs">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-serif text-slate-900">
                {user?.storeName || 'Godavari Ruchulu & Handlooms'} Seller Portal
              </h1>
              <p className="text-xs text-slate-500">
                Manage inventory, fulfill orders across AP, and track revenue
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>KYC {kycStatus}</span>
          </div>
          <button
            id="seller-add-product-btn"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New AP Product</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 text-xs font-bold">
        {[
          { id: 'overview', label: 'Dashboard Overview' },
          { id: 'products', label: `My Products (${products.length})` },
          { id: 'orders', label: `Fulfillment & Orders (${orders.length})` },
          { id: 'kyc', label: 'Business KYC & Banking' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-4 border-b-2 transition ${activeTab === tab.id ? 'border-orange-600 text-orange-950 bg-orange-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                <span className="font-bold uppercase tracking-wider">Total GMV Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-serif">₹{stats?.totalGmv?.toLocaleString('en-IN') || '1,84,500'}</div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">+18.4% this month across AP</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                <span className="font-bold uppercase tracking-wider">Orders Received</span>
                <Package className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{orders.length || 142}</div>
              <p className="text-[11px] text-slate-500 mt-1">98.2% on-time dispatch rate</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                <span className="font-bold uppercase tracking-wider">Active Listings</span>
                <Store className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{products.length}</div>
              <p className="text-[11px] text-blue-600 font-semibold mt-1">All verified AP products</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                <span className="font-bold uppercase tracking-wider">Seller Rating</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">4.9 ★</div>
              <p className="text-[11px] text-amber-800 font-semibold mt-1">Top rated artisan cooperative</p>
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider mb-4">
              Pending Dispatches for AP Express
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Items</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.slice(0, 5).map(ord => {
                    const st = ord.orderStatus || ord.status || 'PLACED';
                    const amt = ord.finalTotal ?? ord.totalAmount ?? 0;
                    const custName = ord.customerName || ord.userName || ord.shippingAddress?.fullName || 'Customer';
                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/70">
                        <td className="py-3 font-mono font-bold text-slate-800">{ord.id}</td>
                        <td className="py-3 font-medium text-slate-900">{custName} ({ord.shippingAddress?.city || 'AP'})</td>
                        <td className="py-3 text-slate-600">{ord.items.length} items</td>
                        <td className="py-3 font-bold font-serif text-slate-950">₹{amt.toLocaleString('en-IN')}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 uppercase">
                            {st}
                          </span>
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => setActiveTab('orders')}
                            className="text-orange-700 hover:text-orange-900 font-bold"
                          >
                            Fulfill →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(prod => (
              <div key={prod.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex gap-3">
                  <img src={prod.images[0]} alt={prod.title} className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{prod.title}</h4>
                    {prod.titleTe && <p className="text-[11px] text-amber-900 font-medium line-clamp-1">{prod.titleTe}</p>}
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-black font-serif text-sm text-slate-900">₹{prod.sellingPrice}</span>
                      <span className="text-[10px] text-slate-400 line-through">₹{prod.originalPrice}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-600 font-medium">Stock: <strong className="text-slate-900">{prod.stock} units</strong></span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(prod)}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-orange-600 rounded-lg transition"
                      title="Edit Product"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ORDERS FULFILLMENT TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.map(ord => {
            const st = ord.orderStatus || ord.status || 'PLACED';
            const amt = ord.finalTotal ?? ord.totalAmount ?? 0;
            const custName = ord.customerName || ord.userName || ord.shippingAddress?.fullName || 'Customer';
            return (
              <div key={ord.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{ord.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 uppercase">
                      {st}
                    </span>
                  </div>
                  <span className="text-slate-400">{new Date(ord.createdAt).toLocaleString('en-IN')}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase block mb-1">Customer Delivery Address</span>
                    <p className="font-bold text-slate-900">{custName}</p>
                    <p className="text-slate-600">{ord.shippingAddress?.street}</p>
                    <p className="text-slate-800 font-semibold">{ord.shippingAddress?.city}, {ord.shippingAddress?.district} - {ord.shippingAddress?.pincode}</p>
                    <p className="text-slate-500">📞 {ord.shippingAddress?.phone || ord.userPhone}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase block mb-1">Ordered Items</span>
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="py-0.5 font-medium text-slate-800">
                        • {it.productTitle} <strong className="text-slate-950">x{it.quantity}</strong>
                      </div>
                    ))}
                    <p className="font-black font-serif text-sm text-slate-950 mt-2">Total Amount: ₹{amt.toLocaleString('en-IN')}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase block mb-1.5">Shipment & Fulfillment Status</span>
                    <div className="space-y-1.5">
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'CONFIRMED')}
                        className={`w-full py-1.5 rounded-lg border text-left px-3 font-semibold transition ${st === 'CONFIRMED' ? 'bg-amber-600 text-white font-bold' : 'hover:bg-slate-50'}`}
                      >
                        1. Confirm Order
                      </button>
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'SHIPPED')}
                        className={`w-full py-1.5 rounded-lg border text-left px-3 font-semibold transition ${st === 'SHIPPED' ? 'bg-amber-600 text-white font-bold' : 'hover:bg-slate-50'}`}
                      >
                        2. Pack & Dispatch (AP Express)
                      </button>
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'OUT_FOR_DELIVERY')}
                        className={`w-full py-1.5 rounded-lg border text-left px-3 font-semibold transition ${st === 'OUT_FOR_DELIVERY' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-50'}`}
                      >
                        3. Out for Delivery
                      </button>
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'DELIVERED')}
                        className={`w-full py-1.5 rounded-lg border text-left px-3 font-semibold transition ${st === 'DELIVERED' ? 'bg-emerald-700 text-white font-bold' : 'hover:bg-slate-50'}`}
                      >
                        4. Mark Delivered
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* KYC TAB */}
      {activeTab === 'kyc' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs text-xs space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900">Seller Business Verification & Banking</h3>
            <p className="text-slate-500 mt-0.5">Mandatory for direct payouts into Andhra Pradesh bank accounts</p>
          </div>

          {kycMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              {kycMsg}
            </div>
          )}

          <form onSubmit={handleSaveKyc} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Business PAN Card Number</label>
              <input
                type="text"
                value={panNumber}
                onChange={e => setPanNumber(e.target.value.toUpperCase())}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">AP GSTIN (State Code: 37)</label>
              <input
                type="text"
                value={gstNumber}
                onChange={e => setGstNumber(e.target.value.toUpperCase())}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank Account Number</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={e => setBankAccount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank IFSC Code</label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={e => setIfscCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition shadow-sm"
            >
              Update KYC Information
            </button>
          </form>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto text-xs">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              {editingProduct ? 'Edit Andhra Product' : 'Add New Andhra Product'}
            </h3>
            <p className="text-slate-500 mb-5">List your regional authentic items on AndhraMart marketplace</p>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Title (English)</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Traditional Andhra Bellam Avakaya Pickle (500g)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Title in Telugu (తెలుగు పేరు)</label>
                <input
                  type="text"
                  value={titleTe}
                  onChange={e => setTitleTe(e.target.value)}
                  placeholder="ఉదా: సాంప్రదాయ బెల్లం ఆవకాయ పచ్చడి"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Origin District (AP)</label>
                  <input
                    type="text"
                    value={originDistrict}
                    onChange={e => setOriginDistrict(e.target.value)}
                    placeholder="e.g. East Godavari / Guntur"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">MRP Price (₹)</label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={e => setOriginalPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={e => setSellingPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Inventory Units</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={e => setStock(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="prod-is-ap"
                  checked={isAndhraSpecial}
                  onChange={e => setIsAndhraSpecial(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 accent-orange-600"
                />
                <label htmlFor="prod-is-ap" className="font-bold text-slate-800 cursor-pointer">
                  Tag as Authentic Andhra Pradesh Specialty / GI Heritage Product
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition"
                >
                  {editingProduct ? 'Save Changes' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
