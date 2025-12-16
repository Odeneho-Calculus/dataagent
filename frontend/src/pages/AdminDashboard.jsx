import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, Activity, ShoppingCart, Menu, Gift } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { admin as adminAPI } from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 dark:border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
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
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-bold">Admin Dashboard</h1>
        </div>
        
        <div className="flex-1 overflow-auto bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Welcome to the admin panel. Manage users, transactions, and system operations.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <button
                key={idx}
                onClick={card.action}
                className={`bg-gradient-to-br ${neutralGradient} card p-6 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition cursor-pointer text-left`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                    </p>
                  </div>
                  <div className="w-10 h-10 p-2 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Icon className={`w-6 h-6 text-slate-700 dark:text-slate-200`} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              System Balance
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Total User Balance:</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  GHS {stats?.totalBalance?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Total Referral Earnings:</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  GHS {stats?.totalReferralEarnings?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Admin Info
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Admins:</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.totalAdmins || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/users')}
            className="btn btn-primary py-3 rounded-lg font-medium transition"
          >
            Manage Users
          </button>
          <button
            onClick={() => navigate('/admin/referrals')}
            className="btn btn-secondary py-3 rounded-lg font-medium transition"
          >
            Manage Referrals
          </button>
          <button
            onClick={() => navigate('/admin/transactions')}
            className="btn btn-secondary py-3 rounded-lg font-medium transition"
          >
            View Transactions
          </button>
          <button
            onClick={() => navigate('/admin/purchases')}
            className="btn btn-secondary py-3 rounded-lg font-medium transition"
          >
            View Purchases
          </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
