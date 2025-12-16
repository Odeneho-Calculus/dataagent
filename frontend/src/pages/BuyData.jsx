import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { ShoppingCart, CheckCircle, AlertCircle } from 'lucide-react';
import { dataplans } from '../services/api';
import PurchaseModal from '../components/PurchaseModal';
import PurchaseVerificationModal from '../components/PurchaseVerificationModal';
import UserLayout from '../components/UserLayout';

const networkEmojis = {
  'MTN': '🔴',
  'TELECEL': '📱',
  'AirtelTigo': '🟢',
  'Telecel': '📱',
  'AIRTELTIGO': '🟢',
};

export default function BuyData() {
  const { user, updateBalance } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedNetwork, setSelectedNetwork] = useState('MTN');
  const [bundles, setBundles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [successDetails, setSuccessDetails] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [initializedFromParams, setInitializedFromParams] = useState(false);

  const fetchDataPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dataplans.list('', 'active');
      if (response.success) {
        const grouped = response.grouped || {};
        setBundles(grouped);
        
        const networks = Object.keys(grouped);
        if (networks.length > 0 && !grouped[selectedNetwork]) {
          setSelectedNetwork(networks[0]);
        }
      }
    } catch (error) {
      setError('Failed to load data plans');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedNetwork]);

  useEffect(() => {
    fetchDataPlans();
  }, [fetchDataPlans]);

  useEffect(() => {
    if (!loading && !initializedFromParams) {
      const planId = searchParams.get('planId');
      const network = searchParams.get('network');
      
      if (planId && network && bundles[network]) {
        setSelectedNetwork(network);
        const bundle = bundles[network].find(b => b._id === planId);
        if (bundle) {
          setSelectedBundle(bundle);
          setShowPurchaseModal(true);
        }
        setInitializedFromParams(true);
      }
    }
  }, [loading, bundles, searchParams, initializedFromParams]);

  useEffect(() => {
    const pending = localStorage.getItem('pendingPurchaseVerification');
    if (pending) {
      const { reference, orderId } = JSON.parse(pending);
      setVerificationData({ reference, orderId });
      setShowVerificationModal(true);
    }
  }, []);

  const handlePurchaseClick = (bundle) => {
    setSelectedBundle(bundle);
    setShowPurchaseModal(true);
    setError('');
  };

  const handlePurchaseSuccess = (data) => {
    setShowPurchaseModal(false);
    setSuccessMessage('Purchase completed successfully!');
    setSuccessDetails(data);
    
    if (updateBalance && data.wallet) {
      updateBalance(data.wallet.balance);
    }

    setTimeout(() => {
      setSuccessMessage(null);
      setSuccessDetails(null);
    }, 8000);

    fetchDataPlans();
  };

  const handleVerificationSuccess = (result) => {
    setShowVerificationModal(false);
    setVerificationData(null);
    localStorage.removeItem('pendingPurchaseVerification');
    
    setSuccessMessage('Purchase completed successfully!');
    setSuccessDetails(result.data);
    
    if (updateBalance && result.data?.order) {
      updateBalance(result.data.order.balance);
    }

    setTimeout(() => {
      setSuccessMessage(null);
      setSuccessDetails(null);
    }, 8000);

    fetchDataPlans();
  };

  const handleVerificationError = () => {
    localStorage.removeItem('pendingPurchaseVerification');
    setError('Payment verification failed. Please check your transactions.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 dark:border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading data plans...</p>
        </div>
      </div>
    );
  }

  const availableNetworks = Object.keys(bundles);
  const currentBundles = bundles[selectedNetwork] || [];

  return (
    <UserLayout>
      <div className="min-h-screen" style={{background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-primary) 100%)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Buy Data Bundles</h1>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{successMessage}</p>
                {successDetails && (
                  <div className="mt-2 text-sm space-y-1">
                    <p>Order #{successDetails.order?.orderNumber}</p>
                    <p>{successDetails.order?.dataAmount} {successDetails.order?.network} to {successDetails.order?.phoneNumber}</p>
                    <p className="font-semibold">Status: {successDetails.order?.status}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-start gap-3">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {availableNetworks.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">No data plans available</p>
            <p className="text-sm text-slate-500">Please check back later or contact support</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {availableNetworks.map(network => (
                <button
                  key={network}
                  onClick={() => setSelectedNetwork(network)}
                  className={`card p-6 text-center transition cursor-pointer ${
                    selectedNetwork === network ? 'ring-2 ring-primary-600' : ''
                  }`}
                  style={{
                    backgroundColor: selectedNetwork === network ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                  }}
                >
                  <div className="text-4xl mb-3">
                    {networkEmojis[network] || '📱'}
                  </div>
                  <h3 className="font-bold text-lg">{network}</h3>
                </button>
              ))}
            </div>

            <div className="card p-8">
              <h2 className="text-2xl font-bold mb-6">Available Bundles - {selectedNetwork}</h2>
              {currentBundles.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400">No bundles available for this network</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentBundles.map(bundle => (
                    <div key={bundle._id} className="p-6 rounded-lg border" style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)'}}>
                      <div className="mb-4">
                        <p className="text-2xl font-bold">{bundle.dataSize}</p>
                        <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Validity: {bundle.validity}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xl font-bold text-primary-600">GHS {bundle.sellingPrice.toFixed(2)}</p>
                        <button
                          onClick={() => handlePurchaseClick(bundle)}
                          className="btn btn-primary text-sm flex items-center gap-2"
                        >
                          <ShoppingCart size={16} />
                          Buy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 card p-8">
              <h3 className="font-bold text-lg mb-4">Current Balance</h3>
              <p className="text-3xl font-bold text-primary-600">GHS {user?.balance?.toFixed(2) || '0.00'}</p>
            </div>
          </>
        )}

        <PurchaseModal
          bundle={selectedBundle}
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          userBalance={user?.balance || 0}
          onPurchaseSuccess={handlePurchaseSuccess}
        />

        {verificationData && (
          <PurchaseVerificationModal
            isOpen={showVerificationModal}
            reference={verificationData.reference}
            onClose={() => {
              setShowVerificationModal(false);
              setVerificationData(null);
            }}
            onSuccess={handleVerificationSuccess}
            onError={handleVerificationError}
          />
        )}
      </div>
      </div>
    </UserLayout>
  );
}
