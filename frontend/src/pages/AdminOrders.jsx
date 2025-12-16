import { useState, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { admin as adminAPI } from '../services/api';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getOrders(page, 10);

      if (response.success) {
        setOrders(response.orders);
        setTotalPages(response.pagination.pages);
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
              Data Purchase Orders
            </h1>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              </div>
            ) : (
              <>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600 dark:text-slate-400">No orders found</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                              Order #
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                              Data Bundle
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                              Phone
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                              Payment
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order) => (
                            <tr
                              key={order._id}
                              className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                            >
                              <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-400">
                                {order.orderNumber?.slice(-8) || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                                <div>
                                  <p className="font-medium">{order.userId?.name || 'Unknown'}</p>
                                  <p className="text-xs text-slate-500">{order.userId?.email || 'N/A'}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                <div>
                                  <p className="font-medium">{order.dataAmount}</p>
                                  <p className="text-xs">{order.network}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                                GHS {order.amount?.toFixed(2) || '0.00'}
                              </td>
                              <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-400">
                                {order.phoneNumber || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 capitalize">
                                {order.paymentMethod || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    statusColors[order.status] || 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'N/A'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-6 flex justify-between items-center">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Page {page} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          disabled={page === totalPages}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
