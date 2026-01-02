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
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border-2 border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">Purchase Data Bundle</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-xl text-slate-900">{bundle.dataSize}</p>
                <p className="text-sm text-slate-600">
                  {bundle.network} - {bundle.planName}
                </p>
              </div>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">GHS {bundle.sellingPrice.toFixed(2)}</p>
            </div>
            <p className="text-xs text-slate-600">
              Validity: {bundle.validity}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-white border-2 border-red-300 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-900">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-blue-400 focus:outline-none bg-white text-slate-900"
            />
            <p className="text-xs mt-1 text-slate-600">
              The data will be sent to this number
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-slate-900">Payment Method</div>

            <button
              onClick={() => {
                setPaymentMethod('wallet');
                setError('');
              }}
              className={`w-full p-4 rounded-xl border-2 transition flex items-center gap-3 ${
                paymentMethod === 'wallet'
                  ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-purple-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              disabled={loading || paystackLoading}
            >
              <Wallet size={20} className={paymentMethod === 'wallet' ? 'text-blue-600' : 'text-slate-600'} />
              <div className="text-left flex-1">
                <p className="font-medium text-slate-900">Wallet Balance</p>
                <p className="text-sm text-slate-600">
                  GHS {userBalance.toFixed(2)}
                </p>
              </div>
              {!canAfford && paymentMethod === 'wallet' && (
                <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-lg">
                  Insufficient
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setPaymentMethod('paystack');
                setError('');
              }}
              className={`w-full p-4 rounded-xl border-2 transition flex items-center gap-3 ${
                paymentMethod === 'paystack'
                  ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-purple-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              disabled={loading || paystackLoading}
            >
              <CreditCard size={20} className={paymentMethod === 'paystack' ? 'text-blue-600' : 'text-slate-600'} />
              <div className="text-left flex-1">
                <p className="font-medium text-slate-900">Paystack Payment</p>
                <p className="text-sm text-slate-600">
                  Pay with card or bank account
                </p>
              </div>
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-900 font-semibold hover:border-slate-300 hover:bg-slate-50 transition disabled:opacity-50"
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
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 font-semibold"
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
