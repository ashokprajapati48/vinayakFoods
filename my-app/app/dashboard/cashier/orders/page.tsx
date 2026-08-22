'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { Order } from '@/types';
import {
  ClipboardList,
  RefreshCw,
  ShoppingCart,
  ChefHat,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  TableProperties,
  Eye,
  Loader2,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  NEW: { label: 'New', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', icon: <ShoppingCart className="w-3 h-3" /> },
  PREPARING: { label: 'Preparing', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: <ChefHat className="w-3 h-3" /> },
  READY: { label: 'Ready', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle className="w-3 h-3" /> },
  COLLECTED: { label: 'Collected', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', icon: <CheckCircle className="w-3 h-3" /> },
  DELIVERED: { label: 'Delivered', color: 'text-surface-400 bg-surface-700/50 border-surface-600/30', icon: <CheckCircle className="w-3 h-3" /> },
  CANCELLED: { label: 'Cancelled', color: 'text-red-400 bg-red-500/10 border-red-500/30', icon: <XCircle className="w-3 h-3" /> },
};

import { getDemoOrders } from '@/lib/mockData';

export default function CashierOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('active');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      let url = '/orders';
      if (filter === 'active') {
        url = '/orders?status=NEW';
      } else if (filter === 'today') {
        url = `/orders?date=${new Date().toISOString().split('T')[0]}`;
      }
      const res = await api.get(url);
      if (res.data?.length > 0) {
        setOrders(res.data);
        return;
      }
    } catch {
      // ignore
    }
    const demo = getDemoOrders();
    setOrders(demo);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Real-time updates
  useEffect(() => {
    const socket = (window as any).__socket;
    if (!socket) return;
    socket.on('order:new', (order: Order) => {
      setOrders((prev) => [order, ...prev]);
    });
    socket.on('order:statusUpdate', (updated: Order) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o)),
      );
    });
    return () => {
      socket.off('order:new');
      socket.off('order:statusUpdate');
    };
  }, []);

  const handleCancel = async (orderId: string) => {
    if (!confirm('Cancel this order?')) return;
    try {
      await api.put(`/orders/${orderId}/cancel`);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o)),
      );
      setSelectedOrder(null);
    } catch {
      alert('Failed to cancel order');
    }
  };

  const getElapsedTime = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  const activeFilters = [
    { key: 'active', label: 'Active' },
    { key: 'today', label: 'Today' },
    { key: 'all', label: 'All' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Orders</h1>
          <p className="text-sm text-surface-400 mt-1">Track and manage all orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadOrders}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-800/50 border border-surface-700/50 text-surface-400 hover:text-surface-200 text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link href="/dashboard/cashier/new-order" className="btn-primary flex items-center gap-2 text-sm">
            <ShoppingCart className="w-4 h-4" />
            New Order
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {activeFilters.map((f) => (
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
                      {getElapsedTime(order.createdAt)}
                    </div>
                  </div>
                  <div className={`status-badge ${status.color} flex items-center gap-1`}>
                    {status.icon}
                    {status.label}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  {order.type === 'DINE_IN' ? (
                    <span className="flex items-center gap-1 text-xs text-surface-400">
                      <TableProperties className="w-3 h-3" />
                      Table {order.table?.number || '—'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-blue-400">
                      <Truck className="w-3 h-3" />
                      Delivery
                    </span>
                  )}
                  {order.customer && (
                    <span className="text-xs text-surface-500">• {order.customer.name}</span>
                  )}
                </div>

                <div className="text-xs text-surface-400 mb-2">
                  {order.orderItems.slice(0, 3).map((item) => (
                    <span key={item.id} className="mr-2">
                      {item.quantity}× {item.menuItem?.name}
                    </span>
                  ))}
                  {order.orderItems.length > 3 && (
                    <span className="text-surface-500">+{order.orderItems.length - 3} more</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="font-bold text-brand-400">₹{order.total}</p>
                  {!order.payment && order.status !== 'CANCELLED' && (
                    <Link
                      href={`/dashboard/cashier/payments?orderId=${order.id}`}
                      className="text-xs px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Pay
                    </Link>
                  )}
                  {order.payment && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Paid
                    </span>
                  )}
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
            <div className="flex items-center justify-between mb-4">
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

            <div className="space-y-3">
              {selectedOrder.orderItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <span className="text-surface-200">{item.menuItem?.name}</span>
                    {item.notes && (
                      <p className="text-surface-500 text-xs italic">{item.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-surface-400">{item.quantity}×</span>
                    <span className="text-brand-400 ml-2 font-semibold">
                      ₹{item.totalPrice}
                    </span>
                  </div>
                </div>
              ))}

              <div className="border-t border-surface-700/50 pt-3 flex justify-between font-bold">
                <span className="text-surface-200">Total</span>
                <span className="text-brand-400">₹{selectedOrder.total}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {selectedOrder.status === 'NEW' && (
                <button
                  onClick={() => handleCancel(selectedOrder.id)}
                  className="btn-danger flex-1 text-sm"
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
