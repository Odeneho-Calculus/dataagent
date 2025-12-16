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
        return 'text-green-600 dark:text-green-400';
      case 'processing':
        return 'text-blue-600 dark:text-blue-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <UserLayout>
      <div className="min-h-screen w-full overflow-x-hidden" style={{background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-primary) 100%)'}}>
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
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-50 flex-shrink-0"
              title="Refresh orders"
            >
              <RotateCw size={18} className={`sm:w-5 sm:h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm sm:text-base">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="card p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 lg:mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label style={{color: 'var(--text-secondary)'}} className="text-xs sm:text-sm block mb-1.5 sm:mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border text-sm" 
                  style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)'}}
                >
                  <option value="all">All</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <label style={{color: 'var(--text-secondary)'}} className="text-xs sm:text-sm block mb-1.5 sm:mb-2">
                  Network
                </label>
                <select
                  value={networkFilter}
                  onChange={(e) => setNetworkFilter(e.target.value)}
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border text-sm" 
                  style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)'}}
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
          <div className="card p-4 sm:p-6 lg:p-8">
            {loading ? (
              <div className="text-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-slate-400 dark:border-slate-600 mx-auto mb-2"></div>
                <p className="text-xs sm:text-sm" style={{color: 'var(--text-secondary)'}}>Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <p className="text-xs sm:text-sm" style={{color: 'var(--text-secondary)'}}>No orders found</p>
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
                      <tr style={{borderBottom: '1px solid var(--border-color)'}}>
                        <th className="text-left py-3 px-3 font-medium whitespace-nowrap" style={{color: 'var(--text-secondary)'}}>Order ID</th>
                        <th className="text-left py-3 px-3 font-medium whitespace-nowrap" style={{color: 'var(--text-secondary)'}}>Date</th>
                        <th className="text-left py-3 px-3 font-medium whitespace-nowrap" style={{color: 'var(--text-secondary)'}}>Network</th>
                        <th className="text-left py-3 px-3 font-medium whitespace-nowrap" style={{color: 'var(--text-secondary)'}}>Plan</th>
                        <th className="text-left py-3 px-3 font-medium whitespace-nowrap" style={{color: 'var(--text-secondary)'}}>Amount</th>
                        <th className="text-left py-3 px-3 font-medium whitespace-nowrap" style={{color: 'var(--text-secondary)'}}>Status</th>
                        <th className="text-left py-3 px-3 font-medium whitespace-nowrap" style={{color: 'var(--text-secondary)'}}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(order => (
                        <tr key={order.id || order._id} style={{borderBottom: '1px solid var(--border-color)'}}>
                          <td className="py-3 px-3 font-mono text-xs">{order.orderNumber?.slice(-8) || 'N/A'}</td>
                          <td className="py-3 px-3 text-sm whitespace-nowrap">{formatDate(order.date || order.createdAt)}</td>
                          <td className="py-3 px-3 text-sm">{order.network || 'N/A'}</td>
                          <td className="py-3 px-3 text-sm max-w-[150px] truncate">{order.dataAmount || 'N/A'}</td>
                          <td className="py-3 px-3 font-bold text-primary-600 whitespace-nowrap">GHS {order.amount?.toFixed(2) || '0.00'}</td>
                          <td className="py-3 px-3">
                            <span className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => handleViewDetails(order)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition"
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
                      <tr style={{borderBottom: '1px solid var(--border-color)'}}>
                        <th className="text-left py-2.5 px-2 font-medium text-xs whitespace-nowrap" style={{color: 'var(--text-secondary)'}}>Order</th>
                        <th className="text-left py-2.5 px-2 font-medium text-xs whitespace-nowrap" style={{color: 'var(--text-secondary)'}}>Date</th>
                        <th className="text-left py-2.5 px-2 font-medium text-xs whitespace-nowrap" style={{color: 'var(--text-secondary)'}}>Details</th>
                        <th className="text-left py-2.5 px-2 font-medium text-xs whitespace-nowrap" style={{color: 'var(--text-secondary)'}}>Amount</th>
                        <th className="text-left py-2.5 px-2 font-medium text-xs whitespace-nowrap" style={{color: 'var(--text-secondary)'}}>Status</th>
                        <th className="text-left py-2.5 px-2 font-medium text-xs whitespace-nowrap" style={{color: 'var(--text-secondary)'}}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(order => (
                        <tr key={order.id || order._id} style={{borderBottom: '1px solid var(--border-color)'}}>
                          <td className="py-2.5 px-2 font-mono text-xs">{order.orderNumber?.slice(-6) || 'N/A'}</td>
                          <td className="py-2.5 px-2 text-xs whitespace-nowrap">{formatDate(order.date || order.createdAt)}</td>
                          <td className="py-2.5 px-2 text-xs">
                            <div className="max-w-[120px] truncate">{order.network}</div>
                            <div className="text-xs truncate" style={{color: 'var(--text-secondary)'}}>{order.dataAmount}</div>
                          </td>
                          <td className="py-2.5 px-2 font-bold text-primary-600 text-xs whitespace-nowrap">GHS {order.amount?.toFixed(2) || '0.00'}</td>
                          <td className="py-2.5 px-2">
                            <span className={`text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2">
                            <button
                              onClick={() => handleViewDetails(order)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition"
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
                      className="p-3 rounded-lg border" 
                      style={{backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)'}}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono truncate" style={{color: 'var(--text-secondary)'}}>
                            #{order.orderNumber?.slice(-8) || 'N/A'}
                          </p>
                          <p className="text-sm font-semibold mt-0.5 truncate">
                            {order.dataAmount} {order.network}
                          </p>
                        </div>
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition flex-shrink-0"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                      
                      <div className="flex justify-between items-center gap-2 pt-2 border-t" style={{borderColor: 'var(--border-color)'}}>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs truncate" style={{color: 'var(--text-secondary)'}}>
                            {formatDate(order.date || order.createdAt)} • {formatTime(order.date || order.createdAt)}
                          </p>
                          <p className="text-sm font-bold text-primary-600 mt-0.5">
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