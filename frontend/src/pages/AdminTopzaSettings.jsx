import { useState, useEffect, useCallback } from 'react';
import { Menu, RotateCcw, AlertCircle, RefreshCw, CheckCircle, DollarSign, Clock, Eye, X } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import Pagination from '../components/Pagination';
import { admin as adminAPI } from '../services/api';

export default function AdminTopzaSettings() {
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      setError('');
      await fetchWalletSettings();
      await fetchTransactions();
    } catch (err) {
      setError(err?.message || 'Sync failed');
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

  if (loading && !walletData) {
    return (
      <div className="flex h-screen">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-950">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 dark:border-slate-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading wallet settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-bold">Topza Wallet</h1>
        </div>

        <div className="flex-1 overflow-auto bg-white dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Topza Wallet Settings
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your Topza wallet and view transaction history
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-center gap-3">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {walletData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Last Sync</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {formatDate(walletData.lastSync)}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                          {formatTime(walletData.lastSync)}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Topza Balance</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          GHS {typeof walletData.balance === 'number' ? walletData.balance.toFixed(2) : '0.00'}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <DollarSign className="text-blue-600 dark:text-blue-400" size={24} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Sync Status</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {walletData.syncStatus}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                          Created: {walletData.createdCount} | Updated: {walletData.updatedCount}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <Clock className="text-blue-600 dark:text-blue-400" size={24} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Synchronization
                    </h2>
                    <button
                      onClick={handleSyncAll}
                      disabled={syncing}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition"
                    >
                      <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                      {syncing ? 'Syncing...' : 'Sync All Networks'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { name: 'MTN', badge: 'MTN' },
                      { name: 'TELECEL', badge: 'TEL' },
                      { name: 'AirtelTigo', badge: 'Air' }
                    ].map((network) => (
                      <div key={network.name} className="border border-slate-300 dark:border-slate-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {network.name}
                          </h3>
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm font-medium">
                            {network.badge}
                          </span>
                        </div>
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium transition">
                          <RotateCcw size={18} />
                          Sync
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                Topza Transaction History
              </h2>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Filter by type..."
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Filter by status..."
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 dark:text-slate-400">No transactions found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-300 dark:border-slate-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">DATE</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">TYPE</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">AMOUNT</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">STATUS</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction, idx) => (
                        <tr key={idx} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                          <td className="py-3 px-4 text-slate-900 dark:text-white">
                            {formatDate(transaction.date || transaction.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-slate-900 dark:text-white">
                            {typeLabels[transaction.transactionType] || transaction.transactionType || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-slate-900 dark:text-white font-semibold">
                            GHS {typeof transaction.amount === 'number' ? transaction.amount.toFixed(2) : '0.00'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[transaction.status] || statusColors.pending}`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleViewDetails(transaction)}
                              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition"
                              title="View details"
                            >
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Transaction Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <X size={24} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Transaction ID</p>
                  <p className="text-slate-900 dark:text-white font-mono text-sm break-all">{selectedTransaction._id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Amount</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    GHS {typeof selectedTransaction.amount === 'number' ? selectedTransaction.amount.toFixed(2) : '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Type</p>
                  <p className="text-slate-900 dark:text-white">{typeLabels[selectedTransaction.transactionType] || selectedTransaction.transactionType}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedTransaction.status] || statusColors.pending}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Date</p>
                  <p className="text-slate-900 dark:text-white">{formatDate(selectedTransaction.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Time</p>
                  <p className="text-slate-900 dark:text-white">{formatTime(selectedTransaction.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Currency</p>
                  <p className="text-slate-900 dark:text-white">{selectedTransaction.currency || 'GHS'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Fee</p>
                  <p className="text-slate-900 dark:text-white">
                    GHS {typeof selectedTransaction.fee === 'number' ? selectedTransaction.fee.toFixed(2) : '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Balance Before</p>
                  <p className="text-slate-900 dark:text-white">
                    GHS {typeof selectedTransaction.balanceBefore === 'number' ? selectedTransaction.balanceBefore.toFixed(2) : '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Balance After</p>
                  <p className="text-slate-900 dark:text-white">
                    GHS {typeof selectedTransaction.balanceAfter === 'number' ? selectedTransaction.balanceAfter.toFixed(2) : '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Payment Method</p>
                  <p className="text-slate-900 dark:text-white">{selectedTransaction.paymentMethod || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">User ID</p>
                  <p className="text-slate-900 dark:text-white font-mono text-sm break-all">{selectedTransaction.userId}</p>
                </div>
              </div>

              {selectedTransaction.description && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Description</p>
                  <p className="text-slate-900 dark:text-white">{selectedTransaction.description}</p>
                </div>
              )}

              {selectedTransaction.source && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Source</p>
                  <p className="text-slate-900 dark:text-white">{selectedTransaction.source}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition"
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
