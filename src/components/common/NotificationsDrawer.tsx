import React, { useState, useEffect } from 'react';
import { X, Bell, Package, Tag, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AppNotification } from '../../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateOrders: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateOrders
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (isOpen) {
      api.getNotifications(user?.id)
        .then(res => setNotifications(res.notifications || []))
        .catch(() => {});
    }
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-700" />
            <h3 className="font-bold text-base text-slate-900">Notifications & Alerts</h3>
          </div>
          <button
            id="close-notifications-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
              No notifications yet.
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-amber-300 transition shadow-2xs space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {notif.type === 'ORDER' ? (
                      <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                        <Package className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                        <Tag className="w-4 h-4" />
                      </span>
                    )}
                    <h4 className="font-bold text-xs text-slate-900">{notif.title}</h4>
                  </div>
                  <span className="text-[10px] text-slate-400">Just now</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pl-8">
                  {notif.message}
                </p>

                {notif.type === 'ORDER' && (
                  <div className="pl-8 pt-1">
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateOrders();
                      }}
                      className="text-[11px] text-amber-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Track Shipment Live</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
