import React, { useState } from 'react';
import { Download, Filter } from 'lucide-react';

export default function Transactions() {
  const [filter, setFilter] = useState('all');

  const transactions = [
    { id: 1, type: 'Data Purchase', description: '1GB MTN Data', amount: -4.99, date: '2024-12-13', status: 'Completed' },
    { id: 2, type: 'Wallet Top-up', description: 'MTN Mobile Money', amount: 50.00, date: '2024-12-12', status: 'Completed' },
    { id: 3, type: 'Data Purchase', description: '500MB Vodafone', amount: -2.99, date: '2024-12-10', status: 'Completed' },
    { id: 4, type: 'Referral Bonus', description: 'Friend signup bonus', amount: 5.00, date: '2024-12-08', status: 'Completed' },
    { id: 5, type: 'Data Purchase', description: '2GB AirtelTigo', amount: -8.99, date: '2024-12-05', status: 'Completed' },
    { id: 6, type: 'Wallet Top-up', description: 'Bank Transfer', amount: 100.00, date: '2024-12-03', status: 'Completed' },
    { id: 7, type: 'Data Purchase', description: '5GB MTN Data', amount: -19.99, date: '2024-11-28', status: 'Completed' },
    { id: 8, type: 'Data Purchase', description: '1GB Vodafone', amount: -4.99, date: '2024-11-25', status: 'Failed' },
  ];

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'purchase') return tx.type === 'Data Purchase';
    if (filter === 'topup') return tx.type === 'Wallet Top-up';
    if (filter === 'bonus') return tx.type === 'Referral Bonus';
    return true;
  });

  const totalSpent = transactions
    .filter(t => t.type === 'Data Purchase' && t.status === 'Completed')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalTopUp = transactions
    .filter(t => t.type === 'Wallet Top-up' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-primary) 100%)'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Transaction History</h1>
          <button className="btn btn-secondary flex items-center gap-2">
            <Download size={16} />
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card p-6">
            <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Total Transactions</p>
            <p className="text-3xl font-bold mt-2">{transactions.length}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Total Data Spent</p>
            <p className="text-3xl font-bold mt-2 text-red-500">-GHS {totalSpent.toFixed(2)}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Total Top-up</p>
            <p className="text-3xl font-bold mt-2 text-green-500">+GHS {totalTopUp.toFixed(2)}</p>
          </div>
        </div>

        <div className="card p-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter size={18} style={{color: 'var(--text-secondary)'}} />
              <span style={{color: 'var(--text-secondary)'}}>Filter:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'purchase', 'topup', 'bonus'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg transition ${
                    filter === f ? 'btn btn-primary' : 'btn btn-secondary'
                  }`}
                >
                  {f === 'all' && 'All'}
                  {f === 'purchase' && 'Data Purchases'}
                  {f === 'topup' && 'Top-ups'}
                  {f === 'bonus' && 'Bonuses'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{borderBottom: '1px solid var(--border-color)'}}>
                  <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Type</th>
                  <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Description</th>
                  <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Amount</th>
                  <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Date</th>
                  <th className="text-left py-3 px-4" style={{color: 'var(--text-secondary)'}}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(tx => (
                  <tr key={tx.id} style={{borderBottom: '1px solid var(--border-color)'}}>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs" style={{backgroundColor: 'var(--bg-secondary)'}}>
                        {tx.type === 'Data Purchase' && '📦'}
                        {tx.type === 'Wallet Top-up' && '💳'}
                        {tx.type === 'Referral Bonus' && '🎁'}
                        {' '}{tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">{tx.description}</td>
                    <td className="py-3 px-4 font-bold">
                      <span style={{color: tx.amount < 0 ? '#ef4444' : '#22c55e'}}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4">{tx.date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${tx.status === 'Completed' ? 'text-green-500' : 'text-red-500'}`} style={{backgroundColor: 'var(--bg-secondary)'}}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
