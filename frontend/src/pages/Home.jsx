import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  const networks = [
    { name: 'MTN', icon: '🔴', color: 'from-red-500 to-orange-500' },
    { name: 'Vodafone', icon: '📱', color: 'from-red-600 to-red-700' },
    { name: 'AirtelTigo', icon: '🟢', color: 'from-green-500 to-green-600' },
  ];

  const plans = [
    { size: '100MB', price: '₵0.99', desc: 'Perfect for browsing', network: 'MTN' },
    { size: '500MB', price: '₵2.99', desc: 'Videos & social media', network: 'MTN' },
    { size: '1GB', price: '₵4.99', desc: 'Daily usage', network: 'MTN' },
    { size: '2GB', price: '₵8.99', desc: 'Streaming ready', network: 'Vodafone' },
    { size: '5GB', price: '₵19.99', desc: 'Unlimited streaming', network: 'Vodafone' },
    { size: '10GB', price: '₵34.99', desc: 'Heavy users', network: 'AirtelTigo' },
  ];

  const features = [
    { icon: '⚡', title: 'Instant Delivery', desc: 'Get data within seconds of purchase' },
    { icon: '💯', title: 'Best Rates', desc: 'Lowest prices compared to direct purchase' },
    { icon: '🔒', title: 'Secure Transactions', desc: 'Bank-level security for all payments' },
    { icon: '🎁', title: 'Referral Rewards', desc: 'Earn GHS 1 per successful referral' },
    { icon: '📊', title: 'Track Everything', desc: 'View all your purchases and transactions' },
    { icon: '💳', title: 'Multiple Payment', desc: 'Accept MTN Mobile Money, Vodafone Cash' },
  ];

  const faqs = [
    { q: 'How long does delivery take?', a: 'Data is delivered instantly to your phone within seconds of purchase.' },
    { q: 'Which networks are supported?', a: 'We support MTN, Vodafone, and AirtelTigo Ghana.' },
    { q: 'Can I get a refund?', a: 'Refunds are available within 24 hours if data was not received.' },
    { q: 'What payment methods do you accept?', a: 'We accept MTN Mobile Money, Vodafone Cash, and bank transfers.' },
  ];

  return (
    <div style={{background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-primary) 100%)'}}>
      {user && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 p-6 md:p-8 bg-gradient-to-r from-primary-500 via-accent-500 to-orange-500 rounded-lg text-white shadow-lg">
            <p className="text-2xl md:text-3xl font-bold mb-2">Welcome, {user.name}! 👋</p>
            <p>Your current balance: GHS {user.balance?.toFixed(2) || '0.00'}</p>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/buy-data"
                className="card p-6 hover:shadow-md transition cursor-pointer group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition">📦</div>
                <h3 className="font-bold mb-1">Buy Data</h3>
                <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Purchase bundles</p>
              </Link>
              <Link
                to="/transactions"
                className="card p-6 hover:shadow-md transition cursor-pointer group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition">📊</div>
                <h3 className="font-bold mb-1">Transactions</h3>
                <p className="text-sm" style={{color: 'var(--text-secondary)'}}>View history</p>
              </Link>
              <Link
                to="/topup"
                className="card p-6 hover:shadow-md transition cursor-pointer group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition">💰</div>
                <h3 className="font-bold mb-1">Top Up Wallet</h3>
                <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Add funds</p>
              </Link>
              <Link
                to="/profile"
                className="card p-6 hover:shadow-md transition cursor-pointer group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition">👤</div>
                <h3 className="font-bold mb-1">My Profile</h3>
                <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Settings</p>
              </Link>
            </div>
          </div>
        </div>
      )}

      {!user && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-20 md:py-32 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              Cheapest Data <br /> in Ghana
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto" style={{color: 'var(--text-secondary)'}}>
              Buy MTN, Vodafone, and AirtelTigo data bundles instantly at unbeatable prices. Get immediate delivery with full transparency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn btn-primary text-lg px-8 py-3">
                Get Started Free
              </Link>
              <Link to="/login" className="btn btn-secondary text-lg px-8 py-3">
                Sign In
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-16">
            {networks.map(net => (
              <div key={net.name} className="card p-8 text-center hover:shadow-lg transition">
                <div className="text-5xl mb-4">{net.icon}</div>
                <h3 className="text-xl font-bold mb-2">{net.name}</h3>
                <p style={{color: 'var(--text-secondary)'}}>Fast & Reliable Data</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Popular Data Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, idx) => (
            <div key={idx} className="card p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-2xl font-bold">{plan.size}</p>
                  <p className="text-sm" style={{color: 'var(--text-secondary)'}}>{plan.desc}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded font-bold" style={{backgroundColor: 'var(--primary-600)', color: 'white'}}>
                  {plan.network}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-2xl font-bold text-primary-600">{plan.price}</p>
                <button className="btn btn-secondary text-sm">
                  {user ? 'Buy Now' : 'View'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose HIGHEST?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => (
            <div key={idx} className="card p-6">
              <div className="text-4xl mb-4">{feat.icon}</div>
              <h3 className="font-bold text-lg mb-2">{feat.title}</h3>
              <p style={{color: 'var(--text-secondary)'}}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="card p-6">
              <h3 className="font-bold mb-3">{faq.q}</h3>
              <p style={{color: 'var(--text-secondary)'}}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {!user && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="card p-8 md:p-12 bg-gradient-to-r from-primary-500 to-accent-500 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Save on Data?</h2>
            <p className="text-lg mb-8 opacity-90">Join thousands of Ghanaians already saving money with HIGHEST</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn btn-light text-lg px-8 py-3">
                Create Account Now
              </Link>
              <Link to="/login" className="btn btn-secondary text-lg px-8 py-3">
                I Already Have an Account
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="border-t" style={{borderColor: 'var(--border-color)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p style={{color: 'var(--text-secondary)'}}>© 2025 HIGHEST Data Hub. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
