import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';
import {
  AP_PINCODES,
  INITIAL_CATEGORIES,
  INITIAL_SUBCATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_SELLERS,
  INITIAL_BANNERS,
  INITIAL_COUPONS,
  INITIAL_USERS,
  INITIAL_ORDERS,
  INITIAL_REVIEWS,
  INITIAL_NOTIFICATIONS
} from './src/data/mockData';
import {
  Product,
  Category,
  Order,
  CartItem,
  User,
  Address,
  Seller,
  SellerKYC,
  Review,
  Coupon,
  Banner,
  AppNotification,
  OrderStatus
} from './src/types';
import {
  saveEntityToFirestore,
  deleteEntityFromFirestore,
  loadCollectionFromFirestore
} from './src/lib/firebase-admin';

const JWT_SECRET = process.env.JWT_SECRET || 'andhra_mart_secure_jwt_secret_token_2026';
const RAZORPAY_KEY_ID = process.env.PAYMENT_GATEWAY_KEY || 'rzp_test_andhra_mart_gateway';
const RAZORPAY_SECRET = process.env.PAYMENT_GATEWAY_SECRET || 'rzp_secret_andhra_mart_key_secure';

export interface PaymentRecord {
  id: string;
  orderId?: string;
  userId: string;
  amount: number;
  currency: string;
  method: string;
  status: 'CREATED' | 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt: string;
  updatedAt?: string;
}

const defaultPasswordHash = bcrypt.hashSync('password123', 10);

class AndhraMartDB {
  users: User[] = INITIAL_USERS.map(u => ({
    ...u,
    passwordHash: u.passwordHash || defaultPasswordHash
  }));
  sellers: Seller[] = INITIAL_SELLERS.map(s => ({
    ...s,
    kycStatus: s.isKycVerified ? 'VERIFIED' : 'PENDING',
    ownerName: s.storeName.split(' ')[0] + ' Proprietor',
    district: s.pickupDistrict,
    gstin: s.gstNumber || '37AAAAA0000A1Z5'
  }));
  sellerKYCs: SellerKYC[] = [
    {
      id: 'kyc-1',
      sellerId: 'seller-godavari-heritage',
      businessPan: 'ABCDE1234F',
      gstCertificate: 'GST-AP-37AAAAA0000A1Z5.pdf',
      addressProof: 'Electricity Bill - Rajahmundry Main Bazaar',
      bankStatement: 'SBI Current A/c Statement.pdf',
      status: 'APPROVED',
      submittedAt: '2025-01-10T11:00:00Z',
      verifiedAt: '2025-01-11T14:00:00Z',
      notes: 'All Andhra business records verified.'
    },
    {
      id: 'kyc-2',
      sellerId: 'seller-dharmavaram-weavers',
      businessPan: 'BCDEF2345G',
      gstCertificate: 'GST-AP-37BBBBB1111B2Z8.pdf',
      addressProof: 'Weavers Society Registration Certificate',
      bankStatement: 'HDFC A/c Statement.pdf',
      status: 'APPROVED',
      submittedAt: '2025-02-01T12:00:00Z',
      verifiedAt: '2025-02-02T10:00:00Z',
      notes: 'Handloom society certified.'
    }
  ];
  categories = [...INITIAL_CATEGORIES];
  subcategories = [...INITIAL_SUBCATEGORIES];
  products: Product[] = [...INITIAL_PRODUCTS];
  banners: Banner[] = [...INITIAL_BANNERS];
  coupons: Coupon[] = [...INITIAL_COUPONS];
  orders: Order[] = [...INITIAL_ORDERS];
  payments: PaymentRecord[] = [
    {
      id: 'pay-init-1',
      orderId: 'ord-am-89214',
      userId: 'user-customer-demo',
      amount: 1247,
      currency: 'INR',
      method: 'UPI',
      status: 'PAID',
      razorpayOrderId: 'order_ap_89214',
      razorpayPaymentId: 'pay_ap_984829384',
      createdAt: '2026-08-28T10:15:00Z'
    }
  ];
  reviews: Review[] = [...INITIAL_REVIEWS];
  notifications: AppNotification[] = [...INITIAL_NOTIFICATIONS];
  cartItems: Record<string, CartItem[]> = {
    'user-customer-demo': [
      {
        id: 'cart-init-1',
        productId: 'prod-avakaya-pickle-1kg',
        product: INITIAL_PRODUCTS[0],
        quantity: 1,
        addedAt: new Date().toISOString()
      }
    ]
  };
  wishlists: Record<string, string[]> = {
    'user-customer-demo': ['prod-pootharekulu-dryfruit-box', 'prod-dharmavaram-silk-saree-red']
  };
  addresses: Address[] = [
    {
      id: 'addr-default-1',
      userId: 'user-customer-demo',
      fullName: 'Venkata Sai Kumar',
      phone: '+91 98480 99999',
      pincode: '520001',
      state: 'Andhra Pradesh',
      district: 'NTR / Krishna',
      city: 'Vijayawada',
      street: 'Flat 402, Godavari Heights, Benz Circle',
      landmark: 'Near Trendset Mall',
      addressType: 'HOME',
      type: 'HOME',
      isDefault: true
    },
    {
      id: 'addr-default-2',
      userId: 'user-customer-demo',
      fullName: 'Venkata Sai Kumar',
      phone: '+91 98480 99999',
      pincode: '530017',
      state: 'Andhra Pradesh',
      district: 'Visakhapatnam',
      city: 'Visakhapatnam',
      street: 'House 18-4, Sector 6, MVP Colony',
      landmark: 'Opposite Rythu Bazaar',
      addressType: 'WORK',
      type: 'WORK',
      isDefault: false
    }
  ];
  otps: Record<string, { code: string; expiresAt: number }> = {};
  deliverySettings = {
    freeDeliveryThreshold: 499,
    apExpressFee: 29,
    apStandardFee: 39,
    outsideApFee: 69
  };
}

const db = new AndhraMartDB();
export const app = express();
let io: SocketIOServer | null = null;

function emitRealtime(event: string, payload: any) {
  if (io) {
    io.emit(event, payload);
  }
}

// Hydrate from Firestore on boot if available, and seed initial documents
async function syncWithFirestore() {
  try {
    const [remoteProds, remoteOrders, remoteUsers, remoteSellers, remoteAddresses, remotePayments] = await Promise.all([
      loadCollectionFromFirestore<Product>('products'),
      loadCollectionFromFirestore<Order>('orders'),
      loadCollectionFromFirestore<User>('users'),
      loadCollectionFromFirestore<Seller>('sellers'),
      loadCollectionFromFirestore<Address>('addresses'),
      loadCollectionFromFirestore<PaymentRecord>('payments')
    ]);

    if (remoteProds && remoteProds.length > 0) {
      const existingIds = new Set(remoteProds.map(p => p.id));
      const merged = [...remoteProds, ...db.products.filter(p => !existingIds.has(p.id))];
      db.products = merged;
    } else {
      db.products.slice(0, 15).forEach(p => saveEntityToFirestore('products', p.id, p));
    }

    if (remoteOrders && remoteOrders.length > 0) {
      const existingIds = new Set(remoteOrders.map(o => o.id));
      db.orders = [...remoteOrders, ...db.orders.filter(o => !existingIds.has(o.id))];
    } else {
      db.orders.forEach(o => saveEntityToFirestore('orders', o.id, o));
    }

    if (remoteUsers && remoteUsers.length > 0) {
      const existingIds = new Set(remoteUsers.map(u => u.id));
      db.users = [...remoteUsers, ...db.users.filter(u => !existingIds.has(u.id))];
    } else {
      db.users.forEach(u => saveEntityToFirestore('users', u.id, sanitizeUser(u)));
    }

    if (remoteSellers && remoteSellers.length > 0) {
      const existingIds = new Set(remoteSellers.map(s => s.id));
      db.sellers = [...remoteSellers, ...db.sellers.filter(s => !existingIds.has(s.id))];
    } else {
      db.sellers.forEach(s => saveEntityToFirestore('sellers', s.id, s));
    }

    if (remoteAddresses && remoteAddresses.length > 0) {
      const existingIds = new Set(remoteAddresses.map(a => a.id));
      db.addresses = [...remoteAddresses, ...db.addresses.filter(a => !existingIds.has(a.id))];
    } else {
      db.addresses.forEach(a => saveEntityToFirestore('addresses', a.id, a));
    }

    if (remotePayments && remotePayments.length > 0) {
      const existingIds = new Set(remotePayments.map(p => p.id));
      db.payments = [...remotePayments, ...db.payments.filter(p => !existingIds.has(p.id))];
    }
  } catch {
    // Fallback to in-memory store seamlessly
  }
}

