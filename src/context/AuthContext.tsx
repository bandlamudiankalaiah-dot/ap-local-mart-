import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (identifier: string, role?: UserRole) => Promise<boolean>;
  loginWithOtp: (phone: string, otp: string, name?: string) => Promise<boolean>;
  register: (data: { name: string; email?: string; phone?: string; role: UserRole; storeName?: string }) => Promise<boolean>;
  logout: () => void;
  switchRoleQuick: (role: UserRole) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('andhramart_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initial fetch of current user
    api.getMe(token || undefined)
      .then(res => {
        if (res.user) {
          setUser(res.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (identifier: string, role?: UserRole): Promise<boolean> => {
    try {
      const res = await api.login(identifier, role);
      if (res.user) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('andhramart_token', res.token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const loginWithOtp = async (phone: string, otp: string, name?: string): Promise<boolean> => {
    try {
      const res = await api.verifyOtp(phone, otp, name);
      if (res.user) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('andhramart_token', res.token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const register = async (data: { name: string; email?: string; phone?: string; role: UserRole; storeName?: string }): Promise<boolean> => {
    try {
      const res = await api.register(data);
      if (res.user) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('andhramart_token', res.token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('andhramart_token');
  };

  const switchRoleQuick = async (targetRole: UserRole) => {
    if (targetRole === 'admin') {
      await login('admin@andhramart.in', 'admin');
    } else if (targetRole === 'seller') {
      await login('seller@godavari.com', 'seller');
    } else {
      await login('sai.kumar@example.com', 'customer');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || 'customer',
        isAuthenticated: !!user,
        login,
        loginWithOtp,
        register,
        logout,
        switchRoleQuick,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
