import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-primary) 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {user && (
          <div className="mb-8 p-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg text-white shadow-lg">
            <p className="text-2xl font-bold mb-2">Welcome, {user.name}! 👋</p>
            <p className="text-primary-100">Your current balance: GHS {user.balance?.toFixed(2) || '0.00'}</p>
          </div>
        )}

        {!user && (
          <div className="mb-12 text-center py-20">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Fast & Reliable Data
            </h1>
            <p className="text-lg mb-8 max-w-2xl mx-auto" style={{color: 'var(--text-secondary)'}}>
              Buy MTN, TELECEL, and Airteltigo data bundles at the best prices. Get instant delivery to your mobile.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/login" className="btn btn-secondary text-lg px-8 py-3">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary text-lg px-8 py-3">
                Create Account
              </Link>
            </div>
          </div>
        )}

        {user && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/buy-data"
                className="card p-6 hover:shadow-md transition cursor-pointer"
              >
                <div className="text-3xl mb-2">📦</div>
                <h3 className="font-bold mb-1">Buy Data</h3>
                <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Purchase data bundles</p>
              </Link>
              <Link
                to="/transactions"
                className="card p-6 hover:shadow-md transition cursor-pointer"
              >
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-bold mb-1">Transactions</h3>
                <p className="text-sm" style={{color: 'var(--text-secondary)'}}>View your history</p>
              </Link>
              <Link
                to="/topup"
                className="card p-6 hover:shadow-md transition cursor-pointer"
              >
                <div className="text-3xl mb-2">💰</div>
                <h3 className="font-bold mb-1">Top Up Wallet</h3>
                <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Add funds to your account</p>
              </Link>
              <Link
                to="/profile"
                className="card p-6 hover:shadow-md transition cursor-pointer"
              >
                <div className="text-3xl mb-2">👤</div>
                <h3 className="font-bold mb-1">My Profile</h3>
                <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Manage your account</p>
              </Link>
            </div>
          </div>
        )}

        <div className="mt-16 p-8 rounded-lg card">
          <h2 className="text-2xl font-bold mb-6">Why Choose Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-bold mb-2">Instant Delivery</h3>
              <p style={{color: 'var(--text-secondary)'}}>Get your data immediately after purchase</p>
            </div>
            <div>
              <div className="text-4xl mb-3">💯</div>
              <h3 className="font-bold mb-2">Best Prices</h3>
              <p style={{color: 'var(--text-secondary)'}}>Competitive rates on all networks</p>
            </div>
            <div>
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="font-bold mb-2">Secure</h3>
              <p style={{color: 'var(--text-secondary)'}}>Your transactions are safe with us</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
