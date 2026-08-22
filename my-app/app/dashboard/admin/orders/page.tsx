'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Order } from '@/types';
import {
  ShoppingCart,
  Filter,
  Loader2,
  ChevronDown,
  TableProperties,
  Truck,
  X,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  NEW: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  PREPARING: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  READY: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  COLLECTED: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  DELIVERED: 'text-surface-400 bg-surface-700/50 border-surface-600/30',
  CANCELLED: 'text-red-400 bg-red-500/10 border-red-500/30',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/orders';
      if (filter === 'today') url = `/orders?date=${today}`;
      else if (filter !== 'all') url = `/orders?status=${filter.toUpperCase()}`;
      const res = await api.get(url);
      setOrders(res.data);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filter, today]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const filters = [
    { key: 'today', label: 'Today' },
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'ready', label: 'Ready' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const totalRevenue = orders
    .filter((o) => o.payment && o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.payment?.amount || 0), 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Orders</h1>
          <p className="text-sm text-surface-400 mt-1">View and manage all restaurant orders.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-brand-400">₹{totalRevenue.toFixed(0)}</p>
          <p className="text-xs text-surface-400">Revenue ({orders.length} orders)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
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
          <Loader2 className="w-7 h-7 animate-spin text-brand-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <ShoppingCart className="w-12 h-12 text-surface-700 mx-auto mb-3" />
          <p className="text-surface-400">No orders found</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Type</th>
                <th>Items</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <td className="font-bold text-surface-100">#{order.orderNumber}</td>
                  <td>
                    {order.type === 'DINE_IN' ? (
                      <span className="flex items-center gap-1 text-surface-400 text-sm">
                        <TableProperties className="w-3 h-3" /> T{order.table?.number}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-blue-400 text-sm">
                        <Truck className="w-3 h-3" /> Delivery
                      </span>
                    )}
                  </td>
                  <td className="text-surface-400">{order.orderItems.length} items</td>
                  <td className="text-surface-300 text-sm">{order.customer?.name || '—'}</td>
                  <td className="font-bold text-brand-400">₹{order.total}</td>
                  <td>
                    {order.payment ? (
                      <span className={`text-xs font-semibold ${
                        order.payment.method === 'CASH' ? 'text-emerald-400' :
                        order.payment.method === 'ONLINE' ? 'text-blue-400' : 'text-amber-400'
                      }`}>
                        {order.payment.method}
                      </span>
                    ) : (
                      <span className="text-surface-600 text-xs">Unpaid</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge text-xs ${STATUS_COLORS[order.status] || ''}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="text-surface-500 text-xs">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content glass-card p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-surface-100">Order #{selectedOrder.orderNumber}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-surface-500 hover:text-surface-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2">
              {selectedOrder.orderItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-1 border-b border-surface-800">
                  <div>
                    <span className="text-surface-200">{item.quantity}× {item.menuItem?.name}</span>
                    {item.notes && <p className="text-xs text-surface-500 italic">{item.notes}</p>}
                  </div>
                  <span className="text-brand-400 font-semibold">₹{item.totalPrice}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between font-bold text-surface-100">
              <span>Total</span>
              <span className="text-brand-400">₹{selectedOrder.total}</span>
            </div>
            {selectedOrder.notes && (
              <p className="mt-2 text-xs text-surface-400 italic">📝 {selectedOrder.notes}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
