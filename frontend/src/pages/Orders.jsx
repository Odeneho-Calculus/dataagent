import React, { useState, useEffect } from 'react';
import { Eye, Download, Filter } from 'lucide-react';
import { purchases } from '../services/api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

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

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'completed') return order.status === 'completed';
    if (filter === 'pending') return order.status === 'pending';
    if (filter === 'processing') return order.status === 'processing';
    if (filter === 'failed') return order.status === 'failed';
    return true;
  });

  const statusColors = {
    completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
    pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
    processing: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
    failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-primary) 100%)'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">My Orders</h1>
          <button className="btn btn-secondary flex items-center gap-2">
            <Download size={16} />
            Export CSV
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-6">
            <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Total Orders</p>
            <p className="text-3xl font-bold mt-2">{orders.length}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Completed</p>
            <p className="text-3xl font-bold mt-2 text-green-500">
              {orders.filter(o => o.status === 'completed').length}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Pending</p>
            <p className="text-3xl font-bold mt-2 text-yellow-500">
              {orders.filter(o => o.status === 'pending' || o.status === 'processing').length}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Failed</p>
            <p className="text-3xl font-bold mt-2 text-red-500">
              {orders.filter(o => o.status === 'failed').length}
            </p>
          </div>
        </div>

        <div className="card p-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter size={18} style={{color: 'var(--text-secondary)'}} />
              <span style={{color: 'var(--text-secondary)'}}>Filter:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'completed', 'processing', 'pending', 'failed'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg transition ${
                    filter === f ? 'btn btn-primary' : 'btn btn-secondary'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

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
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Order #</th>
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Data Bundle</th>
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Amount</th>
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Phone</th>
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Payment</th>
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Status</th>
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Date</th>
                    <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.id || order._id} style={{borderBottom: '1px solid var(--border-color)'}}>
                      <td className="py-3 px-4 font-mono text-xs">{order.orderNumber?.slice(-8) || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold">{order.dataAmount}</p>
                          <p className="text-xs" style={{color: 'var(--text-secondary)'}}>{order.network}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-primary-600">
                        GHS {order.amount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{order.phoneNumber}</td>
                      <td className="py-3 px-4 text-xs">
                        <span className="capitalize">{order.paymentMethod}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]?.bg || ''} ${statusColors[order.status]?.text || ''}`}
                        >
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs" style={{color: 'var(--text-secondary)'}}>
                        {new Date(order.date || order.createdAt).toLocaleDateString('en-CA')}
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
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[selectedOrder.status]?.bg || ''} ${statusColors[selectedOrder.status]?.text || ''}`}
                >
                  {selectedOrder.status?.charAt(0).toUpperCase() + selectedOrder.status?.slice(1)}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
                <span style={{color: 'var(--text-secondary)'}}>Order Date</span>
                <span className="text-sm">{new Date(selectedOrder.date || selectedOrder.createdAt).toLocaleString('en-CA')}</span>
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
  );
}
