import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, TrendingUp, ShoppingCart, Menu, X, Database, Gift, Package, Wallet } from 'lucide-react';

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
        className={`fixed top-0 left-0 h-screen w-64 z-50 transition-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderRight: '1px solid var(--border-color)'
        }}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between" style={{borderBottom: '1px solid var(--border-color)'}}>
            <Link to="/admin" className="flex items-center gap-2 hover:opacity-80 transition">
              <span className="text-2xl">👑</span>
              <span className="font-bold" style={{color: 'var(--text-primary)'}}>Admin</span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg"
              style={{color: 'var(--text-primary)'}}
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
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition"
                  style={active ? {
                    backgroundColor: '#5a1bff',
                    color: 'white'
                  } : {
                    color: 'var(--text-secondary)'
                  }}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 text-xs" style={{borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)'}}>
            <p>Admin Dashboard v1.0</p>
          </div>
        </div>
      </aside>

      <div className="lg:w-64 flex-shrink-0" />
    </>
  );
}
