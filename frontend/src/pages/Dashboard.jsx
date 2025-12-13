import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-primary) 100%)'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

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
            <p className="text-sm font-bold text-primary-600 mt-2">
              {user?.referralCode}
            </p>
          </div>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-bold mb-4">Coming Soon</h2>
          <p style={{color: 'var(--text-secondary)'}}>
            More features and sections will be added to your dashboard soon.
          </p>
        </div>
      </div>
    </div>
  );
}
