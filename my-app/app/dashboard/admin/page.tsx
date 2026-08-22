'use client';

import { useEffect, useState } from 'react';
import {
  ShoppingCart,
  DollarSign,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ChefHat,
  HandPlatter,
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  totalCustomers: number;
  pendingOrders: number;
  kitchen1Active: number;
  kitchen2Active: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    todayRevenue: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    kitchen1Active: 0,
    kitchen2Active: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/reports/dashboard');
      setStats(response.data);
    } catch {
      // Use default stats for now
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: "Today's Orders",
      value: stats.todayOrders,
      icon: <ShoppingCart className="w-5 h-5" />,
      color: 'from-blue-500/20 to-blue-600/10',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/20',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: "Today's Revenue",
      value: formatCurrency(stats.todayRevenue),
      icon: <DollarSign className="w-5 h-5" />,
      color: 'from-emerald-500/20 to-emerald-600/10',
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
      trend: '+8%',
      trendUp: true,
    },
    {
      label: 'Total Customers',
      value: stats.totalCustomers,
      icon: <Users className="w-5 h-5" />,
      color: 'from-purple-500/20 to-purple-600/10',
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/20',
      trend: '+3',
      trendUp: true,
    },
    {
      label: 'Pending Orders',
      value: stats.pendingOrders,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'from-amber-500/20 to-amber-600/10',
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/20',
      trend: '-2',
      trendUp: false,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Dashboard</h1>
        <p className="text-sm text-surface-400 mt-1">
          Welcome back! Here&apos;s your restaurant overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`glass-card glass-card-hover p-5 border ${card.borderColor}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center ${card.iconColor}`}
              >
                {card.icon}
              </div>
              <div
                className={`flex items-center gap-0.5 text-xs font-medium ${
                  card.trendUp ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {card.trendUp ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {card.trend}
              </div>
            </div>
            <p className="text-2xl font-bold text-surface-100">
              {loading ? '—' : card.value}
            </p>
            <p className="text-xs text-surface-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Kitchen Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ChefHat className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-surface-100">
              Kitchen 1
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-surface-800/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {stats.kitchen1Active}
              </p>
              <p className="text-xs text-surface-400 mt-1">Active Orders</p>
            </div>
            <div className="flex-1 bg-surface-800/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">0</p>
              <p className="text-xs text-surface-400 mt-1">Completed Today</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ChefHat className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-surface-100">
              Kitchen 2
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-surface-800/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {stats.kitchen2Active}
              </p>
              <p className="text-xs text-surface-400 mt-1">Active Orders</p>
            </div>
            <div className="flex-1 bg-surface-800/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">0</p>
              <p className="text-xs text-surface-400 mt-1">Completed Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Waiter Status */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <HandPlatter className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-surface-100">
            Waiter Queue
          </h2>
        </div>
        <p className="text-sm text-surface-400">
          No orders ready for delivery at the moment.
        </p>
      </div>
    </div>
  );
}
