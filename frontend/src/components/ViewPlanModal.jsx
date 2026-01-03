import React from 'react';
import { X, Info } from 'lucide-react';

export default function ViewPlanModal({ plan, isOpen, onClose }) {
  if (!isOpen || !plan) return null;

  const calculateMargin = (costPrice, sellingPrice) => {
    if (costPrice <= 0) return 0;
    return (((costPrice - sellingPrice) / costPrice) * 100).toFixed(2);
  };

  const margin = calculateMargin(plan.costPrice, plan.sellingPrice);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border-2 border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Info size={24} className="text-blue-600" />
            Plan Details
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-4 rounded-xl border border-blue-200">
            <p className="text-sm text-slate-600 mb-1">Plan Name</p>
            <p className="text-xl font-bold text-slate-900">{plan.planName}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 mb-1">Network</p>
              <p className="font-semibold text-slate-900">{plan.network}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 mb-1">Data Size</p>
              <p className="font-semibold text-slate-900">{plan.dataSize}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 mb-1">Validity</p>
              <p className="font-semibold text-slate-900">{plan.validity}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 mb-1">Stock</p>
              <p className={`font-semibold ${plan.inStock ? 'text-green-600' : 'text-red-600'}`}>
                {plan.inStock ? 'In Stock' : 'Out of Stock'}
              </p>
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Cost Price (Topza)</span>
              <span className="font-bold text-slate-900">GHS {plan.costPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Admin Price (User Price)</span>
              <span className="font-bold text-blue-600 text-lg">GHS {plan.sellingPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <span className="text-sm font-medium text-slate-700">Margin</span>
              <span className="font-bold text-green-600 text-lg">{margin}%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <span className="text-sm font-medium text-slate-700">Profit per Sale</span>
              <span className="font-bold text-purple-600">GHS {(plan.sellingPrice - plan.costPrice).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <span className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-center ${
              plan.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {plan.status === 'active' ? '✓ Active' : '✗ Inactive'}
            </span>
            {plan.isEdited && (
              <span className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-center bg-orange-100 text-orange-700">
                ⚠ Custom Prices
              </span>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
