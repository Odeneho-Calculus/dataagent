import React, { useState, useEffect } from 'react';
import { Eye, Download, Trash2, Lock, RotateCcw } from 'lucide-react';
import { wallet, purchases } from '../services/api';
import { useAuth } from '../context/AuthContext';
import UserLayout from '../components/UserLayout';

export default function Transactions() {
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [perPage, setPerPage] = useState(10);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryingId, setRetryingId] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  const fetchAllTransactions = async () => {
    try {
      setLoading(true);
      const [walletRes, purchasesRes, ordersRes, balanceRes] = await Promise.all([
        wallet.getTransactions(100, 0),
        purchases.list(100, 0),
        purchases.getOrders(100, 0),
        wallet.getBalance(),
      ]);

      const walletTransactions = walletRes.success ? walletRes.transactions || [] : [];
      const purchasesList = purchasesRes.success ? purchasesRes.purchases || [] : [];
      const ordersList = ordersRes.success ? ordersRes.data?.orders || [] : [];
      const currentBalance = balanceRes.success ? balanceRes.balance || 0 : 0;

      const getTransactionType = (tx) => {
        if (tx.type === 'wallet_topup') return 'Wallet Top-up';
        if (tx.type === 'referral_bonus') return 'Referral Bonus';
        if (tx.type === 'wallet_funding') {
          const desc = tx.description?.toLowerCase() || '';
          if (desc.includes('data purchase')) return 'Data Purchase';
          if (desc.includes('top-up') || desc.includes('topup')) return 'Wallet Top-up';
          return 'Wallet Transaction';
        }
        return 'Transaction';
      };

      const combined = [
        ...walletTransactions.map(tx => ({
          id: tx._id,
          type: getTransactionType(tx),
          description: tx.description || 'Transaction',
          amount: tx.amount,
          date: new Date(tx.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
          status: tx.status.charAt(0).toUpperCase() + tx.status.slice(1),
          statusRaw: tx.status,
          reference: tx.reference,
          txType: tx.type,
          createdAt: tx.createdAt,
          balanceAfter: 0,
        })),
        ...purchasesList.map(purchase => ({
          id: purchase._id,
          type: 'Data Purchase',
          description: `${purchase.gb}GB ${purchase.network} to ${purchase.recipient}`,
          amount: -purchase.price,
          date: new Date(purchase.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
          status: purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1),
          statusRaw: purchase.status,
          balanceAfter: 0,
        })),
        ...ordersList.map(order => ({
          id: order.id,
          type: 'Data Purchase',
          description: `${order.dataAmount}GB ${order.network} to ${order.phoneNumber}`,
          amount: -order.amount,
          date: new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
          status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
          statusRaw: order.status,
          balanceAfter: 0,
        })),
      ].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

      let runningBalance = currentBalance;
      const withBalances = combined.map(tx => {
        const balanceAfter = runningBalance;
        runningBalance = runningBalance - tx.amount;
        return {
          ...tx,
          balanceAfter,
        };
      });

      setTransactions(withBalances);
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
              ? { ...t, status: 'Completed', statusRaw: 'completed' }
              : t
          )
        );
      } else {
        setTransactions(prevTxs => 
          prevTxs.map(t => 
            t.id === tx.id 
              ? { ...t, status: 'Failed', statusRaw: 'failed' }
              : t
          )
        );
      }
    } catch {
      setTransactions(prevTxs => 
        prevTxs.map(t => 
          t.id === tx.id 
            ? { ...t, status: 'Failed', statusRaw: 'failed' }
            : t
        )
      );
    } finally {
      setRetryingId(null);
    }
  };

  const handleDeleteTransaction = (tx) => {
    setTransactions(prev => prev.filter(t => t.id !== tx.id));
  };

  const filteredTransactions = transactions.filter(tx => {
    if (typeFilter !== 'all') {
      if (typeFilter === 'purchase' && tx.type !== 'Data Purchase') return false;
      if (typeFilter === 'topup' && tx.type !== 'Wallet Top-up') return false;
      if (typeFilter === 'bonus' && tx.type !== 'Referral Bonus') return false;
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'completed' && !(tx.statusRaw === 'completed' || tx.statusRaw === 'successful')) return false;
      if (statusFilter === 'pending' && tx.statusRaw !== 'pending') return false;
      if (statusFilter === 'failed' && tx.statusRaw !== 'failed') return false;
    }
    return true;
  });

  const paginatedTransactions = filteredTransactions.slice(0, perPage);

  const getTransactionIcon = (type) => {
    switch(type) {
      case 'Data Purchase': return '📦';
      case 'Wallet Top-up': return '💳';
      case 'Wallet Funding': return '💰';
      case 'Referral Bonus': return '🎁';
      case 'Wallet Transaction': return '💳';
      default: return '🔒';
    }
  };

  const totalSpent = user?.totalSpent || 0;
  const totalTopUp = transactions
    .filter(t => t.type === 'Wallet Top-up' && (t.statusRaw === 'completed' || t.statusRaw === 'successful'))
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <UserLayout>
      <div className="min-h-screen" style={{background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-primary) 100%)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Lock size={24} />
              <h1 className="text-3xl md:text-4xl font-bold">Transaction History</h1>
            </div>
          </div>
          <button className="btn btn-secondary flex items-center gap-2">
            <Download size={16} />
            Export
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

        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label style={{color: 'var(--text-secondary)'}} className="text-sm block mb-2">Filter by Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border" 
                style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)'}}
              >
                <option value="all">All Types</option>
                <option value="purchase">Data Purchase</option>
                <option value="topup">Wallet Funding</option>
                <option value="bonus">Referral Bonus</option>
              </select>
            </div>
            <div>
              <label style={{color: 'var(--text-secondary)'}} className="text-sm block mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border" 
                style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)'}}
              >
                <option value="all">All Status</option>
                <option value="completed">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label style={{color: 'var(--text-secondary)'}} className="text-sm block mb-2">Per Page</label>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border" 
                style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)'}}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
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
          <div className="space-y-4">
            {paginatedTransactions.map(tx => (
              <div key={tx.id} className="card p-6" style={{backgroundColor: 'var(--bg-secondary)'}}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getTransactionIcon(tx.type)}</span>
                    <div>
                      <h3 className="font-semibold">{tx.type}</h3>
                      <p className="text-xs" style={{color: 'var(--text-secondary)'}}>{tx.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tx.statusRaw === 'completed' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : tx.statusRaw === 'failed'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    }`}>
                      ✓ {tx.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 py-3 border-y" style={{borderColor: 'var(--border-color)'}}>
                  <div>
                    <p className="text-xs" style={{color: 'var(--text-secondary)'}}>Amount</p>
                    <p className="font-bold" style={{color: tx.amount < 0 ? '#ef4444' : '#22c55e'}}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{color: 'var(--text-secondary)'}}>Balance After</p>
                    <p className="font-bold" style={{color: '#3b82f6'}}>GHS {tx.balanceAfter.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm">{tx.description}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedTx(tx);
                        setShowDetails(true);
                      }}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
                      title="View details"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
                      title="Download receipt"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteTransaction(tx)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition"
                      title="Delete transaction"
                    >
                      <Trash2 size={18} style={{color: '#ef4444'}} />
                    </button>
                    {tx.status === 'Pending' && tx.txType === 'wallet_topup' && (
                      <button
                        onClick={() => handleRetryVerification(tx)}
                        disabled={retryingId === tx.id}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition disabled:opacity-50"
                        title="Retry payment verification"
                      >
                        <RotateCcw 
                          size={18} 
                          className={`text-blue-500 ${retryingId === tx.id ? 'animate-spin' : ''}`}
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showDetails && selectedTx && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6" style={{backgroundColor: 'var(--bg-primary)'}}>
              <h2 className="text-2xl font-bold mb-6">Transaction Details</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                  <span style={{color: 'var(--text-secondary)'}}>Type</span>
                  <span className="font-semibold">{selectedTx.type}</span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                  <span style={{color: 'var(--text-secondary)'}}>Description</span>
                  <span className="text-sm">{selectedTx.description}</span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                  <span style={{color: 'var(--text-secondary)'}}>Amount</span>
                  <span className="font-bold" style={{color: selectedTx.amount < 0 ? '#ef4444' : '#22c55e'}}>
                    {selectedTx.amount > 0 ? '+' : ''}{selectedTx.amount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                  <span style={{color: 'var(--text-secondary)'}}>Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedTx.statusRaw === 'completed' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : selectedTx.statusRaw === 'failed'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {selectedTx.status}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                  <span style={{color: 'var(--text-secondary)'}}>Date</span>
                  <span className="text-sm">{selectedTx.date}</span>
                </div>
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </UserLayout>
  );
}
