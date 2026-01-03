import { useState, useCallback, useEffect } from 'react';
import { RotateCcw, Trash2, AlertCircle, Eye, Database, TrendingUp, CheckCircle, Search } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import { useSidebar } from '../context/SidebarContext';
import { admin as adminAPI } from '../services/api';

export default function AdminTransactions() {
  const { sidebarOpen, closeSidebar } = useSidebar();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
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
    setPage(1);
  }, [typeFilter, statusFilter, searchTerm]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const showMessage = (msg, isError = false) => {
    if (isError) {
      setError(msg);
    } else {
      setSuccess(msg);
    }
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 3000);
  };

  const handleRefresh = async () => {
    try {
      await fetchTransactions();
      showMessage('Transactions refreshed successfully');
    } catch (err) {
      showMessage(err?.message || 'Refresh failed', true);
    }
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowViewModal(true);
  };

  const handleOpenDelete = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedTransaction) return;

    try {
      setDeleteLoading(true);
      const response = await adminAPI.deleteTransaction(selectedTransaction._id);

      if (response.success) {
        setShowDeleteConfirm(false);
        setSelectedTransaction(null);
        await fetchTransactions();
        showMessage('Transaction deleted successfully');
      } else {
        showMessage(response.message || 'Failed to delete transaction', true);
      }
    } catch (err) {
      showMessage(err?.message || 'Failed to delete transaction', true);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenBulkDelete = () => {
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await adminAPI.bulkDeleteTransactionsByStatus(bulkDeleteStatus);

      if (response.success) {
        setShowBulkDeleteConfirm(false);
        await fetchTransactions();
        showMessage(`Deleted ${response.deletedCount} transactions with status: ${bulkDeleteStatus}`);
      } else {
        showMessage(response.message || 'Failed to delete transactions', true);
      }
    } catch (err) {
      showMessage(err?.message || 'Failed to delete transactions', true);
    } finally {
      setDeleteLoading(false);
    }
  };

  const statusColors = {
    successful: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
  };

  const typeLabels = {
    data_purchase: 'Data Purchase',
    wallet_funding: 'Wallet Funding',
    wallet_topup: 'Wallet Funding',
    refund: 'Refund',
    purchase_refund: 'Refund',
    referral_bonus: 'Referral Bonus',
  };

  const filteredTransactions = transactions.filter(tx =>
    !searchTerm || 
    tx.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const successCount = filteredTransactions.filter(t => t.status === 'successful').length;
  const pendingCount = filteredTransactions.filter(t => t.status === 'pending').length;
  const failedCount = filteredTransactions.filter(t => t.status === 'failed').length;
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div className="flex h-screen">
      <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                Manage Transactions
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Monitor and manage all transactions, payments, and refunds
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 text-sm sm:text-base flex items-center gap-3">
                <AlertCircle size={20} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-3 sm:p-4 bg-green-50 border-2 border-green-200 rounded-2xl text-green-700 text-sm sm:text-base flex items-center gap-3">
                <CheckCircle size={20} className="flex-shrink-0" />
                {success}
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Database className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Total Transactions</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{filteredTransactions.length}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Successful</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{successCount}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Pending</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{pendingCount}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Total Amount</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">GHS {totalAmount.toFixed(2)}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all mb-6 sm:mb-8">
              {/* Search & Refresh Row */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by user name, email, or reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-0 text-sm hover:border-slate-300"
                  />
                </div>
                <button
                  onClick={handleRefresh}
                  className="px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
                >
                  <RotateCcw size={18} />
                  Refresh
                </button>
              </div>

              {/* Filters Row */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Type</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setTypeFilter(''); setPage(1); }}
                      className={`px-4 py-2 rounded-lg font-medium transition text-sm whitespace-nowrap ${
                        typeFilter === ''
                          ? 'bg-blue-100 text-blue-900 border-2 border-blue-300'
                          : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border-2 border-slate-200'
                      }`}
                    >
                      All Types
                    </button>
                    {['data_purchase', 'wallet_funding', 'refund'].map(type => (
                      <button
                        key={type}
                        onClick={() => { setTypeFilter(type); setPage(1); }}
                        className={`px-4 py-2 rounded-lg font-medium transition text-sm whitespace-nowrap ${
                          typeFilter === type
                            ? 'bg-blue-100 text-blue-900 border-2 border-blue-300'
                            : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border-2 border-slate-200'
                        }`}
                      >
                        {typeLabels[type]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Status</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setStatusFilter(''); setPage(1); }}
                      className={`px-4 py-2 rounded-lg font-medium transition text-sm whitespace-nowrap ${
                        statusFilter === ''
                          ? 'bg-blue-100 text-blue-900 border-2 border-blue-300'
                          : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border-2 border-slate-200'
                      }`}
                    >
                      All Status
                    </button>
                    {['successful', 'pending', 'failed', 'cancelled'].map(status => (
                      <button
                        key={status}
                        onClick={() => { setStatusFilter(status); setPage(1); }}
                        className={`px-4 py-2 rounded-lg font-medium transition text-sm whitespace-nowrap ${
                          statusFilter === status
                            ? 'bg-blue-100 text-blue-900 border-2 border-blue-300'
                            : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border-2 border-slate-200'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-300 transition-all overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading transactions...</p>
                  </div>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-16">
                  <Database size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600 text-lg">No transactions found</p>
                  <p className="text-slate-500 text-sm">Try adjusting your filters or search</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-slate-100 to-blue-50 border-b-2 border-slate-200">
                        <tr>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">User</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Type</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Amount</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Status</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Date</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredTransactions.map((tx) => (
                          <tr
                            key={tx._id}
                            className="hover:bg-blue-50 transition"
                          >
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <p className="text-sm font-semibold text-slate-900">{tx.userId?.name || 'Unknown'}</p>
                                <p className="text-xs text-slate-600">{tx.userId?.email || 'N/A'}</p>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <p className="text-sm font-medium text-slate-900">{typeLabels[tx.type] || tx.type || 'N/A'}</p>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <p className="text-sm font-bold text-blue-600">{tx.currency || 'GHS'} {tx.amount?.toFixed(2) || '0.00'}</p>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[tx.status] || 'bg-slate-100 text-slate-700'}`}>
                                {tx.status?.charAt(0).toUpperCase() + tx.status?.slice(1) || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <p className="text-xs text-slate-600">{new Date(tx.createdAt).toLocaleDateString()}</p>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex gap-1 flex-wrap">
                                <button
                                  onClick={() => handleViewDetails(tx)}
                                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4 text-cyan-600" />
                                </button>
                                <button
                                  onClick={() => handleOpenDelete(tx)}
                                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <p className="text-sm text-slate-600">
                      Page {page} of {totalPages} • {filteredTransactions.length} transactions
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      {showViewModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-96 overflow-y-auto border-2 border-slate-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Transaction Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedTransaction(null);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div><span className="font-medium text-slate-900">ID:</span> <span className="text-xs font-mono text-slate-600">{selectedTransaction._id?.slice(-8)}</span></div>
              <div><span className="font-medium text-slate-900">User:</span> {selectedTransaction.userId?.name || 'Unknown'}</div>
              <div><span className="font-medium text-slate-900">Email:</span> {selectedTransaction.userId?.email || 'N/A'}</div>
              <div><span className="font-medium text-slate-900">Type:</span> {typeLabels[selectedTransaction.type] || selectedTransaction.type}</div>
              <div><span className="font-medium text-slate-900">Amount:</span> {selectedTransaction.currency || 'GHS'} {selectedTransaction.amount?.toFixed(2)}</div>
              <div><span className="font-medium text-slate-900">Status:</span> <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[selectedTransaction.status]}`}>{selectedTransaction.status?.toUpperCase()}</span></div>
              {selectedTransaction.reference && <div><span className="font-medium text-slate-900">Reference:</span> {selectedTransaction.reference}</div>}
              {selectedTransaction.description && <div><span className="font-medium text-slate-900">Description:</span> {selectedTransaction.description}</div>}
              <div><span className="font-medium text-slate-900">Date:</span> {new Date(selectedTransaction.createdAt).toLocaleString()}</div>
            </div>

            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedTransaction(null);
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Transaction"
        message={selectedTransaction ? `Delete transaction ID ${selectedTransaction._id?.slice(-8)}? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSelectedTransaction(null);
        }}
      />

      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        title="Bulk Delete Transactions"
        message={`Delete all transactions with status: ${bulkDeleteStatus}? This cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />

      {/* Bulk Delete Button - Floating */}
      {!loading && filteredTransactions.length > 0 && (
        <button
          onClick={handleOpenBulkDelete}
          className="fixed bottom-6 right-6 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Trash2 size={18} />
          Bulk Delete
        </button>
      )}
    </div>
  );
}
