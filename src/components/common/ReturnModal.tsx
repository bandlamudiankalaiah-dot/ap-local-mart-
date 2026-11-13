import React, { useState } from 'react';
import { X, RotateCcw, CheckCircle2 } from 'lucide-react';
import { Order } from '../../types';
import { api } from '../../services/api';

interface ReturnModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [reason, setReason] = useState('Damaged or Defective Item');
  const [comments, setComments] = useState('');
  const [refundMode, setRefundMode] = useState<'ORIGINAL_PAYMENT' | 'ANDHRAMART_WALLET'>('ORIGINAL_PAYMENT');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const fullReason = `${reason}: ${comments}`;
      const res = await api.requestReturn(order.id, fullReason);
      setLoading(false);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg('Failed to process return request');
      }
    } catch {
      setLoading(false);
      setErrorMsg('Failed to process return request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150 text-xs">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Request 7-Day AP Return & Refund</h3>
            <p className="text-[11px] text-slate-500 font-mono">Order ID: {order.id}</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 bg-red-50 text-red-700 rounded-lg font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason for Return</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
            >
              <option>Damaged or Defective Item</option>
              <option>Product Different from Website Photos</option>
              <option>Quality Not as Expected</option>
              <option>Fit / Size Issue (Handloom/Apparel)</option>
              <option>Incorrect Item Delivered</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Additional Details</label>
            <textarea
              rows={3}
              value={comments}
              onChange={e => setComments(e.target.value)}
              placeholder="Describe the issue in detail..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Refund Preference</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRefundMode('ORIGINAL_PAYMENT')}
                className={`p-2.5 rounded-xl border text-center font-bold transition ${refundMode === 'ORIGINAL_PAYMENT' ? 'border-purple-600 bg-purple-50 text-purple-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
              >
                Original Source (UPI/Bank)
              </button>
              <button
                type="button"
                onClick={() => setRefundMode('ANDHRAMART_WALLET')}
                className={`p-2.5 rounded-xl border text-center font-bold transition ${refundMode === 'ANDHRAMART_WALLET' ? 'border-purple-600 bg-purple-50 text-purple-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
              >
                Instant AP Wallet Credit
              </button>
            </div>
          </div>

          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-[11px] text-purple-900">
            <span className="font-bold">AndhraMart Return Policy:</span> Our courier partner will pick up the package from your address within 24-48 hours. Refund will be credited immediately upon pickup verification.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition"
            >
              {loading ? 'Submitting...' : 'Submit Return Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
