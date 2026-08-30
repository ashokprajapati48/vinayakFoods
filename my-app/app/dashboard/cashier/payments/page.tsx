'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import api, { apiErrorMessage } from '@/lib/api';
import { useOrderEvents } from '@/lib/realtime';
import { formatMoney, getOrderStatusLabel } from '@/lib/utils';
import type { Order, Payment } from '@/types';
import ThermalReceiptModal from '@/components/receipts/ThermalReceiptModal';
import {
  CreditCard,
  CheckCircle,
  Loader2,
  Banknote,
  Smartphone,
  Wallet,
  Clock,
  AlertTriangle,
  Printer,
} from 'lucide-react';

export default function CashierPaymentsPage() {
  const searchParams = useSearchParams();
  const preselectedOrderId = searchParams.get('orderId');

  const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE' | 'CREDIT'>('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPaidOrder, setLastPaidOrder] = useState<Order | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const today = (() => {
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0];
      })();

      const [ordersRes, paymentsRes] = await Promise.all([
        api.get<Order[]>(`/orders?date=${today}`),
        api.get<Payment[]>(`/payments?date=${today}`),
      ]);

      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      setUnpaidOrders(
        orders.filter((o) => !o.payment && o.status !== 'CANCELLED'),
      );
      setRecentPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);

      if (preselectedOrderId) {
        const order = orders.find((o) => o.id === preselectedOrderId);
        if (order) setSelectedOrder(order);
      }
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load orders and payments'));
    } finally {
      setLoading(false);
    }
  }, [preselectedOrderId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Keep the pending list in step with the kitchen and other terminals.
  useOrderEvents({
    onNewOrder: () => loadData(),
    onStatusUpdate: () => loadData(),
    onPayment: () => loadData(),
    onReconnect: () => loadData(),
  });

  const handlePayment = async () => {
    if (!selectedOrder) return;
    setProcessing(true);
    setSuccess(false);
    setError(null);
    try {
      await api.post('/payments', {
        orderId: selectedOrder.id,
        amount: selectedOrder.total,
        method: paymentMethod,
        transactionId: transactionId.trim() || undefined,
      });
      setLastPaidOrder(selectedOrder);
      setSuccess(true);
      setSelectedOrder(null);
      setTransactionId('');
      loadData();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Payment failed'));
    } finally {
      setProcessing(false);
    }
  };

  const methodConfig = [
    { key: 'CASH' as const, label: 'Cash', icon: <Banknote className="w-4 h-4" />, color: 'text-emerald-400' },
    { key: 'ONLINE' as const, label: 'Online', icon: <Smartphone className="w-4 h-4" />, color: 'text-blue-400' },
    { key: 'CREDIT' as const, label: 'Credit', icon: <Wallet className="w-4 h-4" />, color: 'text-amber-400' },
  ];

  return (
    <>
      <div className="space-y-4 animate-fade-in">
        <div>
        <h1 className="text-2xl font-bold text-surface-100">Payments</h1>
        <p className="text-sm text-surface-400 mt-1">Process payments for completed orders.</p>
      </div>

      {success && (
        <div className="glass-card p-4 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-emerald-400 font-medium">
              Payment recorded. Dine-in tables are freed automatically once the order is
              served.
            </p>
          </div>
          {lastPaidOrder && (
            <button
              onClick={() => setShowReceipt(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'rgba(249,115,22,0.15)',
                border: '1px solid rgba(249,115,22,0.4)',
                color: '#fb923c',
              }}
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="glass-card p-3 flex items-center gap-2 border border-red-500/30 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Unpaid Orders */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider">
            Pending Payment ({unpaidOrders.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
            </div>
          ) : unpaidOrders.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-surface-400 text-sm">All orders paid!</p>
            </div>
          ) : (
            unpaidOrders.map((order) => (
              <div
                key={order.id}
                className={`glass-card p-4 cursor-pointer transition-all ${
                  selectedOrder?.id === order.id
                    ? 'border border-brand-500/50'
                    : 'hover:border-surface-600'
                }`}
                onClick={() => { setSelectedOrder(order); setSuccess(false); }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-surface-100">#{order.orderNumber}</p>
                  <p className="font-bold text-brand-400">{formatMoney(order.total)}</p>
                </div>
                <p className="text-xs text-surface-400">
                  {order.type === 'DINE_IN' ? `Table ${order.table?.number ?? '—'}` : 'Delivery'}
                  {order.customer ? ` • ${order.customer.name}` : ''}
                </p>
                <p className="text-xs text-surface-500 mt-1">
                  {order.orderItems.length} items ·{' '}
                  {getOrderStatusLabel(order.status, order.type)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Payment Form */}
        <div>
          {selectedOrder ? (
            <div className="glass-card p-5 sticky top-20">
              <h2 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-400" />
                Process Payment
              </h2>

              <div className="bg-surface-800/50 rounded-xl p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-surface-400 text-sm">Order #</span>
                  <span className="font-bold text-surface-100">#{selectedOrder.orderNumber}</span>
                </div>
                {selectedOrder.orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span className="text-surface-300">{item.quantity}× {item.menuItem?.name}</span>
                    <span className="text-surface-400">{formatMoney(item.totalPrice)}</span>
                  </div>
                ))}
                <div className="border-t border-surface-700/50 pt-2 mt-2 flex justify-between font-bold">
                  <span className="text-surface-200">Total</span>
                  <span className="text-brand-400 text-lg">{formatMoney(selectedOrder.total)}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-surface-400 mb-2 uppercase tracking-wider">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {methodConfig.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setPaymentMethod(m.key)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                        paymentMethod === m.key
                          ? `bg-surface-700 border border-surface-500 ${m.color}`
                          : 'bg-surface-800/50 border border-surface-700/50 text-surface-400 hover:text-surface-300'
                      }`}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'ONLINE' && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="UPI/Reference ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                </div>
              )}

              {paymentMethod === 'CREDIT' && selectedOrder.customer && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <p className="text-xs text-amber-400">
                    Credit balance will be added to <strong>{selectedOrder.customer.name}</strong>&apos;s account.
                    Current balance: {formatMoney(selectedOrder.customer.creditBalance)}
                  </p>
                </div>
              )}

              {paymentMethod === 'CREDIT' && !selectedOrder.customer && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <p className="text-xs text-red-400">
                    Credit payment requires a customer to be assigned to this order.
                  </p>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={processing || (paymentMethod === 'CREDIT' && !selectedOrder.customer)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {processing ? 'Processing...' : `Collect ${formatMoney(selectedOrder.total)}`}
              </button>
            </div>
          ) : (
            <div className="glass-card p-10 text-center">
              <CreditCard className="w-12 h-12 text-surface-700 mx-auto mb-3" />
              <p className="text-surface-400 text-sm">
                Select an order from the left to process payment.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-3">
            Today&apos;s Payments
          </h2>
          <div className="glass-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="font-medium text-surface-200">
                      #{payment.order?.orderNumber || '—'}
                    </td>
                    <td className="text-brand-400 font-bold">{formatMoney(payment.amount)}</td>
                    <td>
                      <span className={`text-xs font-semibold ${
                        payment.method === 'CASH' ? 'text-emerald-400' :
                        payment.method === 'ONLINE' ? 'text-blue-400' : 'text-amber-400'
                      }`}>
                        {payment.method}
                      </span>
                    </td>
                    <td className="text-surface-500 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* Thermal Receipt Modal */}
      {showReceipt && lastPaidOrder && (
        <ThermalReceiptModal
          order={lastPaidOrder}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </>
  );
}
