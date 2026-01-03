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
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-blue-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <UserLayout>
      <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold truncate">My Orders</h1>
              <p className="text-xs sm:text-sm mt-1 sm:mt-2 truncate" style={{color: 'var(--text-secondary)'}}>
                View and manage your data purchase orders
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-slate-100 transition disabled:opacity-50 flex-shrink-0"
              title="Refresh orders"
            >
              <RotateCw size={18} className={`sm:w-5 sm:h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white border-2 border-red-300 rounded-2xl text-red-700 text-sm sm:text-base">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 lg:mb-8 border-2 border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs sm:text-sm block mb-1.5 sm:mb-2 text-slate-600">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border-2 border-slate-200 text-sm bg-white hover:border-blue-400 transition-colors"
                >
                  <option value="all">All</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <label className="text-xs sm:text-sm block mb-1.5 sm:mb-2 text-slate-600">
                  Network
                </label>
                <select
                  value={networkFilter}
                  onChange={(e) => setNetworkFilter(e.target.value)}
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border-2 border-slate-200 text-sm bg-white hover:border-blue-400 transition-colors"
                >
                  <option value="all">All Networks</option>
                  {getUniqueNetworks().map(network => (
                    <option key={network} value={network}>{network}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Orders Table/Cards */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 border-2 border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
            {loading ? (
              <div className="text-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-xs sm:text-sm text-slate-600">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <p className="text-xs sm:text-sm text-slate-600">No orders found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table - Hidden on mobile */}
                <div className="hidden lg:block overflow-x-auto scrollbar-hide">
                  <style>{`
                    .scrollbar-hide::-webkit-scrollbar {
                      display: none;
                    }
                    .scrollbar-hide {
                      -ms-overflow-style: none;
                      scrollbar-width: none;
                    }
                  `}</style>
                  <table className="w-full text-sm min-w-[800px]">
                    <thead>
                      <tr style={{borderBottom: '2px solid #e5e7eb'}}>
                        <th className="text-left py-3 px-3 font-medium whitespace-nowrap text-slate-600">Order ID</th>
                        <th className="text-left py-3 px-3 font-medium whitespace-nowrap text-slate-600">Date</th>
                        <th className="text-left py-3 px-3 font-medium whitespace-nowrap text-slate-600">Network</th>
                        <th className="text-left py-3 px-3 font-medium whitespace-nowrap text-slate-600">Plan</th>
                        <th className="text-left py-3 px-3 font-medium whitespace-nowrap text-slate-600">Amount</th>
                        <th className="text-left py-3 px-3 font-medium whitespace-nowrap text-slate-600">Status</th>
                        <th className="text-left py-3 px-3 font-medium whitespace-nowrap text-slate-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(order => (
                        <tr key={order.id || order._id} style={{borderBottom: '1px solid #e5e7eb'}}>
                          <td className="py-3 px-3 font-mono text-xs text-slate-900">{order.orderNumber?.slice(-8) || 'N/A'}</td>
                          <td className="py-3 px-3 text-sm whitespace-nowrap text-slate-900">{formatDate(order.date || order.createdAt)}</td>
                          <td className="py-3 px-3 text-sm text-slate-900">{order.network || 'N/A'}</td>
                          <td className="py-3 px-3 text-sm max-w-[150px] truncate text-slate-900">{order.dataAmount || 'N/A'}</td>
                          <td className="py-3 px-3 font-bold text-blue-600 whitespace-nowrap">GHS {order.amount?.toFixed(2) || '0.00'}</td>
                          <td className="py-3 px-3">
                            <span className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => handleViewDetails(order)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg transition"
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

                {/* Tablet Compact Table - Hidden on mobile and desktop */}
                <div className="hidden sm:block lg:hidden overflow-x-auto scrollbar-hide">
                  <style>{`
                    .scrollbar-hide::-webkit-scrollbar {
                      display: none;
                    }
                    .scrollbar-hide {
                      -ms-overflow-style: none;
                      scrollbar-width: none;
                    }
                  `}</style>
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr style={{borderBottom: '2px solid #e5e7eb'}}>
                        <th className="text-left py-2.5 px-2 font-medium text-xs whitespace-nowrap text-slate-600">Order</th>
                        <th className="text-left py-2.5 px-2 font-medium text-xs whitespace-nowrap text-slate-600">Date</th>
                        <th className="text-left py-2.5 px-2 font-medium text-xs whitespace-nowrap text-slate-600">Details</th>
                        <th className="text-left py-2.5 px-2 font-medium text-xs whitespace-nowrap text-slate-600">Amount</th>
                        <th className="text-left py-2.5 px-2 font-medium text-xs whitespace-nowrap text-slate-600">Status</th>
                        <th className="text-left py-2.5 px-2 font-medium text-xs whitespace-nowrap text-slate-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(order => (
                        <tr key={order.id || order._id} style={{borderBottom: '1px solid #e5e7eb'}}>
                          <td className="py-2.5 px-2 font-mono text-xs text-slate-900">{order.orderNumber?.slice(-6) || 'N/A'}</td>
                          <td className="py-2.5 px-2 text-xs whitespace-nowrap text-slate-900">{formatDate(order.date || order.createdAt)}</td>
                          <td className="py-2.5 px-2 text-xs">
                            <div className="max-w-[120px] truncate text-slate-900">{order.network}</div>
                            <div className="text-xs truncate text-slate-600">{order.dataAmount}</div>
                          </td>
                          <td className="py-2.5 px-2 font-bold text-blue-600 text-xs whitespace-nowrap">GHS {order.amount?.toFixed(2) || '0.00'}</td>
                          <td className="py-2.5 px-2">
                            <span className={`text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2">
                            <button
                              onClick={() => handleViewDetails(order)}
                              className="p-1 hover:bg-slate-100 rounded-lg transition"
                              title="View details"
                            >
                              <Eye size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards - Shown only on mobile */}
                <div className="sm:hidden space-y-3">
                  {filteredOrders.map(order => (
                    <div 
                      key={order.id || order._id} 
                      className="p-3 rounded-xl border-2 border-slate-200 bg-white hover:shadow-lg transition-all"
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono truncate text-slate-600">
                            #{order.orderNumber?.slice(-8) || 'N/A'}
                          </p>
                          <p className="text-sm font-semibold mt-0.5 truncate text-slate-900">
                            {order.dataAmount} {order.network}
                          </p>
                        </div>
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition flex-shrink-0"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                      
                      <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-200">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs truncate text-slate-600">
                            {formatDate(order.date || order.createdAt)} • {formatTime(order.date || order.createdAt)}
                          </p>
                          <p className="text-sm font-bold text-blue-600 mt-0.5">
                            GHS {order.amount?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <span className={`text-xs font-medium whitespace-nowrap flex-shrink-0 ${getStatusColor(order.status)}`}>
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Order Details Modal */}
        {showDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div 
              className="rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto" 
              style={{backgroundColor: 'var(--bg-primary)'}}
            >
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6">Order Details</h2>

              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div className="flex justify-between items-start gap-2 pb-2 sm:pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                  <span className="text-xs sm:text-sm flex-shrink-0" style={{color: 'var(--text-secondary)'}}>Order Number</span>
                  <span className="font-mono text-xs sm:text-sm text-right break-all">{selectedOrder.orderNumber}</span>
                </div>

                <div className="flex justify-between items-start gap-2 pb-2 sm:pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                  <span className="text-xs sm:text-sm flex-shrink-0" style={{color: 'var(--text-secondary)'}}>Data Bundle</span>
                  <span className="font-semibold text-xs sm:text-sm text-right">{selectedOrder.dataAmount} {selectedOrder.network}</span>
                </div>

                {selectedOrder.planName && (
                  <div className="flex justify-between items-start gap-2 pb-2 sm:pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                    <span className="text-xs sm:text-sm flex-shrink-0" style={{color: 'var(--text-secondary)'}}>Plan Name</span>
                    <span className="text-xs sm:text-sm text-right break-all">{selectedOrder.planName}</span>
                  </div>
                )}

                <div className="flex justify-between items-start gap-2 pb-2 sm:pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                  <span className="text-xs sm:text-sm flex-shrink-0" style={{color: 'var(--text-secondary)'}}>Phone Number</span>
                  <span className="font-mono text-xs sm:text-sm">{selectedOrder.phoneNumber}</span>
                </div>

                <div className="flex justify-between items-start gap-2 pb-2 sm:pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                  <span className="text-xs sm:text-sm flex-shrink-0" style={{color: 'var(--text-secondary)'}}>Amount</span>
                  <span className="font-bold text-primary-600 text-xs sm:text-sm">GHS {selectedOrder.amount?.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-start gap-2 pb-2 sm:pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                  <span className="text-xs sm:text-sm flex-shrink-0" style={{color: 'var(--text-secondary)'}}>Payment Method</span>
                  <span className="capitalize text-xs sm:text-sm">{selectedOrder.paymentMethod}</span>
                </div>

                <div className="flex justify-between items-start gap-2 pb-2 sm:pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                  <span className="text-xs sm:text-sm flex-shrink-0" style={{color: 'var(--text-secondary)'}}>Status</span>
                  <span className={`text-xs sm:text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status?.charAt(0).toUpperCase() + selectedOrder.status?.slice(1)}
                  </span>
                </div>

                <div className="flex justify-between items-start gap-2 pb-2 sm:pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                  <span className="text-xs sm:text-sm flex-shrink-0" style={{color: 'var(--text-secondary)'}}>Order Date</span>
                  <span className="text-xs sm:text-sm text-right">{new Date(selectedOrder.date || selectedOrder.createdAt).toLocaleString('en-US')}</span>
                </div>

                {selectedOrder.providerMessage && (
                  <div className="flex justify-between items-start gap-2 pb-2 sm:pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                    <span className="text-xs sm:text-sm flex-shrink-0" style={{color: 'var(--text-secondary)'}}>Provider Message</span>
                    <span className="text-xs sm:text-sm text-right break-words">{selectedOrder.providerMessage}</span>
                  </div>
                )}

                {selectedOrder.errorMessage && (
                  <div className="flex justify-between items-start gap-2 pb-2 sm:pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                    <span className="text-xs sm:text-sm flex-shrink-0" style={{color: 'var(--text-secondary)'}}>Error</span>
                    <span className="text-xs sm:text-sm text-red-500 text-right break-words">{selectedOrder.errorMessage}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="w-full px-4 py-2 sm:py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm sm:text-base"
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