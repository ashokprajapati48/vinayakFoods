'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { apiErrorMessage, isOffline } from '@/lib/api';
import { getDemoOrders, saveDemoOrders } from '@/lib/mockData';
import { playNewOrderChime, useOrderEvents, useTicker } from '@/lib/realtime';
import { formatElapsed, formatMoney } from '@/lib/utils';
import type { Order } from '@/types';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  HandPlatter,
  Loader2,
  Package,
  RefreshCw,
  TableProperties,
  Truck,
  WifiOff,
} from 'lucide-react';

export default function WaiterPage() {
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useTicker(15000);

  const loadOrders = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (opts.silent) setRefreshing(true);
    try {
      const res = await api.get<Order[]>('/orders/ready');
      setReadyOrders(Array.isArray(res.data) ? res.data : []);
      setError(null);
      setOffline(false);
    } catch (err) {
      if (isOffline(err)) {
        setOffline(true);
        setError(null);
        setReadyOrders(getDemoOrders().filter((o) => o.status === 'READY'));
      } else {
        setOffline(false);
        setError(apiErrorMessage(err, 'Could not load ready orders'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const live = useOrderEvents({
    onStatusUpdate: (updated) => {
      setReadyOrders((prev) => {
        if (updated.status === 'READY') {
          const idx = prev.findIndex((o) => o.id === updated.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updated;
            return next;
          }
          playNewOrderChime();
          return [...prev, updated];
        }
        // Anything else means it left the pickup queue.
        return prev.filter((o) => o.id !== updated.id);
      });
    },
    onReconnect: () => loadOrders({ silent: true }),
  });

  const advance = async (orderId: string, status: 'COLLECTED' | 'DELIVERED') => {
    setUpdatingId(orderId);
    const snapshot = readyOrders;
    setReadyOrders((prev) => prev.filter((o) => o.id !== orderId));

    try {
      await api.put(`/orders/${orderId}/status`, { status });
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
      } else {
        setReadyOrders(snapshot);
        setError(apiErrorMessage(err, 'Could not update this order'));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center text-emerald-400">
            <HandPlatter className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-100">Waiter Station</h1>
            <p className="text-sm text-surface-400">
              Orders ready for pickup and delivery
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {readyOrders.length} Ready
          </span>
          <span
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border ${
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
            onClick={() => loadOrders({ silent: true })}
            className="p-2 rounded-lg bg-surface-800/50 border border-surface-700/50 text-surface-400 hover:text-surface-200"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {offline && (
        <div className="glass-card p-3 flex items-center gap-2 border border-amber-500/30 text-amber-400 text-sm">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          Server unreachable — showing the offline demo queue.
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
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      ) : readyOrders.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <HandPlatter className="w-16 h-16 text-surface-700 mx-auto mb-4" />
          <p className="text-lg font-medium text-surface-400">No orders ready</p>
          <p className="text-sm text-surface-500 mt-1">
            Orders marked ready by both kitchens appear here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {readyOrders.map((order) => {
            const isDelivery = order.type === 'DELIVERY';
            const busy = updatingId === order.id;

            return (
              <div
                key={order.id}
                className="kitchen-card glass-card p-4 border border-emerald-500/30"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xl font-bold text-surface-100">
                      #{order.orderNumber}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-emerald-400">
                      <Clock className="w-3 h-3" />
                      Ready {formatElapsed(order.updatedAt)}
                    </div>
                  </div>
                  <div
                    className={`status-badge flex items-center gap-1 ${
                      isDelivery
                        ? 'text-blue-400 bg-blue-500/10 border-blue-500/30'
                        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    }`}
                  >
                    {isDelivery ? (
                      <Truck className="w-3 h-3" />
                    ) : (
                      <TableProperties className="w-3 h-3" />
                    )}
                    {isDelivery ? 'Delivery' : `Table ${order.table?.number ?? '—'}`}
                  </div>
                </div>

                {(order.customer || order.deliveryInfo) && (
                  <div className="text-sm text-surface-400 mb-3">
                    {order.customer && <p>👤 {order.customer.name}</p>}
                    {isDelivery && order.deliveryInfo?.address && (
                      <p className="text-xs text-surface-500 mt-0.5">
                        📍 {order.deliveryInfo.address}
                      </p>
                    )}
                    {isDelivery && order.deliveryInfo?.phone && (
                      <p className="text-xs text-surface-500">
                        📞 {order.deliveryInfo.phone}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-1.5 mb-3">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                        {item.quantity}
                      </span>
                      <span className="text-surface-300">
                        {item.menuItem?.name || 'Item'}
                      </span>
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-surface-800 text-surface-500">
                        {item.kitchen === 'KITCHEN_1' ? 'K1' : 'K2'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-surface-500">
                    {order.payment ? 'Paid' : 'Payment pending'}
                  </span>
                  <span className="font-bold text-brand-400">
                    {formatMoney(order.total)}
                  </span>
                </div>

                {order.notes && (
                  <div className="mb-3 p-2 rounded-lg bg-surface-800/50 text-xs text-surface-400 italic">
                    📝 {order.notes}
                  </div>
                )}

                <button
                  onClick={() => advance(order.id, isDelivery ? 'DELIVERED' : 'COLLECTED')}
                  disabled={busy}
                  className="btn-success w-full flex items-center justify-center gap-2 text-sm py-2.5 disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isDelivery ? (
                    <>
                      <Package className="w-4 h-4" />
                      Hand to Delivery
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Serve to Table
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
