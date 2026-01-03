import React, { useState, useEffect } from 'react';
import { X, Wallet, CreditCard, Loader, Clock } from 'lucide-react';
import { purchases, publicAPI } from '../services/api';
import PurchasePaymentModal from './PurchasePaymentModal';

export default function PurchaseModal({ bundle, isOpen, onClose, userBalance, onPurchaseSuccess }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paystackLoading, setPaystackLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [businessStatus, setBusinessStatus] = useState(null);
  const [checkingBusinessStatus, setCheckingBusinessStatus] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setBusinessStatus(null);
      return;
    }

    const checkStatus = async () => {
      try {
        setCheckingBusinessStatus(true);
        const response = await publicAPI.getBusinessStatus();
        if (response.success && response.data) {
          setBusinessStatus(response.data);
          if (!response.data.isOpen) {
            setError(response.data.message || 'Business is currently closed');
          }
        } else {
          setBusinessStatus(null);
          setError(response.message || 'Failed to check business status');
        }
      } catch (err) {
        console.error('Failed to check business status:', err);
        setBusinessStatus(null);
      } finally {
        setCheckingBusinessStatus(false);
      }
    };

    checkStatus();
  }, [isOpen]);

  if (!isOpen || !bundle) return null;

  const handleWalletPurchase = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await purchases.buyDataBundle({
        dataPlanId: bundle._id,
        phoneNumber,
        paymentMethod: 'wallet',
      });

      if (response.success) {
        onPurchaseSuccess(response.data);
        setPhoneNumber('');
        onClose();
      } else {
        setError(response.message || 'Purchase failed');
      }
    } catch (err) {
      setError(err?.message || 'An error occurred during purchase');
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackPurchase = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    try {
      setPaystackLoading(true);
      setError('');

      const response = await purchases.buyDataBundle({
        dataPlanId: bundle._id,
        phoneNumber,
        paymentMethod: 'paystack',
      });

      if (response.success) {
        setPaymentData(response.data);
        setShowPaymentModal(true);
      } else {
        setError(response.message || 'Payment initialization failed');
        setPaystackLoading(false);
      }
    } catch (err) {
      setError(err?.message || 'An error occurred');
      setPaystackLoading(false);
    }
  };

  const handlePaymentSuccess = (result) => {
    setShowPaymentModal(false);
    setPaymentData(null);
    onPurchaseSuccess(result.data);
    setPhoneNumber('');
    onClose();
  };

  const canAfford = userBalance >= bundle.sellingPrice;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border-2 border-slate-200 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-200">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Purchase Data Bundle</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-3 rounded-xl border border-blue-200">
            <div className="flex justify-between items-start gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base sm:text-lg text-slate-900">{bundle.dataSize}</p>
                <p className="text-xs sm:text-sm text-slate-600 truncate">
                  {bundle.network} - {bundle.planName}
                </p>
              </div>
              <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">GHS {bundle.sellingPrice.toFixed(2)}</p>
            </div>
            <p className="text-xs text-slate-600">
              Validity: {bundle.validity}
            </p>
          </div>

          {businessStatus && !businessStatus.isOpen && (
            <div className="p-2 sm:p-3 bg-white border-2 border-orange-300 rounded-lg text-orange-700 text-xs sm:text-sm flex items-start gap-2">
              <Clock size={14} className="flex-shrink-0 mt-0.5 sm:w-4 sm:h-4" />
              <div>
                <p className="font-semibold text-xs sm:text-sm">Business Closed</p>
                <p className="text-xs mt-0.5">{businessStatus.message}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-2 sm:p-3 bg-white border-2 border-red-300 rounded-lg text-red-700 text-xs sm:text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1.5 text-slate-900">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              className="w-full px-3 py-1.5 rounded-lg border-2 border-slate-200 focus:border-blue-400 focus:outline-none bg-white text-slate-900 text-sm"
            />
            <p className="text-xs mt-1 text-slate-600">
              The data will be sent to this number
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-xs sm:text-sm font-medium text-slate-900">Payment Method</div>

            <button
              onClick={() => {
                setPaymentMethod('wallet');
                setError('');
              }}
              className={`w-full p-3 rounded-lg border-2 transition flex items-center gap-2 text-sm ${
                paymentMethod === 'wallet'
                  ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-purple-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              disabled={loading || paystackLoading || (businessStatus && !businessStatus.isOpen)}
            >
              <Wallet size={16} className={paymentMethod === 'wallet' ? 'text-blue-600 flex-shrink-0' : 'text-slate-600 flex-shrink-0'} />
              <div className="text-left flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-xs sm:text-sm">Wallet Balance</p>
                <p className="text-xs text-slate-600">
                  GHS {userBalance.toFixed(2)}
                </p>
              </div>
              {!canAfford && paymentMethod === 'wallet' && (
                <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded whitespace-nowrap flex-shrink-0">
                  Insufficient
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setPaymentMethod('paystack');
                setError('');
              }}
              className={`w-full p-3 rounded-lg border-2 transition flex items-center gap-2 text-sm ${
                paymentMethod === 'paystack'
                  ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-purple-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              disabled={loading || paystackLoading || (businessStatus && !businessStatus.isOpen)}
            >
              <CreditCard size={16} className={paymentMethod === 'paystack' ? 'text-blue-600 flex-shrink-0' : 'text-slate-600 flex-shrink-0'} />
              <div className="text-left flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-xs sm:text-sm">Paystack Payment</p>
                <p className="text-xs text-slate-600">
                  Pay with card or bank account
                </p>
              </div>
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 rounded-lg border-2 border-slate-200 text-slate-900 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition disabled:opacity-50"
              disabled={loading || paystackLoading}
            >
              Cancel
            </button>
            <button
              onClick={paymentMethod === 'wallet' ? handleWalletPurchase : handlePaystackPurchase}
              disabled={
                !phoneNumber.trim() ||
                loading ||
                paystackLoading ||
                (paymentMethod === 'wallet' && !canAfford) ||
                (businessStatus && !businessStatus.isOpen) ||
                checkingBusinessStatus
              }
              className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 font-semibold text-sm"
              title={businessStatus && !businessStatus.isOpen ? 'Business is currently closed' : ''}
            >
              {loading || paystackLoading ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay GHS ${bundle.sellingPrice.toFixed(2)}`
              )}
            </button>
          </div>
        </div>
      </div>

      {paymentData && (
        <PurchasePaymentModal
          key={paymentData?.reference}
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentData(null);
            setPaystackLoading(false);
          }}
          accessCode={paymentData?.accessCode}
          reference={paymentData?.reference}
          amount={bundle.sellingPrice}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
