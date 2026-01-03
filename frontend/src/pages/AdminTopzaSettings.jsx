import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, AlertCircle, RefreshCw, CheckCircle, DollarSign, Clock, Eye, X, Database } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import { useSidebar } from '../context/SidebarContext';
import { admin as adminAPI } from '../services/api';

export default function AdminTopzaSettings() {
  const { sidebarOpen, closeSidebar } = useSidebar();
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await adminAPI.getTopzaWalletTransactions(page, 20, typeFilter, statusFilter);

      if (response.success) {
        setTransactions(response.data?.transactions || []);
        setTotalPages(response.pagination?.totalPages || 0);
      } else {
        setError(response.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch transactions');
    }
  }, [page, typeFilter, statusFilter]);

  useEffect(() => {
    fetchWalletSettings();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const fetchWalletSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getTopzaWalletSettings();

      if (response.success) {
        setWalletData(response.data);
        if (response.data?.error) {
          setError(`Topza API Error: ${response.data.error}`);
        }
      } else {
        setError(response.message || 'Failed to fetch wallet settings');
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch wallet settings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, isError = false) => {
    if (isError) {
      setError(msg);
    } else {
      // success message - can be added if needed
    }
    setTimeout(() => {
      setError('');
    }, 3000);
  };

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      setError('');
      await fetchWalletSettings();
      await fetchTransactions();
    } catch (err) {
      showMessage(err?.message || 'Sync failed', true);
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const statusColors = {
    completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    processing: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    successful: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  };

  const typeLabels = {
    purchase: 'Purchase',
    data_purchase: 'Data Purchase',
    wallet_funding: 'Wallet Funding',
    refund: 'Refund',
    withdrawal: 'Withdrawal',
    deposit: 'Deposit',
    bonus: 'Bonus',
    giveaway_prize: 'Giveaway Prize',
    referral_bonus: 'Referral Bonus',
    wallet_topup: 'Wallet Top-up',
    purchase_refund: 'Purchase Refund',
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  return (
    <div className="flex h-screen">
      <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Topza Wallet Settings</h1>
              <p className="text-slate-600">Manage your Topza wallet and view transaction history</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-white border-2 border-red-300 rounded-2xl text-red-700 flex items-start gap-3">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading wallet settings...</p>
                </div>
              </div>
            ) : walletData ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Topza Balance</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">GHS {typeof walletData.balance === 'number' ? walletData.balance.toFixed(2) : '0.00'}</p>
                      </div>
                      <DollarSign className="w-12 h-12 text-blue-100" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Last Sync</p>
                        <p className="text-2xl font-bold text-slate-900 mt-2">{formatDate(walletData.lastSync)}</p>
                        <p className="text-xs text-slate-500 mt-1">{formatTime(walletData.lastSync)}</p>
                      </div>
                      <CheckCircle className="w-12 h-12 text-green-100" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Created</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{walletData.createdCount || 0}</p>
                      </div>
                      <Clock className="w-12 h-12 text-yellow-100" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Updated</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{walletData.updatedCount || 0}</p>
                      </div>
                      <RefreshCw className="w-12 h-12 text-cyan-100" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all mb-6 sm:mb-8">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Network Synchronization</h2>
                    <button
                      onClick={handleSyncAll}
                      disabled={syncing}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm whitespace-nowrap"
                    >
                      <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                      {syncing ? 'Syncing...' : 'Sync All Networks'}
                    </button>
                  </div>
                </div>
              </>
            ) : null}

            <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-300 transition-all overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Topza Transaction History
                </h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-4 py-2 border-2 border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:border-blue-400 text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="purchase">Purchase</option>
                    <option value="refund">Refund</option>
                    <option value="deposit">Deposit</option>
                    <option value="withdrawal">Withdrawal</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-4 py-2 border-2 border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:border-blue-400 text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-16">
                  <Database size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600 text-lg">No transactions found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-slate-100 to-blue-50 border-b-2 border-slate-200">
                        <tr>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Date</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Type</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Amount</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Status</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {transactions.map((transaction, idx) => (
                          <tr key={idx} className="hover:bg-blue-50 transition">
                            <td className="px-4 sm:px-6 py-4 text-sm text-slate-600">{formatDate(transaction.date || transaction.createdAt)}</td>
                            <td className="px-4 sm:px-6 py-4 text-sm text-slate-900 font-medium">{typeLabels[transaction.transactionType] || transaction.transactionType || 'N/A'}</td>
                            <td className="px-4 sm:px-6 py-4 text-sm font-bold text-blue-600">GHS {typeof transaction.amount === 'number' ? transaction.amount.toFixed(2) : '0.00'}</td>
                            <td className="px-4 sm:px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[transaction.status] || statusColors.pending}`}>
                                {transaction.status}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <button
                                onClick={() => handleViewDetails(transaction)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition"
                                title="View details"
                              >
                                <Eye className="w-4 h-4 text-cyan-600" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <p className="text-sm text-slate-600">
                        Page {page} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        >
                          ← Previous
                        </button>
                        <button
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          disabled={page === totalPages}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 sm:p-8 border-2 border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Transaction Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={24} className="text-slate-600" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h3 className="text-xs font-semibold text-slate-600 mb-4 block">Transaction Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">ID</p>
                    <p className="text-sm font-mono text-slate-900 break-all">{selectedTransaction._id?.slice(-12) || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Amount</p>
                    <p className="text-sm font-bold text-blue-600">GHS {typeof selectedTransaction.amount === 'number' ? selectedTransaction.amount.toFixed(2) : '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Type</p>
                    <p className="text-sm font-semibold text-slate-900">{typeLabels[selectedTransaction.transactionType] || selectedTransaction.transactionType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[selectedTransaction.status] || statusColors.pending}`}>
                      {selectedTransaction.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Date</p>
                    <p className="text-sm font-semibold text-slate-900">{formatDate(selectedTransaction.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Time</p>
                    <p className="text-sm font-semibold text-slate-900">{formatTime(selectedTransaction.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h3 className="text-xs font-semibold text-slate-600 mb-4 block">Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Currency</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedTransaction.currency || 'GHS'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Fee</p>
                    <p className="text-sm font-semibold text-slate-900">GHS {typeof selectedTransaction.fee === 'number' ? selectedTransaction.fee.toFixed(2) : '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Balance Before</p>
                    <p className="text-sm font-semibold text-slate-900">GHS {typeof selectedTransaction.balanceBefore === 'number' ? selectedTransaction.balanceBefore.toFixed(2) : '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Balance After</p>
                    <p className="text-sm font-semibold text-slate-900">GHS {typeof selectedTransaction.balanceAfter === 'number' ? selectedTransaction.balanceAfter.toFixed(2) : '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Payment Method</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedTransaction.paymentMethod || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">User ID</p>
                    <p className="text-sm font-mono text-slate-900">{selectedTransaction.userId?.slice(-8) || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {selectedTransaction.description && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-600 font-medium mb-2">Description</p>
                  <p className="text-sm text-slate-900">{selectedTransaction.description}</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition font-medium"
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
