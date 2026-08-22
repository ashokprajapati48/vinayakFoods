'use client';

import Link from 'next/link';
import {
  ShoppingCart,
  Plus,
  ClipboardList,
  Users,
  CreditCard,
} from 'lucide-react';

export default function CashierDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">
          Cashier Dashboard
        </h1>
        <p className="text-sm text-surface-400 mt-1">
          Create orders and manage payments.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/dashboard/cashier/new-order"
          className="glass-card glass-card-hover p-6 flex flex-col items-center gap-3 text-center group"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 flex items-center justify-center text-brand-400 group-hover:scale-110 transition-transform">
            <Plus className="w-7 h-7" />
          </div>
          <span className="text-sm font-semibold text-surface-200">
            New Order
          </span>
        </Link>

        <Link
          href="/dashboard/cashier/orders"
          className="glass-card glass-card-hover p-6 flex flex-col items-center gap-3 text-center group"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
            <ClipboardList className="w-7 h-7" />
          </div>
          <span className="text-sm font-semibold text-surface-200">
            Active Orders
          </span>
        </Link>

        <Link
          href="/dashboard/cashier/customers"
          className="glass-card glass-card-hover p-6 flex flex-col items-center gap-3 text-center group"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
            <Users className="w-7 h-7" />
          </div>
          <span className="text-sm font-semibold text-surface-200">
            Customers
          </span>
        </Link>

        <Link
          href="/dashboard/cashier/payments"
          className="glass-card glass-card-hover p-6 flex flex-col items-center gap-3 text-center group"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <CreditCard className="w-7 h-7" />
          </div>
          <span className="text-sm font-semibold text-surface-200">
            Payments
          </span>
        </Link>
      </div>

      {/* Today's Summary */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="w-5 h-5 text-brand-400" />
          <h2 className="text-lg font-semibold text-surface-100">
            Today&apos;s Activity
          </h2>
        </div>
        <p className="text-sm text-surface-400">
          No orders created yet today. Tap &quot;New Order&quot; to get
          started.
        </p>
      </div>
    </div>
  );
}
