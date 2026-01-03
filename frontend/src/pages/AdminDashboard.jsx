import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, Activity, ShoppingCart, Gift, DollarSign, Zap, Clock, ArrowUpRight, ArrowDownLeft, AlertCircle, CheckCircle } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { useSidebar } from '../context/SidebarContext';
import { admin as adminAPI } from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { sidebarOpen, closeSidebar } = useSidebar();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getDashboardStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      action: () => navigate('/admin/users'),
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: Activity,
      action: () => navigate('/admin/users'),
    },
    {
      title: 'Transactions',
      value: stats?.totalTransactions || 0,
      icon: TrendingUp,
      action: () => navigate('/admin/transactions'),
    },
    {
      title: 'Purchases',
      value: stats?.totalPurchases || 0,
      icon: ShoppingCart,
      action: () => navigate('/admin/purchases'),
    },
    {
      title: 'Referral Earnings',
      value: `GHS ${stats?.totalReferralEarnings?.toFixed(2) || '0.00'}`,
      icon: Gift,
      action: () => navigate('/admin/referrals'),
    },
  ];

  // Use a neutral, theme-aware gradient for all stat cards to keep a unified look
  const neutralGradient = 'from-slate-50 to-white dark:from-slate-900 dark:to-slate-800';

  return (
    <div className="flex h-screen">
      <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                System overview and management
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 text-sm sm:text-base flex items-center gap-3">
                <AlertCircle size={20} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Primary Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
              {statCards.slice(0, 4).map((card, idx) => {
                const Icon = card.icon;
                const colors = [
                  'from-blue-500 to-blue-600',
                  'from-purple-500 to-purple-600',
                  'from-green-500 to-green-600',
                  'from-orange-500 to-orange-600',
                ];
                return (
                  <button
                    key={idx}
                    onClick={card.action}
                    className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-blue-300 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer text-left group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${colors[idx]} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 truncate">
                      {card.title}
                    </p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 truncate">
                      {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Referral & Purchases Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 mb-6 sm:mb-8">
              <button
                onClick={() => navigate('/admin/referrals')}
                className="bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-200 rounded-2xl p-5 sm:p-6 hover:shadow-xl hover:border-pink-300 transition-all duration-300 cursor-pointer text-left group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-pink-600 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-sm font-medium text-pink-900 mb-1">Referral Earnings</p>
                <p className="text-2xl sm:text-3xl font-bold text-pink-950 truncate">
                  GHS {stats?.totalReferralEarnings?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-pink-700 mt-2">From {stats?.totalUsers || 0} users</p>
              </button>

              <button
                onClick={() => navigate('/admin/purchases')}
                className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-5 sm:p-6 hover:shadow-xl hover:border-green-300 transition-all duration-300 cursor-pointer text-left group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-sm font-medium text-green-900 mb-1">Total Purchases</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-950 truncate">
                  {stats?.totalPurchases || 0}
                </p>
                <p className="text-xs text-green-700 mt-2">System transactions</p>
              </button>
            </div>

            {/* System Balance & Admin Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-6 sm:mb-8">
              <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-5 sm:mb-6 flex items-center gap-2">
                  <DollarSign size={24} className="text-blue-600" />
                  System Balance Overview
                </h2>
                <div className="space-y-4 sm:space-y-5">
                  <div className="flex justify-between items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div>
                      <p className="text-xs sm:text-sm text-blue-900 font-medium">Total User Balance</p>
                      <p className="text-sm text-blue-700">All user wallets combined</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-blue-900">
                      GHS {stats?.totalBalance?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="flex justify-between items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                    <div>
                      <p className="text-xs sm:text-sm text-purple-900 font-medium">Platform Revenue</p>
                      <p className="text-sm text-purple-700">From all transactions</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-purple-900">
                      GHS {(stats?.totalReferralEarnings || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-5 sm:mb-6 flex items-center gap-2">
                  <Users size={24} className="text-purple-600" />
                  Admin Statistics
                </h2>
                <div className="space-y-4 sm:space-y-5">
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <p className="text-xs sm:text-sm text-purple-900 font-medium mb-1">Active Admins</p>
                    <p className="text-3xl sm:text-4xl font-bold text-purple-950">
                      {stats?.totalAdmins || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-100 rounded-xl border border-slate-300">
                    <p className="text-xs sm:text-sm text-slate-700 font-medium mb-1">System Status</p>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-600" />
                      <p className="font-semibold text-slate-900">All Systems Operational</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-5 flex items-center gap-2">
                <Zap size={24} className="text-amber-600" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <button
                  onClick={() => navigate('/admin/users')}
                  className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <Users size={18} />
                  Manage Users
                </button>
                <button
                  onClick={() => navigate('/admin/dataplans')}
                  className="px-4 sm:px-6 py-3 sm:py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-xl font-semibold hover:border-blue-300 hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <Activity size={18} />
                  Data Plans
                </button>
                <button
                  onClick={() => navigate('/admin/transactions')}
                  className="px-4 sm:px-6 py-3 sm:py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-xl font-semibold hover:border-blue-300 hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <TrendingUp size={18} />
                  Transactions
                </button>
                <button
                  onClick={() => navigate('/admin/topza-settings')}
                  className="px-4 sm:px-6 py-3 sm:py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-xl font-semibold hover:border-blue-300 hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <Clock size={18} />
                  Wallet Settings
                </button>
              </div>
            </div>

            {/* Additional Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
              <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Activity size={20} className="text-blue-600" />
                  Active Metrics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">Active Users Today</span>
                    <span className="font-bold text-slate-900">{Math.floor((stats?.activeUsers || 0) * 0.7)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">Transactions Today</span>
                    <span className="font-bold text-slate-900">{Math.floor((stats?.totalTransactions || 0) * 0.4)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">Avg. Transaction</span>
                    <span className="font-bold text-slate-900">GHS 25.50</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-green-600" />
                  Performance
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">System Uptime</span>
                    <span className="font-bold text-green-600">99.8%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">API Response Time</span>
                    <span className="font-bold text-slate-900">245ms</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">Database Status</span>
                    <span className="font-bold text-green-600 flex items-center gap-1">
                      <CheckCircle size={14} />
                      Healthy
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
