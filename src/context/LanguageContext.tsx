import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppLanguage = 'en' | 'te';

interface Translations {
  [key: string]: {
    en: string;
    te: string;
  };
}

const DICTIONARY: Translations = {
  appName: { en: 'AndhraMart', te: 'ఆంధ్ర మార్ట్' },
  tagline: { en: 'Andhra Pradesh Shopping Marketplace', te: 'ఆంధ్రప్రదేశ్ షాపింగ్ మార్కెట్‌ప్లేస్' },
  searchPlaceholder: { en: 'Search 10,000+ authentic Andhra products, handlooms, groceries...', te: '10,000+ ఆంధ్ర ఉత్పత్తులు, చేనేత చీరలు, నిత్యావసరాలు శోధించండి...' },
  deliverTo: { en: 'Deliver to', te: 'డెలివరీ ప్రాంతం' },
  allCategories: { en: 'All Categories', te: 'అన్ని విభాగాలు' },
  andhraSpecials: { en: 'Andhra Specials', te: 'ఆంధ్ర ప్రత్యేకం' },
  handlooms: { en: 'Handlooms & Pattu', te: 'చేనేత & పట్టు చీరలు' },
  spices: { en: 'Spices & Groceries', te: 'మసాలాలు & సరుకులు' },
  picklesSweets: { en: 'Pickles & Sweets', te: 'పచ్చళ్ళు & మిఠాయిలు' },
  electronics: { en: 'Mobiles & Tech', te: 'మొబైల్స్ & టెక్' },
  cart: { en: 'Cart', te: 'కార్ట్' },
  wishlist: { en: 'Wishlist', te: 'కోరికల జాబితా' },
  account: { en: 'Account', te: 'ఖాతా' },
  sellerHub: { en: 'Seller Hub', te: 'విక్రేత కేంద్రం' },
  adminPanel: { en: 'Admin Panel', te: 'అడ్మిన్ ప్యానెల్' },
  freeDelivery: { en: 'Free AP Delivery on orders above ₹499', te: '₹499 పైబడిన ఆర్డర్లపై ఉచిత ఆంధ్రప్రదేశ్ డెలివరీ' },
  addToCart: { en: 'Add to Cart', te: 'కార్ట్‌కు చేర్చు' },
  buyNow: { en: 'Buy Now', te: 'ఇప్పుడే కొనండి' },
  trendingNow: { en: 'Trending Across Andhra', te: 'ఆంధ్రప్రదేశ్ ట్రెండింగ్' },
  bestSellers: { en: 'AP Best Sellers', te: 'అత్యధికంగా అమ్ముడవుతున్నవి' },
  giTagged: { en: 'GI Tagged Heritage Goods', te: 'జీఐ గుర్తింపు పొందిన వారసత్వ వస్తువులు' },
  expressDelivery: { en: '1-2 Days AP Express Delivery', te: '1-2 రోజుల్లో ఎక్స్‌ప్రెస్ డెలివరీ' },
  orderTracking: { en: 'Live Order Tracking', te: 'లైవ్ ఆర్డర్ ట్రాకింగ్' },
  trackOrder: { en: 'Track Order', te: 'ట్రాక్ చేయండి' },
  securePayments: { en: '100% Secure Payments with UPI, Cards, Netbanking & COD', te: 'UPI, కార్డులు & క్యాష్ ఆన్ డెలివరీతో సురక్షిత చెల్లింపులు' },
  sellerTagline: { en: 'Sell across 26 districts of Andhra Pradesh & All-India', te: 'ఆంధ్రప్రదేశ్‌లోని 26 జిల్లాలకు మీ ఉత్పత్తులను విక్రయించండి' }
};

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<AppLanguage>(() => {
    return (localStorage.getItem('andhramart_lang') as AppLanguage) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('andhramart_lang', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'te' : 'en'));
  };

  const t = (key: string): string => {
    if (DICTIONARY[key]) {
      return DICTIONARY[key][language] || DICTIONARY[key].en;
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
