import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { admin as adminAPI } from '../services/api';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getTransactions(page, 10);

      if (response.success) {
        setTransactions(response.transactions);
        setTotalPages(response.pagination.pages);
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-lg font-bold">Transactions</h1>
        </div>
        
        <div className="flex-1 overflow-auto bg-white dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
              Transactions
            </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-400">No transactions found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                          Transaction ID
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr
                          key={tx._id}
                          className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        >
                          <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-400">
                            {tx._id?.slice(-8) || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                            {tx.userId?.name || tx.userId || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                            GHS {tx.amount?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                            {tx.type || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                tx.status === 'completed'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : tx.status === 'pending'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              }`}
                            >
                              {tx.status || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                            {new Date(tx.createdAt).toLocaleDateString()}
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
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
