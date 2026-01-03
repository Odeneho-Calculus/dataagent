import { useState, useEffect } from 'react';
import { Search, Edit2, Ban, Clock, Trash2, Eye, Info, RotateCcw, Users, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import { useSidebar } from '../context/SidebarContext';
import { admin as adminAPI } from '../services/api';

export default function AdminUsers() {
  const { sidebarOpen, closeSidebar } = useSidebar();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [showUnbanConfirm, setShowUnbanConfirm] = useState(false);
  const [showUnsuspendConfirm, setShowUnsuspendConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [confirmingUserId, setConfirmingUserId] = useState(null);

  const [newRole, setNewRole] = useState('user');
  const [banReason, setBanReason] = useState('');
  const [suspendDays, setSuspendDays] = useState(7);

  useEffect(() => {
    fetchUsers();
  }, [page, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers(page, 10, 'user', search);

      if (response.success) {
        setUsers(response.users);
        setTotalPages(response.pagination.pages);
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 3000);
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    try {
      await adminAPI.updateUserRole(selectedUser._id, newRole);
      setShowRoleModal(false);
      setSelectedUser(null);
      fetchUsers();
      showMessage('User role updated successfully');
    } catch (err) {
      showMessage(err?.message || 'Failed to update role', true);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    try {
      await adminAPI.banUser(selectedUser._id, banReason);
      setShowBanModal(false);
      setBanReason('');
      setSelectedUser(null);
      fetchUsers();
      showMessage('User banned successfully');
    } catch (err) {
      showMessage(err?.message || 'Failed to ban user', true);
    }
  };

  const handleUnbanUser = (userId) => {
    setConfirmingUserId(userId);
    setShowUnbanConfirm(true);
  };

  const confirmUnbanUser = async () => {
    try {
      await adminAPI.unbanUser(confirmingUserId);
      fetchUsers();
      showMessage('User unbanned successfully');
    } catch (err) {
      showMessage(err?.message || 'Failed to unban user', true);
    } finally {
      setShowUnbanConfirm(false);
      setConfirmingUserId(null);
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser) return;
    if (suspendDays <= 0) {
      showMessage('Please enter a valid number of days', true);
      return;
    }
    try {
      await adminAPI.suspendUser(selectedUser._id, suspendDays);
      setShowSuspendModal(false);
      setSuspendDays(7);
      setSelectedUser(null);
      fetchUsers();
      showMessage(`User suspended for ${suspendDays} days`);
    } catch (err) {
      showMessage(err?.message || 'Failed to suspend user', true);
    }
  };

  const handleUnsuspendUser = (userId) => {
    setConfirmingUserId(userId);
    setShowUnsuspendConfirm(true);
  };

  const confirmUnsuspendUser = async () => {
    try {
      await adminAPI.unsuspendUser(confirmingUserId);
      fetchUsers();
      showMessage('User unsuspended successfully');
    } catch (err) {
      showMessage(err?.message || 'Failed to unsuspend user', true);
    } finally {
      setShowUnsuspendConfirm(false);
      setConfirmingUserId(null);
    }
  };

  const handleDeleteUser = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await adminAPI.deleteUser(selectedUser._id);
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
      showMessage('User deleted successfully');
    } catch (err) {
      showMessage(err?.message || 'Failed to delete user', true);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleRestoreUser = (userId) => {
    setConfirmingUserId(userId);
    setShowRestoreConfirm(true);
  };

  const confirmRestoreUser = async () => {
    try {
      await adminAPI.restoreUser(confirmingUserId);
      fetchUsers();
      showMessage('User restored successfully');
    } catch (err) {
      showMessage(err?.message || 'Failed to restore user', true);
    } finally {
      setShowRestoreConfirm(false);
      setConfirmingUserId(null);
    }
  };

  const getStatusColor = (user) => {
    if (user.status === 'banned') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    if (user.status === 'suspended') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    if (user.deletedAt) return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
  };

  const getStatusText = (user) => {
    if (user.status === 'banned') return 'Banned';
    if (user.status === 'suspended') return `Suspended`;
    if (user.deletedAt) return 'Deleted';
    return 'Active';
  };

  const activeUsers = users.filter(u => u.status === 'active').length;
  const bannedUsers = users.filter(u => u.status === 'banned').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended').length;
  const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);

  return (
    <div className="flex h-screen">
      <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                Manage Users
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Monitor and manage user accounts, roles, and status
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 text-sm sm:text-base flex items-center gap-3">
                <AlertCircle size={20} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-3 sm:p-4 bg-green-50 border-2 border-green-200 rounded-2xl text-green-700 text-sm sm:text-base flex items-center gap-3">
                <CheckCircle size={20} className="flex-shrink-0" />
                {success}
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Total Users</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{users.length}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Active Users</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{activeUsers}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                    <Ban className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Banned Users</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{bannedUsers}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Suspended</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{suspendedUsers}</p>
              </div>
            </div>

            {/* Balance Summary & Search */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-6 sm:mb-8">
              <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-600" />
                    Total Balance
                  </h2>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">
                    GHS {totalBalance.toFixed(2)}
                  </p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{width: '45%'}}></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                <h3 className="text-sm font-semibold text-slate-600 mb-3">User Distribution</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Active</span>
                    <span className="font-bold text-green-600">{Math.round((activeUsers/users.length)*100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Banned</span>
                    <span className="font-bold text-red-600">{Math.round((bannedUsers/users.length)*100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Suspended</span>
                    <span className="font-bold text-orange-600">{Math.round((suspendedUsers/users.length)*100)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-0 text-sm hover:border-slate-300"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-300 transition-all overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading users...</p>
                  </div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-16">
                  <Users size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600 text-lg">No users found</p>
                  <p className="text-slate-500 text-sm">Try adjusting your search filters</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-100 to-blue-50 border-b-2 border-slate-200">
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">
                            User
                          </th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">
                            Balance
                          </th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">
                            Status
                          </th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                      {users.map((user) => (
                        <tr
                          key={user._id}
                          className={`hover:bg-blue-50 transition ${
                            user.deletedAt ? 'opacity-60 bg-slate-50' : ''
                          }`}
                        >
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                              <p className="text-xs text-slate-600">{user.email}</p>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <p className="text-sm font-bold text-blue-600">GHS {user.balance?.toFixed(2) || '0.00'}</p>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user)}`}>
                              {getStatusText(user)}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex gap-1 flex-wrap">
                            {user.deletedAt ? (
                              <button
                                onClick={() => handleRestoreUser(user._id)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                title="Restore User"
                              >
                                <RotateCcw className="w-4 h-4 text-green-600" />
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowViewModal(true);
                                  }}
                                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                  title="View Info"
                                >
                                  <Eye className="w-4 h-4 text-cyan-600" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setNewRole(user.role);
                                    setShowRoleModal(true);
                                  }}
                                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                  title="Change Role"
                                >
                                  <Edit2 className="w-4 h-4 text-blue-600" />
                                </button>
                                {user.status === 'banned' ? (
                                  <button
                                    onClick={() => handleUnbanUser(user._id)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                    title="Unban User"
                                  >
                                    <Ban className="w-4 h-4 text-yellow-600" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowBanModal(true);
                                    }}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                    title="Ban User"
                                  >
                                    <Ban className="w-4 h-4 text-red-600" />
                                  </button>
                                )}
                                {user.status === 'suspended' ? (
                                  <button
                                    onClick={() => handleUnsuspendUser(user._id)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                    title="Unsuspend User"
                                  >
                                    <Clock className="w-4 h-4 text-orange-600" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setSuspendDays(7);
                                      setShowSuspendModal(true);
                                    }}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                    title="Suspend User"
                                  >
                                    <Clock className="w-4 h-4 text-orange-500" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowDeleteModal(true);
                                  }}
                                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </>
                            )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  <div className="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <p className="text-sm text-slate-600">
                      Page {page} of {totalPages} • {users.length} users total
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

      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              User Information
            </h2>
            <div className="space-y-3">
              <div><span className="font-medium text-slate-900 dark:text-white">Name:</span> {selectedUser.name}</div>
              <div><span className="font-medium text-slate-900 dark:text-white">Email:</span> {selectedUser.email}</div>
              <div><span className="font-medium text-slate-900 dark:text-white">Balance:</span> GHS {selectedUser.balance?.toFixed(2) || '0.00'}</div>
              <div><span className="font-medium text-slate-900 dark:text-white">Role:</span> {selectedUser.role}</div>
              <div><span className="font-medium text-slate-900 dark:text-white">Status:</span> <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedUser)}`}>{getStatusText(selectedUser)}</span></div>
              <div><span className="font-medium text-slate-900 dark:text-white">Active:</span> {selectedUser.isActive ? 'Yes' : 'No'}</div>
              <div><span className="font-medium text-slate-900 dark:text-white">Referral Code:</span> {selectedUser.referralCode}</div>
              <div><span className="font-medium text-slate-900 dark:text-white">Referral Earnings:</span> GHS {selectedUser.referralEarnings?.toFixed(2) || '0.00'}</div>
              <div><span className="font-medium text-slate-900 dark:text-white">Joined:</span> {new Date(selectedUser.createdAt).toLocaleDateString()}</div>
              {selectedUser.status === 'banned' && selectedUser.banReason && (
                <div><span className="font-medium text-slate-900 dark:text-white">Ban Reason:</span> {selectedUser.banReason}</div>
              )}
              {selectedUser.status === 'suspended' && selectedUser.suspendedUntil && (
                <div><span className="font-medium text-slate-900 dark:text-white">Suspended Until:</span> {new Date(selectedUser.suspendedUntil).toLocaleDateString()}</div>
              )}
            </div>
            <button
              onClick={() => setShowViewModal(false)}
              className="mt-6 w-full px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Change User Role</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              User: {selectedUser.name} ({selectedUser.email})
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                New Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 text-red-600">Ban User</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              User: {selectedUser.name} ({selectedUser.email})
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Why is this user being banned?"
                className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
                rows="3"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBanModal(false)}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 text-orange-600">Suspend User</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              User: {selectedUser.name} ({selectedUser.email})
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Suspension Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={suspendDays}
                onChange={(e) => setSuspendDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSuspendModal(false)}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendUser}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 text-red-700">Delete User</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Are you sure you want to delete {selectedUser.name}? This action can be reversed by restoring the user.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showUnbanConfirm}
        title="Unban User"
        message="Are you sure you want to unban this user?"
        confirmText="Unban"
        onConfirm={confirmUnbanUser}
        onCancel={() => setShowUnbanConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showUnsuspendConfirm}
        title="Unsuspend User"
        message="Are you sure you want to unsuspend this user?"
        confirmText="Unsuspend"
        onConfirm={confirmUnsuspendUser}
        onCancel={() => setShowUnsuspendConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.name}? This action can be reversed by restoring the user.`}
        confirmText="Delete"
        onConfirm={confirmDeleteUser}
        onCancel={() => setShowDeleteConfirm(false)}
        isDangerous={true}
      />

      <ConfirmDialog
        isOpen={showRestoreConfirm}
        title="Restore User"
        message="Are you sure you want to restore this user?"
        confirmText="Restore"
        onConfirm={confirmRestoreUser}
        onCancel={() => setShowRestoreConfirm(false)}
      />
    </div>
  );
}
