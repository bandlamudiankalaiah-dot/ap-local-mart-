import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  Download,
  MapPin,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface OrderHistoryViewProps {
  onSelectProductForReview?: (productId: string) => void;
  onRequestReturn?: (order: Order) => void;
  selectedOrderId?: string;
}

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  onSelectProductForReview,
  onRequestReturn,
  selectedOrderId
}) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [user?.id]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getOrders(user?.id);
      const fetched = res.orders || [];
      setOrders(fetched);
      if (selectedOrderId) {
        const match = fetched.find((o: Order) => o.id === selectedOrderId);
        if (match) setActiveOrder(match);
        else if (fetched.length > 0) setActiveOrder(fetched[0]);
      } else if (fetched.length > 0) {
        setActiveOrder(fetched[0]);
      }
    } catch {
      setOrders([]);
    }
    setLoading(false);
  };

  const handleCancelOrder = async (orderId: string) => {
    const reason = prompt('Please enter cancellation reason (e.g. Changed mind, Ordered by mistake):');
    if (!reason) return;
    setCancellingId(orderId);
    try {
      const res = await api.cancelOrder(orderId, reason);
      if (res.success && res.order) {
        setOrders(prev => prev.map(o => (o.id === orderId ? res.order : o)));
        if (activeOrder?.id === orderId) {
          setActiveOrder(res.order);
        }
      }
    } catch {
      alert('Failed to cancel order');
    }
    setCancellingId(null);
  };

  const downloadInvoice = (order: Order) => {
    const invoiceText = `
========================================
ANDHRAMART TAX INVOICE & RECEIPT
Andhra Pradesh Shopping Marketplace
GSTIN: 37AAAAA0000A1Z5
========================================
Order ID: ${order.id}
Date: ${new Date(order.createdAt).toLocaleString('en-IN')}
Payment: ${order.paymentMethod} (${order.paymentDetails?.status})
Transaction ID: ${order.paymentDetails?.transactionId || 'N/A'}

Customer: ${order.customerName}
Phone: ${order.customerPhone}
Delivery Address:
${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.district}, AP - ${order.shippingAddress.pincode}

----------------------------------------
ITEMS ORDERED:
${order.items.map(i => `- ${i.productTitle} x ${i.quantity} = ₹${i.price * i.quantity} (Seller: ${i.sellerName})`).join('\n')}

----------------------------------------
Subtotal: ₹${order.subtotal}
Delivery Charges: ₹${order.deliveryCharge || order.deliveryFee || 0}
Discount: -₹${order.discount || 0}
FINAL TOTAL PAID: ₹${order.finalTotal || order.totalAmount}

Logistics Partner: ${order.courierPartner || order.tracking?.carrier || 'Andhra Express Logistics'}
AWB Tracking Number: ${order.trackingNumber || order.tracking?.awbNumber || 'APX-7890123'}
========================================
Thank you for shopping on AndhraMart!
100% Authentic Andhra Specialities
========================================
    `.trim();

    const element = document.createElement('a');
    const file = new Blob([invoiceText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `AndhraMart-Invoice-${order.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading your orders & live tracking...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <Package className="w-16 h-16 mx-auto mb-4 text-slate-300 stroke-1" />
        <h3 className="text-xl font-bold text-slate-900">No Orders Placed Yet</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          You haven’t placed any orders yet. Discover authentic Andhra handlooms, sweets, and spices on our home page!
        </p>
      </div>
    );
  }

  const stepsList: OrderStatus[] = ['PLACED', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'CANCELLED' || status === 'RETURNED' || status === 'REFUNDED') return -1;
    return stepsList.indexOf(status);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-black font-serif text-slate-900">My Orders & Live Andhra Tracking</h2>
        <p className="text-xs text-slate-500">Track shipments across Andhra Pradesh, download invoices, or initiate returns</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Order List */}
        <div className="lg:col-span-5 space-y-3.5">
          {orders.map(ord => {
            const currentStatus = ord.orderStatus || ord.status || 'PLACED';
            const total = ord.finalTotal ?? ord.totalAmount ?? 0;
            return (
              <div
                key={ord.id}
                onClick={() => setActiveOrder(ord)}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer text-xs space-y-2.5 ${activeOrder?.id === ord.id ? 'border-amber-600 bg-amber-50/40 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">{ord.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      currentStatus === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentStatus === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : currentStatus === 'RETURNED' || currentStatus === 'REFUNDED'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {String(currentStatus).replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Items Preview */}
                <div className="flex items-center gap-2">
                  <img
                    src={ord.items[0]?.productImage}
                    alt="item"
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{ord.items[0]?.productTitle}</p>
                    {ord.items.length > 1 && (
                      <p className="text-[10px] text-slate-400">+{ord.items.length - 1} other item(s)</p>
                    )}
                    <p className="text-slate-950 font-black font-serif mt-0.5">₹{total.toLocaleString('en-IN')}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400">
                  <span>{new Date(ord.createdAt).toLocaleDateString('en-IN')}</span>
                  <span>AP Express • {ord.shippingAddress?.city || 'AP'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Active Order Details & Live Timeline */}
        <div className="lg:col-span-7">
          {activeOrder ? (
            (() => {
              const activeStatus = activeOrder.orderStatus || activeOrder.status || 'PLACED';
              const carrier = activeOrder.courierPartner || activeOrder.tracking?.carrier || 'Andhra Express Logistics (AP SpeedHub)';
              const trackingNum = activeOrder.trackingNumber || activeOrder.tracking?.awbNumber || 'AMEXP-7890123';
              const currentLoc = activeOrder.trackingHistory?.[activeOrder.trackingHistory.length - 1]?.location || activeOrder.tracking?.currentHub || `${activeOrder.shippingAddress?.city || 'Vijayawada'} Sorting Hub`;

              return (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                  {/* Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-900 font-mono">{activeOrder.id}</h3>
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded">
                          {activeOrder.paymentMethod}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Placed on {new Date(activeOrder.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadInvoice(activeOrder)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Tax Invoice</span>
                      </button>
                    </div>
                  </div>

                  {/* LIVE AP TRACKING TIMELINE */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/70 to-orange-50/50 border border-amber-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-amber-700" />
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">
                            {carrier}
                          </h4>
                          <p className="text-xs text-amber-900 font-mono">
                            AWB: <strong>{trackingNum}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Est. Delivery</span>
                        <span className="text-xs font-bold text-emerald-700">{activeOrder.estimatedDelivery || 'Within 2 Days'}</span>
                      </div>
                    </div>

                    {/* Tracking Progress Steps */}
                    {activeStatus !== 'CANCELLED' && activeStatus !== 'RETURNED' && activeStatus !== 'REFUNDED' ? (
                      <div className="pt-2">
                        <div className="grid grid-cols-5 gap-1 relative">
                          {stepsList.map((st, idx) => {
                            const currentIdx = getStepIndex(activeStatus);
                            const isDone = idx <= currentIdx;
                            const isCurrent = idx === currentIdx;

                            return (
                              <div key={st} className="flex flex-col items-center text-center">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                                    isDone
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-200 text-slate-500'
                                  } ${isCurrent ? 'ring-4 ring-emerald-200' : ''}`}
                                >
                                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                </div>
                                <span className={`text-[10px] mt-1.5 font-bold leading-tight ${isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                                  {st === 'PLACED'
                                    ? 'Placed'
                                    : st === 'CONFIRMED'
                                    ? 'Confirmed'
                                    : st === 'SHIPPED'
                                    ? 'Shipped'
                                    : st === 'OUT_FOR_DELIVERY'
                                    ? 'Out for Del.'
                                    : 'Delivered'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-800 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        <span>Order Status: {activeStatus} ({activeOrder.returnDetails?.reason || activeOrder.cancellationReason || 'Customer requested'})</span>
                      </div>
                    )}

                    {/* Transit Location Callout */}
                    <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs text-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Current Transit Hub: <strong>{currentLoc}</strong></span>
                      </div>
                      <span className="text-[10px] text-slate-400">Live GPS Updates</span>
                    </div>
                  </div>

                  {/* Items List in this order */}
                  <div>
                    <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider mb-3">Items in this Order</h4>
                    <div className="space-y-3 divide-y divide-slate-100">
                      {activeOrder.items.map((item, idx) => (
                        <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.productImage}
                              alt={item.productTitle}
                              className="w-14 h-14 object-cover rounded-xl border border-slate-200"
                            />
                            <div>
                              <h5 className="font-bold text-slate-900 line-clamp-1">{item.productTitle}</h5>
                              <p className="text-[11px] text-slate-500">Qty: {item.quantity} • Seller: {item.sellerName}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-black font-serif text-slate-900 text-sm">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address & Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase mb-1">Delivering To:</span>
                      <p className="font-bold text-slate-900">{activeOrder.shippingAddress?.fullName || activeOrder.userName || 'Customer'}</p>
                      <p className="text-slate-600">{activeOrder.shippingAddress?.street}</p>
                      <p className="text-slate-800 font-semibold">{activeOrder.shippingAddress?.city}, {activeOrder.shippingAddress?.district} - {activeOrder.shippingAddress?.pincode}</p>
                      <p className="text-slate-500">📞 {activeOrder.shippingAddress?.phone || activeOrder.userPhone}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <span className="text-slate-400 font-bold block text-[10px] uppercase mb-1">Order Actions:</span>

                      <div className="space-y-2">
                        {/* Return Action */}
                        {activeStatus === 'DELIVERED' && onRequestReturn && (
                          <button
                            onClick={() => onRequestReturn(activeOrder)}
                            className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Request 7-Day AP Return / Refund</span>
                          </button>
                        )}

                        {/* Cancel Action */}
                        {activeStatus !== 'DELIVERED' && activeStatus !== 'CANCELLED' && activeStatus !== 'RETURNED' && activeStatus !== 'REFUNDED' && (
                          <button
                            onClick={() => handleCancelOrder(activeOrder.id)}
                            disabled={cancellingId === activeOrder.id}
                            className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{cancellingId === activeOrder.id ? 'Cancelling...' : 'Cancel Order'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Select an order to view live Andhra tracking and details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
