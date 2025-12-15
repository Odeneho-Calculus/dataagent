import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Loader } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import { wallet } from '../services/api';

export default function TopUp() {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  const handleTopUp = async () => {
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
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
    <div className="min-h-screen" style={{background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-primary) 100%)'}}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8" style={{color: 'var(--text-primary)'}}>Top Up Wallet</h1>

        {error && (
          <div className="mb-4 p-4 rounded-lg flex items-start gap-3 border" style={{backgroundColor: 'rgba(220, 38, 38, 0.1)', borderColor: 'rgba(220, 38, 38, 0.2)', color: '#dc2626'}}>
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-bold text-sm">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 rounded-lg flex items-start gap-3 border" style={{backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e'}}>
            <span className="text-xl">✓</span>
            <div>
              <p className="font-bold text-sm">Success</p>
              <p className="text-sm">{success}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="card p-4 sm:p-6 mb-4 sm:mb-6">
              <h2 className="font-bold text-sm sm:text-base mb-3 sm:mb-4" style={{color: 'var(--text-primary)'}}>Current Balance</h2>
              <p className="text-3xl sm:text-4xl font-bold" style={{color: '#0ea5e9'}}>GHS {user?.balance?.toFixed(2) || '0.00'}</p>
            </div>

            <div className="card p-4 sm:p-6">
              <h2 className="font-bold text-sm sm:text-base mb-4 sm:mb-6" style={{color: 'var(--text-primary)'}}>Quick Amounts</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {quickAmounts.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    disabled={loading}
                    className={`py-2 sm:py-3 px-2 sm:px-3 rounded-lg transition text-xs sm:text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed ${
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
              <h2 className="font-bold text-base sm:text-lg mb-4 sm:mb-6" style={{color: 'var(--text-primary)'}}>Top Up Amount</h2>

              <div className="mb-6 sm:mb-8">
                <label className="block text-xs sm:text-sm font-medium mb-2" style={{color: 'var(--text-secondary)'}}>Amount (GHS)</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-bold whitespace-nowrap" style={{color: 'var(--text-primary)'}}>GHS</span>
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
                    className="flex-1 px-3 sm:px-4 py-2 rounded-lg border text-sm disabled:opacity-50 disabled:cursor-not-allowed input-field"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handleTopUp}
                disabled={loading || !amount}
                className="btn btn-primary w-full text-sm sm:text-base font-bold py-2.5 sm:py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

              <p className="text-xs text-center mt-3 sm:mt-4" style={{color: 'var(--text-secondary)'}}>
                Your transaction is secure and encrypted with Paystack
              </p>
            </div>
          </div>
        </div>
      </div>

      {paymentData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentData(null);
          }}
          accessCode={paymentData.accessCode}
          reference={paymentData.reference}
          amount={parseFloat(amount)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
