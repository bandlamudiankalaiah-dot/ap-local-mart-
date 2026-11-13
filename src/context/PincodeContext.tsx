import React, { createContext, useContext, useState, useEffect } from 'react';
import { PincodeInfo } from '../types';
import { api } from '../services/api';
import { AP_PINCODES } from '../data/mockData';

interface PincodeContextType {
  currentPincode: string;
  pincodeInfo: PincodeInfo;
  isPincodeModalOpen: boolean;
  setIsPincodeModalOpen: (open: boolean) => void;
  updatePincode: (pin: string) => Promise<{ success: boolean; info?: PincodeInfo; error?: string }>;
}

const defaultPincode = '520001'; // Vijayawada, AP

const PincodeContext = createContext<PincodeContextType | undefined>(undefined);

export const PincodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPincode, setCurrentPincode] = useState<string>(() => {
    return localStorage.getItem('andhramart_pincode') || defaultPincode;
  });

  const [pincodeInfo, setPincodeInfo] = useState<PincodeInfo>(() => {
    return AP_PINCODES[currentPincode] || AP_PINCODES[defaultPincode];
  });

  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('andhramart_pincode', currentPincode);
    api.checkPincode(currentPincode)
      .then(info => setPincodeInfo(info))
      .catch(() => {});
  }, [currentPincode]);

  const updatePincode = async (pin: string) => {
    try {
      const info = await api.checkPincode(pin);
      setCurrentPincode(pin);
      setPincodeInfo(info);
      setIsPincodeModalOpen(false);
      return { success: true, info };
    } catch (err: any) {
      return { success: false, error: err.message || 'Pincode not serviceable' };
    }
  };

  return (
    <PincodeContext.Provider
      value={{
        currentPincode,
        pincodeInfo,
        isPincodeModalOpen,
        setIsPincodeModalOpen,
        updatePincode
      }}
    >
      {children}
    </PincodeContext.Provider>
  );
};

export const usePincode = () => {
  const context = useContext(PincodeContext);
  if (!context) {
    throw new Error('usePincode must be used within a PincodeProvider');
  }
  return context;
};
