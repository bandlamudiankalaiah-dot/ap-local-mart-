import axios from 'axios';
import {
  Product,
  Category,
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

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export const httpClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

httpClient.interceptors.request.use(config => {
  const token = localStorage.getItem('andhramart_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function safeRequest<T = any>(promise: Promise<{ data: T }>): Promise<T> {
  try {
    const res = await promise;
    return res.data;
  } catch (err: any) {
    if (err.response && err.response.data) {
      return err.response.data;
    }
    throw err;
  }
}

export const api = {
  // Auth
  async register(data: {
    name: string;
    email?: string;
    phone?: string;
    role: string;
    password?: string;
    storeName?: string;
    pickupPincode?: string;
    pickupDistrict?: string;
    pickupAddress?: string;
  }) {
    return safeRequest(httpClient.post('/auth/register', data));
  },

  async login(identifier: string, role?: string, password?: string) {
    return safeRequest(httpClient.post('/auth/login', { identifier, role, password }));
  },

  async forgotPassword(identifier: string) {
    return safeRequest(httpClient.post('/auth/forgot-password', { identifier }));
  },

  async resetPassword(identifier: string, otp: string, newPassword: string) {
    return safeRequest(httpClient.post('/auth/reset-password', { identifier, otp, newPassword }));
  },

  async sendOtp(phone: string) {
    return safeRequest(httpClient.post('/auth/otp-send', { phone }));
  },

  async verifyOtp(phone: string, otp: string, name?: string) {
    return safeRequest(httpClient.post('/auth/otp-verify', { phone, otp, name }));
  },

  async getMe(token?: string) {
    return safeRequest(
      httpClient.get('/auth/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
    );
  },

  async updateProfile(data: { userId?: string; name?: string; email?: string; phone?: string; avatar?: string }) {
    return safeRequest(httpClient.put('/users/profile', data));
  },

  // Products, Stores & Categories
  async getProducts(params?: Record<string, string | number | boolean | undefined>) {
    return safeRequest(httpClient.get('/products', { params }));
  },

  async getProduct(id: string) {
    return safeRequest(httpClient.get(`/products/${id}`));
  },

  async getStores() {
    return safeRequest(httpClient.get('/stores'));
  },

  async getCategories() {
    return safeRequest(httpClient.get('/categories'));
  },

  async getBanners() {
    return safeRequest(httpClient.get('/banners'));
  },

  async getSearchSuggestions(q: string) {
    return safeRequest(httpClient.get('/search/suggestions', { params: { q } }));
  },

  // Pincode
  async checkPincode(pincode: string): Promise<PincodeInfo> {
    const res = await httpClient.get(`/pincode/${pincode}`);
    return res.data;
  },

  // Cart
  async getCart(userId?: string, pincode?: string) {
    return safeRequest(
      httpClient.get('/cart', {
        params: { userId: userId || 'user-customer-demo', pincode }
      })
    );
  },

  async addToCart(productId: string, quantity = 1, selectedVariant?: string, userId?: string) {
    return safeRequest(
      httpClient.post('/cart/add', { productId, quantity, selectedVariant, userId })
    );
  },

  async updateCartItem(id: string, quantity: number, userId?: string) {
    return safeRequest(httpClient.put(`/cart/item/${id}`, { quantity, userId }));
  },

  async removeCartItem(id: string, userId?: string) {
    return safeRequest(
      httpClient.delete(`/cart/item/${id}`, {
        params: { userId: userId || 'user-customer-demo' }
      })
    );
  },

  async clearCart(userId?: string) {
    return safeRequest(
      httpClient.delete('/cart/clear', {
        params: { userId: userId || 'user-customer-demo' }
      })
    );
  },

  // Wishlist
  async getWishlist(userId?: string) {
    return safeRequest(
      httpClient.get('/wishlist', {
        params: { userId: userId || 'user-customer-demo' }
      })
    );
  },

  async toggleWishlistApi(productId: string, userId?: string) {
    return safeRequest(
      httpClient.post('/wishlist/toggle', {
        productId,
        userId: userId || 'user-customer-demo'
      })
    );
  },

  // Addresses
  async getAddresses(userId?: string) {
    return safeRequest(
      httpClient.get('/addresses', {
        params: { userId: userId || 'user-customer-demo' }
      })
    );
  },

  async addAddress(address: Partial<Address>, userId?: string) {
    return safeRequest(httpClient.post('/addresses', { ...address, userId }));
  },

  async deleteAddress(id: string, userId?: string) {
    return safeRequest(
      httpClient.delete(`/addresses/${id}`, {
        params: { userId: userId || 'user-customer-demo' }
      })
    );
  },

  // Coupons
  async getCoupons() {
    return safeRequest(httpClient.get('/coupons'));
  },

  async validateCoupon(code: string, orderAmount: number) {
    return safeRequest(httpClient.post('/coupons/validate', { code, orderAmount }));
  },

  // Razorpay Payments
  async createRazorpayOrder(amount: number, userId?: string, method?: string) {
    return safeRequest(
      httpClient.post('/payments/razorpay/create-order', { amount, userId, method })
    );
  },

  async verifyRazorpayPayment(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    simulateFailure?: boolean;
  }) {
    return safeRequest(httpClient.post('/payments/razorpay/verify', data));
  },

  // Orders
  async getOrders(userId?: string, sellerId?: string) {
    return safeRequest(httpClient.get('/orders', { params: { userId, sellerId } }));
  },

  async getMyOrders(userId?: string) {
    return safeRequest(httpClient.get('/orders/my-orders', { params: { userId } }));
  },

  async getOrder(id: string) {
    return safeRequest(httpClient.get(`/orders/${id}`));
  },

  async createOrder(orderData: any) {
    return safeRequest(httpClient.post('/orders/create', orderData));
  },

  async cancelOrder(id: string, reason: string) {
    return safeRequest(httpClient.post(`/orders/${id}/cancel`, { reason }));
  },

  async returnOrder(id: string, reason: string, notes?: string) {
    return safeRequest(httpClient.post(`/orders/${id}/return`, { reason, notes }));
  },

  // Reviews
  async getProductReviews(productId: string) {
    return safeRequest(httpClient.get(`/reviews/product/${productId}`));
  },

  async addReview(data: Partial<Review>) {
    return safeRequest(httpClient.post('/reviews/create', data));
  },

  // Notifications
  async getNotifications(userId?: string) {
    return safeRequest(
      httpClient.get('/notifications', {
        params: { userId: userId || 'user-customer-demo' }
      })
    );
  },

  async markNotificationRead(id: string) {
    return safeRequest(httpClient.put(`/notifications/${id}/read`));
  },

  // Seller Operations
  async getSellerProfile(sellerId?: string) {
    return safeRequest(
      httpClient.get('/seller/profile', {
        params: { sellerId: sellerId || 'seller-godavari-heritage' }
      })
    );
  },

  async updateSellerProfile(data: Partial<Seller> & { sellerId?: string }) {
    return safeRequest(httpClient.put('/seller/profile', data));
  },

  async submitSellerKyc(data: any) {
    return safeRequest(httpClient.post('/seller/kyc', data));
  },

  async getSellerProducts(sellerId?: string) {
    return safeRequest(
      httpClient.get('/seller/products', {
        params: { sellerId: sellerId || 'seller-godavari-heritage' }
      })
    );
  },

  async addSellerProduct(product: Partial<Product>) {
    return safeRequest(httpClient.post('/seller/products', product));
  },

  async updateSellerProduct(id: string, product: Partial<Product>) {
    return safeRequest(httpClient.put(`/seller/products/${id}`, product));
  },

  async deleteSellerProduct(id: string) {
    return safeRequest(httpClient.delete(`/seller/products/${id}`));
  },

  async updateSellerOrderStatus(id: string, status: string, trackingNote?: string, location?: string) {
    return safeRequest(
      httpClient.put(`/seller/orders/${id}/status`, { status, trackingNote, location })
    );
  },

  async getSellerAnalytics(sellerId?: string) {
    return safeRequest(
      httpClient.get('/seller/dashboard', {
        params: { sellerId: sellerId || 'seller-godavari-heritage' }
      })
    );
  },

  // Admin Operations
  async getAdminStats() {
    return safeRequest(httpClient.get('/admin/dashboard'));
  },

  async getAdminUsers() {
    return safeRequest(httpClient.get('/admin/users'));
  },

  async deleteAdminUser(id: string) {
    return safeRequest(httpClient.delete(`/admin/users/${id}`));
  },

  async getAdminSellers() {
    return safeRequest(httpClient.get('/admin/sellers'));
  },

  async verifySellerKyc(sellerId: string, status: 'APPROVED' | 'REJECTED', notes?: string) {
    return safeRequest(httpClient.put(`/admin/sellers/${sellerId}/kyc`, { status, notes }));
  },

  async addAdminCategory(category: Partial<Category>) {
    return safeRequest(httpClient.post('/admin/categories', category));
  },

  async deleteAdminCategory(id: string) {
    return safeRequest(httpClient.delete(`/admin/categories/${id}`));
  },

  async addAdminCoupon(coupon: Partial<Coupon>) {
    return safeRequest(httpClient.post('/admin/coupons', coupon));
  },

  async deleteAdminCoupon(id: string) {
    return safeRequest(httpClient.delete(`/admin/coupons/${id}`));
  },

  async updateDeliverySettings(settings: {
    freeDeliveryThreshold?: number;
    apExpressFee?: number;
    apStandardFee?: number;
    outsideApFee?: number;
  }) {
    return safeRequest(httpClient.put('/admin/delivery-settings', settings));
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
    return this.verifySellerKyc(sellerId, 'APPROVED', 'Verified by AP Local Mart Admin');
  },

  async rejectSeller(sellerId: string, reason?: string) {
    return this.verifySellerKyc(sellerId, 'REJECTED', reason || 'Documentation rejected');
  },

  async createCoupon(coupon: Partial<Coupon>) {
    return this.addAdminCoupon(coupon);
  }
};
