'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Order } from '@/types';
import {
  ChefHat,
  Clock,
  Truck,
  TableProperties,
  CheckCircle,
  PlayCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

const KITCHEN = 'KITCHEN_1';
const KITCHEN_LABEL = 'Kitchen 1';
const KITCHEN_SUBTITLE = 'Tandoor, Gravies & Breads';

type KitchenOrderStatus = 'NEW' | 'PREPARING' | 'READY';

interface KitchenDisplayOrder extends Order {
  kitchenStatus: KitchenOrderStatus;
}

export default function Kitchen1Page() {
  const [orders, setOrders] = useState<KitchenDisplayOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const res = await api.get(`/orders/kitchen/${KITCHEN}`);
      const enriched = res.data.map((order: Order) => ({
        ...order,
        kitchenStatus: order.kitchenOrders?.find((ko) => ko.kitchen === KITCHEN)?.status || 'NEW',
      }));
      setOrders(enriched);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Real-time updates
  useEffect(() => {
    const socket = (window as any).__socket;
    if (!socket) return;

    const handleNewOrder = (order: Order) => {
      const hasKitchen = order.kitchenOrders?.some((ko) => ko.kitchen === KITCHEN);
      if (hasKitchen) {
        const enriched: KitchenDisplayOrder = {
          ...order,
          kitchenStatus: 'NEW',
        };
        setOrders((prev) => [enriched, ...prev]);
      }
    };

    const handleStatusUpdate = (updated: Order) => {
      setOrders((prev) =>
        prev
          .map((o) => {
            if (o.id === updated.id) {
              const ko = updated.kitchenOrders?.find((k) => k.kitchen === KITCHEN);
              const status = ko?.status as KitchenOrderStatus || o.kitchenStatus;
              return { ...updated, kitchenStatus: status };
            }
            return o;
          })
          .filter((o) => ['NEW', 'PREPARING'].includes(o.status)),
      );
    };

    socket.on('order:new', handleNewOrder);
    socket.on('order:statusUpdate', handleStatusUpdate);
    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:statusUpdate', handleStatusUpdate);
    };
  }, []);

  const updateStatus = async (orderId: string, status: KitchenOrderStatus) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/orders/${orderId}/kitchen/${KITCHEN}/status`, { status });
      setOrders((prev) =>
        prev
          .map((o) => (o.id === orderId ? { ...o, kitchenStatus: status } : o))
          .filter((o) => {
            if (o.id === orderId && status === 'READY') return false;
            return true;
          }),
      );
    } catch {
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getElapsed = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const newOrders = orders.filter((o) => o.kitchenStatus === 'NEW');
  const preparingOrders = orders.filter((o) => o.kitchenStatus === 'PREPARING');

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center text-amber-400">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-100">{KITCHEN_LABEL}</h1>
            <p className="text-sm text-surface-400">{KITCHEN_SUBTITLE}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              {newOrders.length} New
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {preparingOrders.length} Preparing
            </span>
          </div>
          <button
            onClick={loadOrders}
            className="p-2 rounded-lg bg-surface-800/50 border border-surface-700/50 text-surface-400 hover:text-surface-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <ChefHat className="w-16 h-16 text-surface-700 mx-auto mb-4" />
          <p className="text-lg font-medium text-surface-400">No active orders</p>
          <p className="text-sm text-surface-500 mt-1">New orders will appear here in real-time</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((order) => {
            const isNew = order.kitchenStatus === 'NEW';
            const isPreparing = order.kitchenStatus === 'PREPARING';
            const elapsed = getElapsed(order.createdAt);
            const elapsedMins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
            const isUrgent = elapsedMins >= 15;

            const kitchenItems = order.orderItems.filter((item) => item.kitchen === KITCHEN);

            return (
              <div
                key={order.id}
                className={`kitchen-card glass-card p-4 ${
                  isNew ? 'border border-blue-500/40 pulse-new' : ''
                } ${isUrgent ? 'border border-red-500/40' : ''}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xl font-bold text-surface-100">
                      #{order.orderNumber}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                      <Clock className={`w-3 h-3 ${isUrgent ? 'text-red-400' : 'text-surface-500'}`} />
                      <span className={isUrgent ? 'text-red-400 font-semibold' : 'text-surface-500'}>
                        {elapsed}
                        {isUrgent ? ' ⚠️' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`status-badge ${
                      isNew
                        ? 'text-blue-400 bg-blue-500/10 border-blue-500/30'
                        : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                    }`}>
                      {isNew ? 'NEW' : 'PREPARING'}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-surface-500">
                      {order.type === 'DINE_IN' ? (
                        <><TableProperties className="w-3 h-3" /> Table {order.table?.number}</>
                      ) : (
                        <><Truck className="w-3 h-3" /> Delivery</>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4">
                  {kitchenItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-2 rounded-xl bg-surface-800/50"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-amber-400">{item.quantity}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-surface-200">
                          {item.menuItem?.name}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-amber-300 italic mt-0.5">📝 {item.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="mb-3 p-2 rounded-lg bg-surface-800/50 text-xs text-surface-400 italic">
                    Note: {order.notes}
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() =>
                    updateStatus(order.id, isNew ? 'PREPARING' : 'READY')
                  }
                  disabled={updatingId === order.id}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                    isNew
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30'
                      : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                  }`}
                >
                  {updatingId === order.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isNew ? (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      Start Preparing
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Mark Ready
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
