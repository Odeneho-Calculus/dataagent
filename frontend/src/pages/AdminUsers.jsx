import { useState, useEffect } from 'react';
import { Search, Edit2, Ban, Clock, Trash2, Menu, Eye, Info, RotateCcw } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import { admin as adminAPI } from '../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          <h1 className="text-lg font-bold">Manage Users</h1>
        </div>
        
        <div className="flex-1 overflow-auto bg-white dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Manage Users</h1>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
                {success}
              </div>
            )}

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
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-400">No users found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                          Balance
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr
                          key={user._id}
                          className={`border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                            user.deletedAt ? 'opacity-50' : ''
                          }`}
                        >
                          <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">
                            GHS {user.balance?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user)}`}>
                              {getStatusText(user)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm flex gap-1 flex-wrap">
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
