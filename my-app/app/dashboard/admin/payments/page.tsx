'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Payment } from '@/types';
import {
  CreditCard,
  Calendar,
  Loader2,
  Banknote,
  Smartphone,
  Wallet,
  TrendingUp,
} from 'lucide-react';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<(Payment & { order?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<{ method: string; _sum: { amount: number }; _count: { id: number } }[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [paymentsRes, summaryRes] = await Promise.all([
        api.get(`/payments?date=${dateFilter}`),
        api.get('/payments/summary/today'),
      ]);
      setPayments(paymentsRes.data);
      setSummary(summaryRes.data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {methodStats.map((method) => {
          const methodPayments = payments.filter((p) => p.method === method.key);
          const methodTotal = methodPayments.reduce((sum, p) => sum + Number(p.amount), 0);
          return (
            <div key={method.key} className={`glass-card p-4 border ${method.bg}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={method.color}>{method.icon}</div>
                <span className="text-surface-300 font-medium">{method.label}</span>
              </div>
              <p className={`text-2xl font-bold ${method.color}`}>₹{methodTotal.toFixed(0)}</p>
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
          <p className="text-3xl font-bold text-brand-400">₹{totalRevenue.toFixed(0)}</p>
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
                    <td className="font-bold text-brand-400">₹{payment.amount}</td>
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
