import React, { useState, useEffect } from 'react';
import { Eye, RotateCw } from 'lucide-react';
import { purchases } from '../services/api';
import UserLayout from '../components/UserLayout';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [networkFilter, setNetworkFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await purchases.getOrders(100, 0);
      if (response.success) {
        setOrders(response.data?.orders || response.orders || []);
      }
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  };

  const getUniqueNetworks = () => {
    const networks = new Set(orders.map(o => o.network).filter(Boolean));
    return Array.from(networks).sort();
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (networkFilter !== 'all' && order.network !== networkFilter) return false;
    return true;
  });

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  return (
    <UserLayout>
      <div className="min-h-screen" style={{background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-primary) 100%)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">My Orders</h1>
            <p className="text-sm mt-2" style={{color: 'var(--text-secondary)'}}>View and manage your data purchase orders</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-50"
            title="Refresh orders"
          >
            <RotateCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="card p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label style={{color: 'var(--text-secondary)'}} className="text-sm block mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border" 
                style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)'}}
              >
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label style={{color: 'var(--text-secondary)'}} className="text-sm block mb-2">Network</label>
              <select
                value={networkFilter}
                onChange={(e) => setNetworkFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border" 
                style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)'}}
              >
                <option value="all">All</option>
                {getUniqueNetworks().map(network => (
                  <option key={network} value={network}>{network}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-8">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 dark:border-slate-600 mx-auto mb-2"></div>
              <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm" style={{color: 'var(--text-secondary)'}}>No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{borderBottom: '1px solid var(--border-color)'}}>
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Order ID</th>
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Date</th>
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Time</th>
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Network</th>
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Plan</th>
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Amount</th>
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Status</th>
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.id || order._id} style={{borderBottom: '1px solid var(--border-color)'}}>
                      <td className="py-3 px-4 font-mono text-xs">{order.orderNumber?.slice(-8) || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm">{formatDate(order.date || order.createdAt)}</td>
                      <td className="py-3 px-4 text-xs font-mono">{formatTime(order.date || order.createdAt)}</td>
                      <td className="py-3 px-4 text-sm">{order.network || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm">{order.dataAmount && order.network ? `${order.dataAmount} ${order.network} Data` : 'N/A'}</td>
                      <td className="py-3 px-4 font-bold text-primary-600">GHS {order.amount?.toFixed(2) || '0.00'}</td>
                      <td className="py-3 px-4">
                        <span
                          style={{color: '#2563eb'}}
                          className="text-sm font-medium"
                        >
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6" style={{backgroundColor: 'var(--bg-primary)'}}>
            <h2 className="text-2xl font-bold mb-6">Order Details</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                <span style={{color: 'var(--text-secondary)'}}>Order Number</span>
                <span className="font-mono">{selectedOrder.orderNumber}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                <span style={{color: 'var(--text-secondary)'}}>Data Bundle</span>
                <span className="font-semibold">{selectedOrder.dataAmount} {selectedOrder.network}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                <span style={{color: 'var(--text-secondary)'}}>Plan Name</span>
                <span className="text-sm">{selectedOrder.planName}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                <span style={{color: 'var(--text-secondary)'}}>Phone Number</span>
                <span className="font-mono">{selectedOrder.phoneNumber}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                <span style={{color: 'var(--text-secondary)'}}>Amount</span>
                <span className="font-bold text-primary-600">GHS {selectedOrder.amount?.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                <span style={{color: 'var(--text-secondary)'}}>Payment Method</span>
                <span className="capitalize">{selectedOrder.paymentMethod}</span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                <span style={{color: 'var(--text-secondary)'}}>Status</span>
                <span style={{color: '#2563eb'}} className="text-sm font-medium">
                  {selectedOrder.status?.charAt(0).toUpperCase() + selectedOrder.status?.slice(1)}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                <span style={{color: 'var(--text-secondary)'}}>Order Date</span>
                <span className="text-sm">{new Date(selectedOrder.date || selectedOrder.createdAt).toLocaleString('en-US')}</span>
              </div>

              {selectedOrder.providerMessage && (
                <div className="flex justify-between items-start pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                  <span style={{color: 'var(--text-secondary)'}}>Provider Message</span>
                  <span className="text-sm text-right">{selectedOrder.providerMessage}</span>
                </div>
              )}

              {selectedOrder.errorMessage && (
                <div className="flex justify-between items-start pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                  <span style={{color: 'var(--text-secondary)'}}>Error</span>
                  <span className="text-sm text-red-500 text-right">{selectedOrder.errorMessage}</span>
                </div>
              )}
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
    </UserLayout>
  );
}
