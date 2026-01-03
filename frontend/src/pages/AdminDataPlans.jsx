import { useState, useEffect } from 'react';
import { Edit2, Trash2, RefreshCw, Eye, Database, TrendingUp, AlertCircle, CheckCircle, Search } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import ConfirmDialog from '../components/ConfirmDialog';
import ViewPlanModal from '../components/ViewPlanModal';
import EditPricesModal from '../components/EditPricesModal';
import { useSidebar } from '../context/SidebarContext';
import { dataplans } from '../services/api';

export default function AdminDataPlans() {
  const { sidebarOpen, closeSidebar } = useSidebar();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({ totalPlans: 0, activePlans: 0, outOfStockPlans: 0, avgMargin: 0 });

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditPricesModal, setShowEditPricesModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearEditsConfirm, setShowClearEditsConfirm] = useState(false);
  const [editPricesSaving, setEditPricesSaving] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [selectedNetwork, searchTerm]);

  useEffect(() => {
    fetchDataPlans();
    fetchStats();
  }, [page, selectedNetwork]);

  const fetchDataPlans = async () => {
    try {
      setLoading(true);
      const response = await dataplans.list(selectedNetwork, '', page, 10);
      if (response.success) {
        setPlans(response.plans);
        setTotalPages(response.pagination?.pages || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await dataplans.getStats(selectedNetwork || 'all');
      if (response.success) {
        setStats(response.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

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

  const getFilteredPlans = () => {
    if (!searchTerm) return plans;
    return plans.filter(plan =>
      plan.planName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await dataplans.sync();
      if (response.success) {
        setPage(1);
        await fetchDataPlans();
        await fetchStats();
        showMessage(`Sync complete: ${response.stats.synced} new, ${response.stats.updated} updated`);
      }
    } catch (err) {
      showMessage(`Sync failed: ${err.message}`, true);
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenEditPrices = (plan) => {
    setSelectedPlan(plan);
    setShowEditPricesModal(true);
  };

  const handleSavePrices = async (costPrice, sellingPrice) => {
    if (!selectedPlan) return;
    try {
      setEditPricesSaving(true);
      const response = await dataplans.updatePrices(selectedPlan._id, costPrice, sellingPrice);
      if (response.success) {
        setPlans(plans.map(p => p._id === selectedPlan._id ? response.plan : p));
        setShowEditPricesModal(false);
        setSelectedPlan(null);
        showMessage('Data plan prices updated successfully');
      }
    } catch (err) {
      showMessage(`Failed to update prices: ${err.message}`, true);
    } finally {
      setEditPricesSaving(false);
    }
  };

  const handleOpenClearEdits = (plan) => {
    setSelectedPlan(plan);
    setShowClearEditsConfirm(true);
  };

  const confirmClearEdits = async () => {
    if (!selectedPlan) return;
    try {
      const response = await dataplans.clearEdits(selectedPlan._id);
      if (response.success) {
        setPlans(plans.map(p => p._id === selectedPlan._id ? response.plan : p));
        setShowClearEditsConfirm(false);
        setSelectedPlan(null);
        showMessage('Data plan edits cleared successfully');
      }
    } catch (err) {
      showMessage(`Failed to clear edits: ${err.message}`, true);
    }
  };

  const handleToggleStatus = async (plan) => {
    try {
      const response = await dataplans.toggleStatus(plan._id);
      if (response.success) {
        setPlans(plans.map(p => p._id === plan._id ? response.plan : p));
        showMessage(`Data plan ${response.plan.status === 'active' ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (err) {
      showMessage(`Failed to toggle status: ${err.message}`, true);
    }
  };

  const handleOpenDelete = (plan) => {
    setSelectedPlan(plan);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedPlan) return;
    try {
      const response = await dataplans.delete(selectedPlan._id);
      if (response.success) {
        setShowDeleteConfirm(false);
        await fetchDataPlans();
        setSelectedPlan(null);
        showMessage('Data plan deleted successfully');
      }
    } catch (err) {
      showMessage(`Failed to delete plan: ${err.message}`, true);
    }
  };

  const filteredPlans = getFilteredPlans();

  return (
    <div className="flex h-screen">
      <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                Manage Data Plans
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sync and manage data plan pricing, margins, and availability
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
                    <Database className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Total Plans</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.totalPlans}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Active Plans</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.activePlans}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Out of Stock</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.outOfStockPlans}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mb-1">Avg Margin</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.avgMargin}%</p>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all mb-6 sm:mb-8">
              {/* Search & Sync Row */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by plan name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-0 text-sm hover:border-slate-300"
                  />
                </div>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
                >
                  <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                  {syncing ? 'Syncing...' : 'Sync'}
                </button>
              </div>

              {/* Network Filter Row */}
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2 block">Network</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedNetwork('')}
                    className={`px-4 py-2 rounded-lg font-medium transition text-sm whitespace-nowrap ${
                      selectedNetwork === ''
                        ? 'bg-blue-100 text-blue-900 border-2 border-blue-300'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border-2 border-slate-200'
                    }`}
                  >
                    All Networks
                  </button>
                  {['MTN', 'TELECEL', 'AIRTELTIGO'].map(network => (
                    <button
                      key={network}
                      onClick={() => setSelectedNetwork(network)}
                      className={`px-4 py-2 rounded-lg font-medium transition text-sm whitespace-nowrap ${
                        selectedNetwork === network
                          ? 'bg-blue-100 text-blue-900 border-2 border-blue-300'
                          : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border-2 border-slate-200'
                      }`}
                    >
                      {network}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Data Plans Table */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-300 transition-all overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading data plans...</p>
                  </div>
                </div>
              ) : filteredPlans.length === 0 ? (
                <div className="text-center py-16">
                  <Database size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600 text-lg">No data plans found</p>
                  <p className="text-slate-500 text-sm">Try adjusting your search or network filter</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-slate-100 to-blue-50 border-b-2 border-slate-200">
                        <tr>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Plan</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Pricing</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Margin</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Status</th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredPlans.map(plan => {
                          const margin = ((plan.sellingPrice - plan.costPrice) / plan.costPrice * 100).toFixed(2);
                          return (
                            <tr
                              key={plan._id}
                              className={`hover:bg-blue-50 transition ${
                                !plan.inStock ? 'opacity-60 bg-slate-50' : ''
                              }`}
                            >
                              <td className="px-4 sm:px-6 py-4">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-slate-900">{plan.planName}</p>
                                    {!plan.inStock && (
                                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">Out of Stock</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-600">{plan.network} • {plan.dataSize} • {plan.validity}</p>
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <div className="flex flex-col gap-1">
                                  <p className="text-xs text-slate-600">Cost: <span className="font-medium text-slate-900">GHS {plan.costPrice.toFixed(2)}</span></p>
                                  <p className="text-sm font-bold text-blue-600">Admin: GHS {plan.sellingPrice.toFixed(2)}</p>
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <p className="text-sm font-medium text-slate-900">{margin}%</p>
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  plan.status === 'active'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {plan.status}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <div className="flex gap-1 flex-wrap">
                                  <button
                                    onClick={() => {
                                      setSelectedPlan(plan);
                                      setShowViewModal(true);
                                    }}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition"
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4 text-cyan-600" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditPrices(plan)}
                                    disabled={!plan.inStock}
                                    className={`p-2 rounded-lg transition ${!plan.inStock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'}`}
                                    title={!plan.inStock ? 'Cannot edit out-of-stock plans' : 'Edit prices'}
                                  >
                                    <Edit2 className="w-4 h-4 text-blue-600" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleStatus(plan)}
                                    disabled={!plan.inStock}
                                    className={`p-2 rounded-lg transition ${!plan.inStock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'}`}
                                    title={!plan.inStock ? 'Cannot toggle status for out-of-stock plans' : 'Toggle status'}
                                  >
                                    <RefreshCw className="w-4 h-4 text-green-600" />
                                  </button>
                                  {plan.isEdited && plan.inStock && (
                                    <button
                                      onClick={() => handleOpenClearEdits(plan)}
                                      className="p-2 hover:bg-slate-100 rounded-lg transition"
                                      title="Clear edits"
                                    >
                                      <AlertCircle className="w-4 h-4 text-orange-600" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleOpenDelete(plan)}
                                    disabled={!plan.inStock}
                                    className={`p-2 rounded-lg transition ${!plan.inStock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'}`}
                                    title={!plan.inStock ? 'Cannot delete out-of-stock plans' : 'Delete'}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <p className="text-sm text-slate-600">
                      Page {page} of {totalPages} • {filteredPlans.length} plans total
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

      <ViewPlanModal
        plan={selectedPlan}
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedPlan(null);
        }}
      />

      <EditPricesModal
        plan={selectedPlan}
        isOpen={showEditPricesModal}
        onClose={() => {
          setShowEditPricesModal(false);
          setSelectedPlan(null);
        }}
        onSave={handleSavePrices}
        loading={editPricesSaving}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Data Plan"
        message={selectedPlan ? `Are you sure you want to delete "${selectedPlan.planName}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSelectedPlan(null);
        }}
      />

      <ConfirmDialog
        isOpen={showClearEditsConfirm}
        title="Clear Price Edits"
        message={selectedPlan ? `Revert "${selectedPlan.planName}" prices to original API values?` : ''}
        confirmText="Clear"
        cancelText="Cancel"
        isDangerous={false}
        onConfirm={confirmClearEdits}
        onCancel={() => {
          setShowClearEditsConfirm(false);
          setSelectedPlan(null);
        }}
      />
    </div>
  );
}
