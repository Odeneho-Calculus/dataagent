import { useState, useEffect } from 'react';
import { Search, Edit2, RotateCcw, Eye, Settings } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('referrals');

  const [showEditEarningsModal, setShowEditEarningsModal] = useState(false);
  const [showResetCodeModal, setShowResetCodeModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [newEarnings, setNewEarnings] = useState(0);
  const [settingsForm, setSettingsForm] = useState({
    amountPerReferral: 1,
    minimumWithdrawalAmount: 10,
    isEnabled: true,
    maxReferralsPerUser: null,
    description: 'Earn GHS per successful referral',
  });

  useEffect(() => {
    fetchData();
  }, [page, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      setLoading(true);
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
  };

  const showMessage = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 3000);
  };

  const handleEditEarnings = async () => {
    if (!selectedReferral) return;
    if (newEarnings < 0) {
      showMessage('Earnings cannot be negative', true);
      return;
    }
    try {
      await adminAPI.updateReferralEarnings(selectedReferral._id, newEarnings);
      setShowEditEarningsModal(false);
      setSelectedReferral(null);
      fetchData();
      showMessage('Referral earnings updated successfully');
    } catch (err) {
      showMessage(err?.message || 'Failed to update earnings', true);
    }
  };

  const handleResetCode = async () => {
    if (!selectedReferral) return;
    try {
      await adminAPI.resetReferralCode(selectedReferral._id);
      setShowResetCodeModal(false);
      setSelectedReferral(null);
      fetchData();
      showMessage('Referral code reset successfully');
    } catch (err) {
      showMessage(err?.message || 'Failed to reset code', true);
    }
  };

  const confirmResetAllEarnings = async () => {
    try {
      await adminAPI.resetAllReferralEarnings();
      setShowResetAllModal(false);
      fetchData();
      showMessage('All referral earnings reset successfully');
    } catch (err) {
      showMessage(err?.message || 'Failed to reset earnings', true);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      await adminAPI.updateReferralSettings(settingsForm);
      setShowSettingsModal(false);
      fetchData();
      showMessage('Referral settings updated successfully');
    } catch (err) {
      showMessage(err?.message || 'Failed to update settings', true);
    }
  };

  return (
    <div className="flex h-screen">
      <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto bg-white dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Referral Program Management
              </h1>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <Settings size={20} />
                <span>Settings</span>
              </button>
            </div>

            <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('referrals')}
                className={`px-4 py-2 font-medium transition ${
                  activeTab === 'referrals'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Referrals
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-2 font-medium transition ${
                  activeTab === 'stats'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Statistics
              </button>
            </div>

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

            {loading && stats === null ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              </div>
            ) : activeTab === 'stats' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="card p-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Total Referral Users
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {stats?.totalReferralUsers || 0}
                    </p>
                  </div>

                  <div className="card p-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Total Referral Earnings
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      GHS {stats?.totalReferralEarnings?.toFixed(2) || '0.00'}
                    </p>
                  </div>

                  <div className="card p-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Average Earnings per Referrer
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      GHS {stats?.averageEarningsPerReferrer?.toFixed(2) || '0.00'}
                    </p>
                  </div>

                  <div className="card p-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-slate-800">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Top Referrer
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
                      {stats?.topReferrers?.[0]?.name || 'N/A'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      GHS {stats?.topReferrers?.[0]?.referralEarnings?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>

                <div className="card p-6 rounded-lg border border-slate-200 dark:border-slate-700 mb-8">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Top 10 Referrers
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            Name
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            Referral Code
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            Earnings
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.topReferrers?.map((ref, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <td className="py-3 px-4 text-slate-900 dark:text-white">
                              {ref.name}
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">
                              {ref.referralCode}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-900 dark:text-white font-medium">
                              GHS {ref.referralEarnings?.toFixed(2) || '0.00'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or referral code..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button
                    onClick={() => setShowResetAllModal(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                  >
                    Reset All Earnings
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                  </div>
                ) : referrals.length === 0 ? (
                  <div className="text-center py-12 card border border-slate-200 dark:border-slate-700 rounded-lg">
                    <p className="text-slate-600 dark:text-slate-400">No referral users found</p>
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
                              Referral Code
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                              Earnings
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {referrals.map((ref) => (
                            <tr
                              key={ref._id}
                              className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                            >
                              <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">
                                {ref.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                {ref.email}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono">
                                {ref.referralCode}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">
                                GHS {ref.referralEarnings?.toFixed(2) || '0.00'}
                              </td>
                              <td className="px-6 py-4 text-sm flex gap-1 flex-wrap">
                                <button
                                  onClick={() => {
                                    setSelectedReferral(ref);
                                    setShowViewModal(true);
                                  }}
                                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4 text-cyan-600" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedReferral(ref);
                                    setNewEarnings(ref.referralEarnings);
                                    setShowEditEarningsModal(true);
                                  }}
                                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                  title="Edit Earnings"
                                >
                                  <Edit2 className="w-4 h-4 text-blue-600" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedReferral(ref);
                                    setShowResetCodeModal(true);
                                  }}
                                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                  title="Reset Referral Code"
                                >
                                  <RotateCcw className="w-4 h-4 text-orange-600" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div className="mt-6 flex justify-center gap-2">
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="px-4 py-2 text-slate-600 dark:text-slate-400">
                          Page {page} of {totalPages}
                        </span>
                        <button
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          disabled={page === totalPages}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showViewModal && selectedReferral && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Referral Details
            </h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-slate-900 dark:text-white">Name:</span>
                <p className="text-slate-600 dark:text-slate-400">{selectedReferral.name}</p>
              </div>
              <div>
                <span className="font-medium text-slate-900 dark:text-white">Email:</span>
                <p className="text-slate-600 dark:text-slate-400">{selectedReferral.email}</p>
              </div>
              <div>
                <span className="font-medium text-slate-900 dark:text-white">Referral Code:</span>
                <p className="text-slate-600 dark:text-slate-400 font-mono">
                  {selectedReferral.referralCode}
                </p>
              </div>
              <div>
                <span className="font-medium text-slate-900 dark:text-white">Total Earnings:</span>
                <p className="text-slate-600 dark:text-slate-400">
                  GHS {selectedReferral.referralEarnings?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <span className="font-medium text-slate-900 dark:text-white">Joined:</span>
                <p className="text-slate-600 dark:text-slate-400">
                  {new Date(selectedReferral.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowViewModal(false);
                setSelectedReferral(null);
              }}
              className="mt-6 w-full btn btn-secondary py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showEditEarningsModal && selectedReferral && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Edit Referral Earnings
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Earnings Amount (GHS)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newEarnings}
                onChange={(e) => setNewEarnings(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditEarningsModal(false);
                  setSelectedReferral(null);
                }}
                className="flex-1 btn btn-secondary py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleEditEarnings}
                className="flex-1 btn btn-primary py-2 rounded-lg"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetCodeModal && selectedReferral && (
        <ConfirmDialog
          title="Reset Referral Code"
          message={`Are you sure you want to reset the referral code for ${selectedReferral.name}? A new code will be generated.`}
          onConfirm={handleResetCode}
          onCancel={() => {
            setShowResetCodeModal(false);
            setSelectedReferral(null);
          }}
        />
      )}

      {showResetAllModal && (
        <ConfirmDialog
          title="Reset All Referral Earnings"
          message="Are you sure you want to reset all referral earnings to 0? This action cannot be undone."
          onConfirm={confirmResetAllEarnings}
          onCancel={() => setShowResetAllModal(false)}
          isDangerous={true}
        />
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Referral Program Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Amount per Referral (GHS)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settingsForm.amountPerReferral}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      amountPerReferral: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Minimum Withdrawal Amount (GHS)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settingsForm.minimumWithdrawalAmount}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      minimumWithdrawalAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Max Referrals per User (0 = unlimited)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settingsForm.maxReferralsPerUser || 0}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      maxReferralsPerUser: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Program Description
                </label>
                <textarea
                  value={settingsForm.description}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      description: e.target.value,
                    })
                  }
                  rows="3"
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <input
                  type="checkbox"
                  id="isEnabled"
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
                  className="text-sm font-medium text-slate-900 dark:text-white cursor-pointer"
                >
                  Referral Program Enabled
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 btn btn-secondary py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSettings}
                className="flex-1 btn btn-primary py-2 rounded-lg"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
