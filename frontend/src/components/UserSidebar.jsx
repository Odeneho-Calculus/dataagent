import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, TrendingUp, Wallet, User, Menu, X } from 'lucide-react';

export default function UserSidebar({ isOpen, onClose }) {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/buy-data', label: 'Buy Data', icon: ShoppingCart },
    { path: '/orders', label: 'My Orders', icon: Package },
    { path: '/transactions', label: 'Transaction History', icon: TrendingUp },
    { path: '/topup', label: 'Wallet', icon: Wallet },
    { path: '/profile', label: 'Profile', icon: User },
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
        className={`fixed top-16 left-0 h-[calc(100vh-64px)] w-64 z-50 transition-transform bg-white border-r-2 border-slate-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
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
            <p>v1.0</p>
          </div>
        </div>
      </aside>

      <div className="lg:w-64 flex-shrink-0" />
    </>
  );
}
