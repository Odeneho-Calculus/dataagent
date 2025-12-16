import React, { useState, useEffect } from 'react';
import { Download, Filter, RotateCcw } from 'lucide-react';
import { wallet, purchases } from '../services/api';

export default function Transactions() {
  const [filter, setFilter] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryingId, setRetryingId] = useState(null);

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  const fetchAllTransactions = async () => {
    try {
      setLoading(true);
      const [walletRes, purchasesRes] = await Promise.all([
        wallet.getTransactions(100, 0),
        purchases.list(100, 0),
      ]);

      const walletTransactions = walletRes.success ? walletRes.transactions || [] : [];
      const purchasesList = purchasesRes.success ? purchasesRes.purchases || [] : [];

      const combined = [
        ...walletTransactions.map(tx => ({
          id: tx._id,
          type: tx.type === 'wallet_topup' ? 'Wallet Top-up' : 
                tx.type === 'referral_bonus' ? 'Referral Bonus' : 'Refund',
          description: tx.description || 'Transaction',
          amount: tx.amount,
          date: new Date(tx.createdAt).toLocaleDateString('en-CA'),
          status: tx.status.charAt(0).toUpperCase() + tx.status.slice(1),
          reference: tx.reference,
          txType: tx.type,
          createdAt: tx.createdAt,
        })),
        ...purchasesList.map(purchase => ({
          id: purchase._id,
          type: 'Data Purchase',
          description: `${purchase.gb}GB ${purchase.network} to ${purchase.recipient}`,
          amount: -purchase.price,
          date: new Date(purchase.createdAt).toLocaleDateString('en-CA'),
          status: purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1),
        })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setTransactions(combined);
    } catch (error) {
      setError('Failed to load transactions');
      console.error(error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryVerification = async (tx) => {
    if (!tx.reference || tx.txType !== 'wallet_topup') return;
    
    try {
      setRetryingId(tx.id);
      const response = await wallet.verifyPayment({ reference: tx.reference });
      
      if (response.success) {
        setTransactions(prevTxs => 
          prevTxs.map(t => 
            t.id === tx.id 
              ? { ...t, status: 'Completed' }
              : t
          )
        );
      } else {
        setTransactions(prevTxs => 
          prevTxs.map(t => 
            t.id === tx.id 
              ? { ...t, status: 'Failed' }
              : t
          )
        );
      }
    } catch {
      setTransactions(prevTxs => 
        prevTxs.map(t => 
          t.id === tx.id 
            ? { ...t, status: 'Failed' }
            : t
        )
      );
    } finally {
      setRetryingId(null);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'purchase') return tx.type === 'Data Purchase';
    if (filter === 'topup') return tx.type === 'Wallet Top-up';
    if (filter === 'bonus') return tx.type === 'Referral Bonus';
    return true;
  });

  const totalSpent = transactions
    .filter(t => t.type === 'Data Purchase' && t.status === 'Completed')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalTopUp = transactions
    .filter(t => t.type === 'Wallet Top-up' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-primary) 100%)'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Transaction History</h1>
          <button className="btn btn-secondary flex items-center gap-2">
            <Download size={16} />
            Export CSV
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card p-6">
            <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Total Transactions</p>
            <p className="text-3xl font-bold mt-2">{transactions.length}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Total Data Spent</p>
            <p className="text-3xl font-bold mt-2 text-red-500">-GHS {totalSpent.toFixed(2)}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Total Top-up</p>
            <p className="text-3xl font-bold mt-2 text-green-500">+GHS {totalTopUp.toFixed(2)}</p>
          </div>
        </div>

        <div className="card p-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter size={18} style={{color: 'var(--text-secondary)'}} />
              <span style={{color: 'var(--text-secondary)'}}>Filter:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'purchase', 'topup', 'bonus'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg transition ${
                    filter === f ? 'btn btn-primary' : 'btn btn-secondary'
                  }`}
                >
                  {f === 'all' && 'All'}
                  {f === 'purchase' && 'Data Purchases'}
                  {f === 'topup' && 'Top-ups'}
                  {f === 'bonus' && 'Bonuses'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 dark:border-slate-600 mx-auto mb-2"></div>
              <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm" style={{color: 'var(--text-secondary)'}}>No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{borderBottom: '1px solid var(--border-color)'}}>
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Type</th>
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Description</th>
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Amount</th>
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Date</th>
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(tx => (
                    <tr key={tx.id} style={{borderBottom: '1px solid var(--border-color)'}}>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded text-xs" style={{backgroundColor: 'var(--bg-secondary)'}}>
                          {tx.type === 'Data Purchase' && '📦'}
                          {tx.type === 'Wallet Top-up' && '💳'}
                          {tx.type === 'Referral Bonus' && '🎁'}
                          {' '}{tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">{tx.description}</td>
                      <td className="py-3 px-4 font-bold">
                        <span style={{color: tx.amount < 0 ? '#ef4444' : '#22c55e'}}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4">{tx.date}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${tx.status === 'Completed' ? 'text-green-500' : tx.status === 'Failed' ? 'text-red-500' : 'text-yellow-500'}`} style={{backgroundColor: 'var(--bg-secondary)'}}>
                            {tx.status}
                          </span>
                          {tx.status === 'Pending' && tx.txType === 'wallet_topup' && (
                            <button
                              onClick={() => handleRetryVerification(tx)}
                              disabled={retryingId === tx.id}
                              className="p-1 hover:bg-blue-500/20 rounded transition"
                              title="Retry payment verification"
                            >
                              <RotateCcw 
                                size={16} 
                                className={`text-blue-500 ${retryingId === tx.id ? 'animate-spin' : ''}`}
                              />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
