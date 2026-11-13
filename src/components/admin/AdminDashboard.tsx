import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Store,
  Package,
  DollarSign,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Sparkles,
  Truck,
  Layers
} from 'lucide-react';
import { Product, Order, Category, Coupon, Seller, User } from '../../types';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';

interface AdminDashboardProps {
  categories: Category[];
  onRefreshCatalog?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ categories: initialCategories, onRefreshCatalog }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'customers' | 'sellers' | 'products' | 'categories' | 'orders' | 'coupons' | 'delivery'
  >('overview');

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Delivery settings state
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(499);
  const [apExpressFee, setApExpressFee] = useState(29);
  const [apStandardFee, setApStandardFee] = useState(39);
  const [outsideApFee, setOutsideApFee] = useState(69);
  const [deliverySavedMsg, setDeliverySavedMsg] = useState('');

  // New Category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatNameTe, setNewCatNameTe] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatImage, setNewCatImage] = useState('https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80');

  // New Coupon modal
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(15);
  const [couponMinOrder, setCouponMinOrder] = useState(499);
  const [couponMaxDiscount, setCouponMaxDiscount] = useState(150);

  // Reject KYC inline state
  const [rejectingSellerId, setRejectingSellerId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Incomplete GST / PAN documentation');

  useEffect(() => {
    loadAdminData();
    const socket = getSocket();
    const handleAdminRefresh = () => loadAdminData();
    socket.on('admin:refresh', handleAdminRefresh);
    socket.on('order:created', handleAdminRefresh);
    socket.on('order:updated', handleAdminRefresh);
    return () => {
      socket.off('admin:refresh', handleAdminRefresh);
      socket.off('order:created', handleAdminRefresh);
      socket.off('order:updated', handleAdminRefresh);
    };
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [adminRes, prodRes, catRes] = await Promise.all([
        api.getAdminStats(),
        api.getProducts(),
        api.getCategories()
      ]);
      setStats(adminRes.stats || adminRes);
      setSellers(adminRes.sellers || []);
      setCoupons(adminRes.coupons || []);
      setUsers(adminRes.users || []);
      setOrders(adminRes.orders || []);
      setProducts(prodRes.products || []);
      if (catRes.categories) setCategories(catRes.categories);
      if (adminRes.deliverySettings) {
        setFreeDeliveryThreshold(adminRes.deliverySettings.freeDeliveryThreshold);
        setApExpressFee(adminRes.deliverySettings.apExpressFee);
        setApStandardFee(adminRes.deliverySettings.apStandardFee);
        setOutsideApFee(adminRes.deliverySettings.outsideApFee);
      }
    } catch {
      // Fallback
    }
    setLoading(false);
  };

  const handleApproveSellerKyc = async (sellerId: string) => {
    const res = await api.approveSeller(sellerId);
    if (res.success) {
      setSellers(prev => prev.map(s => (s.id === sellerId ? { ...s, kycStatus: 'VERIFIED', isKycVerified: true } : s)));
    }
  };

  const handleConfirmRejectSellerKyc = async (sellerId: string) => {
    const res = await api.rejectSeller(sellerId, rejectReason);
    if (res.success) {
      setSellers(prev => prev.map(s => (s.id === sellerId ? { ...s, kycStatus: 'REJECTED', isKycVerified: false } : s)));
    }
    setRejectingSellerId(null);
  };

  const handleProcessRefund = async (orderId: string) => {
    const res = await api.updateOrderStatus(orderId, 'REFUNDED');
    if (res.success && res.order) {
      setOrders(prev => prev.map(o => (o.id === orderId ? res.order : o)));
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const res = await api.deleteProduct(productId);
    if (res.success) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      onRefreshCatalog?.();
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    const res = await api.addAdminCategory({
      name: newCatName,
      nameTe: newCatNameTe || newCatName,
      description: newCatDesc,
      image: newCatImage
    });
    if (res.success && res.category) {
      setCategories(prev => [...prev, res.category]);
      setNewCatName('');
      setNewCatNameTe('');
      setNewCatDesc('');
      onRefreshCatalog?.();
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    const res = await api.deleteAdminCategory(catId);
    if (res.success) {
      setCategories(prev => prev.filter(c => c.id !== catId));
      onRefreshCatalog?.();
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    const newC: any = {
      code: couponCode.toUpperCase(),
      discountValue: Number(couponDiscount),
      minOrderValue: Number(couponMinOrder),
      maxDiscount: Number(couponMaxDiscount),
      isActive: true,
      description: `${couponDiscount}% OFF for Andhra Pradesh shoppers`
    };
    const res = await api.createCoupon(newC);
    if (res.success && res.coupon) {
      setCoupons(prev => [res.coupon, ...prev]);
    }
    setCouponCode('');
    setIsCouponModalOpen(false);
  };

  const handleDeleteCoupon = async (id: string) => {
    const res = await api.deleteAdminCoupon(id);
    if (res.success) {
      setCoupons(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleSaveDeliverySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.updateDeliverySettings({
      freeDeliveryThreshold: Number(freeDeliveryThreshold),
      apExpressFee: Number(apExpressFee),
      apStandardFee: Number(apStandardFee),
      outsideApFee: Number(outsideApFee)
    });
    if (res.success) {
      setDeliverySavedMsg('Delivery charges updated across AP Local Mart!');
      setTimeout(() => setDeliverySavedMsg(''), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Admin Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-600 text-white shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-serif text-slate-900">AP Local Mart — Central Admin Panel</h1>
            <p className="text-xs text-slate-500">
              Complete marketplace control: customers, sellers, products, categories, orders, coupons & delivery charges
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold font-mono">
            AUTHORIZED_ADMIN
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 mb-6 text-xs font-bold">
        {[
          { id: 'overview', label: 'Analytics Overview' },
          { id: 'customers', label: `Customers (${users.length})` },
          { id: 'sellers', label: `Sellers & KYC (${sellers.length})` },
          { id: 'products', label: `Products (${products.length})` },
          { id: 'categories', label: `Categories (${categories.length})` },
          { id: 'orders', label: `Orders & Refunds (${orders.length})` },
          { id: 'coupons', label: `Offers & Coupons (${coupons.length})` },
          { id: 'delivery', label: 'Delivery Charges' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-3.5 border-b-2 whitespace-nowrap transition ${activeTab === tab.id ? 'border-red-600 text-red-950 bg-red-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                <span className="font-bold uppercase tracking-wider">Total Sales</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-serif">
                ₹{(stats?.totalGmv || 1247).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Live marketplace revenue</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                <span className="font-bold uppercase tracking-wider">Total Orders</span>
                <Package className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{orders.length}</div>
              <p className="text-[11px] text-slate-500 mt-1">Across 26 AP Districts</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                <span className="font-bold uppercase tracking-wider">Total Customers</span>
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{users.length}</div>
              <p className="text-[11px] text-purple-600 font-semibold mt-1">Verified accounts</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                <span className="font-bold uppercase tracking-wider">Total Sellers</span>
                <Store className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{sellers.length}</div>
              <p className="text-[11px] text-blue-600 font-semibold mt-1">Local AP shops & farmers</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                <span className="font-bold uppercase tracking-wider">Total Products</span>
                <Sparkles className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{products.length}</div>
              <p className="text-[11px] text-orange-600 font-semibold mt-1">In active catalog</p>
            </div>
          </div>

          {/* Category Distribution Analytics */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider mb-4">
              Category Distribution & Inventory Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {categories.map(cat => {
                const count = products.filter(p => p.categoryId === cat.id).length;
                return (
                  <div key={cat.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{cat.name}</p>
                      <p className="text-[11px] text-amber-800">{cat.nameTe}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-mono font-bold text-slate-900">
                      {count} items
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. CUSTOMERS TAB */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider mb-4">
            Registered Marketplace Users & Customers ({users.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">User ID</th>
                  <th className="pb-3">Full Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-3 font-mono text-slate-600">{u.id}</td>
                    <td className="py-3 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 text-slate-600">{u.email}</td>
                    <td className="py-3 font-mono text-slate-700">{u.phone}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SELLERS KYC TAB */}
      {activeTab === 'sellers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sellers.map(s => (
              <div key={s.id} className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 text-xs shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-sm text-slate-900">{s.storeName}</h4>
                    <p className="text-slate-500 font-medium">
                      {s.ownerName || 'Proprietor'} • 📍 {s.district || s.pickupDistrict}, AP
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      s.kycStatus === 'VERIFIED' || s.isKycVerified
                        ? 'bg-emerald-100 text-emerald-800'
                        : s.kycStatus === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {s.kycStatus || (s.isKycVerified ? 'VERIFIED' : 'PENDING')}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1 font-mono text-[11px] text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">GSTIN:</span>
                    <span>{s.gstin || s.gstNumber || '37ABCDE1234F1Z5'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">PAN:</span>
                    <span>{s.panNumber || 'ABCDE1234F'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Pincode:</span>
                    <span>{s.pickupPincode || '520001'}</span>
                  </div>
                </div>

                {rejectingSellerId === s.id ? (
                  <div className="p-3 bg-red-50 rounded-xl space-y-2">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection"
                      className="w-full p-2 bg-white border border-red-200 rounded-lg text-xs"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfirmRejectSellerKyc(s.id)}
                        className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-lg text-[11px]"
                      >
                        Confirm Reject
                      </button>
                      <button
                        onClick={() => setRejectingSellerId(null)}
                        className="px-3 py-1.5 bg-white text-slate-600 border rounded-lg text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleApproveSellerKyc(s.id)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Seller</span>
                    </button>
                    <button
                      onClick={() => setRejectingSellerId(s.id)}
                      className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl transition flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. PRODUCTS MANAGEMENT TAB */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider mb-4">
            All Marketplace Products ({products.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Seller</th>
                  <th className="pb-3">District</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Stock</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-3 font-bold text-slate-900 max-w-xs truncate">{p.title}</td>
                    <td className="py-3 text-slate-600">{p.sellerName}</td>
                    <td className="py-3 text-slate-600">{p.originDistrict || 'AP'}</td>
                    <td className="py-3 font-serif font-bold text-slate-900">₹{p.sellingPrice}</td>
                    <td className="py-3 font-mono">{p.stock}</td>
                    <td className="py-3">
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-red-600 hover:text-red-800 font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. CATEGORIES MANAGEMENT TAB */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddCategory} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 text-xs h-fit">
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-red-600" />
              <span>Add New Category</span>
            </h3>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category Name (English)</label>
              <input
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="e.g. Organic Millets"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category Name (Telugu)</label>
              <input
                type="text"
                value={newCatNameTe}
                onChange={e => setNewCatNameTe(e.target.value)}
                placeholder="ఉదా: చిరుధాన్యాలు"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Image URL</label>
              <input
                type="url"
                value={newCatImage}
                onChange={e => setNewCatImage(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={newCatDesc}
                onChange={e => setNewCatDesc(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
            >
              Create Category
            </button>
          </form>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {categories.map(cat => (
              <div key={cat.id} className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-xl object-cover border" />
                  <div>
                    <h4 className="font-bold text-slate-900">{cat.name}</h4>
                    <p className="text-[11px] text-amber-800">{cat.nameTe}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600"
                  title="Delete Category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. ORDERS & RETURNS MODERATION TAB */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider mb-4">
            Customer Orders, Status Updates & Return Refunds
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Order ID</th>
                  <th className="pb-3">Customer & AP District</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(ord => {
                  const st = ord.orderStatus || ord.status || 'PLACED';
                  const amt = ord.finalTotal ?? ord.totalAmount ?? 0;
                  const custName = ord.customerName || ord.userName || ord.shippingAddress?.fullName || 'Customer';
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70">
                      <td className="py-3 font-mono font-bold text-slate-900">{ord.orderNumber || ord.id}</td>
                      <td className="py-3 font-medium text-slate-800">
                        {custName} ({ord.shippingAddress?.district || 'AP'})
                      </td>
                      <td className="py-3 font-mono text-slate-600">
                        {ord.paymentMethod} ({ord.paymentStatus})
                      </td>
                      <td className="py-3 font-black font-serif text-slate-950">₹{amt.toLocaleString('en-IN')}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            st === 'RETURNED' || st === 'RETURN_REQUESTED'
                              ? 'bg-purple-100 text-purple-800'
                              : st === 'REFUNDED' || st === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {String(st).replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={st}
                            onChange={e => api.updateOrderStatus(ord.id, e.target.value).then(() => loadAdminData())}
                            className="p-1 bg-slate-50 border border-slate-200 rounded text-[11px] font-semibold"
                          >
                            <option value="PLACED">PLACED</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="PACKED">PACKED</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                            <option value="REFUNDED">REFUNDED</option>
                          </select>
                          {(st === 'RETURNED' || st === 'RETURN_REQUESTED') && (
                            <button
                              onClick={() => handleProcessRefund(ord.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px]"
                            >
                              Approve Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. COUPONS TAB */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Active Promotional Coupons</h3>
            <button
              onClick={() => setIsCouponModalOpen(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Promo Code</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {coupons.map(c => (
              <div key={c.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs relative">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-mono font-black text-sm">
                    {c.code}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-bold">
                      {c.discountType === 'FLAT' ? `₹${c.discountValue} OFF` : `${c.discountValue}% OFF`}
                    </span>
                    <button
                      onClick={() => handleDeleteCoupon(c.id)}
                      className="text-slate-400 hover:text-red-600"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-slate-600 text-[11px]">{c.description}</p>
                <div className="text-[10px] text-slate-400 font-mono">
                  Min Order: ₹{c.minOrderValue} {c.maxDiscount ? `• Max Cap: ₹${c.maxDiscount}` : ''}
                </div>
              </div>
            ))}
          </div>

          {isCouponModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative text-xs">
                <button
                  onClick={() => setIsCouponModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
                >
                  <XCircle className="w-5 h-5" />
                </button>
                <h3 className="text-base font-black text-slate-900 mb-4">Add Promotional Coupon</h3>
                <form onSubmit={handleCreateCoupon} className="space-y-3">
                  <div>
                    <label className="font-bold block mb-1">Coupon Code</label>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SANKRANTI2026"
                      className="w-full p-2 bg-slate-50 border rounded-lg font-mono uppercase font-bold"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="font-bold block mb-1">Discount %</label>
                      <input
                        type="number"
                        value={couponDiscount}
                        onChange={e => setCouponDiscount(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border rounded-lg font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Min Order ₹</label>
                      <input
                        type="number"
                        value={couponMinOrder}
                        onChange={e => setCouponMinOrder(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border rounded-lg font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Max Cap ₹</label>
                      <input
                        type="number"
                        value={couponMaxDiscount}
                        onChange={e => setCouponMaxDiscount(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border rounded-lg font-mono"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl mt-3"
                  >
                    Create & Activate Coupon
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 8. DELIVERY CHARGES MANAGEMENT TAB */}
      {activeTab === 'delivery' && (
        <div className="max-w-xl bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs text-xs space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Location-Based Delivery Charges Configuration</h3>
              <p className="text-slate-500">Configure pincode shipping fees and free-delivery thresholds</p>
            </div>
          </div>

          {deliverySavedMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
              {deliverySavedMsg}
            </div>
          )}

          <form onSubmit={handleSaveDeliverySettings} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Free Delivery Minimum Order Value (₹)</label>
              <input
                type="number"
                value={freeDeliveryThreshold}
                onChange={e => setFreeDeliveryThreshold(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">AP Express Fee (₹)</label>
                <input
                  type="number"
                  value={apExpressFee}
                  onChange={e => setApExpressFee(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">AP Standard Fee (₹)</label>
                <input
                  type="number"
                  value={apStandardFee}
                  onChange={e => setApStandardFee(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Rest of India Fee (₹)</label>
                <input
                  type="number"
                  value={outsideApFee}
                  onChange={e => setOutsideApFee(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs transition"
            >
              Update Marketplace Delivery Charges
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
