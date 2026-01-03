import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { ShoppingCart, CheckCircle, AlertCircle, Wifi } from 'lucide-react';
import { dataplans } from '../services/api';
import PurchaseModal from '../components/PurchaseModal';
import PurchaseVerificationModal from '../components/PurchaseVerificationModal';
import UserLayout from '../components/UserLayout';

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
      const response = await dataplans.list('', '', 1, 500);
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
          setInitializedFromParams(true);
        }
      } else if (planId && network && Object.keys(bundles).length > 0) {
        const allBundles = Object.values(bundles).flat();
        const foundBundle = allBundles.find(b => b._id === planId);
        if (foundBundle && foundBundle.network === network) {
          setSelectedNetwork(network);
          setSelectedBundle(foundBundle);
          setShowPurchaseModal(true);
          setInitializedFromParams(true);
        }
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
    if (bundle.inStock) {
      setSelectedBundle(bundle);
      setShowPurchaseModal(true);
      setError('');
    }
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
      <UserLayout>
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-slate-400 mx-auto mb-4"></div>
            <p className="text-sm sm:text-base text-slate-600">Loading data plans...</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  const availableNetworks = Object.keys(bundles);
  const currentBundles = bundles[selectedNetwork] || [];

  return (
    <UserLayout>
      <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          {/* Page Header with Balance */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">Buy Data Bundles</h1>
            <div className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-3 sm:p-4 shadow-lg">
              <p className="text-xs sm:text-sm text-blue-100 mb-1">Current Balance</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">
                GHS {user?.balance?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white border-2 border-green-300 rounded-2xl text-green-700">
              <div className="flex items-start gap-2 sm:gap-3">
                <CheckCircle size={18} className="flex-shrink-0 mt-0.5 sm:w-5 sm:h-5 text-green-500" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base">{successMessage}</p>
                  {successDetails && (
                    <div className="mt-2 text-xs sm:text-sm space-y-1">
                      <p className="truncate">Order #{successDetails.order?.orderNumber}</p>
                      <p className="truncate">{successDetails.order?.dataAmount} {successDetails.order?.network} to {successDetails.order?.phoneNumber}</p>
                      <p className="font-semibold">Status: {successDetails.order?.status}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white border-2 border-red-300 rounded-2xl text-red-700">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5 sm:w-5 sm:h-5 text-red-500" />
                <div className="text-sm sm:text-base">{error}</div>
              </div>
            </div>
          )}

          {/* No Plans Available */}
          {availableNetworks.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 sm:p-8 text-center border-2 border-slate-200">
              <p className="text-slate-600 mb-3 sm:mb-4 text-sm sm:text-base">No data plans available</p>
              <p className="text-xs sm:text-sm text-slate-500">Please check back later or contact support</p>
            </div>
          ) : (
            <>
              {/* Network Tabs */}
              <div className="mb-4 sm:mb-6 lg:mb-8 border-b border-slate-200">
                <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-0">
                  {availableNetworks.map(network => (
                    <button
                      key={network}
                      onClick={() => setSelectedNetwork(network)}
                      className={`px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-medium transition whitespace-nowrap border-b-2 ${
                        selectedNetwork === network 
                          ? 'border-blue-600 text-blue-600' 
                          : 'border-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Wifi size={16} className="inline mr-2" />
                      {network}
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Bundles */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 border-2 border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6 text-slate-900">
                  <span className="hidden sm:inline">{selectedNetwork} Bundles</span>
                  <span className="sm:hidden truncate">{selectedNetwork}</span>
                </h2>
                {currentBundles.length === 0 ? (
                  <p className="text-slate-600 text-sm sm:text-base">No bundles available for this network</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                    {currentBundles.map(bundle => (
                      <div 
                        key={bundle._id} 
                        className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                          bundle.inStock 
                            ? 'cursor-pointer hover:border-blue-400 hover:shadow-lg border-slate-200 bg-white' 
                            : 'opacity-50 cursor-not-allowed border-slate-200 bg-white'
                        }`}
                        onClick={() => bundle.inStock && handlePurchaseClick(bundle)}
                      >
                        <div className="mb-2 sm:mb-3">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div>
                              <p className="text-base sm:text-lg font-bold truncate text-slate-900">{bundle.dataSize}</p>
                              <p className="text-xs sm:text-sm truncate text-slate-600">
                                {bundle.validity}
                              </p>
                            </div>
                            {!bundle.inStock ? (
                              <span className="text-xs px-2 py-1 rounded-lg whitespace-nowrap flex-shrink-0 bg-red-100 text-red-600 font-semibold">
                                Out of Stock
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-lg whitespace-nowrap flex-shrink-0 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold">
                                {bundle.network}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-end gap-2">
                          <p className="text-sm sm:text-base font-bold text-blue-600 whitespace-nowrap">
                            GHS {bundle.sellingPrice.toFixed(2)}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePurchaseClick(bundle);
                            }}
                            disabled={!bundle.inStock}
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                              bundle.inStock 
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg text-white' 
                                : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <ShoppingCart size={16} className="sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </>
          )}

          {/* Purchase Modal */}
          <PurchaseModal
            bundle={selectedBundle}
            isOpen={showPurchaseModal}
            onClose={() => setShowPurchaseModal(false)}
            userBalance={user?.balance || 0}
            onPurchaseSuccess={handlePurchaseSuccess}
          />

          {/* Verification Modal */}
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