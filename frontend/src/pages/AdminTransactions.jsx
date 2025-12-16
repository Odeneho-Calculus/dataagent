import { useState, useCallback, useEffect } from 'react';
import { Menu, RotateCcw, Trash2, AlertCircle, X, Check, Eye } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import Pagination from '../components/Pagination';
import { admin as adminAPI } from '../services/api';

export default function AdminTransactions() {
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteStatus, setBulkDeleteStatus] = useState('pending');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getTransactions(page, 10, typeFilter, statusFilter);

      if (response.success) {
        setTransactions(response.transactions || []);
        setTotalPages(response.pagination?.pages || 0);
      } else {
        setError(response.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleRefresh = async () => {
    try {
      setSyncing(true);
      setError('');
      await fetchTransactions();
    } catch (err) {
      setError(err?.message || 'Refresh failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      setDeleteLoading(true);
      const response = await adminAPI.deleteTransaction(selectedTransaction._id);

      if (response.success) {
        setShowDeleteModal(false);
        await fetchTransactions();
        setSelectedTransaction(null);
      } else {
        alert(response.message || 'Failed to delete transaction');
      }
    } catch (err) {
      alert(err?.message || 'Failed to delete transaction');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await adminAPI.bulkDeleteTransactionsByStatus(bulkDeleteStatus);

      if (response.success) {
        setShowBulkDeleteModal(false);
        await fetchTransactions();
        alert(`Deleted ${response.deletedCount} transactions with status: ${bulkDeleteStatus}`);
      } else {
        alert(response.message || 'Failed to delete transactions');
      }
    } catch (err) {
      alert(err?.message || 'Failed to delete transactions');
    } finally {
      setDeleteLoading(false);
    }
  };

  const statusColors = {
    successful: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    cancelled: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300',
  };

  const typeColors = {
    data_purchase: 'text-blue-600 dark:text-blue-400',
    wallet_funding: 'text-purple-600 dark:text-purple-400',
    refund: 'text-orange-600 dark:text-orange-400',
  };

  const typeLabels = {
    data_purchase: 'Data Purchase',
    wallet_funding: 'Wallet Funding',
    refund: 'Refund',
    wallet_topup: 'Wallet Funding',
    purchase_refund: 'Refund',
    referral_bonus: 'Refund',
  };

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
          <h1 className="text-lg font-bold">Transactions</h1>
        </div>

        <div className="flex-1 overflow-auto bg-white dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Transactions
                </h1>
                <div className="flex gap-3">
                  <button
                    onClick={handleRefresh}
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition"
                  >
                    <RotateCcw size={18} className={syncing ? 'animate-spin' : ''} />
                    {syncing ? 'Refreshing...' : 'Refresh'}
                  </button>

                  <button
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition"
                  >
                    <Trash2 size={18} />
                    Bulk Delete
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-start gap-3">
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Transaction Type</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setTypeFilter('');
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      typeFilter === ''
                        ? 'bg-blue-600 dark:bg-blue-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    All Types
                  </button>
                  <button
                    onClick={() => {
                      setTypeFilter('data_purchase');
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      typeFilter === 'data_purchase'
                        ? 'bg-blue-600 dark:bg-blue-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    Data Purchase
                  </button>
                  <button
                    onClick={() => {
                      setTypeFilter('wallet_funding');
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      typeFilter === 'wallet_funding'
                        ? 'bg-blue-600 dark:bg-blue-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    Wallet Funding
                  </button>
                  <button
                    onClick={() => {
                      setTypeFilter('refund');
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      typeFilter === 'refund'
                        ? 'bg-blue-600 dark:bg-blue-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    Refund
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Status</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setStatusFilter('');
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      statusFilter === ''
                        ? 'bg-blue-600 dark:bg-blue-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    All Statuses
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('successful');
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      statusFilter === 'successful'
                        ? 'bg-green-600 dark:bg-green-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    Success
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('pending');
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      statusFilter === 'pending'
                        ? 'bg-yellow-600 dark:bg-yellow-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('failed');
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      statusFilter === 'failed'
                        ? 'bg-red-600 dark:bg-red-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    Failed
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('cancelled');
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      statusFilter === 'cancelled'
                        ? 'bg-gray-600 dark:bg-gray-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    Cancelled
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600 dark:text-slate-400">No transactions found</p>
                  </div>
                ) : (
                  <>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <div
                        className="overflow-x-auto"
                        style={{
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                        }}
                      >
                        <style>{`
                          div::-webkit-scrollbar {
                            display: none;
                          }
                        `}</style>
                        <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              ID
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              User
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              Type
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              Date
                            </th>
                            <th className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((tx) => (
                            <tr
                              key={tx._id}
                              className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                            >
                              <td className="px-4 py-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {tx._id?.slice(-8) || 'N/A'}
                              </td>
                              <td className="px-4 py-4 text-slate-900 dark:text-white whitespace-nowrap">
                                <p className="font-medium text-xs">
                                  {tx.userId?.name || 'Unknown'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {tx.userId?.email || 'N/A'}
                                </p>
                                {tx.isAPI && (
                                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                    API
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <a href="#" className={`font-medium ${typeColors[tx.type] || 'text-slate-600 dark:text-slate-400'}`}>
                                  {typeLabels[tx.type] || tx.type || 'N/A'}
                                </a>
                              </td>
                              <td className="px-4 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                {tx.currency || 'GHS'} {tx.amount?.toFixed(2) || '0.00'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                                    statusColors[tx.status] ||
                                    'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {tx.status?.charAt(0).toUpperCase() +
                                    tx.status?.slice(1) ||
                                    'N/A'}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {new Date(tx.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleViewDetails(tx)}
                                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded transition"
                                    title="View Details"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedTransaction(tx);
                                      setShowDeleteModal(true);
                                    }}
                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                      <Pagination 
                        currentPage={page} 
                        totalPages={totalPages} 
                        onPageChange={setPage}
                        isLoading={loading}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Transaction Details
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Transaction ID</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white font-mono">
                    {selectedTransaction._id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      statusColors[selectedTransaction.status]
                    }`}
                  >
                    {selectedTransaction.status?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">User Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">User Name</p>
                    <p className="text-base font-medium text-slate-900 dark:text-white">
                      {selectedTransaction.userId?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                    <p className="text-base font-medium text-slate-900 dark:text-white break-all">
                      {selectedTransaction.userId?.email || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Transaction Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Type</p>
                    <p className={`text-base font-medium ${typeColors[selectedTransaction.type] || 'text-slate-600 dark:text-slate-400'}`}>
                      {typeLabels[selectedTransaction.type] || selectedTransaction.type || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Amount</p>
                    <p className="text-base font-semibold text-slate-900 dark:text-white">
                      {selectedTransaction.currency || 'GHS'} {selectedTransaction.amount?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  {selectedTransaction.reference && (
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Reference</p>
                      <p className="text-base font-mono text-slate-900 dark:text-white">
                        {selectedTransaction.reference}
                      </p>
                    </div>
                  )}
                  {selectedTransaction.description && (
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Description</p>
                      <p className="text-base text-slate-900 dark:text-white">
                        {selectedTransaction.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedTransaction.metadata && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Additional Information</h3>
                  <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded text-sm">
                    <pre className="text-slate-900 dark:text-white overflow-auto">
                      {JSON.stringify(selectedTransaction.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Created At</p>
                    <p className="text-sm text-slate-900 dark:text-white">
                      {new Date(selectedTransaction.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedTransaction.updatedAt && (
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Updated At</p>
                      <p className="text-sm text-slate-900 dark:text-white">
                        {new Date(selectedTransaction.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Delete Transaction
              </h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-slate-600 dark:text-slate-300">
                Are you sure you want to delete this transaction? This action cannot be undone.
              </p>
              <div className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded">
                <p className="text-xs text-slate-500 dark:text-slate-400">Transaction ID</p>
                <p className="text-sm font-mono text-slate-900 dark:text-white">
                  {selectedTransaction._id}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTransaction}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Bulk Delete Transactions
              </h2>
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Delete all transactions with status:
                </label>
                <select
                  value={bulkDeleteStatus}
                  onChange={(e) => setBulkDeleteStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="successful">Successful</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  ⚠️ This will permanently delete all transactions with the selected status. This
                  action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={deleteLoading}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {deleteLoading ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
