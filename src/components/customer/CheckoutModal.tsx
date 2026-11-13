import React, { useState } from 'react';
import {
  X,
  MapPin,
  Truck,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Plus,
  Building,
  Smartphone,
  Sparkles,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { usePincode } from '../../context/PincodeContext';
import { Address, Order, PaymentMethod } from '../../types';
import { api } from '../../services/api';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess
}) => {
  const { user } = useAuth();
  const { items, subtotal, deliveryCharge, finalTotal, appliedCoupon, couponDiscount, clearCart } = useCart();
  const { currentPincode, pincodeInfo } = usePincode();

  const [step, setStep] = useState<'address' | 'payment' | 'processing' | 'success'>('address');

  // Address selection state
  const [addresses, setAddresses] = useState<Address[]>(() => {
    if (user?.addresses && user.addresses.length > 0) return user.addresses;
    return [
      {
        id: 'addr-default-1',
        fullName: user?.name || 'Sai Kumar',
        phone: user?.phone || '+91 98480 12345',
        street: 'D.No. 40-1-52, MG Road, Labbipet',
        city: 'Vijayawada',
        district: 'NTR (Vijayawada)',
        state: 'Andhra Pradesh',
        pincode: currentPincode || '520001',
        isDefault: true,
        type: 'HOME'
      }
    ];
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string>('addr-default-1');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  // New Address Form fields
  const [newFullName, setNewFullName] = useState(user?.name || '');
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState(pincodeInfo?.city || 'Vijayawada');
  const [newDistrict, setNewDistrict] = useState(pincodeInfo?.district || 'NTR (Vijayawada)');
  const [newPincode, setNewPincode] = useState(currentPincode || '520001');

  // Payment selection state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [upiId, setUpiId] = useState('andhramart.user@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8829');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('892');
  const [selectedBank, setSelectedBank] = useState('State Bank of India (SBI / erstwhile Andhra Bank)');
  const [selectedWallet, setSelectedWallet] = useState('PhonePe UPI');
  const [deliverySpeed, setDeliverySpeed] = useState<'express' | 'standard'>('express');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newPhone || !newStreet || !newPincode) {
      setErrorMsg('Please fill in all address details');
      return;
    }
    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      fullName: newFullName,
      phone: newPhone,
      street: newStreet,
      city: newCity,
      district: newDistrict,
      state: 'Andhra Pradesh',
      pincode: newPincode,
      isDefault: false,
      type: 'HOME'
    };
    setAddresses(prev => [...prev, newAddr]);
    setSelectedAddressId(newAddr.id);
    setShowNewAddressForm(false);
    setErrorMsg('');
  };

  const handlePlaceOrder = async () => {
    const address = addresses.find(a => a.id === selectedAddressId) || addresses[0];
    if (!address) {
      setErrorMsg('Please choose a delivery address');
      return;
    }

    setLoading(true);
    setStep('processing');
    setErrorMsg('');

    try {
      // Simulate secure gateway tokenization
      const orderPayload = {
        userId: user?.id || 'usr-guest',
        customerName: address.fullName,
        customerPhone: address.phone,
        items: items.map(i => ({
          productId: i.product.id,
          productTitle: i.product.title,
          productImage: i.product.images[0],
          price: i.product.sellingPrice,
          quantity: i.quantity,
          sellerId: i.product.sellerId,
          sellerName: i.product.sellerName
        })),
        shippingAddress: address,
        paymentMethod,
        paymentDetails: {
          gateway: 'Razorpay AP FastPay',
          transactionId: `TXN-AP-${Date.now()}`,
          status: paymentMethod === 'COD' ? 'PENDING' : 'COMPLETED',
          timestamp: new Date().toISOString()
        },
        subtotal,
        deliveryFee: deliveryCharge,
        discount: couponDiscount,
        couponCode: appliedCoupon?.code,
        totalAmount: finalTotal
      };

      const result = await api.createOrder(orderPayload);
      setLoading(false);

      if (result.success && result.order) {
        setCreatedOrder(result.order);
        setStep('success');
        clearCart();
        onOrderSuccess(result.order);
      } else {
        setStep('payment');
        setErrorMsg(result.error || 'Failed to place order');
      }
    } catch (err: any) {
      setLoading(false);
      setStep('payment');
      setErrorMsg(err.message || 'Payment processing error');
    }
  };

  const selectedAddr = addresses.find(a => a.id === selectedAddressId) || addresses[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Secure AndhraMart Checkout</h3>
              <p className="text-xs text-slate-500 font-medium">100% Encrypted Payment with Fast AP Delivery</p>
            </div>
          </div>
          <button
            id="close-checkout-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        {step !== 'success' && step !== 'processing' && (
          <div className="grid grid-cols-2 text-center text-xs font-bold border-b border-slate-200 bg-white">
            <button
              onClick={() => setStep('address')}
              className={`py-3 flex items-center justify-center gap-2 transition ${step === 'address' ? 'border-b-2 border-amber-600 text-amber-900 bg-amber-50/50' : 'text-slate-500'}`}
            >
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[11px] flex items-center justify-center font-mono">1</span>
              <span>Delivery Address</span>
            </button>
            <button
              onClick={() => setStep('payment')}
              className={`py-3 flex items-center justify-center gap-2 transition ${step === 'payment' ? 'border-b-2 border-amber-600 text-amber-900 bg-amber-50/50' : 'text-slate-500'}`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] flex items-center justify-center font-mono">2</span>
              <span>Payment & Place Order</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 sm:p-8 flex-1">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Address */}
          {step === 'address' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-black text-sm text-slate-900 uppercase tracking-wider">Select Delivery Address</h4>
                  <button
                    onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                    className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showNewAddressForm ? 'Cancel' : 'Add New AP Address'}</span>
                  </button>
                </div>

                {showNewAddressForm ? (
                  <form onSubmit={handleAddNewAddress} className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                    <h5 className="font-bold text-xs text-amber-950">Add Andhra Pradesh Address</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-semibold block mb-1">Full Name</label>
                        <input
                          type="text"
                          value={newFullName}
                          onChange={e => setNewFullName(e.target.value)}
                          placeholder="e.g. Sai Kumar"
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={newPhone}
                          onChange={e => setNewPhone(e.target.value)}
                          placeholder="+91 98480 12345"
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                          required
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="font-semibold block mb-1">House No., Building, Street & Landmark</label>
                        <input
                          type="text"
                          value={newStreet}
                          onChange={e => setNewStreet(e.target.value)}
                          placeholder="Door No 12-3, Main Bazaar, near Temple"
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">City / Town</label>
                        <input
                          type="text"
                          value={newCity}
                          onChange={e => setNewCity(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">AP Pincode (6 digits)</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={newPincode}
                          onChange={e => setNewPincode(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition"
                    >
                      Save & Use Address
                    </button>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addresses.map(addr => (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-4 rounded-2xl border-2 transition cursor-pointer text-xs space-y-1.5 ${selectedAddressId === addr.id ? 'border-amber-600 bg-amber-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">{addr.fullName}</span>
                          <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                            {addr.type}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-snug">{addr.street}</p>
                        <p className="text-slate-800 font-semibold">{addr.city}, {addr.district} - <span className="font-mono text-amber-800">{addr.pincode}</span></p>
                        <p className="text-slate-500 font-medium">📞 {addr.phone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery Speed Options */}
              <div className="border-t border-slate-200 pt-5">
                <h4 className="font-black text-sm text-slate-900 uppercase tracking-wider mb-3">Delivery Speed</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setDeliverySpeed('express')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer flex items-center justify-between text-xs transition ${deliverySpeed === 'express' ? 'border-emerald-600 bg-emerald-50/60' : 'border-slate-200'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">AP Express Delivery</div>
                        <div className="text-[11px] text-emerald-700 font-semibold">1-2 Days Guaranteed</div>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-800">FREE</span>
                  </div>

                  <div
                    onClick={() => setDeliverySpeed('standard')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer flex items-center justify-between text-xs transition ${deliverySpeed === 'standard' ? 'border-amber-600 bg-amber-50/60' : 'border-slate-200'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Standard Delivery</div>
                        <div className="text-[11px] text-slate-500">3-4 Days</div>
                      </div>
                    </div>
                    <span className="font-bold text-slate-700">FREE</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  id="checkout-next-to-payment"
                  onClick={() => setStep('payment')}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Payment */}
          {step === 'payment' && (
            <div className="space-y-6">
              {/* Order summary pill */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Deliver to: </span>
                  <strong className="text-slate-900">{selectedAddr.fullName}, {selectedAddr.city} ({selectedAddr.pincode})</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Total: </span>
                  <strong className="text-base font-black text-slate-950 font-serif">₹{finalTotal.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* Payment Methods Tabs */}
              <div>
                <h4 className="font-black text-sm text-slate-900 uppercase tracking-wider mb-3">Choose Payment Method</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-bold mb-4">
                  {[
                    { id: 'UPI' as PaymentMethod, label: 'UPI / QR', icon: QrCode },
                    { id: 'CARD' as PaymentMethod, label: 'Cards', icon: CreditCard },
                    { id: 'NETBANKING' as PaymentMethod, label: 'NetBanking', icon: Building },
                    { id: 'WALLET' as PaymentMethod, label: 'Wallets', icon: Smartphone },
                    { id: 'COD' as PaymentMethod, label: 'Cash on Del.', icon: Truck }
                  ].map(m => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition ${paymentMethod === m.id ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-view for UPI */}
                {paymentMethod === 'UPI' && (
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Simulated QR Code */}
                      <div className="p-2 bg-white rounded-xl shadow-xs border border-amber-300 text-center">
                        <div className="w-32 h-32 bg-slate-900 p-2 rounded-lg flex flex-col items-center justify-center text-white">
                          <QrCode className="w-24 h-24 text-amber-400" />
                        </div>
                        <span className="text-[10px] font-bold text-amber-900 mt-1 block">Scan with any UPI App</span>
                      </div>

                      <div className="flex-1 space-y-2 text-xs">
                        <p className="font-bold text-slate-800">Or Pay via UPI ID / VPA:</p>
                        <input
                          type="text"
                          value={upiId}
                          onChange={e => setUpiId(e.target.value)}
                          placeholder="yourname@okhdfcbank"
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium focus:outline-none focus:border-amber-500"
                        />
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {['@okhdfcbank', '@oksbi', '@paytm', '@ybl'].map(vpa => (
                            <span key={vpa} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-mono">
                              {vpa}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-view for Cards */}
                {paymentMethod === 'CARD' && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        placeholder="•••• •••• •••• ••••"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Valid Thru (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={e => setCardExpiry(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">CVV</label>
                        <input
                          type="password"
                          maxLength={3}
                          value={cardCvv}
                          onChange={e => setCardCvv(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      100% RBI Tokenized & Secured. We never store raw card numbers.
                    </p>
                  </div>
                )}

                {/* Sub-view for Netbanking */}
                {paymentMethod === 'NETBANKING' && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <label className="font-semibold text-slate-700 block">Select Your Indian / AP Bank</label>
                    <select
                      value={selectedBank}
                      onChange={e => setSelectedBank(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    >
                      <option>State Bank of India (SBI / erstwhile Andhra Bank)</option>
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                      <option>Axis Bank</option>
                      <option>Kotak Mahindra Bank</option>
                      <option>Union Bank of India</option>
                      <option>Canara Bank</option>
                      <option>AP Grameena Vikas Bank</option>
                    </select>
                  </div>
                )}

                {/* Sub-view for Wallets */}
                {paymentMethod === 'WALLET' && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <label className="font-semibold text-slate-700 block">Select Digital Wallet</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['PhonePe UPI', 'Paytm Wallet', 'Amazon Pay'].map(w => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setSelectedWallet(w)}
                          className={`p-2.5 rounded-xl border text-center font-bold transition ${selectedWallet === w ? 'border-amber-600 bg-amber-100/70 text-amber-950' : 'bg-white text-slate-700 border-slate-200'}`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-view for COD */}
                {paymentMethod === 'COD' && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Cash on Delivery is available for pincode {selectedAddr.pincode}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      You can pay via Cash or UPI QR scan at your doorstep when the delivery partner arrives.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('address')}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  ← Back to Address
                </button>

                <button
                  id="confirm-place-order-btn"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-sm rounded-xl shadow-lg transition flex items-center gap-2 transform active:scale-98"
                >
                  <Lock className="w-4 h-4" />
                  <span>Pay ₹{finalTotal.toLocaleString('en-IN')} & Place Order</span>
                </button>
              </div>
            </div>
          )}

          {/* Processing State */}
          {step === 'processing' && (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <h4 className="text-lg font-black text-slate-900">Processing Your Payment...</h4>
              <p className="text-xs text-slate-500">Contacting Indian Banking Gateway. Please do not refresh.</p>
            </div>
          )}

          {/* Success State */}
          {step === 'success' && createdOrder && (
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-2xl font-black text-slate-900 font-serif">Order Confirmed!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Thank you for supporting authentic Andhra artisans & sellers!
                </p>
                <div className="mt-3 inline-block px-3 py-1 bg-amber-100 text-amber-900 font-mono font-bold text-xs rounded-lg">
                  Order ID: {createdOrder.id}
                </div>
              </div>

              <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Delivery:</span>
                  <span className="font-bold text-emerald-700">{createdOrder.estimatedDelivery}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Courier Partner:</span>
                  <span className="font-bold text-slate-800">{createdOrder.tracking.courier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">AWB Tracking Number:</span>
                  <span className="font-mono font-bold text-amber-800">{createdOrder.tracking.trackingNumber}</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  id="view-live-tracking-btn"
                  onClick={() => {
                    onClose();
                    onOrderSuccess(createdOrder);
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  <span>View Live Order Tracking</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
