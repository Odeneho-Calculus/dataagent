import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Loader, Clock } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import { wallet, publicAPI } from '../services/api';
import UserLayout from '../components/UserLayout';

export default function TopUp() {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [businessStatus, setBusinessStatus] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await publicAPI.getBusinessStatus();
        if (response.success && response.data) {
          setBusinessStatus(response.data);
        }
      } catch (err) {
        console.error('Failed to check business status:', err);
      }
    };

    checkStatus();
  }, []);

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  const handleTopUp = async () => {
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (businessStatus && !businessStatus.isOpen) {
      setError(businessStatus.message || 'Business is currently closed. Please try again during business hours.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await wallet.initializePayment({ amount: parseFloat(amount) });

      if (result.success) {
        setPaymentData(result.data);
        setShowPaymentModal(true);
      } else {
        setError(result.message || 'Failed to initialize payment');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while processing your payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (result) => {
    setSuccess(`Successfully topped up GHS ${amount}! Your new balance is GHS ${result.balance}`);
    setAmount('');
    await refreshUser();
    setTimeout(() => setSuccess(null), 5000);
  };

  return (
    <UserLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-slate-900">Top Up Wallet</h1>

        {businessStatus && !businessStatus.isOpen && (
          <div className="mb-4 p-4 rounded-2xl flex items-start gap-3 border-2 border-orange-300 bg-white text-orange-700">
            <Clock size={20} className="flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Business Closed</p>
              <p className="text-sm">{businessStatus.message}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 rounded-2xl flex items-start gap-3 border-2 border-red-300 bg-white text-red-700">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-bold text-sm">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 rounded-2xl flex items-start gap-3 border-2 border-green-300 bg-white text-green-700">
            <span className="text-xl">✓</span>
            <div>
              <p className="font-bold text-sm">Success</p>
              <p className="text-sm">{success}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <h2 className="font-bold text-sm sm:text-base mb-3 sm:mb-4 text-slate-900">Current Balance</h2>
              <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">GHS {user?.balance?.toFixed(2) || '0.00'}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
              <h2 className="font-bold text-sm sm:text-base mb-4 sm:mb-6 text-slate-900">Quick Amounts</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {quickAmounts.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    disabled={loading || (businessStatus && !businessStatus.isOpen)}
                    className={`py-2 sm:py-3 px-2 sm:px-3 rounded-lg transition text-xs sm:text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed ${
                      amount === amt.toString()
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    GHS {amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 border-2 border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
              <h2 className="font-bold text-base sm:text-lg mb-4 sm:mb-6 text-slate-900">Top Up Amount</h2>

              <div className="mb-6 sm:mb-8">
                <label className="block text-xs sm:text-sm font-medium mb-2 text-slate-900">Amount (GHS)</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-bold whitespace-nowrap text-slate-900">GHS</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter amount"
                    disabled={loading}
                    min="1"
                    step="0.01"
                    className="flex-1 px-3 sm:px-4 py-2 rounded-lg border-2 border-slate-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: '#f9fafb',
                      color: '#111827',
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handleTopUp}
                disabled={loading || !amount || (businessStatus && !businessStatus.isOpen)}
                className="w-full text-sm sm:text-base font-bold py-2.5 sm:py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
                title={businessStatus && !businessStatus.isOpen ? 'Business is currently closed' : ''}
              >
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Proceed to Payment
                  </>
                )}
              </button>

              <p className="text-xs text-center mt-3 sm:mt-4 text-slate-600">
                Your transaction is secure and encrypted with Paystack
              </p>
            </div>
          </div>
        </div>
      </div>

      {paymentData && (
        <PaymentModal
          key={paymentData?.reference}
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentData(null);
          }}
          accessCode={paymentData?.accessCode}
          reference={paymentData?.reference}
          amount={parseFloat(amount)}
          onSuccess={handlePaymentSuccess}
        />
      )}
      </div>
    </UserLayout>
  );
}
