import React, { useState, useEffect } from 'react';
import { X, DollarSign, TrendingUp } from 'lucide-react';

export default function EditPricesModal({ plan, isOpen, onClose, onSave, loading = false }) {
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');

  useEffect(() => {
    if (plan && isOpen) {
      setCostPrice(Number(plan.costPrice) || 0);
      setSellingPrice(Number(plan.sellingPrice) || 0);
    }
  }, [plan, isOpen]);

  if (!isOpen || !plan) return null;

  const calculateMargin = () => {
    const cost = isNaN(costPrice) ? 0 : Number(costPrice);
    const selling = isNaN(sellingPrice) ? 0 : Number(sellingPrice);
    if (cost <= 0) return 0;
    return (((cost - selling) / cost) * 100).toFixed(2);
  };

  const profit = (isNaN(sellingPrice) ? 0 : Number(sellingPrice)) - (isNaN(costPrice) ? 0 : Number(costPrice));
  const margin = calculateMargin();

  const handleSave = () => {
    const cost = isNaN(costPrice) ? 0 : Number(costPrice);
    const selling = isNaN(sellingPrice) ? 0 : Number(sellingPrice);
    onSave(cost, selling);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border-2 border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign size={24} className="text-blue-600" />
            Set Prices
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-4 rounded-xl border border-blue-200">
            <p className="text-sm text-slate-600 mb-1">Plan</p>
            <p className="font-bold text-slate-900">{plan.planName}</p>
            <p className="text-xs text-slate-500 mt-1">{plan.network} • {plan.dataSize} • {plan.validity}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Cost Price (from Topza API)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-semibold">GHS</span>
              <input
                type="number"
                value={isNaN(costPrice) ? 0 : costPrice}
                disabled
                step="0.01"
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-300 bg-slate-100 text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Read-only • Synced from API</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Admin Price (what users pay)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-semibold">GHS</span>
              <input
                type="number"
                value={isNaN(sellingPrice) ? 0 : sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                step="0.01"
                disabled={loading}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-400 focus:outline-none disabled:opacity-50"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Set the price users will pay for this plan</p>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
            <div>
              <p className="text-xs text-slate-600 font-medium">Margin</p>
              <p className="text-2xl font-bold text-green-600">{margin}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-medium">Profit/Sale</p>
              <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                GHS {profit.toFixed(2)}
              </p>
            </div>
          </div>

          {margin < 0 && (
            <div className="p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">
                ⚠ Warning: You're selling below cost! Margin is {margin}%
              </p>
            </div>
          )}

          {sellingPrice > 0 && costPrice > 0 && sellingPrice < costPrice && (
            <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">
                ❌ Loss detected: Admin price is lower than cost price
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-900 font-semibold hover:border-slate-300 hover:bg-slate-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <TrendingUp size={18} />
                Save Prices
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
