import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Copy, TrendingUp, Clock, Zap } from 'lucide-react';
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
        { label: 'Total Spent', value: `GHS ${(user?.totalSpent || 0).toFixed(2)}`, icon: '💳' },
        { label: 'Data Used', value: `${user?.dataUsed || 0}GB`, icon: '📊' },
        { label: 'Referral Earnings', value: `GHS ${(user?.referralEarnings || 0).toFixed(2)}`, icon: '👥' },
      ];

      setStats(newStats);
    } catch (err) {
      console.error('Failed to fetch transactions and stats:', err);
      setRecentTransactions([]);
      setStats([
        { label: 'Total Spent', value: `GHS ${(user?.totalSpent || 0).toFixed(2)}`, icon: '💳' },
        { label: 'Data Used', value: `${user?.dataUsed || 0}GB`, icon: '📊' },
        { label: 'Referral Earnings', value: `GHS ${(user?.referralEarnings || 0).toFixed(2)}`, icon: '👥' },
      ]);
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
      <div className="min-h-screen" style={{background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-primary) 100%)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard</h1>
          <p style={{color: 'var(--text-secondary)'}}>Welcome back, {user?.name}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-6">
            <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Account Balance</p>
            <p className="text-2xl font-bold mt-2">
              GHS {user?.balance?.toFixed(2) || '0.00'}
            </p>
          </div>

          <div className="card p-6">
            <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Email</p>
            <p className="text-sm font-medium mt-2 truncate">
              {user?.email}
            </p>
          </div>

          <div className="card p-6">
            <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Phone</p>
            <p className="text-sm font-medium mt-2">
              {user?.phone || 'Not set'}
            </p>
          </div>

          <div className="card p-6">
            <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Referral Code</p>
            <button
              onClick={copyReferralCode}
              className="text-sm font-bold text-primary-600 mt-2 flex items-center gap-2 hover:opacity-80 transition"
            >
              {user?.referralCode}
              <Copy size={14} />
            </button>
            {copied && <p className="text-xs text-green-500 mt-1">Copied!</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {loadingData ? (
            <div className="col-span-3 text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 dark:border-slate-600 mx-auto mb-2"></div>
              <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Loading stats...</p>
            </div>
          ) : (
            stats.map((stat, idx) => (
              <div key={idx} className="card p-6">
                <div className="text-3xl mb-3">{stat.icon}</div>
                <p className="text-sm" style={{color: 'var(--text-secondary)'}}>{stat.label}</p>
                <p className="text-xl font-bold mt-2">{stat.value}</p>
              </div>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="card p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Available Data Bundles</h2>
                <Link to="/buy-data" className="btn btn-primary text-sm">
                  Buy Now
                </Link>
              </div>
              {loadingBundles ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 dark:border-slate-600 mx-auto mb-2"></div>
                  <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Loading available bundles...</p>
                </div>
              ) : dataBundles.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm" style={{color: 'var(--text-secondary)'}}>No active data plans available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dataBundles.map(bundle => (
                    <div key={bundle._id} className="p-4 rounded-lg" style={{backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)'}}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold">{bundle.planName}</h3>
                          <p className="text-sm" style={{color: 'var(--text-secondary)'}}>{bundle.dataSize}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded" style={{backgroundColor: 'var(--primary-600)', color: 'white'}}>
                          {bundle.network}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-primary-600">GHS {bundle.sellingPrice.toFixed(2)}</p>
                        <Link to="/buy-data" className="btn btn-secondary text-xs">Get</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="card p-6 mb-6">
              <h3 className="font-bold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/buy-data" className="flex items-center gap-3 p-3 rounded-lg hover:opacity-80 transition" style={{backgroundColor: 'var(--bg-secondary)'}}>
                  <Zap size={18} style={{color: 'var(--primary-600)'}} />
                  <span className="text-sm">Buy Data</span>
                </Link>
                <Link to="/topup" className="flex items-center gap-3 p-3 rounded-lg hover:opacity-80 transition" style={{backgroundColor: 'var(--bg-secondary)'}}>
                  <TrendingUp size={18} style={{color: 'var(--primary-600)'}} />
                  <span className="text-sm">Top Up Wallet</span>
                </Link>
                <Link to="/transactions" className="flex items-center gap-3 p-3 rounded-lg hover:opacity-80 transition" style={{backgroundColor: 'var(--bg-secondary)'}}>
                  <Clock size={18} style={{color: 'var(--primary-600)'}} />
                  <span className="text-sm">View History</span>
                </Link>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold mb-4">Referral Bonus</h3>
              <p className="text-sm mb-4" style={{color: 'var(--text-secondary)'}}>
                {referralSettings
                  ? `Earn GHS ${referralSettings.amountPerReferral} for every friend you refer. Share your code and grow your balance!`
                  : 'Earn rewards for every friend you refer. Share your code and grow your balance!'}
              </p>
              <button
                onClick={copyReferralCode}
                className="btn btn-primary w-full text-sm"
              >
                Share Code
              </button>
            </div>
          </div>
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-bold mb-6">Recent Transactions</h2>
          {loadingData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 dark:border-slate-600 mx-auto mb-2"></div>
              <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Loading transactions...</p>
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm" style={{color: 'var(--text-secondary)'}}>No transactions yet</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{borderBottom: '1px solid var(--border-color)'}}>
                      <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Type</th>
                      <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Amount</th>
                      <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Date</th>
                      <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map(tx => (
                      <tr key={tx.id} style={{borderBottom: '1px solid var(--border-color)'}}>
                        <td className="py-3 px-4">{tx.type}</td>
                        <td className="py-3 px-4 font-medium" style={{color: tx.rawAmount < 0 ? '#ef4444' : '#22c55e'}}>
                          {tx.amount}
                        </td>
                        <td className="py-3 px-4">{tx.date}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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
              <div className="mt-4 text-center">
                <Link to="/transactions" className="btn btn-ghost text-sm">
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
