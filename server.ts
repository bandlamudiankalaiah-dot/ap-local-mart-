import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
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

// In-Memory Database Store
class AndhraMartDB {
  users: User[] = [...INITIAL_USERS];
  sellers: Seller[] = [...INITIAL_SELLERS];
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
      isDefault: false
    }
  ];
  otps: Record<string, { code: string; expiresAt: number }> = {};
}

const db = new AndhraMartDB();
export const app = express();
app.use(express.json());

function setupRoutes() {
  // API ROUTE LOGGING & CORS
  app.use((req, res, next) => {
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
    res.json({ status: 'ok', app: 'AndhraMart API Server', time: new Date().toISOString() });
  });

  // ==================== AUTH APIS ====================
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email, phone, role, password } = req.body;
    if (!name || (!email && !phone)) {
      return res.status(400).json({ error: 'Name and Email or Phone are required' });
    }

    const existing = db.users.find(u => (email && u.email.toLowerCase() === email.toLowerCase()) || (phone && u.phone === phone));
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
        storeName: req.body.storeName || `${name}'s Andhra Store`,
        storeSlug: (req.body.storeName || `${name}-store`).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: req.body.description || 'Verified seller offering authentic Andhra items & essentials.',
        logo: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=200&auto=format&fit=crop&q=80',
        rating: 5.0,
        totalSales: 0,
        totalOrders: 0,
        isKycVerified: false,
        businessType: req.body.businessType || 'INDIVIDUAL',
        panNumber: req.body.panNumber || 'APABC1234F',
        gstNumber: req.body.gstNumber || '',
        bankAccount: req.body.bankAccount || '987654321012',
        bankIfsc: req.body.bankIfsc || 'SBIN0001000',
        pickupPincode: req.body.pickupPincode || '520001',
        pickupDistrict: req.body.pickupDistrict || 'NTR / Krishna',
        pickupAddress: req.body.pickupAddress || 'Vijayawada, Andhra Pradesh',
        phone: phone || '+91 98480 00000',
        email: email || 'seller@andhramart.in',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      db.sellers.push(newSeller);

      db.sellerKYCs.push({
        id: `kyc-${Date.now()}`,
        sellerId,
        businessPan: newSeller.panNumber,
        addressProof: 'Business Registration Document',
        bankStatement: 'Bank Account Passbook / Cancelled Cheque',
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
        notes: 'KYC under admin verification.'
      });
    }

    const newUser: User = {
      id: userId,
      name,
      email: email || `${phone.replace(/\D/g, '')}@andhramart.in`,
      phone: phone || '+91 98480 00000',
      role: (role as any) || 'customer',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      isVerified: true,
      sellerId,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    res.json({ user: newUser, token: `am_token_${newUser.id}` });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { identifier, password, role } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Email or Mobile Number is required' });
    }

    let user = db.users.find(
      u => u.email.toLowerCase() === identifier.toLowerCase() || u.phone === identifier || u.phone.includes(identifier)
    );

    if (!user) {
      // Demo ease: if testing role demo logins
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

    res.json({ user, token: `am_token_${user.id}` });
  });

  app.post('/api/auth/otp-send', (req: Request, res: Response) => {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const code = '520001'; // Easy to use default OTP matching Vijayawada AP pincode, or 6-digit random
    db.otps[cleanPhone] = {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000
    };
    res.json({
      success: true,
      message: `OTP sent successfully to ${phone}. (For immediate testing use OTP: ${code})`,
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

    let user = db.users.find(u => u.phone.replace(/\D/g, '') === cleanPhone);
    if (!user) {
      user = {
        id: `user-${Date.now()}`,
        name: name || `Andhra Customer ${cleanPhone.slice(-4)}`,
        email: `${cleanPhone}@andhramart.in`,
        phone: `+91 ${cleanPhone}`,
        role: 'customer',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${cleanPhone}`,
        isVerified: true,
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
    }

    res.json({ user, token: `am_token_${user.id}` });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.json({ user: db.users[0] }); // fallback default customer for easy demo
    }
    const userId = authHeader.replace('Bearer ', '').replace('am_token_', '');
    const user = db.users.find(u => u.id === userId) || db.users[0];
    res.json({ user });
  });

  // ==================== PRODUCTS & CATEGORIES ====================
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

    if (sortBy === 'price_low') {
      list.sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (sortBy === 'price_high') {
      list.sort((a, b) => b.sellingPrice - a.sellingPrice);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // Popularity default
      list.sort((a, b) => (b.reviewCount * b.rating) - (a.reviewCount * a.rating));
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
    const related = db.products.filter(p => p.id !== product.id && (p.categoryId === product.categoryId || p.sellerId === product.sellerId)).slice(0, 4);
    res.json({ product, seller, related });
  });

  app.get('/api/search/suggestions', (req: Request, res: Response) => {
    const q = ((req.query.q as string) || '').toLowerCase().trim();
    if (!q) {
      return res.json({ suggestions: [], products: [] });
    }
    const matchedProducts = db.products
      .filter(p => p.title.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q)))
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
    res.json({ categories: db.categories, subcategories: db.subcategories });
  });

  app.get('/api/banners', (req: Request, res: Response) => {
    res.json({ banners: db.banners.filter(b => b.active) });
  });

  // ==================== PINCODE CHECKER ====================
  app.get('/api/pincode/:pincode', (req: Request, res: Response) => {
    const pin = req.params.pincode;
    const info = AP_PINCODES[pin];
    if (info) {
      return res.json(info);
    }

    // Dynamic heuristic for any valid 6-digit Indian PIN
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
        expressAvailable: isAP
      });
    }

    res.status(400).json({ error: 'Please enter a valid 6-digit PIN code' });
  });

  // ==================== CART APIS ====================
  app.get('/api/cart', (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || 'user-customer-demo';
    const items = db.cartItems[userId] || [];
    let subtotal = 0;
    let totalDiscount = 0;

    items.forEach(item => {
      subtotal += item.product.sellingPrice * item.quantity;
      totalDiscount += (item.product.originalPrice - item.product.sellingPrice) * item.quantity;
    });

    const deliveryCharge = subtotal > 499 || items.length === 0 ? 0 : 49;
    const finalTotal = subtotal + deliveryCharge;

    res.json({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      totalDiscount,
      deliveryCharge,
      finalTotal,
      freeDeliveryThreshold: 499,
      freeDeliveryRemaining: Math.max(0, 499 - subtotal)
    });
  });

  app.post('/api/cart/add', (req: Request, res: Response) => {
    const { userId = 'user-customer-demo', productId, quantity = 1, selectedVariant } = req.body;
    const product = db.products.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!db.cartItems[userId]) {
      db.cartItems[userId] = [];
    }

    const existingIndex = db.cartItems[userId].findIndex(item => item.productId === productId);
    if (existingIndex > -1) {
      db.cartItems[userId][existingIndex].quantity += quantity;
    } else {
      db.cartItems[userId].push({
        id: `cart-${Date.now()}`,
        productId,
        product,
        quantity,
        selectedVariant,
        addedAt: new Date().toISOString()
      });
    }

    res.json({ success: true, cart: db.cartItems[userId] });
  });

  app.put('/api/cart/item/:id', (req: Request, res: Response) => {
    const { userId = 'user-customer-demo', quantity } = req.body;
    const items = db.cartItems[userId] || [];
    const item = items.find(i => i.id === req.params.id);
    if (item) {
      if (quantity <= 0) {
        db.cartItems[userId] = items.filter(i => i.id !== req.params.id);
      } else {
        item.quantity = quantity;
      }
    }
    res.json({ success: true, cart: db.cartItems[userId] });
  });

  app.delete('/api/cart/item/:id', (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || 'user-customer-demo';
    if (db.cartItems[userId]) {
      db.cartItems[userId] = db.cartItems[userId].filter(i => i.id !== req.params.id);
    }
    res.json({ success: true, cart: db.cartItems[userId] || [] });
  });

  app.delete('/api/cart/clear', (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || 'user-customer-demo';
    db.cartItems[userId] = [];
    res.json({ success: true });
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

  // Helper to ensure order has all normalized properties for frontend compatibility
  const normalizeOrder = (order: Order): Order => {
    const status = order.orderStatus || order.status || 'PLACED';
    const finalTotal = order.finalTotal ?? order.totalAmount ?? 0;
    const deliveryCharge = order.deliveryCharge ?? order.deliveryFee ?? 0;
    const customerName = order.userName || order.customerName || order.shippingAddress?.fullName || 'Customer';
    const customerPhone = order.userPhone || order.customerPhone || order.shippingAddress?.phone || '';
    const courier = order.courierPartner || order.tracking?.carrier || 'Andhra Express Logistics (AP SpeedHub)';
    const awb = order.trackingNumber || order.tracking?.awbNumber || `AMEXP-AP-${order.id}`;
    const latestLocation = (order.trackingHistory && order.trackingHistory.length > 0)
      ? order.trackingHistory[order.trackingHistory.length - 1].location
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
        carrier: courier,
        currentHub: latestLocation,
        estimatedDeliveryDate: order.estimatedDelivery || 'Within 2-3 Business Days'
      },
      estimatedDelivery: order.estimatedDelivery || 'Within 2-3 Business Days'
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

  app.get('/api/orders/:id', (req: Request, res: Response) => {
    const order = db.orders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ order: normalizeOrder(order) });
  });

  app.post('/api/orders/create', (req: Request, res: Response) => {
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

    let subtotal = 0;
    const orderItems = items.map((item: any) => {
      const prod = db.products.find(p => p.id === item.productId) || item.product;
      const price = prod ? prod.sellingPrice : item.price;
      subtotal += price * item.quantity;
      return {
        productId: item.productId,
        productTitle: prod ? prod.title : item.productTitle,
        productImage: prod && prod.images[0] ? prod.images[0] : item.productImage,
        price,
        quantity: item.quantity,
        sellerId: prod ? prod.sellerId : 'seller-godavari-heritage',
        sellerName: prod ? prod.sellerName : 'Godavari Ruchulu'
      };
    });

    const deliveryCharge = subtotal > 499 ? 0 : 49;
    const finalTotal = Math.max(0, subtotal - discount + deliveryCharge);
    const orderNumber = `AM-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const trackingNumber = `AMEXP-${(shippingAddress.city || 'AP').slice(0, 4).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const user = db.users.find(u => u.id === userId) || db.users[0];

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      userId,
      userName: user.name,
      userPhone: user.phone,
      shippingAddress,
      items: orderItems,
      subtotal,
      discount,
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
          location: `${shippingAddress.city}, AP Hub`,
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          completed: true,
          notes: paymentMethod === 'COD' ? 'Cash on Delivery selected' : 'Payment verified online'
        },
        {
          status: 'CONFIRMED',
          title: 'Seller Preparing Order',
          location: 'Andhra Seller Warehouse',
          timestamp: 'In Progress',
          completed: false
        },
        {
          status: 'PACKED',
          title: 'Packaging & Quality Inspection',
          location: 'Dispatch Hub',
          timestamp: 'Pending',
          completed: false
        },
        {
          status: 'SHIPPED',
          title: 'Dispatched via Andhra Express',
          location: 'Transit Line',
          timestamp: 'Pending',
          completed: false
        },
        {
          status: 'OUT_FOR_DELIVERY',
          title: 'Out for Delivery to Your Doorstep',
          location: `${shippingAddress.pincode} Delivery Center`,
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
      estimatedDelivery: 'Within 1-2 Business Days',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.orders.unshift(newOrder);

    // Clear cart for this user
    db.cartItems[userId] = [];

    // Push notification
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId,
      title: 'Order Confirmed! 🎉',
      message: `Your AndhraMart order ${orderNumber} for ₹${finalTotal} has been placed successfully.`,
      type: 'ORDER',
      read: false,
      createdAt: new Date().toISOString(),
      link: '/orders'
    });

    res.json({ success: true, order: normalizeOrder(newOrder) });
  });

  app.post('/api/orders/:id/cancel', (req: Request, res: Response) => {
    const { reason } = req.body;
    const order = db.orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (['DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.orderStatus)) {
      return res.status(400).json({ error: `Cannot cancel an order with status ${order.orderStatus}` });
    }

    order.orderStatus = 'CANCELLED';
    order.cancellationReason = reason || 'Customer requested cancellation';
    order.updatedAt = new Date().toISOString();

    if (order.paymentStatus === 'PAID') {
      order.paymentStatus = 'REFUNDED';
    }

    res.json({ success: true, order: normalizeOrder(order) });
  });

  app.post('/api/orders/:id/return', (req: Request, res: Response) => {
    const { reason, notes } = req.body;
    const order = db.orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.orderStatus = 'RETURN_REQUESTED';
    order.returnDetails = {
      reason: reason || 'Defective / Damaged or not as described',
      status: 'REQUESTED',
      requestedAt: new Date().toISOString(),
      refundAmount: order.finalTotal
    };
    order.updatedAt = new Date().toISOString();

    res.json({ success: true, order: normalizeOrder(order) });
  });

  // ==================== ADDRESSES ====================
  app.get('/api/addresses', (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || 'user-customer-demo';
    res.json({ addresses: db.addresses.filter(a => a.userId === userId) });
  });

  app.post('/api/addresses', (req: Request, res: Response) => {
    const { userId = 'user-customer-demo', fullName, phone, pincode, state, district, city, street, landmark, addressType, isDefault } = req.body;
    const newAddress: Address = {
      id: `addr-${Date.now()}`,
      userId,
      fullName,
      phone,
      pincode,
      state: state || 'Andhra Pradesh',
      district: district || 'NTR / Krishna',
      city,
      street,
      landmark,
      addressType: addressType || 'HOME',
      isDefault: isDefault || false
    };

    if (isDefault) {
      db.addresses.forEach(a => {
        if (a.userId === userId) a.isDefault = false;
      });
    }

    db.addresses.push(newAddress);
    res.json({ success: true, address: newAddress, addresses: db.addresses.filter(a => a.userId === userId) });
  });

  app.delete('/api/addresses/:id', (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || 'user-customer-demo';
    db.addresses = db.addresses.filter(a => a.id !== req.params.id);
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

    // Update product rating count
    const prod = db.products.find(p => p.id === productId);
    if (prod) {
      prod.reviewCount += 1;
    }

    res.json({ success: true, review: newRev });
  });

  // ==================== SELLER APIS ====================
  app.get('/api/seller/profile', (req: Request, res: Response) => {
    const sellerId = (req.query.sellerId as string) || 'seller-godavari-heritage';
    const seller = db.sellers.find(s => s.id === sellerId);
    const kyc = db.sellerKYCs.find(k => k.sellerId === sellerId);
    res.json({ seller, kyc });
  });

  app.post('/api/seller/kyc', (req: Request, res: Response) => {
    const { sellerId, panNumber, gstNumber, businessType, addressProof } = req.body;
    const seller = db.sellers.find(s => s.id === sellerId);
    if (seller) {
      seller.panNumber = panNumber;
      if (gstNumber) seller.gstNumber = gstNumber;
      if (businessType) seller.businessType = businessType;
    }

    let kyc = db.sellerKYCs.find(k => k.sellerId === sellerId);
    if (!kyc) {
      kyc = {
        id: `kyc-${Date.now()}`,
        sellerId,
        businessPan: panNumber,
        addressProof: addressProof || 'Submitted address proof document',
        bankStatement: 'Submitted bank statement',
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
        notes: 'KYC application received'
      };
      db.sellerKYCs.push(kyc);
    } else {
      kyc.status = 'PENDING';
      kyc.submittedAt = new Date().toISOString();
      kyc.businessPan = panNumber;
    }

    res.json({ success: true, kyc });
  });

  app.get('/api/seller/products', (req: Request, res: Response) => {
    const sellerId = (req.query.sellerId as string) || 'seller-godavari-heritage';
    const list = db.products.filter(p => p.sellerId === sellerId);
    res.json({ products: list });
  });

  app.post('/api/seller/products', (req: Request, res: Response) => {
    const {
      sellerId = 'seller-godavari-heritage',
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

    const seller = db.sellers.find(s => s.id === sellerId);
    const orig = Number(originalPrice) || Number(sellingPrice);
    const sell = Number(sellingPrice);
    const discountPercent = orig > sell ? Math.round(((orig - sell) / orig) * 100) : 0;

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      sellerId,
      sellerName: seller ? seller.storeName : 'Andhra Vendor',
      categoryId: categoryId || 'cat-ap-special',
      subcategoryId: subcategoryId || 'sub-pickles',
      title,
      titleTe,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description,
      specifications: specifications || [{ key: 'Quality', value: '100% Guaranteed Genuine' }],
      brand: brand || 'Andhra Artisans',
      originalPrice: orig,
      sellingPrice: sell,
      discountPercent,
      stock: Number(stock) || 20,
      inStock: (Number(stock) || 20) > 0,
      rating: 5.0,
      reviewCount: 0,
      images: images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80'],
      isAndhraSpecial: isAndhraSpecial ?? true,
      originDistrict: originDistrict || 'East Godavari',
      tags: tags || ['andhra', 'handcrafted'],
      status: 'active',
      createdAt: new Date().toISOString(),
      deliveryDays: 2
    };

    db.products.unshift(newProd);
    res.json({ success: true, product: newProd });
  });

  app.put('/api/seller/products/:id', (req: Request, res: Response) => {
    const prod = db.products.find(p => p.id === req.params.id);
    if (!prod) {
      return res.status(404).json({ error: 'Product not found' });
    }

    Object.assign(prod, req.body);
    if (req.body.sellingPrice || req.body.originalPrice) {
      const orig = Number(prod.originalPrice);
      const sell = Number(prod.sellingPrice);
      prod.discountPercent = orig > sell ? Math.round(((orig - sell) / orig) * 100) : 0;
    }
    if (typeof req.body.stock !== 'undefined') {
      prod.stock = Number(req.body.stock);
      prod.inStock = prod.stock > 0;
    }

    res.json({ success: true, product: prod });
  });

  app.delete('/api/seller/products/:id', (req: Request, res: Response) => {
    db.products = db.products.filter(p => p.id !== req.params.id);
    res.json({ success: true });
  });

  app.put('/api/seller/orders/:id/status', (req: Request, res: Response) => {
    const { status, trackingNote, location } = req.body;
    const order = db.orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.orderStatus = status as OrderStatus;
    order.updatedAt = new Date().toISOString();

    const step = order.trackingHistory.find(s => s.status === status);
    if (step) {
      step.completed = true;
      step.timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      if (trackingNote) step.notes = trackingNote;
      if (location) step.location = location;
    }

    res.json({ success: true, order: normalizeOrder(order) });
  });

  app.get('/api/seller/analytics', (req: Request, res: Response) => {
    const sellerId = (req.query.sellerId as string) || 'seller-godavari-heritage';
    const sellerOrders = db.orders.filter(o => o.items.some(i => i.sellerId === sellerId));
    const sellerProducts = db.products.filter(p => p.sellerId === sellerId);

    const totalRevenue = sellerOrders.reduce((sum, o) => sum + (o.finalTotal ?? o.totalAmount ?? 0), 0);
    const totalUnitsSold = sellerOrders.reduce(
      (sum, o) => sum + o.items.filter(i => i.sellerId === sellerId).reduce((s, it) => s + it.quantity, 0),
      0
    );

    res.json({
      totalRevenue,
      totalOrders: sellerOrders.length,
      totalUnitsSold,
      activeProducts: sellerProducts.length,
      recentOrders: sellerOrders.slice(0, 5).map(normalizeOrder),
      monthlyRevenue: [
        { month: 'Apr', sales: 42000 },
        { month: 'May', sales: 68000 },
        { month: 'Jun', sales: 95000 },
        { month: 'Jul', sales: 124000 },
        { month: 'Aug', sales: 182000 }
      ]
    });
  });

  // ==================== ADMIN APIS ====================
  app.get('/api/admin/stats', (req: Request, res: Response) => {
    const totalGmv = db.orders.reduce((sum, o) => sum + o.finalTotal, 0);
    const totalOrders = db.orders.length;
    const totalUsers = db.users.length;
    const totalSellers = db.sellers.length;
    const pendingKycCount = db.sellerKYCs.filter(k => k.status === 'PENDING').length;

    res.json({
      totalGmv,
      totalOrders,
      totalUsers,
      totalSellers,
      pendingKycCount,
      totalProducts: db.products.length,
      categoryDistribution: db.categories.map(c => ({
        name: c.name,
        count: db.products.filter(p => p.categoryId === c.id).length
      }))
    });
  });

  app.get('/api/admin/users', (req: Request, res: Response) => {
    res.json({ users: db.users });
  });

  app.get('/api/admin/sellers', (req: Request, res: Response) => {
    const enriched = db.sellers.map(s => {
      const kyc = db.sellerKYCs.find(k => k.sellerId === s.id);
      return { ...s, kyc };
    });
    res.json({ sellers: enriched });
  });

  app.put('/api/admin/sellers/:id/kyc', (req: Request, res: Response) => {
    const { status, notes } = req.body;
    const seller = db.sellers.find(s => s.id === req.params.id);
    let kyc = db.sellerKYCs.find(k => k.sellerId === req.params.id);

    if (seller) {
      seller.isKycVerified = status === 'APPROVED';
      seller.status = status === 'APPROVED' ? 'active' : status === 'REJECTED' ? 'suspended' : 'pending';
    }

    if (kyc) {
      kyc.status = status;
      kyc.notes = notes || (status === 'APPROVED' ? 'KYC verified and approved by Central Admin' : 'Documents rejected');
      kyc.verifiedAt = new Date().toISOString();
    }

    res.json({ success: true, seller, kyc });
  });

  app.post('/api/admin/categories', (req: Request, res: Response) => {
    const { name, nameTe, slug, iconName, image, description } = req.body;
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      nameTe: nameTe || name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      iconName: iconName || 'ShoppingBag',
      image: image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80',
      description: description || '',
      featured: true,
      order: db.categories.length + 1
    };
    db.categories.push(newCat);
    res.json({ success: true, category: newCat });
  });

  app.post('/api/admin/coupons', (req: Request, res: Response) => {
    const { code, discountType, discountValue, minOrderValue, maxDiscount, description } = req.body;
    const newCoupon: Coupon = {
      id: `coup-${Date.now()}`,
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue),
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      validUntil: '2026-12-31',
      isActive: true,
      description
    };
    db.coupons.unshift(newCoupon);
    res.json({ success: true, coupon: newCoupon });
  });

  app.delete('/api/admin/coupons/:id', (req: Request, res: Response) => {
    db.coupons = db.coupons.filter(c => c.id !== req.params.id);
    res.json({ success: true });
  });

  // ==================== NOTIFICATIONS ====================
  app.get('/api/notifications', (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || 'user-customer-demo';
    res.json({ notifications: db.notifications.filter(n => n.userId === userId || n.type === 'PROMO') });
  });
}

setupRoutes();

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  // Vite middleware setup (DEV mode) vs Static files (PROD mode)
  if (process.env.NODE_ENV !== 'production') {
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AndhraMart] Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;

