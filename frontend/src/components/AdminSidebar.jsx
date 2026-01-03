import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, TrendingUp, ShoppingCart, X, Database, Gift, Package, Wallet, Bell } from 'lucide-react';

export default function AdminSidebar({ isOpen, onClose }) {
  const location = useLocation();

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/dataplans', label: 'Data Plans', icon: Database },
    { path: '/admin/transactions', label: 'Transactions', icon: TrendingUp },
    { path: '/admin/orders', label: 'Orders', icon: Package },
    { path: '/admin/referrals', label: 'Referral Program', icon: Gift },
    { path: '/admin/purchases', label: 'Purchases', icon: ShoppingCart },
    { path: '/admin/topza-settings', label: 'Topza Wallet', icon: Wallet },
    { path: '/admin/notifications', label: 'Notifications', icon: Bell },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed top-16 left-0 lg:top-16 h-[calc(100vh-64px)] w-64 z-50 transition-transform bg-white border-r-2 border-slate-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="lg:hidden flex items-center justify-end p-4 border-b-2 border-slate-200">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-600"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose()}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    active
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 text-xs border-t-2 border-slate-200 text-slate-600">
            <p>Admin Dashboard v1.0</p>
          </div>
        </div>
      </aside>

      <div className="lg:w-64 flex-shrink-0" />
    </>
  );
}
