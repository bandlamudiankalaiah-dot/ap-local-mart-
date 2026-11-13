import React, { useState } from 'react';
import { User, MapPin, Phone, Mail, Shield, Plus, Trash2, CheckCircle2, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Address } from '../../types';

export const ProfileView: React.FC = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>(() => {
    return user?.addresses || [
      {
        id: 'addr-1',
        fullName: user?.name || 'Sai Kumar',
        phone: user?.phone || '+91 98480 12345',
        street: 'D.No. 40-1-52, MG Road, Labbipet',
        city: 'Vijayawada',
        district: 'NTR (Vijayawada)',
        state: 'Andhra Pradesh',
        pincode: '520001',
        isDefault: true,
        type: 'HOME'
      }
    ];
  });

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Vijayawada');
  const [district, setDistrict] = useState('NTR (Vijayawada)');
  const [pincode, setPincode] = useState('520001');

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      fullName,
      phone,
      street,
      city,
      district,
      state: 'Andhra Pradesh',
      pincode,
      isDefault: false,
      type: 'HOME'
    };
    setAddresses(prev => [...prev, newAddr]);
    setIsAddingAddress(false);
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-black font-serif text-slate-900">My Account & Addresses</h2>
        <p className="text-xs text-slate-500">Manage your AndhraMart profile, login details, and saved delivery locations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4 text-xs">
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full object-cover border-2 border-amber-500" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xl font-bold">
                {user?.name?.[0] || 'U'}
              </div>
            )}
            <div>
              <h3 className="font-extrabold text-base text-slate-900">{user?.name || 'Guest Shopper'}</h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] uppercase">
                {user?.role || 'Customer'}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-slate-600">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{user?.email || 'sai.kumar@example.com'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{user?.phone || '+91 98480 12345'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>Andhra Pradesh, India</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-800 font-medium text-[11px] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Active AndhraMart Customer</span>
          </div>
        </div>

        {/* Saved Addresses */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Saved Andhra Delivery Addresses</h3>
            <button
              onClick={() => setIsAddingAddress(!isAddingAddress)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingAddress ? 'Cancel' : 'Add New Address'}</span>
            </button>
          </div>

          {isAddingAddress && (
            <form onSubmit={handleAddAddress} className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 text-xs">
              <h4 className="font-bold text-amber-950">Add Andhra Pradesh Address</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="p-2 bg-white border border-slate-300 rounded-lg"
                  required
                />
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="p-2 bg-white border border-slate-300 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="House / Street / Landmark"
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  className="p-2 bg-white border border-slate-300 rounded-lg sm:col-span-2"
                  required
                />
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="p-2 bg-white border border-slate-300 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="6-digit Pincode"
                  value={pincode}
                  onChange={e => setPincode(e.target.value)}
                  className="p-2 bg-white border border-slate-300 rounded-lg font-mono"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl"
              >
                Save Address
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {addresses.map(addr => (
              <div key={addr.id} className="p-4 rounded-2xl bg-white border border-slate-200 text-xs space-y-1.5 relative shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{addr.fullName}</span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {addr.type}
                  </span>
                </div>
                <p className="text-slate-600">{addr.street}</p>
                <p className="text-slate-900 font-semibold">{addr.city}, {addr.district} - <span className="font-mono text-amber-800">{addr.pincode}</span></p>
                <p className="text-slate-500">📞 {addr.phone}</p>

                {addresses.length > 1 && (
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="absolute bottom-3 right-3 text-slate-400 hover:text-red-600 p-1"
                    title="Delete Address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
