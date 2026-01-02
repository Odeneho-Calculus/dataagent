import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Copy, TrendingUp, Clock, Zap } from 'lucide-react';
import { CreditCardIcon, ChartBarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { dataplans, wallet, purchases, publicAPI } from '../services/api';
import UserLayout from '../components/UserLayout';

export default function Dashboard() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [dataBundles, setDataBundles] = useState([]);
  const [loadingBundles, setLoadingBundles] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [stats, setStats] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [referralSettings, setReferralSettings] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchReferralSettings();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true);
      await Promise.all([
        fetchActiveBundles(),
        fetchTransactionsAndStats(),
      ]);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoadingData(false);
      setLoadingBundles(false);
    }
  };

  const fetchActiveBundles = async () => {
    try {
      const response = await dataplans.list('', 'active');
      if (response.success && response.plans) {
        setDataBundles(response.plans.slice(0, 6));
      }
    } catch (err) {
      console.error('Failed to fetch bundles:', err);
    }
  };

  const fetchTransactionsAndStats = async () => {
    try {
      const [transactionsRes, purchasesRes] = await Promise.all([
        wallet.getTransactions(10, 0),
        purchases.list(10, 0),
      ]);

      const walletTransactions = transactionsRes.success ? transactionsRes.transactions || [] : [];
      const purchasesList = purchasesRes.success ? purchasesRes.purchases || [] : [];

      const getTransactionType = (tx) => {
        if (tx.type === 'wallet_topup') return 'Wallet Top-up';
        if (tx.type === 'referral_bonus') return 'Referral Bonus';
        if (tx.type === 'wallet_funding') {
          const desc = tx.description?.toLowerCase() || '';
          if (desc.includes('data purchase')) return 'Data Purchase';
          if (desc.includes('top-up') || desc.includes('topup')) return 'Wallet Top-up';
          return 'Wallet Transaction';
        }
        return 'Transaction';
      };

      const combined = [
        ...walletTransactions.map(tx => ({
          id: tx._id,
          type: getTransactionType(tx),
          description: tx.description || 'Transaction',
          amount: `${tx.amount > 0 ? '+' : ''}GHS ${Math.abs(tx.amount).toFixed(2)}`,
          date: new Date(tx.createdAt),
          dateStr: formatDate(new Date(tx.createdAt)),
          status: tx.status.charAt(0).toUpperCase() + tx.status.slice(1),
          statusRaw: tx.status,
          rawAmount: tx.amount,
        })),
        ...purchasesList.map(purchase => ({
          id: purchase._id,
          type: 'Data Purchase',
          description: `${purchase.gb}GB ${purchase.network} to ${purchase.recipient}`,
          amount: `-GHS ${purchase.price.toFixed(2)}`,
          date: new Date(purchase.createdAt),
          dateStr: formatDate(new Date(purchase.createdAt)),
          status: purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1),
          statusRaw: purchase.status,
          rawAmount: -purchase.price,
        })),
      ]
        .sort((a, b) => b.date - a.date)
        .slice(0, 6)
        .map(({ dateStr, ...rest }) => ({ ...rest, date: dateStr }));

      setRecentTransactions(combined);

      const newStats = [
        { label: 'Total Spent', value: `GHS ${(user?.totalSpent || 0).toFixed(2)}`, icon: 'card' },
        { label: 'Data Used', value: `${user?.dataUsed || 0}GB`, icon: 'chart' },
        { label: 'Referral Earnings', value: `GHS ${(user?.referralEarnings || 0).toFixed(2)}`, icon: 'users' },
      ];

      setStats(newStats);
    } catch (err) {
      console.error('Failed to fetch transactions and stats:', err);
      setRecentTransactions([]);
      setStats([
        { label: 'Total Spent', value: `GHS ${(user?.totalSpent || 0).toFixed(2)}`, icon: 'card' },
        { label: 'Data Used', value: `${user?.dataUsed || 0}GB`, icon: 'chart' },
        { label: 'Referral Earnings', value: `GHS ${(user?.referralEarnings || 0).toFixed(2)}`, icon: 'users' },
      ]);
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const fetchReferralSettings = async () => {
    try {
      const response = await publicAPI.getReferralSettings();
      if (response.success) {
        setReferralSettings(response.settings);
      }
    } catch (err) {
      console.error('Failed to fetch referral settings:', err);
    }
  };

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <UserLayout>
      <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">Dashboard</h1>
            <p className="text-sm sm:text-base truncate" style={{color: 'var(--text-secondary)'}}>Welcome back, {user?.name}!</p>
          </div>

          {/* Account Info Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
            <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-5 border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <p className="text-xs sm:text-sm truncate text-slate-600">Balance</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1 sm:mt-2 truncate bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                GHS {user?.balance?.toFixed(2) || '0.00'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-5 border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <p className="text-xs sm:text-sm truncate text-slate-600">Email</p>
              <p className="text-xs sm:text-sm font-medium mt-1 sm:mt-2 truncate text-slate-900" title={user?.email}>
                {user?.email}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-5 border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <p className="text-xs sm:text-sm truncate text-slate-600">Phone</p>
              <p className="text-xs sm:text-sm font-medium mt-1 sm:mt-2 truncate text-slate-900">
                {user?.phone || 'Not set'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-5 border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <p className="text-xs sm:text-sm truncate text-slate-600">Referral</p>
              <button
                onClick={copyReferralCode}
                className="text-xs sm:text-sm font-bold text-blue-600 mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2 hover:opacity-80 transition truncate max-w-full"
              >
                <span className="truncate">{user?.referralCode}</span>
                <Copy size={12} className="flex-shrink-0" />
              </button>
              {copied && <p className="text-xs text-green-500 mt-1">Copied!</p>}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
            {loadingData ? (
              <div className="col-span-2 text-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-xs sm:text-sm text-slate-600">Loading stats...</p>
              </div>
            ) : (
              stats.map((stat, idx) => (
                <div key={idx} className={`bg-white rounded-2xl p-4 sm:p-5 lg:p-6 border-2 border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 ${idx === stats.length - 1 ? 'col-span-2' : ''}`}>
                  <div className="mb-2 sm:mb-3 inline-flex p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {stat.icon === 'card' && <CreditCardIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                    {stat.icon === 'chart' && <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                    {stat.icon === 'users' && <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </div>
                  <p className="text-xs sm:text-sm truncate text-slate-600">{stat.label}</p>
                  <p className="text-base sm:text-lg lg:text-xl font-bold mt-1 sm:mt-2 truncate text-slate-900">{stat.value}</p>
                </div>
              ))
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6">
            {/* Data Bundles */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 border-2 border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold truncate text-slate-900">Available Data Bundles</h2>
                </div>
                {loadingBundles ? (
                  <div className="text-center py-6 sm:py-8">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-xs sm:text-sm text-slate-600">Loading bundles...</p>
                  </div>
                ) : dataBundles.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <p className="text-xs sm:text-sm text-slate-600">No active data plans available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                    {dataBundles.map(bundle => (
                      <Link 
                        key={bundle._id} 
                        to={`/buy-data?planId=${bundle._id}&planName=${encodeURIComponent(bundle.planName)}&dataSize=${encodeURIComponent(bundle.dataSize)}&price=${bundle.sellingPrice}&network=${bundle.network}`}
                        className="p-3 sm:p-4 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-blue-400 hover:shadow-lg bg-white transition-all duration-300">
                        <div className="mb-2 sm:mb-3">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div>
                              <p className="text-base sm:text-lg font-bold truncate text-slate-900">{bundle.dataSize}</p>
                              <p className="text-xs sm:text-sm truncate text-slate-600">
                                {bundle.validity}
                              </p>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-lg whitespace-nowrap flex-shrink-0 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold">
                              {bundle.network}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-end gap-2">
                          <p className="text-sm sm:text-base font-bold text-blue-600 whitespace-nowrap">
                            GHS {bundle.sellingPrice.toFixed(2)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
                <h3 className="font-bold text-sm sm:text-base mb-3 sm:mb-4 text-slate-900">Quick Actions</h3>
                <div className="space-y-2">
                  <Link to="/buy-data" className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 hover:shadow-lg transition cursor-pointer border border-blue-200">
                    <Zap size={16} className="flex-shrink-0 sm:w-[18px] sm:h-[18px] text-blue-600" />
                    <span className="text-xs sm:text-sm truncate font-medium text-slate-900">Buy Data</span>
                  </Link>
                  <Link to="/topup" className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 hover:shadow-lg transition cursor-pointer border border-blue-200">
                    <TrendingUp size={16} className="flex-shrink-0 sm:w-[18px] sm:h-[18px] text-blue-600" />
                    <span className="text-xs sm:text-sm truncate font-medium text-slate-900">Top Up Wallet</span>
                  </Link>
                  <Link to="/transactions" className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 hover:shadow-lg transition cursor-pointer border border-blue-200">
                    <Clock size={16} className="flex-shrink-0 sm:w-[18px] sm:h-[18px] text-blue-600" />
                    <span className="text-xs sm:text-sm truncate font-medium text-slate-900">View History</span>
                  </Link>
                </div>
              </div>

              {/* Referral Bonus */}
              <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-4 sm:p-6 shadow-xl">
                <h3 className="font-bold text-sm sm:text-base mb-3 sm:mb-4 text-white">Referral Bonus</h3>
                <p className="text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3 text-blue-100">
                  {referralSettings
                    ? `Earn GHS ${referralSettings.amountPerReferral} for every friend you refer. Share your code and grow your balance!`
                    : 'Earn rewards for every friend you refer. Share your code and grow your balance!'}
                </p>
                <button
                  onClick={copyReferralCode}
                  className="w-full px-4 py-2.5 bg-white text-slate-900 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 text-xs sm:text-sm"
                >
                  Share Code
                </button>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 border-2 border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6 text-slate-900">Recent Transactions</h2>
            {loadingData ? (
              <div className="text-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-xs sm:text-sm text-slate-600">Loading transactions...</p>
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <p className="text-xs sm:text-sm text-slate-600">No transactions yet</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{borderBottom: '2px solid #e5e7eb'}}>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                        <th className="text-left py-3 px-4 font-medium" style={{color: 'var(--text-secondary)'}}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map(tx => (
                        <tr key={tx.id} style={{borderBottom: '1px solid var(--border-color)'}}>
                          <td className="py-3 px-4 truncate max-w-[200px]">{tx.type}</td>
                          <td className="py-3 px-4 font-medium whitespace-nowrap" style={{color: tx.rawAmount < 0 ? '#ef4444' : '#22c55e'}}>
                            {tx.amount}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">{tx.date}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap inline-block ${
                              tx.statusRaw === 'completed' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : tx.statusRaw === 'failed'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            }`}>
                              ✓ {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {recentTransactions.map(tx => (
                    <div key={tx.id} className="p-3 rounded-lg" style={{backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)'}}>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="text-xs sm:text-sm font-medium truncate flex-1">{tx.type}</span>
                        <span className={`text-xs sm:text-sm font-bold whitespace-nowrap flex-shrink-0 ${tx.rawAmount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {tx.amount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2 text-xs" style={{color: 'var(--text-secondary)'}}>
                        <span className="truncate">{tx.date}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                          tx.statusRaw === 'completed' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : tx.statusRaw === 'failed'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-center">
                  <Link to="/transactions" className="btn btn-ghost text-xs sm:text-sm">
                    View All Transactions
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}