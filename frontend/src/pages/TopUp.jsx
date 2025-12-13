import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Smartphone, Building2 } from 'lucide-react';

export default function TopUp() {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  const paymentMethods = [
    { id: 'mtn', name: 'MTN Mobile Money', icon: Smartphone, desc: 'Instant funding via MTN' },
    { id: 'vodafone', name: 'Vodafone Cash', icon: Smartphone, desc: 'Instant funding via Vodafone' },
    { id: 'bank', name: 'Bank Transfer', icon: Building2, desc: 'Direct bank account transfer' },
  ];

  const handleTopUp = () => {
    if (!amount || !phoneNumber) {
      alert('Please fill in all fields');
      return;
    }
    alert(`Processing GHS ${amount} top-up via ${method.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-primary) 100%)'}}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8">Top Up Wallet</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="card p-4 sm:p-6 mb-4 sm:mb-6">
              <h2 className="font-bold text-sm sm:text-base mb-3 sm:mb-4">Current Balance</h2>
              <p className="text-3xl sm:text-4xl font-bold text-primary-600">GHS {user?.balance?.toFixed(2) || '0.00'}</p>
            </div>

            <div className="card p-4 sm:p-6">
              <h2 className="font-bold text-sm sm:text-base mb-4 sm:mb-6">Quick Amounts</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {quickAmounts.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className={`py-2 sm:py-3 px-2 sm:px-3 rounded-lg transition text-xs sm:text-sm font-bold ${
                      amount === amt.toString()
                        ? 'btn btn-primary'
                        : 'btn btn-secondary'
                    }`}
                  >
                    GHS {amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="card p-4 sm:p-6 lg:p-8">
              <h2 className="font-bold text-base sm:text-lg mb-4 sm:mb-6">Top Up Details</h2>

              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium mb-2 sm:mb-3">Payment Method</label>
                <div className="space-y-2 sm:space-y-3">
                  {paymentMethods.map(pm => (
                    <button
                      key={pm.id}
                      onClick={() => setMethod(pm.id)}
                      className={`w-full p-3 sm:p-4 rounded-lg border transition text-left text-sm ${
                        method === pm.id
                          ? 'ring-2 ring-primary-600'
                          : ''
                      }`}
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: method === pm.id ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                      }}
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <pm.icon size={18} style={{color: 'var(--primary-600)', flexShrink: 0}} />
                        <div className="flex-1 text-left">
                          <p className="font-bold text-xs sm:text-sm">{pm.name}</p>
                          <p className="text-xs" style={{color: 'var(--text-secondary)'}}>{pm.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium mb-2">Amount</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-bold whitespace-nowrap">GHS</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="flex-1 px-3 sm:px-4 py-2 rounded-lg border text-sm"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              <div className="mb-6 sm:mb-8">
                <label className="block text-xs sm:text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0XX-XXX-XXXX"
                  className="w-full px-3 sm:px-4 py-2 rounded-lg border text-sm"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <button
                onClick={handleTopUp}
                className="btn btn-primary w-full text-sm sm:text-base font-bold py-2.5 sm:py-3 flex items-center justify-center gap-2"
              >
                <CreditCard size={18} />
                Proceed to Payment
              </button>

              <p className="text-xs text-center mt-3 sm:mt-4" style={{color: 'var(--text-secondary)'}}>
                Your transaction is secure and encrypted
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
