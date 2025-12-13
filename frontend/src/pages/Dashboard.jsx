import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Copy, TrendingUp, Clock, Zap } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const dataBundles = [
    { id: 1, name: 'Lite', size: '100MB', price: 'GHS 0.99', network: 'MTN' },
    { id: 2, name: 'Basic', size: '500MB', price: 'GHS 2.99', network: 'MTN' },
    { id: 3, name: 'Standard', size: '1GB', price: 'GHS 4.99', network: 'MTN' },
    { id: 4, name: 'Plus', size: '2GB', price: 'GHS 8.99', network: 'Vodafone' },
    { id: 5, name: 'Pro', size: '5GB', price: 'GHS 19.99', network: 'Vodafone' },
    { id: 6, name: 'Max', size: '10GB', price: 'GHS 34.99', network: 'AirtelTigo' },
  ];

  const recentTransactions = [
    { id: 1, type: 'Data Purchase', amount: '-GHS 4.99', date: '2 hours ago', status: 'Completed' },
    { id: 2, type: 'Wallet Top-up', amount: '+GHS 50.00', date: '1 day ago', status: 'Completed' },
    { id: 3, type: 'Data Purchase', amount: '-GHS 8.99', date: '3 days ago', status: 'Completed' },
  ];

  const stats = [
    { label: 'Total Spent', value: 'GHS 1,250.50', icon: '💳' },
    { label: 'Data Used', value: '45.5GB', icon: '📊' },
    { label: 'Referrals', value: '12', icon: '👥' },
  ];

  return (
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
          {stats.map((stat, idx) => (
            <div key={idx} className="card p-6">
              <div className="text-3xl mb-3">{stat.icon}</div>
              <p className="text-sm" style={{color: 'var(--text-secondary)'}}>{stat.label}</p>
              <p className="text-xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataBundles.map(bundle => (
                  <div key={bundle.id} className="p-4 rounded-lg" style={{backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)'}}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold">{bundle.name}</h3>
                        <p className="text-sm" style={{color: 'var(--text-secondary)'}}>{bundle.size}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded" style={{backgroundColor: 'var(--primary-600)', color: 'white'}}>
                        {bundle.network}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-primary-600">{bundle.price}</p>
                      <button className="btn btn-secondary text-xs">Get</button>
                    </div>
                  </div>
                ))}
              </div>
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
                Earn GHS 1 for every friend you refer. Share your code and grow your balance!
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
                    <td className="py-3 px-4 font-medium">{tx.amount}</td>
                    <td className="py-3 px-4">{tx.date}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs" style={{backgroundColor: 'var(--bg-secondary)'}}>
                        {tx.status}
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
        </div>
      </div>
    </div>
  );
}
