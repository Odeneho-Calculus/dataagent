import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart } from 'lucide-react';

export default function BuyData() {
  const { user } = useAuth();
  const [selectedNetwork, setSelectedNetwork] = useState('MTN');

  const bundles = {
    MTN: [
      { id: 1, size: '100MB', price: 0.99, validity: '7 days' },
      { id: 2, size: '500MB', price: 2.99, validity: '14 days' },
      { id: 3, size: '1GB', price: 4.99, validity: '30 days' },
      { id: 4, size: '2GB', price: 8.99, validity: '30 days' },
      { id: 5, size: '5GB', price: 19.99, validity: '30 days' },
      { id: 6, size: '10GB', price: 34.99, validity: '30 days' },
    ],
    Vodafone: [
      { id: 7, size: '100MB', price: 0.99, validity: '7 days' },
      { id: 8, size: '500MB', price: 2.99, validity: '14 days' },
      { id: 9, size: '1GB', price: 4.99, validity: '30 days' },
      { id: 10, size: '2GB', price: 8.99, validity: '30 days' },
      { id: 11, size: '5GB', price: 19.99, validity: '30 days' },
    ],
    AirtelTigo: [
      { id: 12, size: '100MB', price: 0.99, validity: '7 days' },
      { id: 13, size: '500MB', price: 2.99, validity: '14 days' },
      { id: 14, size: '1GB', price: 4.99, validity: '30 days' },
      { id: 15, size: '5GB', price: 19.99, validity: '30 days' },
      { id: 16, size: '10GB', price: 34.99, validity: '30 days' },
    ],
  };

  const handlePurchase = (bundle) => {
    if (user.balance < bundle.price) {
      alert('Insufficient balance. Please top up your wallet.');
      return;
    }
    alert(`Purchasing ${bundle.size} on ${selectedNetwork} for GHS ${bundle.price.toFixed(2)}`);
  };

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-primary) 100%)'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Buy Data Bundles</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {['MTN', 'Vodafone', 'AirtelTigo'].map(network => (
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
                {network === 'MTN' && '🔴'}
                {network === 'Vodafone' && '📱'}
                {network === 'AirtelTigo' && '🟢'}
              </div>
              <h3 className="font-bold text-lg">{network}</h3>
            </button>
          ))}
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-bold mb-6">Available Bundles - {selectedNetwork}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bundles[selectedNetwork].map(bundle => (
              <div key={bundle.id} className="p-6 rounded-lg border" style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)'}}>
                <div className="mb-4">
                  <p className="text-2xl font-bold">{bundle.size}</p>
                  <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Validity: {bundle.validity}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xl font-bold text-primary-600">GHS {bundle.price.toFixed(2)}</p>
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
        </div>

        <div className="mt-8 card p-8">
          <h3 className="font-bold text-lg mb-4">Current Balance</h3>
          <p className="text-3xl font-bold text-primary-600">GHS {user?.balance?.toFixed(2) || '0.00'}</p>
        </div>
      </div>
    </div>
  );
}
