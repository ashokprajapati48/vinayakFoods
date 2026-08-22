'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {
  BarChart3,
  Calendar,
  Loader2,
  TrendingUp,
  Users,
  ChefHat,
  ShoppingCart,
  Banknote,
  Smartphone,
  Wallet,
} from 'lucide-react';

interface SalesAnalytics {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  bestSellers: { name: string; quantity: number; revenue: number }[];
  leastSellers: { name: string; quantity: number; revenue: number }[];
  dineInVsDelivery: { dineIn: number; delivery: number };
  paymentBreakdown: { cash: number; online: number; credit: number };
  kitchenVolume: { kitchen1: number; kitchen2: number };
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/sales/analytics?startDate=${startDate}&endDate=${endDate}`);
      setAnalytics(res.data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const maxSellers = analytics?.bestSellers.reduce((max, s) => Math.max(max, s.quantity), 0) || 1;
  const totalPayments = analytics ? analytics.paymentBreakdown.cash + analytics.paymentBreakdown.online + analytics.paymentBreakdown.credit : 0;
  const totalOrders = analytics ? analytics.dineInVsDelivery.dineIn + analytics.dineInVsDelivery.delivery : 0;

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Analytics</h1>
        <p className="text-sm text-surface-400 mt-1">Deep insights into your restaurant performance.</p>
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

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        </div>
      ) : !analytics ? (
        <div className="glass-card p-10 text-center">
          <BarChart3 className="w-12 h-12 text-surface-700 mx-auto mb-3" />
          <p className="text-surface-400">No data available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-surface-400 text-sm">Total Revenue</span>
              </div>
              <p className="text-3xl font-bold text-emerald-400">₹{analytics.totalSales.toFixed(0)}</p>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <ShoppingCart className="w-5 h-5 text-blue-400" />
                <span className="text-surface-400 text-sm">Total Orders</span>
              </div>
              <p className="text-3xl font-bold text-blue-400">{analytics.totalOrders}</p>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <span className="text-surface-400 text-sm">Avg. Order Value</span>
              </div>
              <p className="text-3xl font-bold text-purple-400">₹{analytics.avgOrderValue.toFixed(0)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Best Sellers */}
            <div className="glass-card p-5">
              <h2 className="font-semibold text-surface-100 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Top Selling Items
              </h2>
              {analytics.bestSellers.length === 0 ? (
                <p className="text-surface-500 text-sm">No data</p>
              ) : (
                <div className="space-y-3">
                  {analytics.bestSellers.map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-surface-200 font-medium">{item.name}</span>
                        <span className="text-surface-400">{item.quantity} sold · ₹{item.revenue.toFixed(0)}</span>
                      </div>
                      <div className="w-full h-2.5 bg-surface-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                          style={{ width: `${(item.quantity / maxSellers) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Breakdown */}
            <div className="glass-card p-5">
              <h2 className="font-semibold text-surface-100 mb-4">Payment Breakdown</h2>
              <div className="space-y-4">
                {[
                  { label: 'Cash', value: analytics.paymentBreakdown.cash, icon: <Banknote className="w-4 h-4" />, color: 'from-emerald-600 to-emerald-400', textColor: 'text-emerald-400' },
                  { label: 'Online', value: analytics.paymentBreakdown.online, icon: <Smartphone className="w-4 h-4" />, color: 'from-blue-600 to-blue-400', textColor: 'text-blue-400' },
                  { label: 'Credit', value: analytics.paymentBreakdown.credit, icon: <Wallet className="w-4 h-4" />, color: 'from-amber-600 to-amber-400', textColor: 'text-amber-400' },
                ].map((method) => {
                  const pct = totalPayments > 0 ? (method.value / totalPayments) * 100 : 0;
                  return (
                    <div key={method.label}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className={`flex items-center gap-2 ${method.textColor}`}>
                          {method.icon} {method.label}
                        </span>
                        <span className="font-bold text-surface-200">₹{method.value.toFixed(0)} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full h-3 bg-surface-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${method.color} rounded-full transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dine-In vs Delivery */}
            <div className="glass-card p-5">
              <h2 className="font-semibold text-surface-100 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                Dine-In vs Delivery
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-800/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-brand-400">{analytics.dineInVsDelivery.dineIn}</p>
                  <p className="text-sm text-surface-400 mt-1">Dine-In</p>
                  <p className="text-xs text-surface-500">
                    {totalOrders > 0 ? ((analytics.dineInVsDelivery.dineIn / totalOrders) * 100).toFixed(0) : 0}%
                  </p>
                </div>
                <div className="bg-surface-800/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-400">{analytics.dineInVsDelivery.delivery}</p>
                  <p className="text-sm text-surface-400 mt-1">Delivery</p>
                  <p className="text-xs text-surface-500">
                    {totalOrders > 0 ? ((analytics.dineInVsDelivery.delivery / totalOrders) * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* Kitchen Volume */}
            <div className="glass-card p-5">
              <h2 className="font-semibold text-surface-100 mb-4 flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-amber-400" />
                Kitchen Volume (Items Served)
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-amber-400">{analytics.kitchenVolume.kitchen1}</p>
                  <p className="text-sm text-surface-400 mt-1">Kitchen 1</p>
                  <p className="text-xs text-surface-500">Tandoor & Gravies</p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-orange-400">{analytics.kitchenVolume.kitchen2}</p>
                  <p className="text-sm text-surface-400 mt-1">Kitchen 2</p>
                  <p className="text-xs text-surface-500">Chinese & Rice</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
