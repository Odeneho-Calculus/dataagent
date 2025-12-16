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
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
      <div className="rounded-lg shadow-xl max-w-md w-full p-8 card">
        <div className="flex gap-4 mb-4">
          {isDangerous && <AlertCircle size={28} className="text-red-500 flex-shrink-0" />}
        </div>
        
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
        
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          {message}
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white font-medium transition ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
