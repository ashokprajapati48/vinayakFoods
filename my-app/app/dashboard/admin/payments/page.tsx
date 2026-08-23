'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { apiErrorMessage } from '@/lib/api';
import { useOrderEvents } from '@/lib/realtime';
import { formatMoney, sumBy } from '@/lib/utils';
import type { Payment } from '@/types';
import {
  Calendar,
  Loader2,
  Banknote,
  Smartphone,
  Wallet,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];
  });

  const loadData = useCallback(async () => {
    try {
      const res = await api.get<Payment[]>(`/payments?date=${dateFilter}`);
      setPayments(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load payments'));
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  useOrderEvents({
    onPayment: () => loadData(),
    onReconnect: () => loadData(),
  });

  const totalRevenue = sumBy(payments, (p) => p.amount);

  const methodStats = [
    { key: 'CASH', label: 'Cash', icon: <Banknote className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { key: 'ONLINE', label: 'Online', icon: <Smartphone className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { key: 'CREDIT', label: 'Credit', icon: <Wallet className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Payments</h1>
          <p className="text-sm text-surface-400 mt-1">View and track all payment transactions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-surface-400" />
          <input
            type="date"
            className="input-field py-1.5 text-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="glass-card p-3 flex items-center gap-2 border border-red-500/30 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {methodStats.map((method) => {
          const methodPayments = payments.filter((p) => p.method === method.key);
          const methodTotal = sumBy(methodPayments, (p) => p.amount);
          return (
            <div key={method.key} className={`glass-card p-4 border ${method.bg}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={method.color}>{method.icon}</div>
                <span className="text-surface-300 font-medium">{method.label}</span>
              </div>
              <p className={`text-2xl font-bold ${method.color}`}>{formatMoney(methodTotal)}</p>
              <p className="text-xs text-surface-500 mt-1">{methodPayments.length} transactions</p>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="glass-card p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <p className="text-3xl font-bold text-brand-400">{formatMoney(totalRevenue)}</p>
          <p className="text-sm text-surface-400">Total Revenue for {new Date(dateFilter).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin text-brand-400" />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Transaction ID</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-surface-500 py-8">
                    No payments for this date
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="font-bold text-surface-100">#{payment.order?.orderNumber || '—'}</td>
                    <td className="text-surface-400 text-sm">{payment.order?.customer?.name || '—'}</td>
                    <td className="font-bold text-brand-400">{formatMoney(payment.amount)}</td>
                    <td>
                      <span className={`text-xs font-semibold ${
                        payment.method === 'CASH' ? 'text-emerald-400' :
                        payment.method === 'ONLINE' ? 'text-blue-400' : 'text-amber-400'
                      }`}>
                        {payment.method}
                      </span>
                    </td>
                    <td className="text-surface-500 text-xs font-mono">{payment.transactionId || '—'}</td>
                    <td className="text-surface-500 text-xs">
                      {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
