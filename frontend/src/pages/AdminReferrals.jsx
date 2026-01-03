import { useState, useEffect, useCallback } from 'react';
import { Search, Edit2, RotateCcw, Eye, Settings, AlertCircle, CheckCircle, Users, TrendingUp, DollarSign, Award, Database, X } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import { useSidebar } from '../context/SidebarContext';
import { admin as adminAPI } from '../services/api';

export default function AdminReferrals() {
  const { sidebarOpen, closeSidebar } = useSidebar();
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedReferral, setSelectedReferral] = useState(null);

  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditEarningsModal, setShowEditEarningsModal] = useState(false);
  const [showResetCodeConfirm, setShowResetCodeConfirm] = useState(false);
  const [showResetAllConfirm, setShowResetAllConfirm] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [newEarnings, setNewEarnings] = useState(0);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    amountPerReferral: 1,
    minimumWithdrawalAmount: 10,
    isEnabled: true,
    maxReferralsPerUser: null,
    description: 'Earn GHS per successful referral',
  });

  useEffect(() => {
    setPage(1);
  }, [search]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [referralsRes, statsRes, settingsRes] = await Promise.all([
        adminAPI.getAllReferrals(page, 10, search),
        adminAPI.getReferralStats(),
        adminAPI.getReferralSettings(),
      ]);

      if (referralsRes.success) {
        setReferrals(referralsRes.referrals);
        setTotalPages(referralsRes.pagination.pages);
      }

      if (statsRes.success) {
        setStats(statsRes.stats);
      }

      if (settingsRes.success) {
        setSettingsForm(settingsRes.settings);
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch referral data');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showMessage = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 3000);
  };

  const getFilteredReferrals = () => {
    if (!search) return referrals;
    const term = search.toLowerCase();
    return referrals.filter(ref =>
      ref.name.toLowerCase().includes(term) ||
      ref.email.toLowerCase().includes(term) ||
      (ref.referralCode || '').toLowerCase().includes(term)
    );
  };

  const handleViewDetails = (referral) => {
    setSelectedReferral(referral);
    setShowViewModal(true);
  };

  const handleOpenEditEarnings = (referral) => {
    setSelectedReferral(referral);
    setNewEarnings(referral.referralEarnings || 0);
    setShowEditEarningsModal(true);
  };

  const confirmEditEarnings = async () => {
    if (!selectedReferral) return;
    if (newEarnings < 0) {
      showMessage('Earnings cannot be negative', true);
      return;
    }
    try {
      setUpdateLoading(true);
      await adminAPI.updateReferralEarnings(selectedReferral._id, newEarnings);
      setShowEditEarningsModal(false);
      setSelectedReferral(null);
      await fetchData();
      showMessage('Referral earnings updated successfully');
    } catch (err) {
      showMessage(err?.message || 'Failed to update earnings', true);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleOpenResetCode = (referral) => {
    setSelectedReferral(referral);
    setShowResetCodeConfirm(true);
  };

  const confirmResetCode = async () => {
    if (!selectedReferral) return;
    try {
      setUpdateLoading(true);
      await adminAPI.resetReferralCode(selectedReferral._id);
      setShowResetCodeConfirm(false);
      setSelectedReferral(null);
      await fetchData();
      showMessage('Referral code reset successfully');
    } catch (err) {
      showMessage(err?.message || 'Failed to reset code', true);
    } finally {
      setUpdateLoading(false);
    }
  };

  const confirmResetAllEarnings = async () => {
    try {
      setUpdateLoading(true);
      await adminAPI.resetAllReferralEarnings();
      setShowResetAllConfirm(false);
      await fetchData();
      showMessage('All referral earnings reset successfully');
    } catch (err) {
      showMessage(err?.message || 'Failed to reset earnings', true);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      setUpdateLoading(true);
      await adminAPI.updateReferralSettings(settingsForm);
      setShowSettingsModal(false);
      await fetchData();
      showMessage('Referral settings updated successfully');
    } catch (err) {
      showMessage(err?.message || 'Failed to update settings', true);
    } finally {
      setUpdateLoading(false);
    }
  };

  const filteredReferrals = getFilteredReferrals();

  return (
    <div className="flex h-screen">
      <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Referral Management</h1>
              <p className="text-slate-600">Manage referral program, track earnings, and control settings</p>
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

            {loading && stats === null ? (
              <div className="flex justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading referral data...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Total Referrers</p>
                        <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.totalReferralUsers || 0}</p>
                      </div>
                      <Users className="w-12 h-12 text-blue-100" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Total Earnings</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">GHS {stats?.totalReferralEarnings?.toFixed(2) || '0.00'}</p>
                      </div>
                      <DollarSign className="w-12 h-12 text-green-100" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Avg per Referrer</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">GHS {stats?.averageEarningsPerReferrer?.toFixed(2) || '0.00'}</p>
                      </div>
                      <TrendingUp className="w-12 h-12 text-blue-100" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-600 text-sm font-medium">Top Referrer</p>
                        <p className="text-lg font-bold text-slate-900 mt-2 truncate">{stats?.topReferrers?.[0]?.name || 'N/A'}</p>
                        <p className="text-xs text-slate-500 mt-1">GHS {stats?.topReferrers?.[0]?.referralEarnings?.toFixed(2) || '0.00'}</p>
                      </div>
                      <Award className="w-12 h-12 text-amber-100" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all mb-6 sm:mb-8">
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by name, email, or referral code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-0 text-sm hover:border-slate-300"
                      />
                    </div>
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
                    >
                      <Settings size={18} />
                      Settings
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-300 transition-all overflow-hidden">
                  {loading ? (
                    <div className="flex justify-center py-16">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-600">Loading referrals...</p>
                      </div>
                    </div>
                  ) : filteredReferrals.length === 0 ? (
                    <div className="text-center py-16">
                      <Database size={48} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-600 text-lg">No referrals found</p>
                      <p className="text-slate-500 text-sm">Try adjusting your search</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gradient-to-r from-slate-100 to-blue-50 border-b-2 border-slate-200">
                            <tr>
                              <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Referrer</th>
                              <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Code</th>
                              <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Earnings</th>
                              <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Joined</th>
                              <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {filteredReferrals.map(ref => (
                              <tr key={ref._id} className="hover:bg-blue-50 transition">
                                <td className="px-4 sm:px-6 py-4">
                                  <div className="flex flex-col gap-1">
                                    <p className="text-sm font-semibold text-slate-900">{ref.name}</p>
                                    <p className="text-xs text-slate-600">{ref.email}</p>
                                  </div>
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                  <p className="text-sm font-mono text-slate-600">{ref.referralCode}</p>
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                  <p className="text-sm font-bold text-green-600">GHS {ref.referralEarnings?.toFixed(2) || '0.00'}</p>
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                  <p className="text-xs text-slate-600">{new Date(ref.createdAt).toLocaleDateString()}</p>
                                </td>
                                <td className="px-4 sm:px-6 py-4">
                                  <div className="flex gap-1 flex-wrap">
                                    <button
                                      onClick={() => handleViewDetails(ref)}
                                      className="p-2 hover:bg-slate-100 rounded-lg transition"
                                      title="View Details"
                                    >
                                      <Eye className="w-4 h-4 text-cyan-600" />
                                    </button>
                                    <button
                                      onClick={() => handleOpenEditEarnings(ref)}
                                      className="p-2 hover:bg-slate-100 rounded-lg transition"
                                      title="Edit Earnings"
                                    >
                                      <Edit2 className="w-4 h-4 text-blue-600" />
                                    </button>
                                    <button
                                      onClick={() => handleOpenResetCode(ref)}
                                      className="p-2 hover:bg-slate-100 rounded-lg transition"
                                      title="Reset Code"
                                    >
                                      <RotateCcw className="w-4 h-4 text-orange-600" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <p className="text-sm text-slate-600">
                          Page {page} of {totalPages} • {filteredReferrals.length} referrals total
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

                <button
                  onClick={() => setShowResetAllConfirm(true)}
                  className="fixed bottom-6 right-6 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <RotateCcw size={18} />
                  Reset All Earnings
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showViewModal && selectedReferral && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border-2 border-slate-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Award size={24} className="text-blue-600" />
                Referral Details
              </h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedReferral(null);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-600 mb-1">Name</p>
                <p className="font-semibold text-slate-900">{selectedReferral.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Email</p>
                <p className="font-semibold text-slate-900 text-sm">{selectedReferral.email}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs text-slate-600 mb-1">Referral Code</p>
                <p className="font-mono font-semibold text-slate-900">{selectedReferral.referralCode}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Total Earnings</p>
                <p className="text-lg font-bold text-green-600">GHS {selectedReferral.referralEarnings?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs text-slate-600 mb-1">Joined Date</p>
                <p className="font-semibold text-slate-900">{new Date(selectedReferral.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedReferral(null);
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditEarningsModal && selectedReferral && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border-2 border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <DollarSign size={24} className="text-blue-600" />
                Edit Earnings
              </h2>
              <button
                onClick={() => {
                  setShowEditEarningsModal(false);
                  setSelectedReferral(null);
                }}
                disabled={updateLoading}
                className="p-1 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-4 rounded-xl border border-blue-200">
                <p className="text-sm text-slate-600 mb-1">Referrer</p>
                <p className="font-bold text-slate-900">{selectedReferral.name}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Earnings Amount (GHS)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-semibold">GHS</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newEarnings}
                    onChange={(e) => setNewEarnings(parseFloat(e.target.value) || 0)}
                    disabled={updateLoading}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-400 focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowEditEarningsModal(false);
                  setSelectedReferral(null);
                }}
                disabled={updateLoading}
                className="px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmEditEarnings}
                disabled={updateLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg transition disabled:opacity-50"
              >
                {updateLoading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showResetCodeConfirm}
        title="Reset Referral Code"
        message={selectedReferral ? `Reset the referral code for ${selectedReferral.name}? A new code will be generated.` : ''}
        confirmText="Reset"
        cancelText="Cancel"
        isDangerous={false}
        onConfirm={confirmResetCode}
        onCancel={() => {
          setShowResetCodeConfirm(false);
          setSelectedReferral(null);
        }}
      />

      <ConfirmDialog
        isOpen={showResetAllConfirm}
        title="Reset All Earnings"
        message="Reset all referral earnings to 0? This action cannot be undone."
        confirmText="Reset All"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={confirmResetAllEarnings}
        onCancel={() => setShowResetAllConfirm(false)}
      />

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-96 overflow-y-auto border-2 border-slate-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Settings size={24} className="text-blue-600" />
                Program Settings
              </h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                disabled={updateLoading}
                className="p-1 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Amount per Referral (GHS)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-semibold">GHS</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={updateLoading}
                    value={settingsForm.amountPerReferral}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        amountPerReferral: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-400 focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Minimum Withdrawal (GHS)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-semibold">GHS</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={updateLoading}
                    value={settingsForm.minimumWithdrawalAmount}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        minimumWithdrawalAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-400 focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Max Referrals per User
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={updateLoading}
                  value={settingsForm.maxReferralsPerUser || 0}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      maxReferralsPerUser: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-400 focus:outline-none disabled:opacity-50"
                />
                <p className="text-xs text-slate-500 mt-1">0 = unlimited</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Program Description
                </label>
                <textarea
                  disabled={updateLoading}
                  value={settingsForm.description}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      description: e.target.value,
                    })
                  }
                  rows="2"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-400 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  id="isEnabled"
                  disabled={updateLoading}
                  checked={settingsForm.isEnabled}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      isEnabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <label
                  htmlFor="isEnabled"
                  className="text-sm font-medium text-slate-900 cursor-pointer"
                >
                  Program Enabled
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                disabled={updateLoading}
                className="px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSettings}
                disabled={updateLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg transition disabled:opacity-50"
              >
                {updateLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
