'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Plus,
  ClipboardList,
  Users,
  CreditCard,
  Loader2,
  ChefHat,
  CheckCircle,
} from 'lucide-react';
import api from '@/lib/api';
import { useOrderEvents } from '@/lib/realtime';
import { formatMoney, sumBy } from '@/lib/utils';
import type { Order } from '@/types';

function todayString() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().split('T')[0];
}

export default function CashierDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get<Order[]>(`/orders?date=${todayString()}`);
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch {
      // Quick-action tiles still work without the summary.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useOrderEvents({
    onNewOrder: () => load(),
    onStatusUpdate: () => load(),
    onPayment: () => load(),
    onReconnect: () => load(),
  });

  const active = orders.filter((o) =>
    ['NEW', 'PREPARING', 'READY'].includes(o.status),
  );
  const unpaid = orders.filter((o) => !o.payment && o.status !== 'CANCELLED');
  const collected = sumBy(
    orders.filter((o) => o.payment),
    (o) => o.payment?.amount,
  );

  const quickActions = [
    {
      href: '/dashboard/cashier/new-order',
      label: 'New Order',
      icon: <Plus className="w-7 h-7" />,
      wrap: 'from-brand-500/20 to-brand-600/10 text-brand-400',
    },
    {
      href: '/dashboard/cashier/orders',
      label: 'Active Orders',
      icon: <ClipboardList className="w-7 h-7" />,
      wrap: 'from-blue-500/20 to-blue-600/10 text-blue-400',
    },
    {
      href: '/dashboard/cashier/customers',
      label: 'Customers',
      icon: <Users className="w-7 h-7" />,
      wrap: 'from-purple-500/20 to-purple-600/10 text-purple-400',
    },
    {
      href: '/dashboard/cashier/payments',
      label: 'Payments',
      icon: <CreditCard className="w-7 h-7" />,
      wrap: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400',
    },
  ];

  const summary = [
    {
      label: 'Orders today',
      value: orders.length,
      icon: <ShoppingCart className="w-4 h-4" />,
      color: 'text-blue-400',
    },
    {
      label: 'In the kitchen',
      value: active.length,
      icon: <ChefHat className="w-4 h-4" />,
      color: 'text-amber-400',
    },
    {
      label: 'Awaiting payment',
      value: unpaid.length,
      icon: <CreditCard className="w-4 h-4" />,
      color: 'text-red-400',
    },
    {
      label: 'Collected today',
      value: formatMoney(collected),
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Cashier Dashboard</h1>
        <p className="text-sm text-surface-400 mt-1">
          Create orders and manage payments.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="glass-card glass-card-hover p-6 flex flex-col items-center gap-3 text-center group"
          >
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center group-hover:scale-110 transition-transform ${action.wrap}`}
            >
              {action.icon}
            </div>
            <span className="text-sm font-semibold text-surface-200">
              {action.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Today's Summary */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="w-5 h-5 text-brand-400" />
          <h2 className="text-lg font-semibold text-surface-100">
            Today&apos;s Activity
          </h2>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-surface-500" />}
        </div>

        {!loading && orders.length === 0 ? (
          <p className="text-sm text-surface-400">
            No orders yet today. Tap &quot;New Order&quot; to get started.
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {summary.map((item) => (
              <div key={item.label} className="bg-surface-800/50 rounded-xl p-4">
                <div className={`flex items-center gap-2 mb-1 ${item.color}`}>
                  {item.icon}
                  <span className="text-xs text-surface-400">{item.label}</span>
                </div>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
