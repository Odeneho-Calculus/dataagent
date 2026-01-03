import { useState, useEffect, useCallback } from 'react';
import { Eye, Edit2, Trash2, X, AlertCircle, Search, RefreshCw, ShoppingCart, CheckCircle, Clock, XCircle, TrendingUp, Database } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import { useSidebar } from '../context/SidebarContext';
import { admin as adminAPI } from '../services/api';

export default function AdminOrders() {
  const { sidebarOpen, closeSidebar } = useSidebar();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [networkFilter, setNetworkFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const [newStatus, setNewStatus] = useState('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [bulkDeleteStatus, setBulkDeleteStatus] = useState('pending');
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, networkFilter, searchTerm]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getOrders(page, 10, statusFilter, networkFilter);

      if (response.success) {
        setOrders(response.data?.orders || response.orders || []);
        setTotalPages(response.data?.pagination?.pages || response.pagination?.pages || 0);
      } else {
        setError(response.message || 'Failed to fetch orders');
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, networkFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  const getFilteredOrders = () => {
    if (!searchTerm) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(order =>
      (order.user?.name || order.userId?.name || '').toLowerCase().includes(term) ||
      (order.user?.email || order.userId?.email || '').toLowerCase().includes(term) ||
      (order.phoneNumber || '').includes(term) ||
      (order.orderNumber || '').includes(term) ||
      (order.planName || '').toLowerCase().includes(term)
    );
  };

  const calculateStats = () => {
    const total = orders.length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    return { total, completed, pending, processing };
  };

  const stats = calculateStats();
  const filteredOrders = getFilteredOrders();

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleEditStatus = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setAdminNotes(order.adminNotes || '');
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    try {
      setUpdateLoading(true);
      const response = await adminAPI.updateOrderStatus(
        selectedOrder.id || selectedOrder._id,
        newStatus,
        adminNotes
      );

      if (response.success) {
        setShowStatusModal(false);
        await fetchOrders();
        setSelectedOrder(null);
        showMessage('Order status updated successfully');
      } else {
        showMessage(response.message || 'Failed to update status', true);
      }
    } catch (err) {
      showMessage(err?.message || 'Failed to update status', true);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleOpenDelete = (order) => {
    setSelectedOrder(order);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedOrder) return;

    try {
      setUpdateLoading(true);
      const response = await adminAPI.deleteOrder(selectedOrder.id || selectedOrder._id);

      if (response.success) {
        setShowDeleteConfirm(false);
        await fetchOrders();
        setSelectedOrder(null);
        showMessage('Order deleted successfully');
      } else {
        showMessage(response.message || 'Failed to delete order', true);
      }
    } catch (err) {
      showMessage(err?.message || 'Failed to delete order', true);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleOpenBulkDelete = () => {
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    try {
      setUpdateLoading(true);
      const response = await adminAPI.bulkDeleteOrdersByStatus(bulkDeleteStatus);

      if (response.success) {
        setShowBulkDeleteConfirm(false);
        await fetchOrders();
        showMessage(`Deleted ${response.deletedCount || 0} orders with status: ${bulkDeleteStatus}`);
      } else {
        showMessage(response.message || 'Failed to delete orders', true);
      }
    } catch (err) {
      showMessage(err?.message || 'Failed to delete orders', true);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setUpdateLoading(true);
      const response = await adminAPI.syncOrdersFromTopza();
      if (response.success) {
        setPage(1);
        await fetchOrders();
        showMessage('Orders synced from Topza successfully');
      } else {
        showMessage(response.message || 'Sync failed', true);
      }
    } catch (err) {
      showMessage(err?.message || 'Sync failed', true);
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
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Order Management</h1>
              <p className="text-slate-600">Manage all customer orders and track their status</p>
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
                    <p className="text-slate-600 text-sm font-medium">Total Orders</p>
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
                    <p className="text-slate-600 text-sm font-medium">Processing</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.processing}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-blue-100" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by order #, user name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-0 text-sm hover:border-slate-300"
                  />
                </div>
                <button
                  onClick={handleSync}
                  disabled={updateLoading}
                  className="px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
                >
                  <RefreshCw size={18} className={updateLoading ? 'animate-spin' : ''} />
                  {updateLoading ? 'Syncing...' : 'Sync from Topza'}
                </button>
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
                    {['pending', 'processing', 'completed', 'failed'].map(status => (
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
                    <p className="text-slate-600">Loading orders...</p>
                  </div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-16">
                  <Database size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600 text-lg">No orders found</p>
                  <p className="text-slate-500 text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-slate-100 to-blue-50 border-b-2 border-slate-200">
                        <tr>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Order</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Customer</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Plan</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Amount</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Status</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Date</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredOrders.map(order => (
                          <tr
                            key={order.id || order._id}
                            className="hover:bg-blue-50 transition"
                          >
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <p className="text-sm font-semibold text-slate-900">{order.orderNumber?.slice(-8) || order._id?.slice(-8) || 'N/A'}</p>
                                <p className="text-xs text-slate-600">{order.planName || 'N/A'} • {order.network || 'N/A'}</p>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <p className="text-sm font-semibold text-slate-900">{order.user?.name || order.userId?.name || 'Unknown'}</p>
                                <p className="text-xs text-slate-600">{order.user?.email || order.userId?.email || 'N/A'}</p>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <p className="text-sm font-medium text-slate-900">{order.dataAmount || 'N/A'}</p>
                                <p className="text-xs text-slate-600">{order.phoneNumber || 'N/A'}</p>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <p className="text-sm font-bold text-blue-600">GHS {order.amount?.toFixed(2) || '0.00'}</p>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : order.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : order.status === 'processing'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <p className="text-xs text-slate-600">{new Date(order.date || order.createdAt).toLocaleDateString()}</p>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex gap-1 flex-wrap">
                                <button
                                  onClick={() => handleViewDetails(order)}
                                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4 text-cyan-600" />
                                </button>
                                <button
                                  onClick={() => handleEditStatus(order)}
                                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                                  title="Edit Status"
                                >
                                  <Edit2 className="w-4 h-4 text-blue-600" />
                                </button>
                                <button
                                  onClick={() => handleOpenDelete(order)}
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
                      Page {page} of {totalPages} • {filteredOrders.length} orders total
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

      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto border-2 border-slate-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart size={24} className="text-blue-600" />
                Order Details
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedOrder(null);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600 mb-1">Order Number</p>
                  <p className="font-semibold text-slate-900">{selectedOrder.orderNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    selectedOrder.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : selectedOrder.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : selectedOrder.status === 'processing'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedOrder.status?.charAt(0).toUpperCase() + selectedOrder.status?.slice(1) || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-slate-900 mb-3">Customer Info</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Name</p>
                    <p className="font-semibold text-slate-900">{selectedOrder.user?.name || selectedOrder.userId?.name || 'Unknown'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Email</p>
                    <p className="font-semibold text-slate-900 text-sm">{selectedOrder.user?.email || selectedOrder.userId?.email || 'N/A'}</p>
                  </div>
                  <div className="col-span-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Phone</p>
                    <p className="font-semibold text-slate-900">{selectedOrder.phoneNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-slate-900 mb-3">Order Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Plan</p>
                    <p className="font-semibold text-slate-900">{selectedOrder.planName || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Data</p>
                    <p className="font-semibold text-slate-900">{selectedOrder.dataAmount || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Network</p>
                    <p className="font-semibold text-slate-900">{selectedOrder.network || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-slate-600 mb-1">Amount</p>
                    <p className="font-bold text-blue-600">GHS {selectedOrder.amount?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>

              {(selectedOrder.providerMessage || selectedOrder.errorMessage || selectedOrder.adminNotes) && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Additional Info</h3>
                  {selectedOrder.providerMessage && (
                    <p className="text-sm text-slate-900 bg-blue-50 p-3 rounded mb-2">{selectedOrder.providerMessage}</p>
                  )}
                  {selectedOrder.errorMessage && (
                    <p className="text-sm text-red-700 bg-red-50 p-3 rounded mb-2">{selectedOrder.errorMessage}</p>
                  )}
                  {selectedOrder.adminNotes && (
                    <p className="text-sm text-slate-900 bg-amber-50 p-3 rounded">{selectedOrder.adminNotes}</p>
                  )}
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-xs text-slate-600">Created: {new Date(selectedOrder.date || selectedOrder.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedOrder(null);
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border-2 border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Edit2 size={24} className="text-blue-600" />
                Update Status
              </h2>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedOrder(null);
                }}
                disabled={updateLoading}
                className="p-1 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-4 rounded-xl border border-blue-200">
                <p className="text-sm text-slate-600 mb-1">Order</p>
                <p className="font-bold text-slate-900">{selectedOrder.orderNumber || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  disabled={updateLoading}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-400 focus:outline-none disabled:opacity-50"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this status update..."
                  disabled={updateLoading}
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-400 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedOrder(null);
                }}
                disabled={updateLoading}
                className="px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updateLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg transition disabled:opacity-50"
              >
                {updateLoading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Order"
        message={selectedOrder ? `Are you sure you want to delete order "${selectedOrder.orderNumber}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSelectedOrder(null);
        }}
      />

      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        title="Bulk Delete Orders"
        message={`Delete all orders with status: ${bulkDeleteStatus}? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />

      {!loading && filteredOrders.length > 0 && (
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
