'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {
  FileText,
  Calendar,
  Loader2,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
} from 'lucide-react';

interface DailySale {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  cashSales: number;
  onlineSales: number;
  creditSales: number;
  dineInOrders: number;
  deliveryOrders: number;
}

interface ExpenseReport {
  totalExpenses: number;
  expenseCount: number;
  byCategory: { categoryId: string; categoryName: string; total: number }[];
}

export default function AdminReportsPage() {
  const [sales, setSales] = useState<DailySale[]>([]);
  const [expenseReport, setExpenseReport] = useState<ExpenseReport | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, expRes] = await Promise.all([
        api.get(`/reports/sales/daily?startDate=${startDate}&endDate=${endDate}`),
        api.get(`/reports/expenses?startDate=${startDate}&endDate=${endDate}`),
      ]);
      setSales(salesRes.data);
      setExpenseReport(expRes.data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const totalRevenue = sales.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalOrders = sales.reduce((sum, s) => sum + s.totalOrders, 0);
  const netProfit = totalRevenue - (expenseReport?.totalExpenses || 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Reports</h1>
          <p className="text-sm text-surface-400 mt-1">Sales and expense reports.</p>
        </div>
      </div>

      {/* Date Range */}
      <div className="glass-card p-4 flex items-center gap-4 flex-wrap">
        <Calendar className="w-4 h-4 text-surface-400" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-surface-400">From:</span>
          <input type="date" className="input-field py-1.5 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-surface-400">To:</span>
          <input type="date" className="input-field py-1.5 text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toFixed(0)}`, color: 'text-emerald-400', icon: <TrendingUp className="w-5 h-5" /> },
          { label: 'Total Orders', value: totalOrders, color: 'text-blue-400', icon: <ShoppingCart className="w-5 h-5" /> },
          { label: 'Total Expenses', value: `₹${(expenseReport?.totalExpenses || 0).toFixed(0)}`, color: 'text-red-400', icon: <TrendingDown className="w-5 h-5" /> },
          { label: 'Net Profit', value: `₹${netProfit.toFixed(0)}`, color: netProfit >= 0 ? 'text-emerald-400' : 'text-red-400', icon: <DollarSign className="w-5 h-5" /> },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-surface-800 to-surface-700 flex items-center justify-center mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-surface-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin text-brand-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Daily Sales Table */}
          <div>
            <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-3">Daily Sales</h2>
            <div className="glass-card overflow-hidden">
              {sales.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="w-10 h-10 text-surface-700 mx-auto mb-2" />
                  <p className="text-surface-400 text-sm">No sales data for this period</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Orders</th>
                      <th>Revenue</th>
                      <th>Cash</th>
                      <th>Online</th>
                      <th>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((day) => (
                      <tr key={day.date}>
                        <td className="text-surface-300 text-sm">
                          {new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="text-blue-400 font-semibold">{day.totalOrders}</td>
                        <td className="text-emerald-400 font-bold">₹{day.totalRevenue.toFixed(0)}</td>
                        <td className="text-surface-400 text-sm">₹{day.cashSales.toFixed(0)}</td>
                        <td className="text-surface-400 text-sm">₹{day.onlineSales.toFixed(0)}</td>
                        <td className="text-amber-400 text-sm">₹{day.creditSales.toFixed(0)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-surface-700">
                      <td className="font-bold text-surface-100">Total</td>
                      <td className="font-bold text-blue-400">{totalOrders}</td>
                      <td className="font-bold text-emerald-400">₹{totalRevenue.toFixed(0)}</td>
                      <td className="font-bold text-surface-300">₹{sales.reduce((s, d) => s + d.cashSales, 0).toFixed(0)}</td>
                      <td className="font-bold text-surface-300">₹{sales.reduce((s, d) => s + d.onlineSales, 0).toFixed(0)}</td>
                      <td className="font-bold text-amber-400">₹{sales.reduce((s, d) => s + d.creditSales, 0).toFixed(0)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Expense Breakdown */}
          <div>
            <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-3">Expense Breakdown</h2>
            <div className="glass-card p-4">
              {!expenseReport || expenseReport.byCategory.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="w-10 h-10 text-surface-700 mx-auto mb-2" />
                  <p className="text-surface-400 text-sm">No expenses for this period</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenseReport.byCategory.map((cat) => {
                    const pct = expenseReport.totalExpenses > 0
                      ? (cat.total / expenseReport.totalExpenses) * 100
                      : 0;
                    return (
                      <div key={cat.categoryId}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-surface-300">{cat.categoryName}</span>
                          <span className="font-semibold text-red-400">₹{cat.total.toFixed(0)}</span>
                        </div>
                        <div className="w-full h-2 bg-surface-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-surface-500 mt-0.5">{pct.toFixed(1)}%</p>
                      </div>
                    );
                  })}
                  <div className="border-t border-surface-700 pt-3 flex justify-between font-bold">
                    <span className="text-surface-200">Total Expenses</span>
                    <span className="text-red-400">₹{expenseReport.totalExpenses.toFixed(0)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
