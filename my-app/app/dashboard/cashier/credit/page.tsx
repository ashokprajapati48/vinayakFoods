'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Customer } from '@/types';
import {
  Wallet,
  Search,
  Loader2,
  CheckCircle,
  X,
  Minus,
} from 'lucide-react';

interface CreditEntry {
  id: string;
  customerId: string;
  orderId?: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  customer?: { id: string; name: string; mobile?: string };
  order?: { id: string; orderNumber: number };
}

export default function CreditPage() {
  const [outstanding, setOutstanding] = useState<Customer[]>([]);
  const [ledger, setLedger] = useState<CreditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDesc, setPaymentDesc] = useState('');
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [outRes, ledgerRes] = await Promise.all([
        api.get('/credit/outstanding'),
        api.get('/credit/ledger?limit=20'),
      ]);
      setOutstanding(outRes.data);
      setLedger(ledgerRes.data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePayment = async () => {
    if (!selectedCustomer || !paymentAmount) return;
    setPaying(true);
    setSuccess(false);
    try {
      await api.post(`/credit/customer/${selectedCustomer.id}/payment`, {
        amount: parseFloat(paymentAmount),
        description: paymentDesc || 'Credit payment received',
      });
      setSuccess(true);
      setSelectedCustomer(null);
      setPaymentAmount('');
      setPaymentDesc('');
      loadData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Credit Management</h1>
        <p className="text-sm text-surface-400 mt-1">Manage customer credit balances and payments.</p>
      </div>

      {success && (
        <div className="glass-card p-4 border border-emerald-500/30 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-emerald-400 font-medium">Credit payment recorded successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Outstanding Credits */}
        <div>
          <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-3">
            Outstanding Credit ({outstanding.length} customers)
          </h2>
          {outstanding.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-surface-400 text-sm">No outstanding credit</p>
            </div>
          ) : (
            <div className="space-y-2">
              {outstanding.map((customer) => (
                <div
                  key={customer.id}
                  className={`glass-card p-4 cursor-pointer transition-all ${
                    selectedCustomer?.id === customer.id
                      ? 'border border-brand-500/50'
                      : 'hover:border-surface-600'
                  }`}
                  onClick={() => { setSelectedCustomer(customer); setSuccess(false); }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-surface-200">{customer.name}</p>
                      {customer.mobile && <p className="text-xs text-surface-500">{customer.mobile}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-400">₹{customer.creditBalance}</p>
                      <p className="text-xs text-surface-500">outstanding</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Form */}
        <div>
          {selectedCustomer ? (
            <div className="glass-card p-5 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-surface-100 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-400" />
                  Collect Credit Payment
                </h2>
                <button onClick={() => setSelectedCustomer(null)} className="text-surface-500 hover:text-surface-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-surface-800/50 rounded-xl p-4 mb-4">
                <p className="font-semibold text-surface-200">{selectedCustomer.name}</p>
                {selectedCustomer.mobile && <p className="text-sm text-surface-400">{selectedCustomer.mobile}</p>}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-surface-400 text-sm">Outstanding:</span>
                  <span className="font-bold text-amber-400 text-lg">₹{selectedCustomer.creditBalance}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">
                    Payment Amount
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="Enter amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    max={selectedCustomer.creditBalance}
                  />
                  <button
                    className="text-xs text-brand-400 mt-1"
                    onClick={() => setPaymentAmount(String(selectedCustomer.creditBalance))}
                  >
                    Pay full amount (₹{selectedCustomer.creditBalance})
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Payment note"
                    value={paymentDesc}
                    onChange={(e) => setPaymentDesc(e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={paying || !paymentAmount || parseFloat(paymentAmount) <= 0}
                className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
              >
                {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {paying ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          ) : (
            <div className="glass-card p-10 text-center">
              <Wallet className="w-12 h-12 text-surface-700 mx-auto mb-3" />
              <p className="text-surface-400 text-sm">Select a customer to record credit payment</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Credit Ledger */}
      {ledger.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-3">
            Recent Transactions
          </h2>
          <div className="glass-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Balance After</th>
                  <th>Description</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td className="font-medium text-surface-200">{entry.customer?.name || '—'}</td>
                    <td>
                      <span className={`status-badge text-xs ${
                        entry.type === 'DEBIT'
                          ? 'text-red-400 bg-red-500/10 border-red-500/30'
                          : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      }`}>
                        {entry.type === 'DEBIT' ? 'Credit Given' : 'Payment'}
                      </span>
                    </td>
                    <td className={`font-bold ${entry.type === 'DEBIT' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {entry.type === 'DEBIT' ? '+' : '-'}₹{entry.amount}
                    </td>
                    <td className="text-surface-300 font-medium">₹{entry.balanceAfter}</td>
                    <td className="text-surface-400 text-sm">{entry.description}</td>
                    <td className="text-surface-500 text-xs">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
