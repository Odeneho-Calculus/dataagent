import React, { useState } from 'react';
import { X, Wallet, CreditCard, Loader } from 'lucide-react';
import { purchases } from '../services/api';
import PurchasePaymentModal from './PurchasePaymentModal';

export default function PurchaseModal({ bundle, isOpen, onClose, userBalance, onPurchaseSuccess }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paystackLoading, setPaystackLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full" style={{backgroundColor: 'var(--bg-primary)'}}>
        <div className="flex justify-between items-center p-6 border-b" style={{borderColor: 'var(--border-color)'}}>
          <h2 className="text-2xl font-bold">Purchase Data Bundle</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg" style={{backgroundColor: 'var(--bg-secondary)'}}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-xl">{bundle.dataSize}</p>
                <p className="text-sm" style={{color: 'var(--text-secondary)'}}>
                  {bundle.network} - {bundle.planName}
                </p>
              </div>
              <p className="text-2xl font-bold text-primary-600">GHS {bundle.sellingPrice.toFixed(2)}</p>
            </div>
            <p className="text-xs" style={{color: 'var(--text-secondary)'}}>
              Validity: {bundle.validity}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              className="w-full px-3 py-2 rounded-lg border" 
              style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)'}}
            />
            <p className="text-xs mt-1" style={{color: 'var(--text-secondary)'}}>
              The data will be sent to this number
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">Payment Method</div>

            <button
              onClick={() => {
                setPaymentMethod('wallet');
                setError('');
              }}
              className={`w-full p-4 rounded-lg border-2 transition flex items-center gap-3 ${
                paymentMethod === 'wallet'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
              disabled={loading || paystackLoading}
            >
              <Wallet size={20} className={paymentMethod === 'wallet' ? 'text-primary-600' : ''} />
              <div className="text-left flex-1">
                <p className="font-medium">Wallet Balance</p>
                <p className="text-sm" style={{color: 'var(--text-secondary)'}}>
                  GHS {userBalance.toFixed(2)}
                </p>
              </div>
              {!canAfford && paymentMethod === 'wallet' && (
                <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded">
                  Insufficient
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setPaymentMethod('paystack');
                setError('');
              }}
              className={`w-full p-4 rounded-lg border-2 transition flex items-center gap-3 ${
                paymentMethod === 'paystack'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
              disabled={loading || paystackLoading}
            >
              <CreditCard size={20} className={paymentMethod === 'paystack' ? 'text-primary-600' : ''} />
              <div className="text-left flex-1">
                <p className="font-medium">Paystack Payment</p>
                <p className="text-sm" style={{color: 'var(--text-secondary)'}}>
                  Pay with card or bank account
                </p>
              </div>
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border transition"
              style={{borderColor: 'var(--border-color)'}}
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
                (paymentMethod === 'wallet' && !canAfford)
              }
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading || paystackLoading ? (
                <>
                  <Loader size={16} className="animate-spin" />
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
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentData(null);
            setPaystackLoading(false);
          }}
          accessCode={paymentData.accessCode}
          reference={paymentData.reference}
          amount={bundle.sellingPrice}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
