import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart } from 'lucide-react';
import { dataplans } from '../services/api';

const networkEmojis = {
  'MTN': '🔴',
  'TELECEL': '📱',
  'AirtelTigo': '🟢',
  'Telecel': '📱',
  'AIRTELTIGO': '🟢',
};

export default function BuyData() {
  const { user } = useAuth();
  const [selectedNetwork, setSelectedNetwork] = useState('MTN');
  const [bundles, setBundles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDataPlans();
  }, []);

  const fetchDataPlans = async () => {
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
    } catch (err) {
      setError('Failed to load data plans');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (bundle) => {
    if (user.balance < bundle.sellingPrice) {
      alert('Insufficient balance. Please top up your wallet.');
      return;
    }
    alert(`Purchasing ${bundle.dataSize} on ${selectedNetwork} for GHS ${bundle.sellingPrice.toFixed(2)}`);
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
    <div className="min-h-screen" style={{background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-primary) 100%)'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Buy Data Bundles</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
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
                          onClick={() => handlePurchase(bundle)}
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
      </div>
    </div>
  );
}
