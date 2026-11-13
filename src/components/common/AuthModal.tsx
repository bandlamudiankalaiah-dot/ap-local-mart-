import React, { useState } from 'react';
import { X, Phone, Mail, User, Lock, Store, MapPin, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AndhraMartLogo } from './AndhraMartLogo';
import { UserRole } from '../../types';
import { api } from '../../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  initialRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  initialRole = 'customer'
}) => {
  const { login, loginWithOtp, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'otp' | 'forgot' | 'reset'>(initialMode);
  const [authMethod, setAuthMethod] = useState<'email' | 'otp'>('email');
  const [role, setRole] = useState<UserRole>(initialRole);

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('password123');
  const [newPassword, setNewPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [pickupDistrict, setPickupDistrict] = useState('NTR / Krishna');
  const [pickupPincode, setPickupPincode] = useState('520001');
  const [otpValue, setOtpValue] = useState('');
  const [otpSentMsg, setOtpSentMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setErrorMsg('Please enter your email or phone');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const success = await login(identifier, role, password);
    setLoading(false);
    if (success) {
      onClose();
    } else {
      setErrorMsg('Invalid login credentials or account not found');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit Indian phone number');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.sendOtp(phone);
      setLoading(false);
      if (res.success) {
        setOtpSentMsg(res.message);
        setOtpValue(res.demoOtp || '520001');
        setMode('otp');
      } else {
        setErrorMsg(res.error || 'Failed to send OTP');
      }
    } catch {
      setLoading(false);
      setErrorMsg('Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpValue) {
      setErrorMsg('Please enter the OTP');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const success = await loginWithOtp(phone, otpValue, name);
    setLoading(false);
    if (success) {
      onClose();
    } else {
      setErrorMsg('Invalid OTP. Please enter 520001');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setErrorMsg('Please enter your registered email or mobile number');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const res = await api.forgotPassword(identifier);
    setLoading(false);
    if (res.success) {
      setOtpSentMsg(res.message);
      setOtpValue(res.demoOtp || '520001');
      setMode('reset');
    } else {
      setErrorMsg(res.error || 'Account not found');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpValue || !newPassword) {
      setErrorMsg('Please enter the OTP and your new password');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const res = await api.resetPassword(identifier, otpValue, newPassword);
    setLoading(false);
    if (res.success) {
      await login(identifier, role, newPassword);
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to reset password');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || (!email && !phone)) {
      setErrorMsg('Name and contact info are required');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const success = await register({
      name,
      email,
      phone,
      role,
      password,
      storeName: role === 'seller' ? storeName : undefined,
      pickupDistrict: role === 'seller' ? pickupDistrict : undefined,
      pickupPincode: role === 'seller' ? pickupPincode : undefined
    });
    setLoading(false);
    if (success) {
      onClose();
    } else {
      setErrorMsg('Registration failed or user already exists');
    }
  };

  const handleQuickDemoLogin = async (demoRole: UserRole) => {
    setLoading(true);
    setErrorMsg('');
    let demoIdentifier = 'sai.kumar@example.com';
    if (demoRole === 'seller') demoIdentifier = 'seller@godavari.com';
    if (demoRole === 'admin') demoIdentifier = 'admin@andhramart.in';

    const success = await login(demoIdentifier, demoRole);
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150">
        <button
          id="close-auth-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-block mb-3">
            <AndhraMartLogo size="sm" />
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {mode === 'login'
              ? 'Welcome to AP Local Mart'
              : mode === 'register'
              ? 'Create AP Local Mart Account'
              : mode === 'forgot'
              ? 'Forgot Password'
              : mode === 'reset'
              ? 'Set New Password'
              : 'Verify Mobile OTP'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login'
              ? 'Sign in to access orders, wishlist, and fast AP delivery'
              : mode === 'register'
              ? 'Join Andhra Pradesh’s local e-commerce marketplace'
              : mode === 'forgot'
              ? 'Enter your email or mobile to receive a reset OTP'
              : mode === 'reset'
              ? `Resetting password for ${identifier}`
              : `Enter the 6-digit code sent to ${phone}`}
          </p>
        </div>

        {/* Quick 1-Click Role Switcher Bar */}
        <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-[11px] font-bold text-amber-900 mb-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
            Quick Role Access (Verified Accounts):
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              id="demo-login-customer"
              type="button"
              onClick={() => handleQuickDemoLogin('customer')}
              className="px-2 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold transition shadow-2xs"
            >
              👤 Customer
            </button>
            <button
              id="demo-login-seller"
              type="button"
              onClick={() => handleQuickDemoLogin('seller')}
              className="px-2 py-1.5 bg-white hover:bg-orange-100 text-orange-900 border border-orange-300 rounded-lg text-[11px] font-bold transition shadow-2xs"
            >
              🏪 Seller Hub
            </button>
            <button
              id="demo-login-admin"
              type="button"
              onClick={() => handleQuickDemoLogin('admin')}
              className="px-2 py-1.5 bg-white hover:bg-red-100 text-red-900 border border-red-300 rounded-lg text-[11px] font-bold transition shadow-2xs"
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Login Mode */}
        {mode === 'login' && (
          <div>
            <div className="flex border-b border-slate-200 mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAuthMethod('email')}
                className={`flex-1 pb-2 border-b-2 text-center transition ${authMethod === 'email' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500'}`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('otp')}
                className={`flex-1 pb-2 border-b-2 text-center transition ${authMethod === 'otp' ? 'border-amber-600 text-amber-900' : 'border-transparent text-slate-500'}`}
              >
                Phone OTP Login
              </button>
            </div>

            {authMethod === 'email' ? (
              <form onSubmit={handleEmailLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email or Phone</label>
                  <div className="relative">
                    <input
                      id="auth-identifier"
                      type="text"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="sai.kumar@example.com or 9848099999"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg('');
                        setMode('forgot');
                      }}
                      className="text-[11px] font-bold text-amber-800 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <button
                  id="auth-submit-login"
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-sm rounded-xl transition shadow-sm"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">10-Digit Mobile Number</label>
                  <div className="relative">
                    <input
                      id="auth-otp-phone"
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="98480 12345"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <button
                  id="auth-send-otp-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'Sending...' : 'Send Login OTP'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            <div className="mt-5 text-center text-xs text-slate-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-amber-800 font-bold hover:underline"
              >
                Sign Up Now
              </button>
            </div>
          </div>
        )}

        {/* Forgot Password Step */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Registered Email or Mobile</label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="sai.kumar@example.com or 9848099999"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-amber-500 focus:outline-none"
                  required
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition shadow-sm"
            >
              {loading ? 'Sending Reset OTP...' : 'Send Password Reset OTP'}
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {/* Reset Password Step */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            {otpSentMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                {otpSentMsg}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">6-Digit Reset OTP</label>
              <input
                type="text"
                maxLength={6}
                value={otpValue}
                onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))}
                placeholder="520001"
                className="w-full text-center tracking-widest text-base font-mono font-bold py-2 bg-slate-50 border border-slate-300 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new secure password"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-sm"
            >
              {loading ? 'Updating Password...' : 'Reset Password & Sign In'}
            </button>
          </form>
        )}

        {/* OTP Verification Step */}
        {mode === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {otpSentMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                {otpSentMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Enter 6-Digit OTP</label>
              <input
                id="auth-otp-code"
                type="text"
                maxLength={6}
                value={otpValue}
                onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))}
                placeholder="520001"
                className="w-full text-center tracking-widest text-lg font-mono font-bold py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1 text-center">
                Verification OTP: <strong className="font-mono text-slate-700">520001</strong>
              </p>
            </div>

            <button
              id="auth-verify-otp-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition shadow-sm"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800"
            >
              Back to Login Options
            </button>
          </form>
        )}

        {/* Register Mode */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">I want to register as:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition ${role === 'customer' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('seller')}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition ${role === 'seller' ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                >
                  AP Local Store / Farmer
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Venkata Ramanuja"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-amber-500 focus:outline-none"
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {role === 'seller' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Local Store / Rythu Farm Name</label>
                  <div className="relative">
                    <input
                      id="reg-store-name"
                      type="text"
                      value={storeName}
                      onChange={e => setStoreName(e.target.value)}
                      placeholder="e.g. Bezawada Rythu Kirana & Organics"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-amber-500 focus:outline-none"
                      required
                    />
                    <Store className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">AP District</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={pickupDistrict}
                        onChange={e => setPickupDistrict(e.target.value)}
                        className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                        required
                      />
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Store Pincode</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pickupPincode}
                      onChange={e => setPickupPincode(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-amber-500 focus:outline-none"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number (AP)</label>
              <div className="relative">
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98480 00000"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-amber-500 focus:outline-none"
                  required
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Create Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-amber-500 focus:outline-none"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              id="reg-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-sm rounded-xl transition shadow-sm mt-2"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>

            <div className="mt-4 text-center text-xs text-slate-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-amber-800 font-bold hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
