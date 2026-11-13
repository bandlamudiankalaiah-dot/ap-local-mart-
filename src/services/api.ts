import {
  Product,
  Category,
  Subcategory,
  User,
  Address,
  Seller,
  Order,
  Coupon,
  Banner,
  Review,
  AppNotification,
  PincodeInfo
} from '../types';

const API_BASE = '/api';

export const api = {
  // Auth
  async register(data: { name: string; email?: string; phone?: string; role: string; storeName?: string }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async login(identifier: string, role?: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, role })
    });
    return res.json();
  },

  async sendOtp(phone: string) {
    const res = await fetch(`${API_BASE}/auth/otp-send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    return res.json();
  },

  async verifyOtp(phone: string, otp: string, name?: string) {
    const res = await fetch(`${API_BASE}/auth/otp-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, name })
    });
    return res.json();
  },

  async getMe(token?: string) {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return res.json();
  },

  // Products & Categories
  async getProducts(params?: Record<string, string | number | boolean | undefined>) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.append(k, String(v));
      });
    }
    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    return res.json();
  },

  async getProduct(id: string) {
    const res = await fetch(`${API_BASE}/products/${id}`);
    return res.json();
  },

  async getCategories() {
    const res = await fetch(`${API_BASE}/categories`);
    return res.json();
  },

  async getBanners() {
    const res = await fetch(`${API_BASE}/banners`);
    return res.json();
  },

  async getSearchSuggestions(q: string) {
    const res = await fetch(`${API_BASE}/search/suggestions?q=${encodeURIComponent(q)}`);
    return res.json();
  },

  // Pincode
  async checkPincode(pincode: string): Promise<PincodeInfo> {
    const res = await fetch(`${API_BASE}/pincode/${pincode}`);
    if (!res.ok) {
      throw new Error('Invalid pincode or not serviceable');
    }
    return res.json();
  },

  // Cart
  async getCart(userId?: string) {
    const res = await fetch(`${API_BASE}/cart?userId=${userId || 'user-customer-demo'}`);
    return res.json();
  },

  async addToCart(productId: string, quantity = 1, selectedVariant?: string, userId?: string) {
    const res = await fetch(`${API_BASE}/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity, selectedVariant, userId })
    });
    return res.json();
  },

  async updateCartItem(id: string, quantity: number, userId?: string) {
    const res = await fetch(`${API_BASE}/cart/item/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity, userId })
    });
    return res.json();
  },

  async removeCartItem(id: string, userId?: string) {
    const res = await fetch(`${API_BASE}/cart/item/${id}?userId=${userId || 'user-customer-demo'}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async clearCart(userId?: string) {
    const res = await fetch(`${API_BASE}/cart/clear?userId=${userId || 'user-customer-demo'}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Addresses
  async getAddresses(userId?: string) {
    const res = await fetch(`${API_BASE}/addresses?userId=${userId || 'user-customer-demo'}`);
    return res.json();
  },

  async addAddress(address: Partial<Address>, userId?: string) {
    const res = await fetch(`${API_BASE}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...address, userId })
    });
    return res.json();
  },

  async deleteAddress(id: string, userId?: string) {
    const res = await fetch(`${API_BASE}/addresses/${id}?userId=${userId || 'user-customer-demo'}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Coupons
  async getCoupons() {
    const res = await fetch(`${API_BASE}/coupons`);
    return res.json();
  },

  async validateCoupon(code: string, orderAmount: number) {
    const res = await fetch(`${API_BASE}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, orderAmount })
    });
    return res.json();
  },

  // Orders
  async getOrders(userId?: string, sellerId?: string) {
    const query = new URLSearchParams();
    if (userId) query.append('userId', userId);
    if (sellerId) query.append('sellerId', sellerId);
    const res = await fetch(`${API_BASE}/orders?${query.toString()}`);
    return res.json();
  },

  async getOrder(id: string) {
    const res = await fetch(`${API_BASE}/orders/${id}`);
    return res.json();
  },

  async createOrder(orderData: any) {
    const res = await fetch(`${API_BASE}/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    return res.json();
  },

  async cancelOrder(id: string, reason: string) {
    const res = await fetch(`${API_BASE}/orders/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    return res.json();
  },

  async returnOrder(id: string, reason: string, notes?: string) {
    const res = await fetch(`${API_BASE}/orders/${id}/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, notes })
    });
    return res.json();
  },

  // Reviews
  async getProductReviews(productId: string) {
    const res = await fetch(`${API_BASE}/reviews/product/${productId}`);
    return res.json();
  },

  async addReview(data: Partial<Review>) {
    const res = await fetch(`${API_BASE}/reviews/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Notifications
  async getNotifications(userId?: string) {
    const res = await fetch(`${API_BASE}/notifications?userId=${userId || 'user-customer-demo'}`);
    return res.json();
  },

  // Seller Operations
  async getSellerProfile(sellerId?: string) {
    const res = await fetch(`${API_BASE}/seller/profile?sellerId=${sellerId || 'seller-godavari-heritage'}`);
    return res.json();
  },

  async submitSellerKyc(data: any) {
    const res = await fetch(`${API_BASE}/seller/kyc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getSellerProducts(sellerId?: string) {
    const res = await fetch(`${API_BASE}/seller/products?sellerId=${sellerId || 'seller-godavari-heritage'}`);
    return res.json();
  },

  async addSellerProduct(product: Partial<Product>) {
    const res = await fetch(`${API_BASE}/seller/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return res.json();
  },

  async updateSellerProduct(id: string, product: Partial<Product>) {
    const res = await fetch(`${API_BASE}/seller/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return res.json();
  },

  async deleteSellerProduct(id: string) {
    const res = await fetch(`${API_BASE}/seller/products/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async updateSellerOrderStatus(id: string, status: string, trackingNote?: string, location?: string) {
    const res = await fetch(`${API_BASE}/seller/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, trackingNote, location })
    });
    return res.json();
  },

  async getSellerAnalytics(sellerId?: string) {
    const res = await fetch(`${API_BASE}/seller/analytics?sellerId=${sellerId || 'seller-godavari-heritage'}`);
    return res.json();
  },

  // Admin Operations
  async getAdminStats() {
    const res = await fetch(`${API_BASE}/admin/stats`);
    return res.json();
  },

  async getAdminUsers() {
    const res = await fetch(`${API_BASE}/admin/users`);
    return res.json();
  },

  async getAdminSellers() {
    const res = await fetch(`${API_BASE}/admin/sellers`);
    return res.json();
  },

  async verifySellerKyc(sellerId: string, status: 'APPROVED' | 'REJECTED', notes?: string) {
    const res = await fetch(`${API_BASE}/admin/sellers/${sellerId}/kyc`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    });
    return res.json();
  },

  async addAdminCategory(category: Partial<Category>) {
    const res = await fetch(`${API_BASE}/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
    return res.json();
  },

  async addAdminCoupon(coupon: Partial<Coupon>) {
    const res = await fetch(`${API_BASE}/admin/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coupon)
    });
    return res.json();
  },

  async deleteAdminCoupon(id: string) {
    const res = await fetch(`${API_BASE}/admin/coupons/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Aliases for compatibility
  async submitReview(data: Partial<Review>) {
    return this.addReview(data);
  },

  async requestReturn(id: string, reason: string, notes?: string) {
    return this.returnOrder(id, reason, notes);
  },

  async createProduct(product: Partial<Product>) {
    return this.addSellerProduct(product);
  },

  async updateProduct(id: string, product: Partial<Product>) {
    return this.updateSellerProduct(id, product);
  },

  async deleteProduct(id: string) {
    return this.deleteSellerProduct(id);
  },

  async updateOrderStatus(id: string, status: string, trackingNote?: string, location?: string) {
    return this.updateSellerOrderStatus(id, status, trackingNote, location);
  },

  async getSellerStats(sellerId?: string) {
    return this.getSellerAnalytics(sellerId);
  },

  async approveSeller(sellerId: string) {
    return this.verifySellerKyc(sellerId, 'APPROVED', 'Verified by AndhraMart Admin');
  },

  async rejectSeller(sellerId: string, reason?: string) {
    return this.verifySellerKyc(sellerId, 'REJECTED', reason || 'Documentation rejected');
  },

  async createCoupon(coupon: Partial<Coupon>) {
    return this.addAdminCoupon(coupon);
  }
};

