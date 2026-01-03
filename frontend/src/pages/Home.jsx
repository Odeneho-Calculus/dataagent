import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { publicAPI } from '../services/api';
import { useMetaTags } from '../hooks/useMetaTags';
import { 
  Zap, 
  Shield, 
  TrendingDown, 
  Gift, 
  BarChart3, 
  CreditCard,
  Smartphone,
  Radio,
  CheckCircle2,
  ArrowRight,
  Star,
  Lock
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referralSettings, setReferralSettings] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 50000,
    totalOrdersCompleted: 2000000,
    successRate: 99.9,
  });

  useMetaTags({
    title: 'Buy Data Bundles Online',
    description: 'Get instant access to MTN, Telecel, and AirtelTigo data bundles. No hidden fees, transparent pricing, guaranteed delivery.',
    url: `${import.meta.env.VITE_APP_URL || 'https://desnethub.onrender.com'}/`,
    type: 'website',
  });

  useEffect(() => {
    fetchActivePlans();
    fetchReferralSettings();
    fetchPublicStats();
  }, []);

  const fetchActivePlans = async () => {
    try {
      const response = await publicAPI.getActivePlans(10, 0);
      if (response.success && response.plans) {
        setPlans(response.plans.slice(0, 6));
        
        const uniqueNetworks = [...new Set(response.plans.map(p => p.network))];
        const networkMap = {
          'MTN': { name: 'MTN', icon: 'mtn', color: 'from-yellow-500 to-yellow-600' },
          'TELECEL': { name: 'Telecel', icon: 'phone', color: 'from-red-500 to-red-600' },
          'AIRTELTIGO': { name: 'AirtelTigo', icon: 'airtel', color: 'from-blue-500 to-blue-600' },
        };
        
        setNetworks(uniqueNetworks.map(n => networkMap[n] || { name: n, icon: 'phone', color: 'from-slate-500 to-slate-600' }));
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

  const fetchPublicStats = async () => {
    try {
      console.log('Fetching public stats...');
      const response = await publicAPI.getPublicStats();
      console.log('Public stats response:', response);
      if (response.success && response.stats) {
        console.log('Setting stats:', response.stats);
        setStats(response.stats);
      } else {
        console.log('Response not successful or no stats:', response);
      }
    } catch (err) {
      console.error('Failed to fetch public stats:', err);
    }
  };

  const features = [
    { icon: Zap, title: 'Instant Delivery', desc: 'Get data within seconds of purchase', gradient: 'from-orange-500 to-pink-500' },
    { icon: TrendingDown, title: 'Best Rates', desc: 'Lowest prices compared to direct purchase', gradient: 'from-green-500 to-emerald-500' },
    { icon: Lock, title: 'Secure Transactions', desc: 'Bank-level security for all payments', gradient: 'from-blue-500 to-cyan-500' },
    {
      icon: Gift,
      title: 'Referral Rewards',
      desc: referralSettings
        ? `Earn GHS ${referralSettings.amountPerReferral} per successful referral`
        : 'Earn rewards per successful referral',
      gradient: 'from-purple-500 to-pink-500'
    },
    { icon: BarChart3, title: 'Track Everything', desc: 'View all your purchases and transactions', gradient: 'from-indigo-500 to-purple-500' },
    { icon: CreditCard, title: 'Multiple Payment', desc: 'Accept MTN Mobile Money, Vodafone Cash', gradient: 'from-teal-500 to-cyan-500' },
  ];

  const faqs = [
    { q: 'How long does delivery take?', a: 'Data is delivered instantly to your phone within seconds of purchase.' },
    { q: 'Which networks are supported?', a: 'We support MTN, Vodafone, and AirtelTigo Ghana.' },
    { q: 'Can I get a refund?', a: 'Refunds are available within 24 hours if data was not received.' },
    { q: 'What payment methods do you accept?', a: 'We accept MTN Mobile Money, Vodafone Cash, and bank transfers.' },
  ];

  const getNetworkColor = (network) => {
    const colors = {
      'MTN': 'from-yellow-500 to-yellow-600',
      'TELECEL': 'from-red-500 to-red-600',
      'AIRTELTIGO': 'from-blue-500 to-blue-600'
    };
    return colors[network] || 'from-slate-500 to-slate-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-6">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium text-slate-700">Trusted by {stats.totalUsers.toLocaleString()}+ customers</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Data Bundles
              </span>
              <br />
              <span className="text-slate-900">at Lowest Prices</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Get instant access to MTN, Telecel, and AirtelTigo data bundles with transparent pricing and guaranteed delivery
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link to="/dashboard" className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center gap-2">
                    View Dashboard
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link to="/buy-data" className="px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold border-2 border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
                    Buy Data Now
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center gap-2">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link to="/login" className="px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold border-2 border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Networks Section - Only for non-logged in users */}
      {!user && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {networks.map((net) => (
              <div key={net.name} className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${net.color} shadow-lg`}>
                    {net.icon === 'phone' && <Smartphone className="w-6 h-6 text-white" />}
                    {net.icon === 'mtn' && <Radio className="w-6 h-6 text-white" />}
                    {net.icon === 'airtel' && <Radio className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{net.name}</h3>
                    <p className="text-sm text-slate-500">Fast & Reliable Data</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular Plans */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3">Popular Data Plans</h2>
          <p className="text-lg text-slate-600">Choose from our best-selling data bundles</p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading available plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-600 mb-6">No active data plans available</p>
            {!user && (
              <Link to="/login" className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300">
                Sign In to View Plans
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map((plan) => (
              <Link 
                key={plan._id} 
                to={user ? `/buy-data?planId=${plan._id}&planName=${encodeURIComponent(plan.planName)}&dataSize=${encodeURIComponent(plan.dataSize)}&price=${plan.sellingPrice}&network=${plan.network}` : '/login'} 
                className="group relative bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 cursor-pointer"
              >
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${getNetworkColor(plan.network)}`}>
                    {plan.network}
                  </span>
                </div>

                <div className="mb-6">
                  <p className="text-3xl font-bold text-slate-900 mb-1">{plan.dataSize}</p>
                  <p className="text-sm text-slate-500">{plan.validity}</p>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Price</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      GHS {plan.sellingPrice.toFixed(2)}
                    </p>
                  </div>
                  <button className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-shadow">
                    {user ? 'Get Now' : 'View'}
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3">Why Choose Desnethub?</h2>
          <p className="text-lg text-slate-600">We deliver quality, reliability, and savings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className="group bg-white rounded-2xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feat.gradient} shadow-lg mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-600">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust/Social Proof Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-10 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-5xl font-bold text-white mb-2">
                {stats.totalUsers >= 1000 ? `${(stats.totalUsers / 1000).toFixed(0)}K+` : stats.totalUsers.toLocaleString()}
              </p>
              <p className="text-blue-100">Happy Customers</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-white mb-2">
                {stats.totalOrdersCompleted >= 1000000 ? `${(stats.totalOrdersCompleted / 1000000).toFixed(1)}M+` : stats.totalOrdersCompleted.toLocaleString()}
              </p>
              <p className="text-blue-100">Data Bundles Sold</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-white mb-2">{stats.successRate}%</p>
              <p className="text-blue-100">Success Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3">Frequently Asked Questions</h2>
          <p className="text-lg text-slate-600">Get answers to common questions</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
              <div className="flex gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">{faq.q}</h3>
                  <p className="text-slate-600">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      {!user && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 shadow-2xl">
            <div className="relative z-10 text-center">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Start Saving Today</h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Enjoy reliable, affordable mobile data with Desnethub. Simple, secure, and transparent pricing for everyone.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register" className="px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold hover:shadow-2xl transition-all duration-300">
                  Create Account Now
                </Link>
                <Link to="/login" className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold border-2 border-white/20 hover:bg-white/20 transition-all duration-300">
                  I Already Have an Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-slate-600">© 2025 Desnethub. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}