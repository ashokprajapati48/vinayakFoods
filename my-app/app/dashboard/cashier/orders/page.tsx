'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import api, { apiErrorMessage, isOffline } from '@/lib/api';
import { getDemoOrders, saveDemoOrders } from '@/lib/mockData';
import { useOrderEvents, useTicker, playNewOrderChime } from '@/lib/realtime';
import {
  ACTIVE_ORDER_STATUSES,
  formatElapsed,
  formatMoney,
  getOrderStatusLabel,
} from '@/lib/utils';
import type { Order } from '@/types';
import {
  AlertTriangle,
  CheckCircle,
  ChefHat,
  ClipboardList,
  Clock,
  Loader2,
  Lock,
  RefreshCw,
  ShoppingCart,
  TableProperties,
  Truck,
  WifiOff,
  XCircle,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  NEW: {
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    icon: <ShoppingCart className="w-3 h-3" />,
  },
  PREPARING: {
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    icon: <ChefHat className="w-3 h-3" />,
  },
  READY: {
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  COLLECTED: {
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  DELIVERED: {
    color: 'text-surface-400 bg-surface-700/50 border-surface-600/30',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  CANCELLED: {
    color: 'text-red-400 bg-red-500/10 border-red-500/30',
    icon: <XCircle className="w-3 h-3" />,
  },
};

const FILTERS = [
  { key: 'active', label: 'Active' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'today', label: 'Today' },
  { key: 'all', label: 'All' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

function todayString() {
  // Local date, so "Today" means the restaurant's today.
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().split('T')[0];
}

export default function CashierOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('active');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useTicker(30000);

  const loadOrders = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (opts.silent) setRefreshing(true);
      try {
        let url = '/orders';
        if (filter === 'active' || filter === 'unpaid') {
          url = `/orders?status=${ACTIVE_ORDER_STATUSES.join(',')}`;
        } else if (filter === 'today') {
          url = `/orders?date=${todayString()}`;
        }

        const res = await api.get<Order[]>(url);
        const list = Array.isArray(res.data) ? res.data : [];
        setOrders(filter === 'unpaid' ? list.filter((o) => !o.payment) : list);
        setError(null);
        setOffline(false);
      } catch (err) {
        if (isOffline(err)) {
          setOffline(true);
          setError(null);
          const demo = getDemoOrders();
          setOrders(
            filter === 'active'
              ? demo.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status))
              : filter === 'unpaid'
                ? demo.filter((o) => !o.payment && o.status !== 'CANCELLED')
                : demo,
          );
        } else {
          setOffline(false);
          setError(apiErrorMessage(err, 'Could not load orders'));
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter],
  );

  useEffect(() => {
    setLoading(true);
    loadOrders();
  }, [loadOrders]);

  const matchesFilter = useCallback(
    (order: Order) => {
      if (filter === 'all') return true;
      if (filter === 'active') return ACTIVE_ORDER_STATUSES.includes(order.status);
      if (filter === 'unpaid')
        return !order.payment && order.status !== 'CANCELLED';
      return order.createdAt.startsWith(todayString());
    },
    [filter],
  );

  useOrderEvents({
    onNewOrder: (order) => {
      if (!matchesFilter(order)) return;
      setOrders((prev) =>
        prev.some((o) => o.id === order.id) ? prev : [order, ...prev],
      );
      playNewOrderChime();
    },
    onStatusUpdate: (updated) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === updated.id);
        if (!matchesFilter(updated)) return prev.filter((o) => o.id !== updated.id);
        if (!exists) return [updated, ...prev];
        return prev.map((o) => (o.id === updated.id ? updated : o));
      });
      setSelectedOrder((cur) => (cur?.id === updated.id ? updated : cur));
    },
    onPayment: () => loadOrders({ silent: true }),
    onReconnect: () => loadOrders({ silent: true }),
  });

  const changeStatus = async (orderId: string, status: 'CANCELLED' | 'DELIVERED') => {
    setBusyId(orderId);
    try {
      const res = await api.put<Order>(`/orders/${orderId}/status`, { status });
      setOrders((prev) =>
        prev
          .map((o) => (o.id === orderId ? res.data : o))
          .filter((o) => matchesFilter(o)),
      );
      setSelectedOrder(null);
      setError(null);
    } catch (err) {
      if (isOffline(err)) {
        saveDemoOrders(
          getDemoOrders().map((o) =>
            o.id === orderId
              ? { ...o, status, updatedAt: new Date().toISOString() }
              : o,
          ),
        );
        setOffline(true);
        loadOrders({ silent: true });
        setSelectedOrder(null);
      } else {
        setError(apiErrorMessage(err, 'Could not update this order'));
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = (orderId: string) => {
    if (!confirm('Cancel this order? The table will be freed.')) return;
    changeStatus(orderId, 'CANCELLED');
  };

  const handleClose = (orderId: string) => {
    if (!confirm('Close this order and free the table?')) return;
    changeStatus(orderId, 'DELIVERED');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Orders</h1>
          <p className="text-sm text-surface-400 mt-1">Track and manage all orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadOrders({ silent: true })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-800/50 border border-surface-700/50 text-surface-400 hover:text-surface-200 text-sm transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/dashboard/cashier/new-order"
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            New Order
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f.key
                ? 'bg-brand-500/20 border border-brand-500/30 text-brand-400'
                : 'bg-surface-800/50 border border-surface-700/50 text-surface-400 hover:text-surface-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {offline && (
        <div className="glass-card p-3 flex items-center gap-2 border border-amber-500/30 text-amber-400 text-sm">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          Server unreachable — showing offline demo orders.
        </div>
      )}

      {error && (
        <div className="glass-card p-3 flex items-center justify-between gap-3 border border-red-500/30 text-red-400 text-sm">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </span>
          <button
            onClick={() => loadOrders({ silent: true })}
            className="text-xs px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <ClipboardList className="w-12 h-12 text-surface-700 mx-auto mb-3" />
          <p className="text-surface-400">No orders found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {orders.map((order) => {
            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.NEW;
            const canClose =
              order.type === 'DINE_IN' &&
              Boolean(order.payment) &&
              ['READY', 'COLLECTED'].includes(order.status);

            return (
              <div
                key={order.id}
                className={`glass-card p-4 cursor-pointer transition-all hover:border-surface-600 ${
                  order.status === 'NEW' ? 'pulse-new' : ''
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-lg font-bold text-surface-100">
                      #{order.orderNumber}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-surface-500">
                      <Clock className="w-3 h-3" />
                      {formatElapsed(order.createdAt)} ago
                    </div>
                  </div>
                  <div className={`status-badge ${status.color} flex items-center gap-1`}>
                    {status.icon}
                    {getOrderStatusLabel(order.status, order.type)}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  {order.type === 'DINE_IN' ? (
                    <span className="flex items-center gap-1 text-xs text-surface-400">
                      <TableProperties className="w-3 h-3" />
                      Table {order.table?.number ?? '—'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-blue-400">
                      <Truck className="w-3 h-3" />
                      Delivery
                    </span>
                  )}
                  {order.customer && (
                    <span className="text-xs text-surface-500">
                      • {order.customer.name}
                    </span>
                  )}
                </div>

                <div className="text-xs text-surface-400 mb-2">
                  {order.orderItems.slice(0, 3).map((item) => (
                    <span key={item.id} className="mr-2">
                      {item.quantity}× {item.menuItem?.name}
                    </span>
                  ))}
                  {order.orderItems.length > 3 && (
                    <span className="text-surface-500">
                      +{order.orderItems.length - 3} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-brand-400">{formatMoney(order.total)}</p>
                  <div className="flex items-center gap-2">
                    {order.payment ? (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {order.payment.method}
                      </span>
                    ) : (
                      order.status !== 'CANCELLED' && (
                        <Link
                          href={`/dashboard/cashier/payments?orderId=${order.id}`}
                          className="text-xs px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Pay
                        </Link>
                      )
                    )}
                    {canClose && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClose(order.id);
                        }}
                        disabled={busyId === order.id}
                        className="text-xs px-3 py-1 rounded-lg bg-surface-800 border border-surface-600 text-surface-300 hover:text-surface-100 disabled:opacity-60 flex items-center gap-1"
                        title="Close the order and free the table"
                      >
                        {busyId === order.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Lock className="w-3 h-3" />
                        )}
                        Close
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div
            className="modal-content glass-card p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-surface-100">
                Order #{selectedOrder.orderNumber}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-surface-500 hover:text-surface-300"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-surface-500 mb-4">
              {selectedOrder.type === 'DINE_IN'
                ? `Table ${selectedOrder.table?.number ?? '—'}`
                : 'Delivery'}{' '}
              · {getOrderStatusLabel(selectedOrder.status, selectedOrder.type)} ·{' '}
              {formatElapsed(selectedOrder.createdAt)} ago
            </p>

            <div className="space-y-3">
              {selectedOrder.orderItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <span className="text-surface-200">{item.menuItem?.name}</span>
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-surface-800 text-surface-500">
                      {item.kitchen === 'KITCHEN_1' ? 'K1' : 'K2'}
                    </span>
                    {item.notes && (
                      <p className="text-surface-500 text-xs italic">{item.notes}</p>
                    )}
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="text-surface-400">{item.quantity}×</span>
                    <span className="text-brand-400 ml-2 font-semibold">
                      {formatMoney(item.totalPrice)}
                    </span>
                  </div>
                </div>
              ))}

              <div className="border-t border-surface-700/50 pt-3 flex justify-between font-bold">
                <span className="text-surface-200">Total</span>
                <span className="text-brand-400">{formatMoney(selectedOrder.total)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {['NEW', 'PREPARING'].includes(selectedOrder.status) &&
                !selectedOrder.payment && (
                  <button
                    onClick={() => handleCancel(selectedOrder.id)}
                    disabled={busyId === selectedOrder.id}
                    className="btn-danger flex-1 text-sm disabled:opacity-60"
                  >
                    Cancel Order
                  </button>
                )}
              {!selectedOrder.payment && selectedOrder.status !== 'CANCELLED' && (
                <Link
                  href={`/dashboard/cashier/payments?orderId=${selectedOrder.id}`}
                  className="btn-success flex-1 text-sm text-center"
                >
                  Process Payment
                </Link>
              )}
              {selectedOrder.type === 'DINE_IN' &&
                selectedOrder.payment &&
                ['READY', 'COLLECTED'].includes(selectedOrder.status) && (
                  <button
                    onClick={() => handleClose(selectedOrder.id)}
                    disabled={busyId === selectedOrder.id}
                    className="btn-secondary flex-1 text-sm disabled:opacity-60"
                  >
                    Close & free table
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
