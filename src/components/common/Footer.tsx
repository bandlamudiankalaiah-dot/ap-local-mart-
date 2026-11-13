import React from 'react';
import { AndhraMartLogo } from './AndhraMartLogo';
import { ShieldCheck, Truck, RotateCcw, Award, PhoneCall, Mail, MapPin, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface FooterProps {
  onNavigate: (view: 'home' | 'products' | 'orders' | 'wishlist' | 'seller' | 'admin') => void;
  onOpenCategory: (categoryId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenCategory }) => {
  const { language } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        {/* Trust Badges Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">100% Authentic AP Goods</h4>
              <p className="text-xs text-slate-400">GI Certified & Silk Mark Verified</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">1-2 Days AP Express</h4>
              <p className="text-xs text-slate-400">Free delivery on orders ₹499+</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Secure Indian Gateway</h4>
              <p className="text-xs text-slate-400">UPI, Cards, Netbanking & COD</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Hassle-Free Returns</h4>
              <p className="text-xs text-slate-400">7 Days Easy Return Guarantee</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 py-12 border-b border-slate-800 text-xs">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <AndhraMartLogo size="md" variant="light" />
            <p className="text-slate-400 leading-relaxed max-w-sm">
              AndhraMart is Andhra Pradesh’s dedicated online marketplace connecting authentic regional artisans, weavers, pickle makers, and certified local sellers with customers across all 26 districts of AP and expanding nationwide.
            </p>
            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <span className="text-xs font-semibold text-slate-200">Andhra Logistics Hubs:</span>
              <span className="bg-slate-800 px-2 py-1 rounded text-[11px] font-mono text-amber-400">Vijayawada (VJA)</span>
              <span className="bg-slate-800 px-2 py-1 rounded text-[11px] font-mono text-amber-400">Vizag (VTZ)</span>
              <span className="bg-slate-800 px-2 py-1 rounded text-[11px] font-mono text-amber-400">Tirupati (TPTY)</span>
            </div>
          </div>

          {/* Regional Categories */}
          <div>
            <h5 className="font-bold text-white uppercase tracking-wider text-xs mb-3">AP Specialties</h5>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button onClick={() => onOpenCategory('cat-ap-special')} className="hover:text-amber-400 transition">
                  Kondapalli Toys (బొమ్మలు)
                </button>
              </li>
              <li>
                <button onClick={() => onOpenCategory('cat-sweets-snacks')} className="hover:text-amber-400 transition">
                  Atreyapuram Pootharekulu
                </button>
              </li>
              <li>
                <button onClick={() => onOpenCategory('cat-handlooms')} className="hover:text-amber-400 transition">
                  Dharmavaram Silk Sarees
                </button>
              </li>
              <li>
                <button onClick={() => onOpenCategory('cat-handlooms')} className="hover:text-amber-400 transition">
                  Mangalagiri Pure Cotton
                </button>
              </li>
              <li>
                <button onClick={() => onOpenCategory('cat-groceries')} className="hover:text-amber-400 transition">
                  Guntur Teja Red Chili
                </button>
              </li>
              <li>
                <button onClick={() => onOpenCategory('cat-wellness')} className="hover:text-amber-400 transition">
                  Araku Valley Arabica Coffee
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Care & Orders */}
          <div>
            <h5 className="font-bold text-white uppercase tracking-wider text-xs mb-3">Customer Support</h5>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button onClick={() => onNavigate('orders')} className="hover:text-amber-400 transition">
                  Track Your Order
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('orders')} className="hover:text-amber-400 transition">
                  Returns & Refunds
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('wishlist')} className="hover:text-amber-400 transition">
                  My Wishlist
                </button>
              </li>
              <li>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                  1800-425-ANDHRA (Toll Free)
                </span>
              </li>
              <li>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  support@andhramart.in
                </span>
              </li>
            </ul>
          </div>

          {/* Seller & Business Portals */}
          <div>
            <h5 className="font-bold text-white uppercase tracking-wider text-xs mb-3">Seller & Admin</h5>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  id="footer-seller-link"
                  onClick={() => onNavigate('seller')}
                  className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
                >
                  <span>Become a Seller on AndhraMart</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('seller')} className="hover:text-amber-400 transition">
                  Seller KYC Guidelines
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('seller')} className="hover:text-amber-400 transition">
                  AP Artisans Program
                </button>
              </li>
              <li>
                <button
                  id="footer-admin-link"
                  onClick={() => onNavigate('admin')}
                  className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
                >
                  <span>Admin Control Center</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* AP Districts List */}
        <div className="py-6 border-b border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          <span className="font-bold text-slate-300 mr-2">Serving 26 Districts of Andhra Pradesh:</span>
          Visakhapatnam • NTR (Vijayawada) • Guntur • Tirupati • East Godavari (Rajahmundry) • Kakinada • SPSR Nellore • Kurnool • YSR Kadapa • Anantapur • Sri Sathya Sai • Krishna (Machilipatnam) • Eluru • West Godavari (Bhimavaram) • Dr. B.R. Ambedkar Konaseema • Prakasam (Ongole) • Chittoor • Annamayya • Nandyal • Bapatla • Palnadu • Anakapalli • Vizianagaram • Srikakulam • Alluri Sitharama Raju • Parvathipuram Manyam. Also delivering across Telangana, Karnataka, Tamil Nadu, and PAN-India.
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 AndhraMart Marketplace India Pvt Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer">GI Tag Compliance</span>
            <span className="hover:text-slate-300 cursor-pointer">FSSAI License #10126001000928</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
