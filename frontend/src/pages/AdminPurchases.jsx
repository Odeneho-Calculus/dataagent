import { useState, useEffect, useCallback } from 'react';
import { Eye, Trash2, X, AlertCircle, Search, ShoppingCart, CheckCircle, Clock, DollarSign, Database } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import { useSidebar } from '../context/SidebarContext';
import { admin as adminAPI } from '../services/api';

export default function AdminPurchases() {
  const { sidebarOpen, closeSidebar } = useSidebar();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [networkFilter, setNetworkFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, networkFilter, searchTerm]);

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getPurchases(page, 10);

      if (response.success) {
        setPurchases(response.data?.purchases || response.purchases || []);
        setTotalPages(response.data?.pagination?.pages || response.pagination?.pages || 0);
      } else {
        setError(response.message || 'Failed to fetch purchases');
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

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

  const getFilteredPurchases = () => {
    let filtered = purchases;

    if (statusFilter) {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (networkFilter) {
      filtered = filtered.filter(p => p.network === networkFilter);
    }

    if (!searchTerm) return filtered;

    const term = searchTerm.toLowerCase();
    return filtered.filter(purchase =>
      (purchase.user?.name || purchase.userId?.name || '').toLowerCase().includes(term) ||
      (purchase.user?.email || purchase.userId?.email || '').toLowerCase().includes(term) ||
      (purchase.phoneNumber || purchase.phone || '').includes(term) ||
      (purchase.planName || '').toLowerCase().includes(term)
    );
  };

  const calculateStats = () => {
    const total = purchases.length;
    const completed = purchases.filter(p => p.status === 'completed').length;
    const pending = purchases.filter(p => p.status === 'pending').length;
    const totalRevenue = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
    return { total, completed, pending, totalRevenue };
  };

  const stats = calculateStats();
  const filteredPurchases = getFilteredPurchases();

  const handleViewDetails = (purchase) => {
    setSelectedPurchase(purchase);
    setShowDetailsModal(true);
  };

  const handleOpenDelete = (purchase) => {
    setSelectedPurchase(purchase);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedPurchase) return;

    try {
      setUpdateLoading(true);
      const response = await adminAPI.deletePurchase(selectedPurchase.id || selectedPurchase._id);

      if (response.success) {
        setShowDeleteConfirm(false);
        await fetchPurchases();
        setSelectedPurchase(null);
        showMessage('Purchase deleted successfully');
      } else {
        showMessage(response.message || 'Failed to delete purchase', true);
      }
    } catch (err) {
      showMessage(err?.message || 'Failed to delete purchase', true);
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Purchase Management</h1>
              <p className="text-slate-600">Track all user purchases and manage transactions</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-white border-2 border-red-300 rounded-2xl text-red-700 flex items-start gap-3">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-white border-2 border-green-300 rounded-2xl text-green-700 flex items-start gap-3">
                <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Total Purchases</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
                  </div>
                  <ShoppingCart className="w-12 h-12 text-blue-100" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Completed</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.completed}</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-green-100" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
                  </div>
                  <Clock className="w-12 h-12 text-yellow-100" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Total Revenue</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">GHS {stats.totalRevenue.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-12 h-12 text-purple-100" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by user name, email, phone, plan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-0 text-sm hover:border-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2 block">Status</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setStatusFilter('')}
                      className={`px-4 py-2 rounded-lg font-medium transition text-sm whitespace-nowrap ${
                        statusFilter === ''
                          ? 'bg-blue-100 text-blue-900 border-2 border-blue-300'
                          : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border-2 border-slate-200'
                      }`}
                    >
                      All Status
                    </button>
                    {['pending', 'completed', 'failed'].map(status => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
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

                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2 block">Network</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setNetworkFilter('')}
                      className={`px-4 py-2 rounded-lg font-medium transition text-sm whitespace-nowrap ${
                        networkFilter === ''
                          ? 'bg-blue-100 text-blue-900 border-2 border-blue-300'
                          : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border-2 border-slate-200'
                      }`}
                    >
                      All Networks
                    </button>
                    {['MTN', 'TELECEL', 'AIRTELTIGO'].map(network => (
                      <button
                        key={network}
                        onClick={() => setNetworkFilter(network)}
                        className={`px-4 py-2 rounded-lg font-medium transition text-sm whitespace-nowrap ${
                          networkFilter === network
                            ? 'bg-blue-100 text-blue-900 border-2 border-blue-300'
                            : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border-2 border-slate-200'
                        }`}
                      >
                        {network}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-300 transition-all overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading purchases...</p>
                  </div>
                </div>
              ) : filteredPurchases.length === 0 ? (
                <div className="text-center py-16">
                  <Database size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600 text-lg">No purchases found</p>
                  <p className="text-slate-500 text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-slate-100 to-blue-50 border-b-2 border-slate-200">
                        <tr>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">User</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Plan</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Network</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Amount</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Status</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Date</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredPurchases.map(purchase => (
                          <tr
                            key={purchase.id || purchase._id}
                            className="hover:bg-blue-50 transition"
                          >
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <p className="text-sm font-semibold text-slate-900">{purchase.user?.name || purchase.userId?.name || 'Unknown'}</p>
                                <p className="text-xs text-slate-600">{purchase.user?.email || purchase.userId?.email || 'N/A'}</p>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <p className="text-sm font-medium text-slate-900">{purchase.planName || 'N/A'}</p>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <p className="text-sm font-medium text-slate-900">{purchase.network || 'N/A'}</p>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <p className="text-sm font-bold text-blue-600">GHS {purchase.amount?.toFixed(2) || '0.00'}</p>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                purchase.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : purchase.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {purchase.status?.charAt(0).toUpperCase() + purchase.status?.slice(1) || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <p className="text-xs text-slate-600">{new Date(purchase.date || purchase.createdAt).toLocaleDateString()}</p>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex gap-1 flex-wrap">
                                <button
                                  onClick={() => handleViewDetails(purchase)}
                                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4 text-cyan-600" />
                                </button>
                                <button
                                  onClick={() => handleOpenDelete(purchase)}
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

                  <div className="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <p className="text-sm text-slate-600">
                      Page {page} of {totalPages} • {filteredPurchases.length} purchases total
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

      {showDetailsModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 sm:p-8 border-2 border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Purchase Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={24} className="text-slate-600" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h3 className="text-xs font-semibold text-slate-600 mb-4 block">Customer Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Name</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedPurchase.user?.name || selectedPurchase.userId?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Email</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedPurchase.user?.email || selectedPurchase.userId?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Phone</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedPurchase.phoneNumber || selectedPurchase.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h3 className="text-xs font-semibold text-slate-600 mb-4 block">Purchase Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Plan</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedPurchase.planName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Network</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedPurchase.network || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Amount</p>
                    <p className="text-sm font-bold text-blue-600">GHS {selectedPurchase.amount?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      selectedPurchase.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : selectedPurchase.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedPurchase.status?.charAt(0).toUpperCase() + selectedPurchase.status?.slice(1) || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Date</p>
                    <p className="text-sm font-semibold text-slate-900">{new Date(selectedPurchase.date || selectedPurchase.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium mb-1">Purchase ID</p>
                    <p className="text-sm font-mono text-slate-900">{(selectedPurchase.id || selectedPurchase._id)?.slice(-8) || 'N/A'}</p>
                  </div>
                </div>
              </div>
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

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Purchase"
        message={`Are you sure you want to delete this purchase? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSelectedPurchase(null);
        }}
        isDangerous={true}
      />
    </div>
  );
}
