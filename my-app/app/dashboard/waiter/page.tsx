'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Order } from '@/types';
import {
  HandPlatter,
  Clock,
  TableProperties,
  Truck,
  CheckCircle,
  Loader2,
  RefreshCw,
  Package,
} from 'lucide-react';

import { getDemoOrders, saveDemoOrders } from '@/lib/mockData';

export default function WaiterPage() {
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders/ready');
      if (res.data?.length > 0) {
        setReadyOrders(res.data);
        return;
      }
    } catch {
      // ignore
    }
    const demo = getDemoOrders();
    const ready = demo.filter((o) => o.status === 'READY');
    setReadyOrders(ready);
    setLoading(false);
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Real-time
  useEffect(() => {
    const socket = (window as any).__socket;
    if (!socket) return;
    const handleStatusUpdate = (updated: Order) => {
      if (updated.status === 'READY') {
        setReadyOrders((prev) => {
          const exists = prev.find((o) => o.id === updated.id);
          if (exists) return prev.map((o) => (o.id === updated.id ? updated : o));
          return [updated, ...prev];
        });
      } else if (['COLLECTED', 'DELIVERED', 'CANCELLED'].includes(updated.status)) {
        setReadyOrders((prev) => prev.filter((o) => o.id !== updated.id));
      }
    };
    socket.on('order:statusUpdate', handleStatusUpdate);
    return () => socket.off('order:statusUpdate', handleStatusUpdate);
  }, []);

  const handleCollect = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status: 'COLLECTED' });
    } catch {
      const demo = getDemoOrders();
      const updated = demo.map((o) => (o.id === orderId ? { ...o, status: 'COLLECTED' as const } : o));
      saveDemoOrders(updated);
    }
    setReadyOrders((prev) => prev.filter((o) => o.id !== orderId));
    setUpdatingId(null);
  };

  const handleDeliver = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status: 'DELIVERED' });
      setReadyOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      alert('Failed to update order');
    } finally {
      setUpdatingId(null);
    }
  };

  const getElapsed = (updatedAt: string) => {
    const mins = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 60000);
    if (mins < 1) return 'Just ready';
    return `Ready for ${mins}m`;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center text-emerald-400">
            <HandPlatter className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-100">Waiter Station</h1>
            <p className="text-sm text-surface-400">Orders ready for pickup and delivery</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {readyOrders.length} Ready
          </span>
          <button onClick={loadOrders} className="p-2 rounded-lg bg-surface-800/50 border border-surface-700/50 text-surface-400 hover:text-surface-200">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      ) : readyOrders.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <HandPlatter className="w-16 h-16 text-surface-700 mx-auto mb-4" />
          <p className="text-lg font-medium text-surface-400">No orders ready</p>
          <p className="text-sm text-surface-500 mt-1">Orders marked ready by the kitchen will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {readyOrders.map((order) => {
            const isDelivery = order.type === 'DELIVERY';
            return (
              <div key={order.id} className="kitchen-card glass-card p-4 border border-emerald-500/30">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xl font-bold text-surface-100">#{order.orderNumber}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-emerald-400">
                      <Clock className="w-3 h-3" />
                      {getElapsed(order.updatedAt)}
                    </div>
                  </div>
                  <div className={`status-badge ${
                    isDelivery
                      ? 'text-blue-400 bg-blue-500/10 border-blue-500/30'
                      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                  } flex items-center gap-1`}>
                    {isDelivery ? <Truck className="w-3 h-3" /> : <TableProperties className="w-3 h-3" />}
                    {isDelivery ? 'Delivery' : `Table ${order.table?.number}`}
                  </div>
                </div>

                {order.customer && (
                  <p className="text-sm text-surface-400 mb-3">
                    👤 {order.customer.name}
                    {isDelivery && order.deliveryInfo?.address && (
                      <span className="block text-xs text-surface-500 mt-0.5">
                        📍 {order.deliveryInfo.address}
                      </span>
                    )}
                  </p>
                )}

                <div className="space-y-1.5 mb-4">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
                        {item.quantity}
                      </span>
                      <span className="text-surface-300">{item.menuItem?.name}</span>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="mb-3 p-2 rounded-lg bg-surface-800/50 text-xs text-surface-400 italic">
                    📝 {order.notes}
                  </div>
                )}

                <div className="flex gap-2">
                  {!isDelivery ? (
                    <button
                      onClick={() => handleCollect(order.id)}
                      disabled={updatingId === order.id}
                      className="btn-success flex-1 flex items-center justify-center gap-2 text-sm py-2.5"
                    >
                      {updatingId === order.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Deliver to Table
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDeliver(order.id)}
                      disabled={updatingId === order.id}
                      className="btn-success flex-1 flex items-center justify-center gap-2 text-sm py-2.5"
                    >
                      {updatingId === order.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Package className="w-4 h-4" />
                          Hand to Delivery
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
