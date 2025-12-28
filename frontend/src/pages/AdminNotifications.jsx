import { useState, useEffect, useCallback } from 'react';
import { Menu, Trash2, Bell, CheckCircle, AlertCircle, Info, AlertTriangle, X, Search, Filter } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import Pagination from '../components/Pagination';
import { admin as adminAPI } from '../services/api';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [isReadFilter, setIsReadFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [stats, setStats] = useState({
    unreadCount: 0,
    totalCount: 0,
  });

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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      const response = await adminAPI.deleteNotification(id);
      if (response.success) {
        setNotifications(prev => prev.filter(n => n._id !== id));
        fetchNotificationStats();
      }
    } catch (err) {
      setError(err?.message || 'Failed to delete notification');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Delete all notifications? This cannot be undone.')) return;
    try {
      const response = await adminAPI.deleteAllNotifications();
      if (response.success) {
        setNotifications([]);
        setTotalPages(0);
        fetchNotificationStats();
      }
    } catch (err) {
      setError(err?.message || 'Failed to delete all notifications');
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
    user_created: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    data_purchase: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    low_balance: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    system: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300',
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

  if (loading && notifications.length === 0) {
    return (
      <div className="flex h-screen">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-950">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 dark:border-slate-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-lg font-bold">Notifications</h1>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            <div className="hidden lg:block mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Notifications</h1>
              <p className="text-slate-600 dark:text-slate-400">Manage platform notifications and alerts</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-200">{error}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Notifications</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalCount}</p>
                  </div>
                  <Bell className="w-8 h-8 text-blue-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Unread</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.unreadCount}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-yellow-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Read</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalCount - stats.unreadCount}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500 opacity-20" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search notifications..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <select
                      value={typeFilter}
                      onChange={(e) => {
                        setTypeFilter(e.target.value);
                        setPage(1);
                      }}
                      className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="false">Unread</option>
                      <option value="true">Read</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    {stats.unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium"
                      >
                        Mark All as Read
                      </button>
                    )}
                    <button
                      onClick={handleDeleteAll}
                      disabled={notifications.length === 0}
                      className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete All
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <Bell className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400 mb-2">No notifications found</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500">Notifications will appear here when new events occur</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                        !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type, notification.severity)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-semibold ${!notification.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {notification.title}
                                </h3>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[notification.type] || ''}`}>
                                  {getTypeLabel(notification.type)}
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">{notification.message}</p>
                              {notification.description && (
                                <p className="text-slate-500 dark:text-slate-500 text-sm mb-2">{notification.description}</p>
                              )}
                              <p className="text-xs text-slate-500 dark:text-slate-500">
                                {formatDate(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification._id)}
                              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                              title="Mark as read"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification._id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && totalPages > 1 && (
                <div className="p-6 border-t border-slate-200 dark:border-slate-800">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
