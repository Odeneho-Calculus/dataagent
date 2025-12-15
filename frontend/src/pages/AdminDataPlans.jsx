import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Edit2, Trash2, RefreshCw, X } from 'lucide-react';
import axios from 'axios';
import AdminSidebar from '../components/AdminSidebar';
import { dataplans } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminDataPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editCost, setEditCost] = useState('');
  const [editSelling, setEditSelling] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchDataPlans();
  }, [selectedNetwork]);

  const fetchDataPlans = async () => {
    try {
      setLoading(true);
      const response = await dataplans.list(selectedNetwork, '');
      if (response.success) {
        setPlans(response.plans);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await dataplans.sync();
      if (response.success) {
        alert(`Sync complete: ${response.stats.synced} new, ${response.stats.updated} updated`);
        fetchDataPlans();
      }
    } catch (err) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleEditPrices = (plan) => {
    setEditingId(plan._id);
    setEditCost(plan.costPrice);
    setEditSelling(plan.sellingPrice);
  };

  const handleSavePrices = async () => {
    try {
      const response = await dataplans.updatePrices(editingId, editCost, editSelling);
      if (response.success) {
        setPlans(plans.map(p => p._id === editingId ? response.plan : p));
        setEditingId(null);
      }
    } catch (err) {
      alert(`Failed to update prices: ${err.message}`);
    }
  };

  const handleClearEdits = async (planId) => {
    if (!window.confirm('Revert prices to original API values?')) return;

    try {
      const response = await dataplans.clearEdits(planId);
      if (response.success) {
        setPlans(plans.map(p => p._id === planId ? response.plan : p));
      }
    } catch (err) {
      alert(`Failed to clear edits: ${err.message}`);
    }
  };

  const handleToggleStatus = async (planId) => {
    try {
      const response = await dataplans.toggleStatus(planId);
      if (response.success) {
        setPlans(plans.map(p => p._id === planId ? response.plan : p));
      }
    } catch (err) {
      alert(`Failed to toggle status: ${err.message}`);
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;

    try {
      setDeleting(planId);
      const response = await dataplans.delete(planId);
      if (response.success) {
        setPlans(plans.filter(p => p._id !== planId));
      }
    } catch (err) {
      alert(`Failed to delete plan: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const calculateDiscount = (costPrice, sellingPrice) => {
    if (costPrice <= 0) return 0;
    return (((costPrice - sellingPrice) / costPrice) * 100).toFixed(2);
  };

  const filteredPlans = plans.filter(plan =>
    plan.planName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allNetworks = [...new Set(plans.map(p => p.network))].sort();

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
          <h1 className="text-lg font-bold">Manage Data Plans</h1>
        </div>

        <div className="flex-1 overflow-auto bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Manage Data Plans
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Sync data plans from Topza API and manage pricing
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 rounded-lg"
              >
                <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing...' : 'Sync from Topza'}
              </button>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Search by plan name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="mb-6 flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedNetwork('')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedNetwork === ''
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                All Networks
              </button>
              {allNetworks.map(network => (
                <button
                  key={network}
                  onClick={() => setSelectedNetwork(network)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedNetwork === network
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {network}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 dark:border-slate-600 mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading data plans...</p>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-400">No data plans found</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Network</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Plan Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Data</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Cost Price</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Admin Price</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Validity</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Margin</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredPlans.map(plan => {
                      const margin = ((plan.sellingPrice - plan.costPrice) / plan.costPrice * 100).toFixed(2);
                      return (
                      <tr key={plan._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{plan.network}</td>
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">{plan.planName}</td>
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">{plan.dataSize}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">GHS {plan.costPrice.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm font-medium text-blue-600 dark:text-blue-400">GHS {plan.sellingPrice.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{plan.validity}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            plan.status === 'active'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {plan.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                          {margin}%
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditPrices(plan)}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                              title="Edit prices"
                            >
                              <Edit2 size={16} className="text-blue-600 dark:text-blue-400" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(plan._id)}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                              title="Toggle status"
                            >
                              <RefreshCw size={16} className="text-green-600 dark:text-green-400" />
                            </button>
                            {plan.isEdited && (
                              <button
                                onClick={() => handleClearEdits(plan._id)}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-xs"
                                title="Clear edits"
                              >
                                <X size={16} className="text-orange-600 dark:text-orange-400" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(plan._id)}
                              disabled={deleting === plan._id}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Set Admin Price</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cost Price from Topza (Read-only)
                </label>
                <input
                  type="number"
                  value={editCost}
                  disabled
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Admin Price (What users pay) - GHS
                </label>
                <input
                  type="number"
                  value={editSelling}
                  onChange={(e) => setEditSelling(parseFloat(e.target.value))}
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Margin:</span> {calculateDiscount(editCost, editSelling)}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Your profit: GHS {(editSelling - editCost).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingId(null)}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrices}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
