'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  DollarSign,
  Users,
  Clock,
  ChefHat,
  HandPlatter,
  LayoutGrid,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import api, { apiErrorMessage } from '@/lib/api';
import { useOrderEvents } from '@/lib/realtime';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  totalCustomers: number;
  pendingOrders: number;
  kitchen1Active: number;
  kitchen2Active: number;
  kitchen1CompletedToday: number;
  kitchen2CompletedToday: number;
  readyOrders: number;
  unpaidOrders: number;
  tablesAvailable: number;
  tablesOccupied: number;
  tablesReserved: number;
}

const EMPTY_STATS: DashboardStats = {
  todayOrders: 0,
  todayRevenue: 0,
  totalCustomers: 0,
  pendingOrders: 0,
  kitchen1Active: 0,
  kitchen2Active: 0,
  kitchen1CompletedToday: 0,
  kitchen2CompletedToday: 0,
  readyOrders: 0,
  unpaidOrders: 0,
  tablesAvailable: 0,
  tablesOccupied: 0,
  tablesReserved: 0,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (opts.silent) setRefreshing(true);
    try {
      const response = await api.get<DashboardStats>('/reports/dashboard');
      setStats({ ...EMPTY_STATS, ...response.data });
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load dashboard statistics'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Any order/payment movement changes these numbers — refresh on the event.
  const live = useOrderEvents({
    onNewOrder: () => loadStats({ silent: true }),
    onStatusUpdate: () => loadStats({ silent: true }),
    onPayment: () => loadStats({ silent: true }),
    onTableUpdate: () => loadStats({ silent: true }),
    onReconnect: () => loadStats({ silent: true }),
  });

  const statCards = [
    {
      label: "Today's Orders",
      value: stats.todayOrders,
      icon: <ShoppingCart className="w-5 h-5" />,
      color: 'from-blue-500/20 to-blue-600/10',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/20',
      hint: `${stats.pendingOrders} in the kitchen now`,
      href: '/dashboard/admin/orders',
    },
    {
      label: "Today's Revenue",
      value: formatCurrency(stats.todayRevenue),
      icon: <DollarSign className="w-5 h-5" />,
      color: 'from-emerald-500/20 to-emerald-600/10',
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
      hint: `${stats.unpaidOrders} order(s) unpaid`,
      href: '/dashboard/admin/payments',
    },
    {
      label: 'Active Customers',
      value: stats.totalCustomers,
      icon: <Users className="w-5 h-5" />,
      color: 'from-purple-500/20 to-purple-600/10',
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/20',
      hint: 'In the customer directory',
      href: '/dashboard/admin/customers',
    },
    {
      label: 'Tables Free',
      value: `${stats.tablesAvailable}/${
        stats.tablesAvailable + stats.tablesOccupied + stats.tablesReserved
      }`,
      icon: <LayoutGrid className="w-5 h-5" />,
      color: 'from-amber-500/20 to-amber-600/10',
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/20',
      hint: `${stats.tablesOccupied} occupied · ${stats.tablesReserved} reserved`,
      href: '/dashboard/admin/tables',
    },
  ];

  const kitchens = [
    {
      name: 'Kitchen 1',
      subtitle: 'Non-Veg, Chinese, Gravies, Biryani',
      active: stats.kitchen1Active,
      done: stats.kitchen1CompletedToday,
      accent: 'text-amber-400',
    },
    {
      name: 'Kitchen 2',
      subtitle: 'Breakfast, Paratha, Veg Thali, Drinks',
      active: stats.kitchen2Active,
      done: stats.kitchen2CompletedToday,
      accent: 'text-orange-400',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Dashboard</h1>
          <p className="text-sm text-surface-400 mt-1">
            Live view of today&apos;s service.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border ${
              live
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-surface-800/50 border-surface-700/50 text-surface-500'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                live ? 'bg-emerald-400 animate-pulse' : 'bg-surface-500'
              }`}
            />
            {live ? 'Live' : 'Offline'}
          </span>
          <button
            onClick={() => loadStats({ silent: true })}
            className="p-2 rounded-lg bg-surface-800/50 border border-surface-700/50 text-surface-400 hover:text-surface-200"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-card p-3 flex items-center justify-between gap-3 border border-red-500/30 text-red-400 text-sm">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </span>
          <button
            onClick={() => loadStats({ silent: true })}
            className="text-xs px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`glass-card glass-card-hover p-5 border ${card.borderColor}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center ${card.iconColor}`}
              >
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-surface-100">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-surface-600" />
              ) : (
                card.value
              )}
            </p>
            <p className="text-xs text-surface-400 mt-1">{card.label}</p>
            <p className="text-[11px] text-surface-600 mt-1">{card.hint}</p>
          </Link>
        ))}
      </div>

      {/* Kitchen Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {kitchens.map((kitchen) => (
          <div key={kitchen.name} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-1">
              <ChefHat className={`w-5 h-5 ${kitchen.accent}`} />
              <h2 className="text-lg font-semibold text-surface-100">{kitchen.name}</h2>
            </div>
            <p className="text-xs text-surface-500 mb-4">{kitchen.subtitle}</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-surface-800/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">{kitchen.active}</p>
                <p className="text-xs text-surface-400 mt-1">In progress</p>
              </div>
              <div className="flex-1 bg-surface-800/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-emerald-400">{kitchen.done}</p>
                <p className="text-xs text-surface-400 mt-1">Completed today</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Service queues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <HandPlatter className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-surface-100">Waiter Queue</h2>
          </div>
          {stats.readyOrders === 0 ? (
            <p className="text-sm text-surface-400">
              Nothing waiting to be served right now.
            </p>
          ) : (
            <p className="text-sm text-surface-300">
              <span className="text-2xl font-bold text-emerald-400 mr-2">
                {stats.readyOrders}
              </span>
              order(s) ready for pickup.
            </p>
          )}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-surface-100">Needs attention</h2>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-surface-400 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" /> Orders in the kitchen
              </span>
              <span className="font-bold text-surface-200">{stats.pendingOrders}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-surface-400 flex items-center gap-2">
                <Receipt className="w-4 h-4" /> Unpaid orders today
              </span>
              <span className="font-bold text-surface-200">{stats.unpaidOrders}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-surface-400 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" /> Tables occupied
              </span>
              <span className="font-bold text-surface-200">{stats.tablesOccupied}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
