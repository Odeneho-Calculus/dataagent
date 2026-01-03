import { useState, useEffect, useCallback } from 'react';
import { Trash2, Bell, CheckCircle, AlertCircle, Info, AlertTriangle, X, Search, Database } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import { useSidebar } from '../context/SidebarContext';
import { admin as adminAPI } from '../services/api';

export default function AdminNotifications() {
  const { sidebarOpen, closeSidebar } = useSidebar();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [isReadFilter, setIsReadFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [success, setSuccess] = useState('');
  
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  
  const [stats, setStats] = useState({
    unreadCount: 0,
    totalCount: 0,
  });

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

  const fetchNotificationStats = useCallback(async () => {
    try {
      const response = await adminAPI.getNotificationStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getNotifications(page, 20, typeFilter, isReadFilter, searchQuery);

      if (response.success) {
        setNotifications(response.data?.notifications || []);
        setTotalPages(response.data?.pagination?.totalPages || 0);
        fetchNotificationStats();
      } else {
        setError(response.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, isReadFilter, searchQuery, fetchNotificationStats]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      const response = await adminAPI.markNotificationAsRead(id);
      if (response.success) {
        setNotifications(prev =>
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
        fetchNotificationStats();
      }
    } catch (err) {
      setError(err?.message || 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await adminAPI.markAllNotificationsAsRead();
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        fetchNotificationStats();
      }
    } catch (err) {
      setError(err?.message || 'Failed to mark all notifications as read');
    }
  };

  const handleOpenDelete = (notification) => {
    setSelectedNotification(notification);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedNotification) return;
    try {
      setUpdateLoading(true);
      const response = await adminAPI.deleteNotification(selectedNotification._id);
      if (response.success) {
        setShowDeleteConfirm(false);
        setNotifications(prev => prev.filter(n => n._id !== selectedNotification._id));
        setSelectedNotification(null);
        await fetchNotificationStats();
        showMessage('Notification deleted successfully');
      } else {
        showMessage(response.message || 'Failed to delete notification', true);
      }
    } catch (err) {
      showMessage(err?.message || 'Failed to delete notification', true);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleOpenDeleteAll = () => {
    setShowDeleteAllConfirm(true);
  };

  const confirmDeleteAll = async () => {
    try {
      setUpdateLoading(true);
      const response = await adminAPI.deleteAllNotifications();
      if (response.success) {
        setShowDeleteAllConfirm(false);
        setNotifications([]);
        setTotalPages(0);
        await fetchNotificationStats();
        showMessage('All notifications deleted successfully');
      } else {
        showMessage(response.message || 'Failed to delete notifications', true);
      }
    } catch (err) {
      showMessage(err?.message || 'Failed to delete notifications', true);
    } finally {
      setUpdateLoading(false);
    }
  };

  const getNotificationIcon = (type, severity) => {
    if (severity === 'error') return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (severity === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    if (severity === 'success') return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <Info className="w-5 h-5 text-blue-500" />;
  };

  const getTypeLabel = (type) => {
    const labels = {
      user_created: 'User Created',
      data_purchase: 'Data Purchase',
      low_balance: 'Low Balance',
      system: 'System',
    };
    return labels[type] || type;
  };

  const typeColors = {
    user_created: 'bg-blue-100 text-blue-700',
    data_purchase: 'bg-green-100 text-green-700',
    low_balance: 'bg-yellow-100 text-yellow-700',
    system: 'bg-gray-100 text-gray-700',
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-screen">
      <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Notifications</h1>
              <p className="text-slate-600">Manage platform notifications and alerts</p>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Total Notifications</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalCount}</p>
                  </div>
                  <Bell className="w-12 h-12 text-blue-100" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Unread</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.unreadCount}</p>
                  </div>
                  <AlertCircle className="w-12 h-12 text-yellow-100" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Read</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalCount - stats.unreadCount}</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-green-100" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-300 transition-all overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
                  <div className="flex gap-2">
                    {stats.unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="px-4 py-2 bg-blue-100 text-blue-900 border-2 border-blue-300 rounded-xl hover:bg-blue-200 transition-colors text-sm font-medium"
                      >
                        Mark All as Read
                      </button>
                    )}
                    <button
                      onClick={handleOpenDeleteAll}
                      disabled={notifications.length === 0}
                      className="px-4 py-2 bg-red-100 text-red-900 border-2 border-red-300 rounded-xl hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      Delete All
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-400 text-sm hover:border-slate-300"
                    />
                  </div>
                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-4 py-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-blue-400 text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="user_created">User Created</option>
                    <option value="data_purchase">Data Purchase</option>
                    <option value="low_balance">Low Balance</option>
                    <option value="system">System</option>
                  </select>
                  <select
                    value={isReadFilter}
                    onChange={(e) => {
                      setIsReadFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-4 py-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-blue-400 text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="false">Unread</option>
                    <option value="true">Read</option>
                  </select>
                </div>
              </div>

              {loading && notifications.length === 0 ? (
                <div className="flex justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading notifications...</p>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-16">
                  <Database size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600 text-lg">No notifications found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 sm:p-6 hover:bg-blue-50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type, notification.severity)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className={`font-semibold ${!notification.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                                  {notification.title}
                                </h3>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[notification.type] || ''}`}>
                                  {getTypeLabel(notification.type)}
                                </span>
                              </div>
                              <p className="text-slate-600 text-sm mb-1">{notification.message}</p>
                              {notification.description && (
                                <p className="text-slate-500 text-sm mb-2">{notification.description}</p>
                              )}
                              <p className="text-xs text-slate-500">
                                {formatDate(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification._id)}
                              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                              title="Mark as read"
                            >
                              <CheckCircle size={18} className="text-green-600" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenDelete(notification)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-red-600 transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <p className="text-sm text-slate-600">
                    Page {page} of {totalPages}
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
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Notification"
        message="Are you sure you want to delete this notification?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSelectedNotification(null);
        }}
        isDangerous={true}
      />

      <ConfirmDialog
        isOpen={showDeleteAllConfirm}
        title="Delete All Notifications"
        message="Are you sure you want to delete all notifications? This action cannot be undone."
        confirmText="Delete All"
        cancelText="Cancel"
        onConfirm={confirmDeleteAll}
        onCancel={() => setShowDeleteAllConfirm(false)}
        isDangerous={true}
      />
    </div>
  );
}
