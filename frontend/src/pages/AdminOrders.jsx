import { useState, useEffect, useCallback } from 'react';
import { Menu, Eye, Edit2, Trash2, X, Check, AlertCircle } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import Pagination from '../components/Pagination';
import { admin as adminAPI } from '../services/api';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [networkFilter, setNetworkFilter] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  const [newStatus, setNewStatus] = useState('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [bulkDeleteStatus, setBulkDeleteStatus] = useState('pending');
  const [updateLoading, setUpdateLoading] = useState(false);

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
      } else {
        alert(response.message || 'Failed to update status');
      }
    } catch (err) {
      alert(err?.message || 'Failed to update status');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;

    try {
      setUpdateLoading(true);
      const response = await adminAPI.deleteOrder(selectedOrder.id || selectedOrder._id);

      if (response.success) {
        setShowDeleteModal(false);
        await fetchOrders();
        setSelectedOrder(null);
      } else {
        alert(response.message || 'Failed to delete order');
      }
    } catch (err) {
      alert(err?.message || 'Failed to delete order');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setUpdateLoading(true);
      const response = await adminAPI.bulkDeleteOrdersByStatus(bulkDeleteStatus);

      if (response.success) {
        setShowBulkDeleteModal(false);
        await fetchOrders();
        alert(`Deleted ${response.deletedCount} orders with status: ${bulkDeleteStatus}`);
      } else {
        alert(response.message || 'Failed to delete orders');
      }
    } catch (err) {
      alert(err?.message || 'Failed to delete orders');
    } finally {
      setUpdateLoading(false);
    }
  };

  const statusColors = {
    completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    processing: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
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
          <h1 className="text-lg font-bold">Orders</h1>
        </div>

        <div className="flex-1 overflow-auto bg-white dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
                Order Management
              </h1>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-start gap-3">
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition"
                >
                  <Trash2 size={18} />
                  Bulk Delete
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>

                <select
                  value={networkFilter}
                  onChange={(e) => {
                    setNetworkFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">All Networks</option>
                  <option value="MTN">MTN</option>
                  <option value="TELECEL">TELECEL</option>
                  <option value="AIRTELTIGO">AIRTELTIGO</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600 dark:text-slate-400">No orders found</p>
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
                              Order #
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              User
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              Phone
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              Plan
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              Data
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              Network
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              Payment
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
                          {orders.map((order) => (
                            <tr
                              key={order.id || order._id}
                              className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                            >
                              <td className="px-4 py-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {order.orderNumber?.slice(-8) || 'N/A'}
                              </td>
                              <td className="px-4 py-4 text-slate-900 dark:text-white whitespace-nowrap">
                                <p className="font-medium text-xs">
                                  {order.user?.name || order.userId?.name || 'Unknown'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {order.user?.email || order.userId?.email || 'N/A'}
                                </p>
                              </td>
                              <td className="px-4 py-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {order.phoneNumber || 'N/A'}
                              </td>
                              <td className="px-4 py-4 text-slate-900 dark:text-white whitespace-nowrap text-xs">
                                {order.planName || 'N/A'}
                              </td>
                              <td className="px-4 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {order.dataAmount || 'N/A'}
                              </td>
                              <td className="px-4 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                {order.network || 'N/A'}
                              </td>
                              <td className="px-4 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                GHS {order.amount?.toFixed(2) || '0.00'}
                              </td>
                              <td className="px-4 py-4 text-slate-600 dark:text-slate-400 capitalize whitespace-nowrap">
                                {order.paymentMethod || 'N/A'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                                    statusColors[order.status] ||
                                    'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {order.status?.charAt(0).toUpperCase() +
                                    order.status?.slice(1) ||
                                    'N/A'}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {new Date(
                                  order.date || order.createdAt
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleViewDetails(order)}
                                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded transition"
                                    title="View Details"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleEditStatus(order)}
                                    className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded transition"
                                    title="Edit Status"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedOrder(order);
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

      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Order Details
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
                  <p className="text-sm text-slate-500 dark:text-slate-400">Order Number</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white font-mono">
                    {selectedOrder.orderNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      statusColors[selectedOrder.status]
                    }`}
                  >
                    {selectedOrder.status?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">User Name</p>
                    <p className="text-base font-medium text-slate-900 dark:text-white">
                      {selectedOrder.user?.name || selectedOrder.userId?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                    <p className="text-base font-medium text-slate-900 dark:text-white break-all">
                      {selectedOrder.user?.email || selectedOrder.userId?.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Phone Number</p>
                    <p className="text-base font-mono font-medium text-slate-900 dark:text-white">
                      {selectedOrder.phoneNumber || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Data Bundle Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Plan Name</p>
                    <p className="text-base font-medium text-slate-900 dark:text-white">
                      {selectedOrder.planName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Data Amount</p>
                    <p className="text-base font-medium text-slate-900 dark:text-white">
                      {selectedOrder.dataAmount || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Network</p>
                    <p className="text-base font-medium text-slate-900 dark:text-white">
                      {selectedOrder.network || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Amount</p>
                    <p className="text-base font-semibold text-slate-900 dark:text-white">
                      GHS {selectedOrder.amount?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Payment Method</p>
                    <p className="text-base font-medium text-slate-900 dark:text-white capitalize">
                      {selectedOrder.paymentMethod || 'N/A'}
                    </p>
                  </div>
                  {selectedOrder.paystackReference && (
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Paystack Reference</p>
                      <p className="text-base font-mono text-slate-900 dark:text-white">
                        {selectedOrder.paystackReference}
                      </p>
                    </div>
                  )}
                  {selectedOrder.transactionReference && (
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Transaction Reference</p>
                      <p className="text-base font-mono text-slate-900 dark:text-white">
                        {selectedOrder.transactionReference}
                      </p>
                    </div>
                  )}
                  {selectedOrder.transaction && (
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Transaction Status</p>
                      <p className="text-base font-medium text-slate-900 dark:text-white capitalize">
                        {selectedOrder.transaction?.status || 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedOrder.topzaOrderId && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4">TOPZA Information</h3>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">TOPZA Order ID</p>
                    <p className="text-base font-mono text-slate-900 dark:text-white break-all">
                      {selectedOrder.topzaOrderId}
                    </p>
                  </div>
                </div>
              )}

              {(selectedOrder.providerMessage || selectedOrder.errorMessage || selectedOrder.adminNotes) && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Additional Information</h3>
                  {selectedOrder.providerMessage && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Provider Message</p>
                      <p className="text-sm text-slate-900 dark:text-white bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                        {selectedOrder.providerMessage}
                      </p>
                    </div>
                  )}
                  {selectedOrder.errorMessage && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Error Message</p>
                      <p className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                        {selectedOrder.errorMessage}
                      </p>
                    </div>
                  )}
                  {selectedOrder.adminNotes && (
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Admin Notes</p>
                      <p className="text-sm text-slate-900 dark:text-white bg-amber-50 dark:bg-amber-900/20 p-3 rounded">
                        {selectedOrder.adminNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Created At</p>
                    <p className="text-sm text-slate-900 dark:text-white">
                      {new Date(selectedOrder.date || selectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedOrder.completedAt && (
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Completed At</p>
                      <p className="text-sm text-slate-900 dark:text-white">
                        {new Date(selectedOrder.completedAt).toLocaleString()}
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

      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Update Order Status
              </h2>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Order: {selectedOrder.orderNumber}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this status update..."
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  rows="3"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowStatusModal(false)}
                disabled={updateLoading}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updateLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                <Check size={18} />
                {updateLoading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Delete Order
              </h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-slate-700 dark:text-slate-300">
                Are you sure you want to delete order{' '}
                <span className="font-bold">{selectedOrder.orderNumber}</span>? This action
                cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={updateLoading}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrder}
                disabled={updateLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {updateLoading ? 'Deleting...' : 'Delete'}
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
                Bulk Delete Orders
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
                  Delete all orders with status:
                </label>
                <select
                  value={bulkDeleteStatus}
                  onChange={(e) => setBulkDeleteStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  ⚠️ This will permanently delete all orders with the selected status. This
                  action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={updateLoading}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={updateLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {updateLoading ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