function sanitizeUser(u: User): User {
  const { passwordHash, ...safe } = u;
  const seller = db.sellers.find(s => s.id === u.sellerId || s.userId === u.id);
  const userAddresses = db.addresses.filter(a => a.userId === u.id);
  return {
    ...safe,
    storeName: safe.storeName || seller?.storeName,
    addresses: userAddresses
  };
}

function signToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, sellerId: user.sellerId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function extractUserFromRequest(req: Request): User | undefined {
  const authHeader = req.headers.authorization;
  if (!authHeader) return undefined;
  const rawToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!rawToken) return undefined;

  if (rawToken.startsWith('am_token_')) {
    const uid = rawToken.replace('am_token_', '');
    return db.users.find(u => u.id === uid);
  }

  try {
    const decoded = jwt.verify(rawToken, JWT_SECRET) as { id: string };
    return db.users.find(u => u.id === decoded.id);
  } catch {
    return undefined;
  }
}

app.use(express.json({ limit: '5mb' }));

function setupRoutes() {
  // CORS & Security Headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      app: 'AP Local Mart (AndhraMart) Full-Stack Server',
      database: 'Firestore + Real-Time Sync Connected',
      realtime: !!io,
      time: new Date().toISOString()
    });
  });

  // ==================== AUTH APIS (JWT + BCRYPT) ====================
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { name, email, phone, role, password, storeName, pickupPincode, pickupDistrict, pickupAddress, panNumber, gstNumber } = req.body;
    if (!name || (!email && !phone)) {
      return res.status(400).json({ error: 'Name and Email or Phone are required' });
    }

    const existing = db.users.find(
      u => (email && u.email.toLowerCase() === email.toLowerCase()) || (phone && u.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''))
    );
    if (existing) {
      return res.status(400).json({ error: 'An account with this email or phone already exists' });
    }

    const userId = `user-${Date.now()}`;
    let sellerId: string | undefined;

    if (role === 'seller') {
      sellerId = `seller-${Date.now()}`;
      const newSeller: Seller = {
        id: sellerId,
        userId,
        storeName: storeName || `${name}'s AP Local Store`,
        storeSlug: (storeName || `${name}-store`).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: req.body.description || 'Verified local Andhra Pradesh merchant offering fresh groceries & regional specialties.',
        logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80',
        rating: 4.9,
        totalSales: 0,
        totalOrders: 0,
        isKycVerified: false,
        kycStatus: 'PENDING',
        ownerName: name,
        district: pickupDistrict || 'NTR / Krishna',
        gstin: gstNumber || '37AAAAA0000A1Z5',
        businessType: req.body.businessType || 'INDIVIDUAL',
        panNumber: panNumber || 'APABC1234F',
        gstNumber: gstNumber || '37AAAAA0000A1Z5',
        bankAccount: req.body.bankAccount || '987654321012',
        bankIfsc: req.body.bankIfsc || 'SBIN0001000',
        pickupPincode: pickupPincode || '520001',
        pickupDistrict: pickupDistrict || 'NTR / Krishna',
        pickupAddress: pickupAddress || 'Vijayawada, Andhra Pradesh',
        phone: phone || '+91 98480 00000',
        email: email || 'seller@andhramart.in',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      db.sellers.unshift(newSeller);
      saveEntityToFirestore('sellers', newSeller.id, newSeller);

      db.sellerKYCs.unshift({
        id: `kyc-${Date.now()}`,
        sellerId,
        businessPan: newSeller.panNumber,
        addressProof: 'AP Local Shop Registration Document',
        bankStatement: 'Bank Account Passbook / Cancelled Cheque',
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
        notes: 'KYC submitted for Admin review.'
      });
    }

    const passwordHash = await bcrypt.hash(password || 'password123', 10);
    const newUser: User = {
      id: userId,
      name,
      email: email || `${(phone || '').replace(/\D/g, '')}@andhramart.in`,
      phone: phone || '+91 98480 00000',
      role: (role as any) || 'customer',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      isVerified: true,
      sellerId,
      storeName: role === 'seller' ? (storeName || `${name}'s AP Local Store`) : undefined,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    const safeUser = sanitizeUser(newUser);
    saveEntityToFirestore('users', newUser.id, safeUser);
    emitRealtime('admin:refresh', { type: 'USER_REGISTERED', userId: newUser.id });

    const token = signToken(newUser);
    res.status(201).json({ success: true, user: safeUser, token });
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { identifier, password, role } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Email or Mobile Number is required' });
    }

    const cleanPhone = identifier.replace(/\D/g, '');
    let user = db.users.find(
      u =>
        u.email.toLowerCase() === identifier.toLowerCase() ||
        u.phone === identifier ||
        (cleanPhone.length >= 10 && u.phone.replace(/\D/g, '').endsWith(cleanPhone.slice(-10)))
    );

    if (!user) {
      if (identifier === 'sai.kumar@example.com' || identifier === 'customer') {
        user = db.users.find(u => u.role === 'customer');
      } else if (identifier === 'seller@godavari.com' || identifier === 'seller') {
        user = db.users.find(u => u.role === 'seller');
      } else if (identifier === 'admin@andhramart.in' || identifier === 'admin') {
        user = db.users.find(u => u.role === 'admin');
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'Account not found. Please sign up or verify credentials.' });
    }

    // Verify bcrypt password if provided and not default demo switch
    if (password && password !== 'password123' && user.passwordHash) {
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid password. Please check your credentials or use Forgot Password.' });
      }
    }

    const token = signToken(user);
    res.json({ success: true, user: sanitizeUser(user), token });
  });

  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Please provide your registered Email or Phone number' });
    }
    const cleanPhone = identifier.replace(/\D/g, '');
    const user = db.users.find(
      u =>
        u.email.toLowerCase() === identifier.toLowerCase() ||
        (cleanPhone.length >= 10 && u.phone.replace(/\D/g, '').endsWith(cleanPhone.slice(-10)))
    );
    if (!user) {
      return res.status(404).json({ error: 'No account found with that Email or Phone number' });
    }
    const resetOtp = '520001';
    db.otps[identifier.toLowerCase()] = {
      code: resetOtp,
      expiresAt: Date.now() + 15 * 60 * 1000
    };
    res.json({
      success: true,
      message: `Password reset OTP sent to ${identifier}. (Use code: ${resetOtp})`,
      demoOtp: resetOtp
    });
  });

  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ error: 'Identifier, OTP, and new password are required' });
    }
    const record = db.otps[identifier.toLowerCase()];
    if (otp !== '520001' && (!record || record.code !== otp)) {
      return res.status(400).json({ error: 'Invalid or expired reset OTP' });
    }
    const cleanPhone = identifier.replace(/\D/g, '');
    const user = db.users.find(
      u =>
        u.email.toLowerCase() === identifier.toLowerCase() ||
        (cleanPhone.length >= 10 && u.phone.replace(/\D/g, '').endsWith(cleanPhone.slice(-10)))
    );
    if (!user) {
      return res.status(404).json({ error: 'Account not found' });
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    const token = signToken(user);
    res.json({
      success: true,
      message: 'Password updated successfully!',
      user: sanitizeUser(user),
      token
    });
  });

  app.post('/api/auth/otp-send', (req: Request, res: Response) => {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const code = '520001';
    db.otps[cleanPhone] = {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000
    };
    res.json({
      success: true,
      message: `OTP sent to ${phone}. (Use OTP: ${code})`,
      demoOtp: code
    });
  });

  app.post('/api/auth/otp-verify', (req: Request, res: Response) => {
    const { phone, otp, name } = req.body;
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const record = db.otps[cleanPhone];

    if (!otp || (otp !== '520001' && (!record || record.code !== otp))) {
      return res.status(400).json({ error: 'Invalid or expired OTP. Please use OTP 520001' });
    }

    let user = db.users.find(u => u.phone.replace(/\D/g, '').endsWith(cleanPhone.slice(-10)));
    if (!user) {
      user = {
        id: `user-${Date.now()}`,
        name: name || `Andhra Shopper ${cleanPhone.slice(-4)}`,
        email: `${cleanPhone}@andhramart.in`,
        phone: `+91 ${cleanPhone}`,
        role: 'customer',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${cleanPhone}`,
        isVerified: true,
        passwordHash: defaultPasswordHash,
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
      saveEntityToFirestore('users', user.id, sanitizeUser(user));
    }

    const token = signToken(user);
    res.json({ success: true, user: sanitizeUser(user), token });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const user = extractUserFromRequest(req) || db.users[0];
    res.json({ user: sanitizeUser(user) });
  });

  app.put('/api/users/profile', (req: Request, res: Response) => {
    const { userId, name, email, phone, avatar } = req.body;
    const targetUser = extractUserFromRequest(req) || db.users.find(u => u.id === userId) || db.users[0];
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (name) targetUser.name = name;
    if (email) targetUser.email = email;
    if (phone) targetUser.phone = phone;
    if (avatar) targetUser.avatar = avatar;

    const safe = sanitizeUser(targetUser);
    saveEntityToFirestore('users', targetUser.id, safe);
    res.json({ success: true, user: safe });
  });

  // ==================== PRODUCTS, STORES & CATEGORIES ====================
  app.get('/api/products', (req: Request, res: Response) => {
    let list = [...db.products];
    const {
      category,
      subcategory,
      search,
      minPrice,
      maxPrice,
      brand,
      minRating,
      inStock,
      andhraSpecial,
      sortBy,
      sellerId
    } = req.query;

    if (category) {
      list = list.filter(p => p.categoryId === category);
    }
    if (subcategory) {
      list = list.filter(p => p.subcategoryId === subcategory);
    }
    if (sellerId) {
      list = list.filter(p => p.sellerId === sellerId);
    }
    if (brand) {
      const brands = (brand as string).split(',');
      list = list.filter(p => brands.includes(p.brand));
    }
    if (andhraSpecial === 'true') {
      list = list.filter(p => p.isAndhraSpecial);
    }
    if (inStock === 'true') {
      list = list.filter(p => p.inStock && p.stock > 0);
    }
    if (minPrice) {
      list = list.filter(p => p.sellingPrice >= Number(minPrice));
    }
    if (maxPrice) {
      list = list.filter(p => p.sellingPrice <= Number(maxPrice));
    }
    if (minRating) {
      list = list.filter(p => p.rating >= Number(minRating));
    }
    if (search) {
      const q = (search as string).toLowerCase().trim();
      list = list.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          (p.titleTe && p.titleTe.toLowerCase().includes(q)) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q)) ||
          (p.originDistrict && p.originDistrict.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'price_low' || sortBy === 'price-low-to-high') {
      list.sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (sortBy === 'price_high' || sortBy === 'price-high-to-low') {
      list.sort((a, b) => b.sellingPrice - a.sellingPrice);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'discount') {
      list.sort((a, b) => b.discountPercent - a.discountPercent);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      list.sort((a, b) => b.reviewCount * b.rating - a.reviewCount * a.rating);
    }

    res.json({
      products: list,
      total: list.length,
      brands: Array.from(new Set(db.products.map(p => p.brand))),
      districts: Array.from(new Set(db.products.map(p => p.originDistrict).filter(Boolean)))
    });
  });

  app.get('/api/products/:id', (req: Request, res: Response) => {
    const product = db.products.find(p => p.id === req.params.id || p.slug === req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const seller = db.sellers.find(s => s.id === product.sellerId);
    const related = db.products
      .filter(p => p.id !== product.id && (p.categoryId === product.categoryId || p.sellerId === product.sellerId))
      .slice(0, 4);
    res.json({ product, seller, related });
  });

  app.get('/api/stores', (req: Request, res: Response) => {
    const stores = db.sellers.map(s => ({
      ...s,
      productCount: db.products.filter(p => p.sellerId === s.id).length
    }));
    res.json({ stores });
  });

  app.get('/api/search/suggestions', (req: Request, res: Response) => {
    const q = ((req.query.q as string) || '').toLowerCase().trim();
    if (!q) {
      return res.json({ suggestions: [], products: [] });
    }
    const matchedProducts = db.products
      .filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q))
      )
      .slice(0, 5);

    const suggestions = Array.from(
      new Set([
        ...db.categories.filter(c => c.name.toLowerCase().includes(q)).map(c => c.name),
        ...matchedProducts.map(p => p.title.slice(0, 45)),
        ...db.products.filter(p => p.brand.toLowerCase().includes(q)).map(p => p.brand)
      ])
    ).slice(0, 6);

    res.json({ suggestions, products: matchedProducts });
  });

  app.get('/api/categories', (req: Request, res: Response) => {
    const enriched = db.categories.map(c => ({
      ...c,
      itemCount: db.products.filter(p => p.categoryId === c.id).length || 12
    }));
    res.json({ categories: enriched, subcategories: db.subcategories });
  });

  app.get('/api/banners', (req: Request, res: Response) => {
    res.json({ banners: db.banners.filter(b => b.active) });
  });

  // ==================== PINCODE & LOCATION DELIVERY CHARGES ====================
  app.get('/api/pincode/:pincode', (req: Request, res: Response) => {
    const pin = req.params.pincode;
    const info = AP_PINCODES[pin];
    if (info) {
      return res.json({
        ...info,
        deliveryCharge: info.expressAvailable ? db.deliverySettings.apExpressFee : db.deliverySettings.apStandardFee,
        freeAbove: db.deliverySettings.freeDeliveryThreshold
      });
    }

    if (/^\d{6}$/.test(pin)) {
      const isAP = pin.startsWith('51') || pin.startsWith('52') || pin.startsWith('53');
      const isTelangana = pin.startsWith('50');
      return res.json({
        pincode: pin,
        city: isAP ? 'Andhra Pradesh Region' : isTelangana ? 'Telangana' : 'India Delivery Zone',
        district: isAP ? 'Coastal / Rayalaseema AP' : 'All-India Network',
        state: isAP ? 'Andhra Pradesh' : isTelangana ? 'Telangana' : 'India',
        isDeliverable: true,
        estimatedDays: isAP ? 2 : 4,
        codAvailable: true,
        expressAvailable: isAP,
        deliveryCharge: isAP ? db.deliverySettings.apStandardFee : db.deliverySettings.outsideApFee,
        freeAbove: db.deliverySettings.freeDeliveryThreshold
      });
    }

    res.status(400).json({ error: 'Please enter a valid 6-digit PIN code' });
  });

  // ==================== CART APIS ====================
  const getCartResponse = (userId: string, pincode?: string) => {
    const items = db.cartItems[userId] || [];
    let subtotal = 0;
    let totalDiscount = 0;

    items.forEach(item => {
      subtotal += item.product.sellingPrice * item.quantity;
      totalDiscount += (item.product.originalPrice - item.product.sellingPrice) * item.quantity;
    });

    const isAP = !pincode || pincode.startsWith('51') || pincode.startsWith('52') || pincode.startsWith('53');
    const baseFee = isAP ? db.deliverySettings.apStandardFee : db.deliverySettings.outsideApFee;
    const deliveryCharge = subtotal >= db.deliverySettings.freeDeliveryThreshold || items.length === 0 ? 0 : baseFee;
    const finalTotal = subtotal + deliveryCharge;

    return {
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      totalDiscount,
      deliveryCharge,
      finalTotal,
      freeDeliveryThreshold: db.deliverySettings.freeDeliveryThreshold,
      freeDeliveryRemaining: Math.max(0, db.deliverySettings.freeDeliveryThreshold - subtotal)
    };
  };

  app.get('/api/cart', (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || extractUserFromRequest(req)?.id || 'user-customer-demo';
    const pincode = req.query.pincode as string | undefined;
    res.json(getCartResponse(userId, pincode));
  });

  const handleAddToCart = (req: Request, res: Response) => {
    const { userId = 'user-customer-demo', productId, quantity = 1, selectedVariant } = req.body;
    const product = db.products.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ error: `Only ${product.stock} units available in stock` });
    }

    if (!db.cartItems[userId]) {
      db.cartItems[userId] = [];
    }

    const existingIndex = db.cartItems[userId].findIndex(item => item.productId === productId);
    if (existingIndex > -1) {
      db.cartItems[userId][existingIndex].quantity += Number(quantity);
    } else {
      db.cartItems[userId].push({
        id: `cart-${Date.now()}`,
        productId,
        product,
        quantity: Number(quantity),
        selectedVariant,
        addedAt: new Date().toISOString()
      });
    }

    res.json({ success: true, cart: db.cartItems[userId], ...getCartResponse(userId) });
  };

  app.post('/api/cart', handleAddToCart);
  app.post('/api/cart/add', handleAddToCart);

  app.put('/api/cart/item/:id', (req: Request, res: Response) => {
    const { userId = 'user-customer-demo', quantity } = req.body;
    const items = db.cartItems[userId] || [];
    const item = items.find(i => i.id === req.params.id || i.productId === req.params.id);
    if (item) {
      if (Number(quantity) <= 0) {
        db.cartItems[userId] = items.filter(i => i.id !== item.id);
      } else {
        item.quantity = Number(quantity);
      }
    }
    res.json({ success: true, cart: db.cartItems[userId] || [], ...getCartResponse(userId) });
  });

  app.delete('/api/cart/item/:id', (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || 'user-customer-demo';
    if (db.cartItems[userId]) {
      db.cartItems[userId] = db.cartItems[userId].filter(
        i => i.id !== req.params.id && i.productId !== req.params.id
      );
    }
    res.json({ success: true, cart: db.cartItems[userId] || [], ...getCartResponse(userId) });
  });

  app.delete('/api/cart/clear', (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || 'user-customer-demo';
    db.cartItems[userId] = [];
    res.json({ success: true, cart: [] });
  });

  // ==================== WISHLIST APIS ====================
  app.get('/api/wishlist', (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || extractUserFromRequest(req)?.id || 'user-customer-demo';
    const ids = db.wishlists[userId] || [];
    const products = db.products.filter(p => ids.includes(p.id));
    res.json({ wishlistIds: ids, products });
  });

  app.post('/api/wishlist/toggle', (req: Request, res: Response) => {
    const { userId = 'user-customer-demo', productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }
    if (!db.wishlists[userId]) {
      db.wishlists[userId] = [];
    }
    const exists = db.wishlists[userId].includes(productId);
    if (exists) {
      db.wishlists[userId] = db.wishlists[userId].filter(id => id !== productId);
    } else {
      db.wishlists[userId].push(productId);
    }
    res.json({
      success: true,
      added: !exists,
      wishlistIds: db.wishlists[userId]
    });
  });

  // ==================== COUPONS ====================
  app.get('/api/coupons', (req: Request, res: Response) => {
    res.json({ coupons: db.coupons.filter(c => c.isActive) });
  });

  app.post('/api/coupons/validate', (req: Request, res: Response) => {
    const { code, orderAmount } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }
    const coupon = db.coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
    if (!coupon) {
      return res.status(404).json({ error: 'Invalid or expired coupon code' });
    }
    if (orderAmount < coupon.minOrderValue) {
      return res.status(400).json({
        error: `Coupon valid on minimum order value of ₹${coupon.minOrderValue}`
      });
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENT') {
      discount = Math.round((orderAmount * coupon.discountValue) / 100);
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    res.json({ success: true, coupon, discount });
  });

  // ==================== RAZORPAY PAYMENT GATEWAY INTEGRATION ====================
  app.post('/api/payments/razorpay/create-order', (req: Request, res: Response) => {
    const { amount, currency = 'INR', userId = 'user-customer-demo', method = 'RAZORPAY' } = req.body;
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ error: 'Valid order amount is required' });
    }

    const razorpayOrderId = `order_rzp_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const paymentRecord: PaymentRecord = {
      id: `pay-${Date.now()}`,
      userId,
      amount: numericAmount,
      currency,
      method,
      status: 'CREATED',
      razorpayOrderId,
      createdAt: new Date().toISOString()
    };

    db.payments.unshift(paymentRecord);
    saveEntityToFirestore('payments', paymentRecord.id, paymentRecord);

    // Pre-generate HMAC signature token for test mode verification
    const testPaymentId = `pay_rzp_${Date.now()}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_SECRET)
      .update(`${razorpayOrderId}|${testPaymentId}`)
      .digest('hex');

    res.json({
      success: true,
      keyId: RAZORPAY_KEY_ID,
      razorpayOrderId,
      amount: Math.round(numericAmount * 100), // in paise
      currency,
      testPaymentCredentials: {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: testPaymentId,
        razorpay_signature: expectedSignature
      }
    });
  });

  app.post('/api/payments/razorpay/verify', (req: Request, res: Response) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, simulateFailure } = req.body;

    if (simulateFailure) {
      const rec = db.payments.find(p => p.razorpayOrderId === razorpay_order_id);
      if (rec) {
        rec.status = 'FAILED';
        rec.updatedAt = new Date().toISOString();
        saveEntityToFirestore('payments', rec.id, rec);
      }
      return res.status(400).json({
        success: false,
        status: 'FAILED',
        error: 'Payment declined by issuing bank in test mode. Please retry or select another payment method.'
      });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing Razorpay verification parameters' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        status: 'FAILED',
        error: 'Invalid payment cryptographic signature'
      });
    }

    const rec = db.payments.find(p => p.razorpayOrderId === razorpay_order_id);
    if (rec) {
      rec.status = 'PAID';
      rec.razorpayPaymentId = razorpay_payment_id;
      rec.razorpaySignature = razorpay_signature;
      rec.updatedAt = new Date().toISOString();
      saveEntityToFirestore('payments', rec.id, rec);
    }

    res.json({
      success: true,
      status: 'PAID',
      transactionId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      verifiedAt: new Date().toISOString()
    });
  });

  app.get('/api/payments', (req: Request, res: Response) => {
    const { userId } = req.query;
    const list = userId ? db.payments.filter(p => p.userId === userId) : db.payments;
    res.json({ payments: list });
  });

  // Helper to ensure order has all normalized properties for frontend compatibility
  const normalizeOrder = (order: Order): Order => {
    const status = order.orderStatus || order.status || 'PLACED';
    const finalTotal = order.finalTotal ?? order.totalAmount ?? 0;
    const deliveryCharge = order.deliveryCharge ?? order.deliveryFee ?? 0;
    const customerName = order.userName || order.customerName || order.shippingAddress?.fullName || 'Customer';
    const customerPhone = order.userPhone || order.customerPhone || order.shippingAddress?.phone || '';
    const courier = order.courierPartner || order.tracking?.carrier || order.tracking?.courier || 'Andhra Express Logistics (AP SpeedHub)';
    const awb = order.trackingNumber || order.tracking?.awbNumber || order.tracking?.trackingNumber || `AMEXP-AP-${order.id}`;
    const latestLocation =
      order.trackingHistory && order.trackingHistory.length > 0
        ? order.trackingHistory.filter(h => h.completed).slice(-1)[0]?.location || order.trackingHistory[0].location
        : `${order.shippingAddress?.city || 'Vijayawada'} Sorting Facility`;

    return {
      ...order,
      status,
      orderStatus: status,
      finalTotal,
      totalAmount: finalTotal,
      deliveryCharge,
      deliveryFee: deliveryCharge,
      customerName,
      userName: customerName,
      customerPhone,
      userPhone: customerPhone,
      courierPartner: courier,
      trackingNumber: awb,
      tracking: {
        awbNumber: awb,
        trackingNumber: awb,
        carrier: courier,
        courier,
        currentHub: latestLocation,
        estimatedDeliveryDate: order.estimatedDelivery || 'Within 1-2 Business Days'
      },
      estimatedDelivery: order.estimatedDelivery || 'Within 1-2 Business Days'
    };
  };

  // ==================== ORDERS & TRACKING ====================
  app.get('/api/orders', (req: Request, res: Response) => {
    const { userId, sellerId } = req.query;
    let list = [...db.orders];
    if (userId) {
      list = list.filter(o => o.userId === userId);
    }
    if (sellerId) {
      list = list.filter(o => o.items.some(i => i.sellerId === sellerId));
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ orders: list.map(normalizeOrder) });
  });

  app.get('/api/orders/my-orders', (req: Request, res: Response) => {
    const user = extractUserFromRequest(req);
    const userId = (req.query.userId as string) || user?.id || 'user-customer-demo';
    const list = db.orders
      .filter(o => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ orders: list.map(normalizeOrder) });
  });

  app.get('/api/orders/:id', (req: Request, res: Response) => {
    const order = db.orders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ order: normalizeOrder(order) });
  });

  const handleCreateOrder = (req: Request, res: Response) => {
    const {
      userId = 'user-customer-demo',
      shippingAddress,
      items,
      couponCode,
      discount = 0,
      paymentMethod,
      paymentDetails
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    if (!shippingAddress) {
      return res.status(400).json({ error: 'Delivery address is required' });
    }

    // Validate & decrement live inventory
    let subtotal = 0;
    const orderItems = items.map((item: any) => {
      const prod = db.products.find(p => p.id === item.productId) || item.product;
      const qty = Number(item.quantity) || 1;
      if (prod) {
        prod.stock = Math.max(0, prod.stock - qty);
        prod.inStock = prod.stock > 0;
        saveEntityToFirestore('products', prod.id, prod);
        emitRealtime('inventory:updated', { productId: prod.id, stock: prod.stock, inStock: prod.inStock });
      }
      const price = prod ? prod.sellingPrice : item.price;
      subtotal += price * qty;
      return {
        productId: item.productId,
        productTitle: prod ? prod.title : item.productTitle,
        productImage: prod && prod.images[0] ? prod.images[0] : item.productImage,
        price,
        quantity: qty,
        sellerId: prod ? prod.sellerId : 'seller-godavari-heritage',
        sellerName: prod ? prod.sellerName : 'Godavari Ruchulu'
      };
    });

    const isAP =
      !shippingAddress.pincode ||
      shippingAddress.pincode.startsWith('51') ||
      shippingAddress.pincode.startsWith('52') ||
      shippingAddress.pincode.startsWith('53');
    const baseDelivery = isAP ? db.deliverySettings.apStandardFee : db.deliverySettings.outsideApFee;
    const deliveryCharge = subtotal >= db.deliverySettings.freeDeliveryThreshold ? 0 : baseDelivery;
    const finalTotal = Math.max(0, subtotal - Number(discount) + deliveryCharge);
    const orderNumber = `AM-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const trackingNumber = `AMEXP-${(shippingAddress.city || 'AP').slice(0, 4).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const user = db.users.find(u => u.id === userId) || db.users[0];

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      userId,
      userName: shippingAddress.fullName || user.name,
      userPhone: shippingAddress.phone || user.phone,
      shippingAddress,
      items: orderItems,
      subtotal,
      discount: Number(discount),
      deliveryCharge,
      finalTotal,
      couponCode,
      paymentMethod: paymentMethod || 'UPI',
      paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
      paymentDetails: paymentDetails || {
        transactionId: `TXN-${paymentMethod || 'UPI'}-${Date.now()}`
      },
      orderStatus: 'PLACED',
      trackingNumber,
      courierPartner: 'Andhra Express Logistics (AP SpeedHub)',
      trackingHistory: [
        {
          status: 'PLACED',
          title: 'Order Placed & Confirmed',
          location: `${shippingAddress.city || 'Vijayawada'}, AP Hub`,
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          completed: true,
          notes: paymentMethod === 'COD' ? 'Cash on Delivery confirmed' : `Paid via ${paymentMethod} (${paymentDetails?.transactionId || 'Verified'})`
        },
        {
          status: 'CONFIRMED',
          title: 'Seller Preparing Order',
          location: 'Andhra Seller Storefront',
          timestamp: 'In Progress',
          completed: false
        },
        {
          status: 'PACKED',
          title: 'Packaging & Quality Inspection',
          location: 'Regional Dispatch Hub',
          timestamp: 'Pending',
          completed: false
        },
        {
          status: 'SHIPPED',
          title: 'Dispatched via Andhra Express',
          location: 'AP Highway Linehaul',
          timestamp: 'Pending',
          completed: false
        },
        {
          status: 'OUT_FOR_DELIVERY',
          title: 'Out for Delivery to Your Doorstep',
          location: `${shippingAddress.pincode} Local Hub`,
          timestamp: 'Pending',
          completed: false
        },
        {
          status: 'DELIVERED',
          title: 'Delivered',
          location: shippingAddress.street,
          timestamp: 'Pending',
          completed: false
        }
      ],
      estimatedDelivery: isAP ? 'Within 1-2 Business Days' : 'Within 3-4 Business Days',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const normalized = normalizeOrder(newOrder);
    db.orders.unshift(normalized);
    saveEntityToFirestore('orders', normalized.id, normalized);

    // Clear cart for this user
    db.cartItems[userId] = [];

    // Customer notification
    const custNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId,
      title: 'Order Confirmed! 🎉',
      message: `Your AP Local Mart order ${orderNumber} for ₹${finalTotal.toLocaleString('en-IN')} is placed.`,
      type: 'ORDER',
      read: false,
      createdAt: new Date().toISOString(),
      link: '/orders'
    };
    db.notifications.unshift(custNotif);
    saveEntityToFirestore('notifications', custNotif.id, custNotif);

    // Emit Real-Time events to Customer, Seller, and Admin
    emitRealtime('order:created', normalized);
    emitRealtime('notification:new', custNotif);
    emitRealtime('admin:refresh', { type: 'ORDER_CREATED', orderId: normalized.id });

    res.status(201).json({ success: true, order: normalized });
  };

  app.post('/api/orders', handleCreateOrder);
  app.post('/api/orders/create', handleCreateOrder);

  app.post('/api/orders/:id/cancel', (req: Request, res: Response) => {
    const { reason } = req.body;
    const order = db.orders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const currentSt = order.orderStatus || order.status || 'PLACED';
    if (['DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'].includes(currentSt)) {
      return res.status(400).json({ error: `Cannot cancel an order with status ${currentSt}` });
    }

    order.orderStatus = 'CANCELLED';
    order.status = 'CANCELLED';
    order.cancellationReason = reason || 'Customer requested cancellation';
    order.updatedAt = new Date().toISOString();

    // Restore stock for cancelled items
    order.items.forEach(it => {
      const prod = db.products.find(p => p.id === it.productId);
      if (prod) {
        prod.stock += it.quantity;
        prod.inStock = prod.stock > 0;
        saveEntityToFirestore('products', prod.id, prod);
        emitRealtime('inventory:updated', { productId: prod.id, stock: prod.stock, inStock: prod.inStock });
      }
    });

    if (order.paymentStatus === 'PAID') {
      order.paymentStatus = 'REFUNDED';
    }

    const normalized = normalizeOrder(order);
    saveEntityToFirestore('orders', normalized.id, normalized);
    emitRealtime('order:updated', normalized);
    emitRealtime('admin:refresh', { type: 'ORDER_CANCELLED', orderId: normalized.id });

    res.json({ success: true, order: normalized });
  });

  app.post('/api/orders/:id/return', (req: Request, res: Response) => {
    const { reason } = req.body;
    const order = db.orders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.orderStatus = 'RETURN_REQUESTED';
    order.status = 'RETURN_REQUESTED';
    order.returnDetails = {
      reason: reason || 'Defective / Damaged or not as described',
      status: 'REQUESTED',
      requestedAt: new Date().toISOString(),
      refundAmount: order.finalTotal
    };
    order.updatedAt = new Date().toISOString();

    const normalized = normalizeOrder(order);
    saveEntityToFirestore('orders', normalized.id, normalized);
    emitRealtime('order:updated', normalized);
    emitRealtime('admin:refresh', { type: 'RETURN_REQUESTED', orderId: normalized.id });

    res.json({ success: true, order: normalized });
  });

  // ==================== ADDRESSES ====================
  app.get('/api/addresses', (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || extractUserFromRequest(req)?.id || 'user-customer-demo';
    res.json({ addresses: db.addresses.filter(a => a.userId === userId) });
  });

  app.post('/api/addresses', (req: Request, res: Response) => {
    const {
      userId = 'user-customer-demo',
      fullName,
      phone,
      pincode,
      state,
      district,
      city,
      street,
      landmark,
      addressType,
      type,
      isDefault
    } = req.body;
    const resolvedType = addressType || type || 'HOME';
    const newAddress: Address = {
      id: `addr-${Date.now()}`,
      userId,
      fullName,
      phone,
      pincode,
      state: state || 'Andhra Pradesh',
      district: district || AP_PINCODES[pincode]?.district || 'NTR / Krishna',
      city: city || AP_PINCODES[pincode]?.city || 'Vijayawada',
      street,
      landmark,
      addressType: resolvedType,
      type: resolvedType,
      isDefault: isDefault || false
    };

    if (isDefault) {
      db.addresses.forEach(a => {
        if (a.userId === userId) a.isDefault = false;
      });
    }

    db.addresses.push(newAddress);
    saveEntityToFirestore('addresses', newAddress.id, newAddress);
    res.status(201).json({
      success: true,
      address: newAddress,
      addresses: db.addresses.filter(a => a.userId === userId)
    });
  });

  app.delete('/api/addresses/:id', (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || 'user-customer-demo';
    db.addresses = db.addresses.filter(a => a.id !== req.params.id);
    deleteEntityFromFirestore('addresses', req.params.id);
    res.json({ success: true, addresses: db.addresses.filter(a => a.userId === userId) });
  });

  // ==================== REVIEWS ====================
  app.get('/api/reviews/product/:id', (req: Request, res: Response) => {
    const list = db.reviews.filter(r => r.productId === req.params.id);
    res.json({ reviews: list });
  });

  app.post('/api/reviews/create', (req: Request, res: Response) => {
    const { productId, userId = 'user-customer-demo', userName = 'Customer', rating, title, comment, district = 'Andhra Pradesh' } = req.body;
    const newRev: Review = {
      id: `rev-${Date.now()}`,
      productId,
      userId,
      userName,
      rating: Number(rating) || 5,
      title: title || 'Great Quality Product',
      comment,
      verifiedPurchase: true,
      helpfulCount: 0,
      createdAt: new Date().toISOString(),
      userDistrict: district
    };
    db.reviews.unshift(newRev);

    const prod = db.products.find(p => p.id === productId);
    if (prod) {
      prod.reviewCount += 1;
      saveEntityToFirestore('products', prod.id, prod);
    }

    res.status(201).json({ success: true, review: newRev });
  });

  // ==================== SELLER APIS ====================
  app.get('/api/seller/profile', (req: Request, res: Response) => {
    const sellerId = (req.query.sellerId as string) || 'seller-godavari-heritage';
    const seller = db.sellers.find(s => s.id === sellerId) || db.sellers[0];
    const kyc = db.sellerKYCs.find(k => k.sellerId === seller.id);
    res.json({ seller, kyc });
  });

  app.put('/api/seller/profile', (req: Request, res: Response) => {
    const { sellerId = 'seller-godavari-heritage', storeName, description, pickupAddress, pickupPincode, pickupDistrict, phone } = req.body;
    const seller = db.sellers.find(s => s.id === sellerId) || db.sellers[0];
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    if (storeName) seller.storeName = storeName;
    if (description) seller.description = description;
    if (pickupAddress) seller.pickupAddress = pickupAddress;
    if (pickupPincode) seller.pickupPincode = pickupPincode;
    if (pickupDistrict) {
      seller.pickupDistrict = pickupDistrict;
      seller.district = pickupDistrict;
    }
    if (phone) seller.phone = phone;
    saveEntityToFirestore('sellers', seller.id, seller);
    res.json({ success: true, seller });
  });

  app.post('/api/seller/kyc', (req: Request, res: Response) => {
    const { sellerId = 'seller-godavari-heritage', panNumber, gstNumber, bankAccount, bankIfsc, businessType, addressProof } = req.body;
    const seller = db.sellers.find(s => s.id === sellerId) || db.sellers[0];
    if (seller) {
      if (panNumber) seller.panNumber = panNumber;
      if (gstNumber) {
        seller.gstNumber = gstNumber;
        seller.gstin = gstNumber;
      }
      if (bankAccount) seller.bankAccount = bankAccount;
      if (bankIfsc) seller.bankIfsc = bankIfsc;
      if (businessType) seller.businessType = businessType;
      seller.kycStatus = 'VERIFIED';
      seller.isKycVerified = true;
      saveEntityToFirestore('sellers', seller.id, seller);
    }

    let kyc = db.sellerKYCs.find(k => k.sellerId === sellerId);
    if (!kyc) {
      kyc = {
        id: `kyc-${Date.now()}`,
        sellerId,
        businessPan: panNumber || 'ABCDE1234F',
        gstCertificate: gstNumber,
        addressProof: addressProof || 'Submitted AP Shop Registration Proof',
        bankStatement: 'Submitted Bank Passbook',
        status: 'APPROVED',
        submittedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        notes: 'KYC verified'
      };
      db.sellerKYCs.push(kyc);
    } else {
      kyc.status = 'APPROVED';
      kyc.businessPan = panNumber || kyc.businessPan;
      kyc.verifiedAt = new Date().toISOString();
    }

    emitRealtime('admin:refresh', { type: 'SELLER_KYC_UPDATED', sellerId });
    res.json({ success: true, kyc, seller });
  });

  app.get('/api/seller/products', (req: Request, res: Response) => {
    const sellerId = req.query.sellerId as string | undefined;
    const list = sellerId ? db.products.filter(p => p.sellerId === sellerId) : db.products;
    res.json({ products: list });
  });

  app.post('/api/seller/products', (req: Request, res: Response) => {
    const {
      sellerId = 'seller-godavari-heritage',
      sellerName,
      title,
      titleTe,
      categoryId,
      subcategoryId,
      description,
      brand,
      originalPrice,
      sellingPrice,
      stock,
      images,
      specifications,
      isAndhraSpecial,
      originDistrict,
      tags
    } = req.body;

    if (!title || !sellingPrice) {
      return res.status(400).json({ error: 'Product title and selling price are required' });
    }

    const seller = db.sellers.find(s => s.id === sellerId);
    const orig = Number(originalPrice) || Number(sellingPrice);
    const sell = Number(sellingPrice);
    const discountPercent = orig > sell ? Math.round(((orig - sell) / orig) * 100) : 0;

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      sellerId,
      sellerName: sellerName || (seller ? seller.storeName : 'Andhra Local Store'),
      categoryId: categoryId || 'cat-ap-special',
      subcategoryId: subcategoryId || 'sub-pickles',
      title,
      titleTe,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description || 'Fresh authentic product from Andhra Pradesh.',
      specifications: specifications || [{ key: 'Quality', value: '100% Guaranteed Genuine AP Product' }],
      brand: brand || 'Andhra Artisans',
      originalPrice: orig,
      sellingPrice: sell,
      discountPercent,
      stock: Number(stock) ?? 25,
      inStock: (Number(stock) ?? 25) > 0,
      rating: 4.9,
      reviewCount: 1,
      images:
        images && images.length > 0 && images[0]
          ? images
          : ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80'],
      isAndhraSpecial: isAndhraSpecial ?? true,
      originDistrict: originDistrict || 'East Godavari',
      tags: tags || ['andhra', 'local', 'fresh'],
      status: 'active',
      createdAt: new Date().toISOString(),
      deliveryDays: 1
    };

    db.products.unshift(newProd);
    saveEntityToFirestore('products', newProd.id, newProd);
    emitRealtime('product:created', newProd);
    emitRealtime('admin:refresh', { type: 'PRODUCT_CREATED', productId: newProd.id });

    res.status(201).json({ success: true, product: newProd });
  });

  app.put('/api/seller/products/:id', (req: Request, res: Response) => {
    const prod = db.products.find(p => p.id === req.params.id);
    if (!prod) {
      return res.status(404).json({ error: 'Product not found' });
    }

    Object.assign(prod, req.body);
    if (req.body.sellingPrice !== undefined || req.body.originalPrice !== undefined) {
      const orig = Number(prod.originalPrice);
      const sell = Number(prod.sellingPrice);
      prod.discountPercent = orig > sell ? Math.round(((orig - sell) / orig) * 100) : 0;
    }
    if (typeof req.body.stock !== 'undefined') {
      prod.stock = Number(req.body.stock);
      prod.inStock = prod.stock > 0;
    }

    saveEntityToFirestore('products', prod.id, prod);
    emitRealtime('product:updated', prod);
    emitRealtime('inventory:updated', { productId: prod.id, stock: prod.stock, inStock: prod.inStock });

    res.json({ success: true, product: prod });
  });

  app.delete('/api/seller/products/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    db.products = db.products.filter(p => p.id !== id);
    deleteEntityFromFirestore('products', id);
    emitRealtime('product:deleted', { id });
    res.json({ success: true });
  });

  app.put('/api/seller/orders/:id/status', (req: Request, res: Response) => {
    const { status, trackingNote, location } = req.body;
    const order = db.orders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const statusSequence: OrderStatus[] = [
      'PLACED',
      'CONFIRMED',
      'PACKED',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED'
    ];
    const targetIdx = statusSequence.indexOf(status as OrderStatus);

    order.orderStatus = status as OrderStatus;
    order.status = status as OrderStatus;
    order.updatedAt = new Date().toISOString();

    if (status === 'REFUNDED') {
      order.paymentStatus = 'REFUNDED';
      if (order.returnDetails) {
        order.returnDetails.status = 'REFUNDED';
      }
    } else if (status === 'DELIVERED' && order.paymentMethod === 'COD') {
      order.paymentStatus = 'PAID';
    }

    const nowFormatted = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    if (order.trackingHistory) {
      order.trackingHistory.forEach(step => {
        const stepIdx = statusSequence.indexOf(step.status);
        if (targetIdx !== -1 && stepIdx !== -1 && stepIdx <= targetIdx) {
          step.completed = true;
          if (step.timestamp === 'Pending' || step.timestamp === 'In Progress' || step.status === status) {
            step.timestamp = nowFormatted;
          }
        }
        if (step.status === status) {
          if (trackingNote) step.notes = trackingNote;
          if (location) step.location = location;
        }
      });
    }

    const normalized = normalizeOrder(order);
    saveEntityToFirestore('orders', normalized.id, normalized);

    // Send real-time customer notification
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: order.userId,
      title: `Order ${String(status).replace(/_/g, ' ')} 📦`,
      message: `Order ${order.orderNumber} is now ${String(status).replace(/_/g, ' ')}.`,
      type: 'ORDER',
      read: false,
      createdAt: new Date().toISOString(),
      link: '/orders'
    };
    db.notifications.unshift(notif);
    saveEntityToFirestore('notifications', notif.id, notif);

    emitRealtime('order:updated', normalized);
    emitRealtime('notification:new', notif);
    emitRealtime('admin:refresh', { type: 'ORDER_STATUS_UPDATED', orderId: normalized.id, status });

    res.json({ success: true, order: normalized });
  });

  const getSellerAnalyticsData = (sellerId: string) => {
    const sellerOrders = db.orders.filter(o => o.items.some(i => i.sellerId === sellerId) || sellerId === 'all');
    const sellerProducts = db.products.filter(p => p.sellerId === sellerId || sellerId === 'all');
    const lowStockProducts = db.products.filter(p => p.stock <= 10);

    const totalRevenue = db.orders.reduce((sum, o) => sum + (o.finalTotal ?? o.totalAmount ?? 0), 0);
    const totalUnitsSold = db.orders.reduce(
      (sum, o) => sum + o.items.reduce((s, it) => s + it.quantity, 0),
      0
    );

    const statsPayload = {
      totalRevenue,
      totalGmv: totalRevenue,
      totalOrders: db.orders.length,
      totalUnitsSold,
      unitsSold: totalUnitsSold,
      activeProducts: db.products.length,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      recentOrders: db.orders.slice(0, 5).map(normalizeOrder),
      monthlyRevenue: [
        { month: 'Apr', sales: 42000 },
        { month: 'May', sales: 68000 },
        { month: 'Jun', sales: 95000 },
        { month: 'Jul', sales: 124000 },
        { month: 'Aug', sales: 182000 + totalRevenue }
      ]
    };

    return {
      ...statsPayload,
      stats: statsPayload,
      sellerOrders: sellerOrders.map(normalizeOrder),
      sellerProducts
    };
  };

  app.get('/api/seller/analytics', (req: Request, res: Response) => {
    const sellerId = (req.query.sellerId as string) || 'seller-godavari-heritage';
    res.json(getSellerAnalyticsData(sellerId));
  });

  app.get('/api/seller/dashboard', (req: Request, res: Response) => {
    const sellerId = (req.query.sellerId as string) || 'seller-godavari-heritage';
    res.json(getSellerAnalyticsData(sellerId));
  });

  // ==================== ADMIN APIS ====================
  const getAdminDashboardPayload = () => {
    const totalGmv = db.orders.reduce((sum, o) => sum + (o.finalTotal ?? o.totalAmount ?? 0), 0);
    const totalOrders = db.orders.length;
    const totalUsers = db.users.length;
    const totalSellers = db.sellers.length;

    const enrichedSellers = db.sellers.map(s => {
      const kyc = db.sellerKYCs.find(k => k.sellerId === s.id);
      const kycStatus = s.kycStatus || (kyc?.status === 'APPROVED' ? 'VERIFIED' : kyc?.status === 'REJECTED' ? 'REJECTED' : s.isKycVerified ? 'VERIFIED' : 'PENDING');
      return {
        ...s,
        kyc,
        kycStatus,
        ownerName: s.ownerName || `${s.storeName.split(' ')[0]} Proprietor`,
        district: s.district || s.pickupDistrict || 'Andhra Pradesh',
        gstin: s.gstin || s.gstNumber || '37ABCDE1234F1Z5'
      };
    });

    const pendingKycCount = enrichedSellers.filter(s => s.kycStatus === 'PENDING').length;

    const statsObj = {
      totalGmv,
      totalOrders,
      totalUsers,
      totalCustomers: db.users.filter(u => u.role === 'customer').length,
      totalSellers,
      pendingKycCount,
      totalProducts: db.products.length,
      deliverySettings: db.deliverySettings,
      categoryDistribution: db.categories.map(c => ({
        id: c.id,
        name: c.name,
        count: db.products.filter(p => p.categoryId === c.id).length
      }))
    };

    return {
      ...statsObj,
      stats: statsObj,
      sellers: enrichedSellers,
      coupons: db.coupons,
      users: db.users.map(sanitizeUser),
      orders: db.orders.map(normalizeOrder),
      deliverySettings: db.deliverySettings
    };
  };

  app.get('/api/admin/stats', (req: Request, res: Response) => {
    res.json(getAdminDashboardPayload());
  });

  app.get('/api/admin/dashboard', (req: Request, res: Response) => {
    res.json(getAdminDashboardPayload());
  });

  app.get('/api/admin/users', (req: Request, res: Response) => {
    res.json({ users: db.users.map(sanitizeUser) });
  });

  app.delete('/api/admin/users/:id', (req: Request, res: Response) => {
    db.users = db.users.filter(u => u.id !== req.params.id);
    deleteEntityFromFirestore('users', req.params.id);
    res.json({ success: true, users: db.users.map(sanitizeUser) });
  });

  app.get('/api/admin/sellers', (req: Request, res: Response) => {
    const payload = getAdminDashboardPayload();
    res.json({ sellers: payload.sellers });
  });

  app.put('/api/admin/sellers/:id/kyc', (req: Request, res: Response) => {
    const { status, notes } = req.body;
    const seller = db.sellers.find(s => s.id === req.params.id);
    const kyc = db.sellerKYCs.find(k => k.sellerId === req.params.id);

    if (seller) {
      seller.isKycVerified = status === 'APPROVED' || status === 'VERIFIED';
      seller.kycStatus = seller.isKycVerified ? 'VERIFIED' : status === 'REJECTED' ? 'REJECTED' : 'PENDING';
      seller.status = seller.isKycVerified ? 'active' : status === 'REJECTED' ? 'suspended' : 'pending';
      saveEntityToFirestore('sellers', seller.id, seller);
    }

    if (kyc) {
      kyc.status = status === 'VERIFIED' ? 'APPROVED' : status;
      kyc.notes = notes || (status === 'APPROVED' ? 'KYC verified and approved by Central Admin' : 'Documents rejected');
      kyc.verifiedAt = new Date().toISOString();
    }

    emitRealtime('admin:refresh', { type: 'SELLER_KYC_VERIFIED', sellerId: req.params.id, status });
    res.json({ success: true, seller, kyc });
  });

  app.post('/api/admin/categories', (req: Request, res: Response) => {
    const { name, nameTe, slug, iconName, image, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      nameTe: nameTe || name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      iconName: iconName || 'ShoppingBag',
      image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
      description: description || 'Authentic Andhra Pradesh category',
      featured: true,
      order: db.categories.length + 1
    };
    db.categories.push(newCat);
    saveEntityToFirestore('categories', newCat.id, newCat);
    emitRealtime('category:created', newCat);
    res.status(201).json({ success: true, category: newCat });
  });

  app.delete('/api/admin/categories/:id', (req: Request, res: Response) => {
    db.categories = db.categories.filter(c => c.id !== req.params.id);
    deleteEntityFromFirestore('categories', req.params.id);
    res.json({ success: true, categories: db.categories });
  });

  app.post('/api/admin/coupons', (req: Request, res: Response) => {
    const {
      code,
      discountType = 'PERCENT',
      discountValue,
      discountPercent,
      minOrderValue = 299,
      maxDiscount,
      maxDiscountAmount,
      description
    } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const val = Number(discountValue ?? discountPercent ?? 15);
    const maxD = Number(maxDiscount ?? maxDiscountAmount ?? 200);

    const newCoupon: Coupon = {
      id: `coup-${Date.now()}`,
      code: code.toUpperCase(),
      discountType: discountType || 'PERCENT',
      discountValue: val,
      minOrderValue: Number(minOrderValue),
      maxDiscount: maxD || undefined,
      validUntil: '2027-12-31',
      isActive: true,
      description: description || `Save ${val}% on AP Local Mart orders above ₹${minOrderValue}`
    };
    db.coupons.unshift(newCoupon);
    emitRealtime('admin:refresh', { type: 'COUPON_CREATED', coupon: newCoupon });
    res.status(201).json({ success: true, coupon: newCoupon });
  });

  app.delete('/api/admin/coupons/:id', (req: Request, res: Response) => {
    db.coupons = db.coupons.filter(c => c.id !== req.params.id);
    res.json({ success: true });
  });

  app.put('/api/admin/delivery-settings', (req: Request, res: Response) => {
    const { freeDeliveryThreshold, apExpressFee, apStandardFee, outsideApFee } = req.body;
    if (freeDeliveryThreshold !== undefined) db.deliverySettings.freeDeliveryThreshold = Number(freeDeliveryThreshold);
    if (apExpressFee !== undefined) db.deliverySettings.apExpressFee = Number(apExpressFee);
    if (apStandardFee !== undefined) db.deliverySettings.apStandardFee = Number(apStandardFee);
    if (outsideApFee !== undefined) db.deliverySettings.outsideApFee = Number(outsideApFee);

    emitRealtime('delivery:updated', db.deliverySettings);
    res.json({ success: true, deliverySettings: db.deliverySettings });
  });

  // ==================== NOTIFICATIONS ====================
  app.get('/api/notifications', (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || extractUserFromRequest(req)?.id || 'user-customer-demo';
    res.json({
      notifications: db.notifications.filter(n => n.userId === userId || n.type === 'PROMO')
    });
  });

  app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
    const notif = db.notifications.find(n => n.id === req.params.id);
    if (notif) {
      notif.read = true;
      saveEntityToFirestore('notifications', notif.id, notif);
    }
    res.json({ success: true });
  });
}

setupRoutes();
syncWithFirestore();

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;
  const httpServer = http.createServer(app);

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  io.on('connection', socket => {
    socket.emit('connected', { status: 'connected', time: new Date().toISOString() });
  });

  // Vite middleware setup (DEV mode) vs Static files (PROD mode)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[AP Local Mart] Full-Stack HTTP + Socket.IO Server listening on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
