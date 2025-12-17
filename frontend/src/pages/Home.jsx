import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { publicAPI } from '../services/api';
import {
  BoltIcon,
  CheckCircleIcon,
  LockClosedIcon,
  GiftIcon,
  ChartBarIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';

export default function Home() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referralSettings, setReferralSettings] = useState(null);

  useEffect(() => {
    fetchActivePlans();
    fetchReferralSettings();
  }, []);

  const fetchActivePlans = async () => {
    try {
      const response = await publicAPI.getActivePlans(10, 0);
      if (response.success && response.plans) {
        setPlans(response.plans.slice(0, 6));
        
        const uniqueNetworks = [...new Set(response.plans.map(p => p.network))];
        const networkMap = {
          'MTN': { name: 'MTN', icon: 'mtn' },
          'TELECEL': { name: 'Telecel', icon: 'phone' },
          'AIRTELTIGO': { name: 'AirtelTigo', icon: 'airtel' },
        };
        
        setNetworks(uniqueNetworks.map(n => networkMap[n] || { name: n, icon: 'phone' }));
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
    }
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

  const features = [
    { icon: 'bolt', title: 'Instant Delivery', desc: 'Get data within seconds of purchase' },
    { icon: 'check', title: 'Best Rates', desc: 'Lowest prices compared to direct purchase' },
    { icon: 'lock', title: 'Secure Transactions', desc: 'Bank-level security for all payments' },
    {
      icon: 'gift',
      title: 'Referral Rewards',
      desc: referralSettings
        ? `Earn GHS ${referralSettings.amountPerReferral} per successful referral`
        : 'Earn rewards per successful referral',
    },
    { icon: 'chart', title: 'Track Everything', desc: 'View all your purchases and transactions' },
    { icon: 'card', title: 'Multiple Payment', desc: 'Accept MTN Mobile Money, Vodafone Cash' },
  ];

  const faqs = [
    { q: 'How long does delivery take?', a: 'Data is delivered instantly to your phone within seconds of purchase.' },
    { q: 'Which networks are supported?', a: 'We support MTN, Vodafone, and AirtelTigo Ghana.' },
    { q: 'Can I get a refund?', a: 'Refunds are available within 24 hours if data was not received.' },
    { q: 'What payment methods do you accept?', a: 'We accept MTN Mobile Money, Vodafone Cash, and bank transfers.' },
  ];

  return (
    <div style={{background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-primary) 100%)'}}>
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-3 sm:px-4 lg:px-6 py-8 sm:py-10">
        <div className="max-w-4xl w-full text-center">
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
            Data Bundles at <span style={{color: 'var(--primary-600)'}}>Lowest Prices</span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed" style={{color: 'var(--text-secondary)'}}>
            Get instant access to MTN, Telecel, and AirtelTigo data bundles. <br className="hidden sm:block" />
            No hidden fees, transparent pricing, guaranteed delivery.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-0">
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-primary text-base sm:text-lg px-6 sm:px-8 py-3">
                  View Dashboard →
                </Link>
                <Link to="/buy-data" className="btn btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3">
                  Buy Data Now
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary text-base sm:text-lg px-6 sm:px-8 py-3">
                  Get Started Free
                </Link>
                <Link to="/login" className="btn btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Networks Section - Only for non-logged in users */}
      {!user && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {networks.map(net => (
              <div key={net.name} className="card p-6 sm:p-8 hover:shadow-lg transition border border-slate-700 dark:border-slate-600 flex items-center gap-4">
                <div className="flex-shrink-0">
                  {net.icon === 'phone' && <DevicePhoneMobileIcon className="w-12 h-12 sm:w-14 sm:h-14" />}
                  {net.icon === 'mtn' && <SignalIcon className="w-12 h-12 sm:w-14 sm:h-14" />}
                  {net.icon === 'airtel' && <SignalIcon className="w-12 h-12 sm:w-14 sm:h-14" />}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold mb-1">{net.name}</h3>
                  <p className="text-sm sm:text-base" style={{color: 'var(--text-secondary)'}}>Fast & Reliable Data</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12">Popular Data Plans</h2>
        {loading ? (
          <div className="text-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-10 sm:h-12 w-10 sm:w-12 border-b-2 border-slate-400 dark:border-slate-600 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-sm sm:text-base" style={{color: 'var(--text-secondary)'}}>Loading available plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base mb-4" style={{color: 'var(--text-secondary)'}}>No active data plans available</p>
            {!user && (
              <Link to="/login" className="btn btn-primary">
                Sign In to View Plans
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
            {plans.map((plan) => (
              <div key={plan._id} className="p-3 sm:p-4 rounded-lg border transition hover:opacity-80 cursor-pointer" style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)'}}>
                <div className="mb-3 sm:mb-4">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <p className="text-base sm:text-lg font-bold truncate">{plan.dataSize}</p>
                      <p className="text-xs sm:text-sm truncate" style={{color: 'var(--text-secondary)'}}>
                        {plan.validity}
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded font-bold whitespace-nowrap flex-shrink-0" style={{backgroundColor: 'var(--primary-600)', color: 'white'}}>
                      {plan.network}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-end gap-2">
                  <p className="text-sm sm:text-base font-bold text-primary-600 whitespace-nowrap">
                    GHS {plan.sellingPrice.toFixed(2)}
                  </p>
                  <Link to={user ? `/buy-data?planId=${plan._id}&planName=${encodeURIComponent(plan.planName)}&dataSize=${encodeURIComponent(plan.dataSize)}&price=${plan.sellingPrice}&network=${plan.network}` : '/login'} className="btn btn-secondary text-xs sm:text-sm py-2 px-3 sm:px-4 flex-shrink-0">
                    {user ? 'Buy' : 'View'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8">Why Choose HIGHEST?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feat, idx) => (
            <div key={idx} className="p-4 sm:p-6 rounded-lg border transition hover:opacity-80" style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)'}}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                {feat.icon === 'bolt' && <BoltIcon className="w-6 h-6 sm:w-7 sm:h-7" />}
                {feat.icon === 'check' && <CheckCircleIcon className="w-6 h-6 sm:w-7 sm:h-7" />}
                {feat.icon === 'lock' && <LockClosedIcon className="w-6 h-6 sm:w-7 sm:h-7" />}
                {feat.icon === 'gift' && <GiftIcon className="w-6 h-6 sm:w-7 sm:h-7" />}
                {feat.icon === 'chart' && <ChartBarIcon className="w-6 h-6 sm:w-7 sm:h-7" />}
                {feat.icon === 'card' && <CreditCardIcon className="w-6 h-6 sm:w-7 sm:h-7" />}
              </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base sm:text-lg mb-1">{feat.title}</h3>
                  <p className="text-xs sm:text-sm" style={{color: 'var(--text-secondary)'}}>{feat.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8">Frequently Asked Questions</h2>
        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="card p-5 sm:p-6 border border-slate-700 dark:border-slate-600">
              <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3">{faq.q}</h3>
              <p className="text-sm sm:text-base" style={{color: 'var(--text-secondary)'}}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {!user && (
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 text-center">
          <div className="p-6 sm:p-8 md:p-10 lg:p-12 rounded-2xl border-2 card" style={{borderColor: 'var(--primary-600)'}}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Start Saving Today</h2>
            <p className="text-base sm:text-lg mb-6 sm:mb-8" style={{color: 'var(--text-secondary)'}}>Enjoy reliable, affordable mobile data with HIGHEST. Simple, secure, and transparent.</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link to="/register" className="btn btn-light text-base sm:text-lg px-6 sm:px-8 py-2.5 sm:py-3">
                Create Account Now
              </Link>
              <Link to="/login" className="btn btn-secondary text-base sm:text-lg px-6 sm:px-8 py-2.5 sm:py-3">
                I Already Have an Account
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="border-t" style={{borderColor: 'var(--border-color)'}}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 text-center">
          <p className="text-sm sm:text-base" style={{color: 'var(--text-secondary)'}}>© 2025 HIGHEST Data Hub. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
