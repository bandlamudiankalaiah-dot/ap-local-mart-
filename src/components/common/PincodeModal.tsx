import React, { useState } from 'react';
import { MapPin, X, Check, Truck, Clock, Shield } from 'lucide-react';
import { usePincode } from '../../context/PincodeContext';
import { AP_PINCODES } from '../../data/mockData';

export const PincodeModal: React.FC = () => {
  const { currentPincode, pincodeInfo, isPincodeModalOpen, setIsPincodeModalOpen, updatePincode } = usePincode();
  const [pinInput, setPinInput] = useState(currentPincode);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isPincodeModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pinInput.trim())) {
      setErrorMsg('Please enter a valid 6-digit Indian PIN code');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const res = await updatePincode(pinInput.trim());
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to verify location');
    }
  };

  const handleQuickSelect = async (pin: string) => {
    setPinInput(pin);
    setLoading(true);
    setErrorMsg('');
    await updatePincode(pin);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150">
        <button
          id="close-pincode-modal"
          onClick={() => setIsPincodeModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">Choose Delivery Location</h3>
            <p className="text-xs text-slate-500">Check fast delivery & COD availability in Andhra Pradesh</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2">
            <input
              id="pincode-input-field"
              type="text"
              maxLength={6}
              value={pinInput}
              onChange={e => {
                setPinInput(e.target.value.replace(/\D/g, ''));
                setErrorMsg('');
              }}
              placeholder="Enter 6-digit AP Pincode (e.g. 520001)"
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <button
              id="pincode-apply-btn"
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition shadow-xs"
            >
              {loading ? 'Checking...' : 'Apply'}
            </button>
          </div>
          {errorMsg && <p className="text-xs text-red-600 mt-1.5 font-medium">{errorMsg}</p>}
        </form>

        {/* Current Pincode Details Card */}
        {pincodeInfo && (
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 mb-5">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                Delivering to {pincodeInfo.city} ({pincodeInfo.pincode})
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                Serviceable
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 pt-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Est. Delivery: {pincodeInfo.estimatedDays} Day{pincodeInfo.estimatedDays > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>COD: Available</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick AP City Pincode Badges */}
        <div>
          <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
            Popular Andhra Pradesh Cities:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { city: 'Vijayawada', pin: '520001' },
              { city: 'Visakhapatnam', pin: '530001' },
              { city: 'Guntur', pin: '522001' },
              { city: 'Tirupati', pin: '517501' },
              { city: 'Rajahmundry', pin: '533101' },
              { city: 'Nellore', pin: '524001' },
              { city: 'Kurnool', pin: '518001' },
              { city: 'Kakinada', pin: '533001' },
              { city: 'Kadapa', pin: '516001' }
            ].map(item => (
              <button
                key={item.pin}
                onClick={() => handleQuickSelect(item.pin)}
                className={`px-2.5 py-1.5 rounded-lg border text-left text-xs transition ${currentPincode === item.pin ? 'bg-amber-600 text-white border-amber-600 font-bold' : 'bg-slate-50 hover:bg-amber-50 border-slate-200 text-slate-700'}`}
              >
                <div className="font-semibold truncate">{item.city}</div>
                <div className={`text-[10px] font-mono ${currentPincode === item.pin ? 'text-amber-200' : 'text-slate-400'}`}>{item.pin}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
