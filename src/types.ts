export type UserRole = 'customer' | 'seller' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  sellerId?: string;
  storeName?: string;
  addresses?: Address[];
  passwordHash?: string;
  createdAt: string;
}

export interface Address {
  id: string;
  userId?: string;
  fullName: string;
  phone: string;
  pincode: string;
  state: string;
  district: string;
  city: string;
  street: string;
  landmark?: string;
  addressType?: 'HOME' | 'WORK' | 'OTHER';
  type?: 'HOME' | 'WORK' | 'OTHER';
  isDefault: boolean;
}

export interface Seller {
  id: string;
  userId: string;
  storeName: string;
  storeSlug: string;
  description: string;
  logo: string;
  banner?: string;
  rating: number;
  totalSales: number;
  totalOrders: number;
  isKycVerified: boolean;
  kycStatus?: 'VERIFIED' | 'PENDING' | 'REJECTED';
  ownerName?: string;
  district?: string;
  gstin?: string;
  businessType: 'INDIVIDUAL' | 'PROPRIETORSHIP' | 'PARTNERSHIP' | 'PVT_LTD';
  gstNumber?: string;
  panNumber: string;
  bankAccount: string;
  bankIfsc: string;
  pickupPincode: string;
  pickupDistrict: string;
  pickupAddress: string;
  phone: string;
  email: string;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
}

export interface SellerKYC {
  id: string;
  sellerId: string;
  businessPan: string;
  gstCertificate?: string;
  addressProof: string;
  bankStatement: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  verifiedAt?: string;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  nameTe: string;
  slug: string;
  iconName: string;
  image: string;
  description: string;
  featured: boolean;
  order: number;
  itemCount?: number;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  nameTe: string;
  slug: string;
  image?: string;
}

export interface ProductSpecification {
  key: string;
  value: string;
}

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  categoryId: string;
  subcategoryId: string;
  title: string;
  titleTe?: string;
  slug: string;
  description: string;
  specifications: ProductSpecification[];
  brand: string;
  originalPrice: number;
  sellingPrice: number;
  discountPercent: number;
  stock: number;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  images: string[];
  isBestSeller?: boolean;
  isTrending?: boolean;
  isAndhraSpecial?: boolean;
  originDistrict?: string;
  tags: string[];
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  deliveryDays?: number;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  selectedVariant?: string;
  addedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  validUntil: string;
  isActive: boolean;
  description: string;
}

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUNDED';

export type PaymentMethod =
  | 'UPI'
  | 'CARD'
  | 'NET_BANKING'
  | 'NETBANKING'
  | 'WALLET'
  | 'COD'
  | 'RAZORPAY';

export type PaymentStatus =
  | 'PAID'
  | 'PENDING'
  | 'FAILED'
  | 'REFUNDED';

export interface OrderItem {
  productId: string;
  productTitle: string;
  productImage: string;
  price: number;
  quantity: number;
  sellerId: string;
  sellerName: string;
}

export interface TrackingStep {
  status: OrderStatus;
  title: string;
  location: string;
  timestamp: string;
  completed: boolean;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userPhone: string;
  customerName?: string;
  customerPhone?: string;
  shippingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  deliveryFee?: number;
  finalTotal: number;
  totalAmount?: number;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDetails?: {
    upiId?: string;
    cardLast4?: string;
    bankName?: string;
    walletName?: string;
    transactionId: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    status?: string;
    gateway?: string;
    timestamp?: string;
  };
  orderStatus: OrderStatus;
  status?: OrderStatus;
  cancellationReason?: string;
  trackingNumber: string;
  tracking?: {
    awbNumber?: string;
    trackingNumber?: string;
    carrier?: string;
    courier?: string;
    currentHub?: string;
    estimatedDeliveryDate?: string;
  };
  courierPartner: string;
  trackingHistory: TrackingStep[];
  estimatedDelivery: string;
  createdAt: string;
  updatedAt: string;
  returnDetails?: {
    reason: string;
    status: 'REQUESTED' | 'APPROVED' | 'PICKED_UP' | 'REFUNDED' | 'REJECTED';
    requestedAt: string;
    refundAmount?: number;
  };
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  userDistrict?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ORDER' | 'PROMO' | 'SYSTEM' | 'SELLER';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  taglineTe?: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  category: string;
  bgGradient: string;
  active: boolean;
}

export interface PincodeInfo {
  pincode: string;
  district: string;
  city: string;
  state: string;
  isDeliverable: boolean;
  estimatedDays: number;
  codAvailable: boolean;
  expressAvailable: boolean;
}

export interface FilterState {
  categoryId?: string;
  subcategoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  brands: string[];
  minRating?: number;
  inStockOnly?: boolean;
  andhraSpecialOnly?: boolean;
  sortBy: 'popularity' | 'price_low' | 'price_high' | 'rating' | 'newest';
  searchQuery?: string;
}
