import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ConfirmDialog({ 
  isOpen, 
  title = 'Confirm Action', 
  message = 'Are you sure?', 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm, 
  onCancel,
  isDangerous = false 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl shadow-xl max-w-md w-full p-8 bg-white border-2 border-slate-200">
        <div className="flex gap-4 mb-4">
          {isDangerous && <AlertCircle size={28} className="text-red-500 flex-shrink-0" />}
        </div>
        
        <h2 className="text-xl font-bold mb-2 text-slate-900">
          {title}
        </h2>
        
        <p className="mb-6 text-slate-600">
          {message}
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-white font-medium transition ${
              isDangerous
                ? 'bg-red-600 hover:shadow-lg'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
