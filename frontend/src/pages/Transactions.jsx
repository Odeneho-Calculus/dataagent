import React, { useState, useEffect } from 'react';
import { Eye, Download, Trash2, Lock, RotateCcw, X } from 'lucide-react';
import { wallet, purchases } from '../services/api';
import { useAuth } from '../context/AuthContext';
import UserLayout from '../components/UserLayout';

export default function Transactions() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
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
      const [walletRes, ordersRes, balanceRes] = await Promise.all([
        wallet.getTransactions(100, 0),
        purchases.getOrders(100, 0),
        wallet.getBalance(),
      ]);

      const walletTransactions = walletRes.success ? walletRes.transactions || [] : [];
      const ordersList = ordersRes.success ? ordersRes.data?.orders || [] : [];
      const currentBalance = balanceRes.success ? balanceRes.balance || 0 : 0;

      const combined = [
        ...walletTransactions.map(tx => {
          const desc = tx.description?.toLowerCase() || '';
          let type = 'Wallet Top-up';
          
          if (desc.includes('data purchase')) {
            type = 'Data Purchase';
          } else if (tx.type === 'referral_bonus') {
            type = 'Referral Bonus';
          }
          
          return {
            id: tx._id,
            type,
            description: tx.description || 'Transaction',
            amount: tx.amount,
            date: new Date(tx.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
            status: tx.status.charAt(0).toUpperCase() + tx.status.slice(1),
            statusRaw: tx.status,
            reference: tx.reference,
            txType: tx.type,
            createdAt: tx.createdAt,
            balanceAfter: 0,
          };
        }),
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
    if (activeTab === 'data-purchase' && tx.type !== 'Data Purchase') return false;
    if (activeTab === 'topup' && tx.type !== 'Wallet Top-up') return false;
    if (activeTab === 'bonus' && tx.type !== 'Referral Bonus') return false;
    
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

  const totalSpent = transactions
    .filter(t => t.type === 'Data Purchase' && (t.statusRaw === 'completed' || t.statusRaw === 'successful'))
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
  const totalTopUp = transactions
    .filter(t => t.type === 'Wallet Top-up' && (t.statusRaw === 'completed' || t.statusRaw === 'successful' || t.statusRaw === 'completed'))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <UserLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6">
            <div className="w-full sm:w-auto">
              <div className="flex items-center gap-2 sm:gap-3 mb-1">
                <Lock size={20} className="sm:w-6 sm:h-6 flex-shrink-0" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">Transaction History</h1>
              </div>
            </div>
            <button className="w-full sm:w-auto px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300 transition flex items-center justify-center gap-2 text-sm sm:text-base">
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white border-2 border-red-300 rounded-2xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Stats Cards - Always 2 columns on mobile, 3 on larger screens */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 shadow-sm p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-slate-600 truncate">Total Transactions</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2 text-slate-900">{transactions.length}</p>
            </div>
            <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 shadow-sm p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-slate-600 truncate">Total Data Spent</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2 text-red-500 truncate">-GHS {totalSpent.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 shadow-sm p-4 sm:p-6 col-span-2 lg:col-span-1">
              <p className="text-xs sm:text-sm text-slate-600 truncate">Total Top-up</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2 text-green-500 truncate">+GHS {totalTopUp.toFixed(2)}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 mb-4 sm:mb-6 shadow-sm">
            {/* Horizontal scrolling tabs only */}
            <div className="overflow-x-auto scrollbar-hide border-b border-slate-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium transition border-b-2 whitespace-nowrap ${
                    activeTab === 'all'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTab('data-purchase')}
                  className={`px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium transition border-b-2 whitespace-nowrap ${
                    activeTab === 'data-purchase'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Data
                </button>
                <button
                  onClick={() => setActiveTab('topup')}
                  className={`px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium transition border-b-2 whitespace-nowrap ${
                    activeTab === 'topup'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Top-ups
                </button>
                <button
                  onClick={() => setActiveTab('bonus')}
                  className={`px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium transition border-b-2 whitespace-nowrap ${
                    activeTab === 'bonus'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bonuses
                </button>
              </div>
            </div>

            {/* Status Filter and Per Page - Compact layout */}
            <div className="p-3 sm:p-4 flex flex-row gap-2 sm:gap-3 items-center">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs sm:text-sm rounded-lg border-2 border-slate-200 bg-white text-slate-900 hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Filter by Status"
              >
                <option value="all">All Status</option>
                <option value="completed">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="px-2.5 py-1.5 text-xs sm:text-sm rounded-lg border-2 border-slate-200 bg-white text-slate-900 hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Items per page"
              >
                <option value={5}>5 items</option>
                <option value={10}>10 items</option>
                <option value={25}>25 items</option>
                <option value={50}>50 items</option>
              </select>
            </div>
          </div>

          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>

          {/* Transactions List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-slate-600">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-600">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {paginatedTransactions.map(tx => (
                <div key={tx.id} className="bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 shadow-sm p-4 sm:p-6">
                  {/* Transaction Header */}
                  <div className="flex justify-between items-start gap-3 mb-3 sm:mb-4">
                    <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                      <span className="text-xl sm:text-2xl flex-shrink-0">{getTransactionIcon(tx.type)}</span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm sm:text-base truncate text-slate-900">{tx.type}</h3>
                        <p className="text-xs text-slate-600">{tx.date}</p>
                      </div>
                    </div>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                      tx.statusRaw === 'completed' 
                        ? 'bg-green-100 text-green-700'
                        : tx.statusRaw === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      ✓ {tx.status}
                    </span>
                  </div>

                  {/* Amount & Balance Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 py-3 border-y border-slate-200">
                    <div>
                      <p className="text-xs text-slate-600 mb-0.5">Amount</p>
                      <p className="font-bold text-sm sm:text-base truncate" style={{color: tx.amount < 0 ? '#ef4444' : '#22c55e'}}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-0.5">Balance After</p>
                      <p className="font-bold text-sm sm:text-base text-blue-600 truncate">GHS {tx.balanceAfter.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Description & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-xs sm:text-sm text-slate-700 break-words flex-1 min-w-0">{tx.description}</p>
                    <div className="flex items-center gap-1.5 sm:gap-2 justify-end flex-shrink-0">
                      <button
                        onClick={() => {
                          setSelectedTx(tx);
                          setShowDetails(true);
                        }}
                        className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition"
                        title="View details"
                      >
                        <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </button>
                      <button
                        className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition"
                        title="Download receipt"
                      >
                        <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(tx)}
                        className="p-1.5 sm:p-2 hover:bg-red-100 rounded-lg transition"
                        title="Delete transaction"
                      >
                        <Trash2 size={16} className="sm:w-[18px] sm:h-[18px] text-red-500" />
                      </button>
                      {tx.status === 'Pending' && tx.txType === 'wallet_topup' && (
                        <button
                          onClick={() => handleRetryVerification(tx)}
                          disabled={retryingId === tx.id}
                          className="p-1.5 sm:p-2 hover:bg-blue-100 rounded-lg transition disabled:opacity-50"
                          title="Retry payment verification"
                        >
                          <RotateCcw 
                            size={16}
                            className={`sm:w-[18px] sm:h-[18px] text-blue-500 ${retryingId === tx.id ? 'animate-spin' : ''}`}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Transaction Details Modal */}
          {showDetails && selectedTx && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border-2 border-slate-200">
                <div className="sticky top-0 bg-white p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">Transaction Details</h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-1 hover:bg-slate-100 rounded-lg transition"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-start gap-4 pb-3 border-b border-slate-200">
                    <span className="text-sm text-slate-600">Type</span>
                    <span className="font-semibold text-sm text-right text-slate-900">{selectedTx.type}</span>
                  </div>

                  <div className="flex justify-between items-start gap-4 pb-3 border-b border-slate-200">
                    <span className="text-sm text-slate-600">Description</span>
                    <span className="text-sm text-right break-words max-w-[60%] text-slate-700">{selectedTx.description}</span>
                  </div>

                  <div className="flex justify-between items-start gap-4 pb-3 border-b border-slate-200">
                    <span className="text-sm text-slate-600">Amount</span>
                    <span className="font-bold text-sm" style={{color: selectedTx.amount < 0 ? '#ef4444' : '#22c55e'}}>
                      {selectedTx.amount > 0 ? '+' : ''}{selectedTx.amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-start gap-4 pb-3 border-b border-slate-200">
                    <span className="text-sm text-slate-600">Status</span>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                      selectedTx.statusRaw === 'completed' 
                        ? 'bg-green-100 text-green-700'
                        : selectedTx.statusRaw === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {selectedTx.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-start gap-4 pb-3 border-b border-slate-200">
                    <span className="text-sm text-slate-600">Date</span>
                    <span className="text-sm text-slate-700">{selectedTx.date}</span>
                  </div>

                  <div className="flex justify-between items-start gap-4 pb-3">
                    <span className="text-sm text-slate-600">Balance After</span>
                    <span className="font-bold text-sm text-blue-600">GHS {selectedTx.balanceAfter.toFixed(2)}</span>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white p-4 sm:p-6 border-t border-slate-200">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}