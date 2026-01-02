import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { purchases } from '../services/api';

export default function PurchasePaymentModal({ isOpen, onClose, accessCode, reference, amount, onSuccess }) {
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState(null);
  const paystackRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !accessCode) return;

    const initializePayment = async () => {
      try {
        if (window.PaystackPop) {
          paystackRef.current = new window.PaystackPop();
          
          paystackRef.current.resumeTransaction(accessCode, {
            onSuccess: async () => {
              setStatus('verifying');
              try {
                const result = await purchases.verifyPurchase({ reference });
                
                if (result.success) {
                  setStatus('success');
                  setTimeout(() => {
                    onSuccess(result);
                    onClose();
                  }, 2000);
                } else {
                  setStatus('failed');
                  setError('Payment verification failed');
                }
              } catch (err) {
                setStatus('failed');
                setError(err.message || 'Payment verification failed');
              }
            },
            onCancel: () => {
              setStatus('cancelled');
            },
            onError: (error) => {
              setStatus('failed');
              setError(error?.message || 'Payment error occurred');
            },
          });
        } else {
          setStatus('failed');
          setError('Paystack library not loaded. Please refresh the page.');
        }
      } catch (err) {
        setStatus('failed');
        setError(err.message || 'Failed to initialize payment');
      }
    };

    initializePayment();

    return () => {
      if (paystackRef.current?.cancelTransaction) {
        paystackRef.current.cancelTransaction(reference);
      }
    };
  }, [isOpen, accessCode, reference, onClose, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {status === 'pending' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-xl max-w-lg w-full p-8 bg-white border-2 border-slate-200">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold mb-2 text-slate-900">Opening Payment Gateway</h3>
              <p className="text-sm text-slate-600">Please wait while we initialize Paystack...</p>
            </div>
          </div>
        </div>
      )}

      {status === 'verifying' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-xl max-w-lg w-full p-8 bg-white border-2 border-slate-200">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold mb-2 text-slate-900">Verifying Payment</h3>
              <p className="text-sm text-slate-600">Please wait while we verify your payment...</p>
            </div>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-xl max-w-lg w-full p-8 bg-white border-2 border-slate-200">
            <div className="flex flex-col items-center justify-center text-center">
              <CheckCircle size={64} className="text-green-500 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-slate-900">Payment Successful!</h3>
              <p className="mb-4 text-slate-600">Your data bundle has been purchased for GHS {amount.toFixed(2)}</p>
              <p className="text-sm text-slate-600">Reference: {reference}</p>
            </div>
          </div>
        </div>
      )}

      {status === 'cancelled' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-xl max-w-lg w-full p-8 bg-white border-2 border-slate-200">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle size={64} className="text-yellow-500 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-slate-900">Payment Cancelled</h3>
              <p className="mb-4 text-slate-600">You cancelled the payment. Your order was not processed.</p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-xl max-w-lg w-full p-8 bg-white border-2 border-slate-200">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle size={64} className="text-red-500 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-slate-900">Payment Failed</h3>
              <p className="mb-4 text-slate-600">{ error || 'Unable to process your payment'}</p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
