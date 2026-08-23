'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { apiErrorMessage, isOffline } from '@/lib/api';
import { getDemoOrders, saveDemoOrders } from '@/lib/mockData';
import { playNewOrderChime, useOrderEvents, useTicker } from '@/lib/realtime';
import { formatElapsed, minutesSince } from '@/lib/utils';
import type { Kitchen, KitchenStatus, Order } from '@/types';
import {
  AlertTriangle,
  CheckCircle,
  ChefHat,
  Clock,
  Loader2,
  PlayCircle,
  RefreshCw,
  TableProperties,
  Truck,
  Volume2,
  VolumeX,
  WifiOff,
} from 'lucide-react';

/** An order as one kitchen station sees it: only its items, only its status. */
interface Ticket extends Order {
  kitchenStatus: KitchenStatus;
}

const URGENT_AFTER_MINUTES = 15;
const CLOSED_STATUSES = ['READY', 'COLLECTED', 'DELIVERED', 'CANCELLED'];

function toTicket(order: Order, kitchen: Kitchen): Ticket {
  const kitchenStatus =
    order.kitchenOrders?.find((ko) => ko.kitchen === kitchen)?.status || 'NEW';
  return {
    ...order,
    // Socket payloads carry both stations' items; keep only ours.
    orderItems: (order.orderItems || []).filter((item) => item.kitchen === kitchen),
    kitchenStatus,
  };
}

/** Does this station still have work to do on this order? */
function isOpenForKitchen(order: Order, kitchen: Kitchen): boolean {
  if (CLOSED_STATUSES.includes(order.status)) return false;

  const station = order.kitchenOrders?.find((ko) => ko.kitchen === kitchen);
  if (station) return station.status !== 'READY';

  // No kitchenOrders in the payload (offline demo data) → fall back to items.
  return (order.orderItems || []).some((item) => item.kitchen === kitchen);
}

interface KitchenDisplayProps {
  kitchen: Kitchen;
  label: string;
  subtitle: string;
  /** Tailwind accent colour family used for this station's chrome. */
  accent: 'amber' | 'orange';
}

const ACCENTS = {
  amber: {
    iconWrap: 'from-amber-500/20 to-amber-600/10 text-amber-400',
    chipDot: 'bg-amber-400',
    chip: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    qty: 'bg-amber-500/20 text-amber-400',
    note: 'text-amber-300',
    startBtn:
      'bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30',
    spinner: 'text-amber-400',
    badge: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  },
  orange: {
    iconWrap: 'from-orange-500/20 to-orange-600/10 text-orange-400',
    chipDot: 'bg-orange-400',
    chip: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    qty: 'bg-orange-500/20 text-orange-400',
    note: 'text-orange-300',
    startBtn:
      'bg-orange-500/20 border border-orange-500/40 text-orange-400 hover:bg-orange-500/30',
    spinner: 'text-orange-400',
    badge: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  },
} as const;

export default function KitchenDisplay({
  kitchen,
  label,
  subtitle,
  accent,
}: KitchenDisplayProps) {
  const theme = ACCENTS[accent];

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);

  // Re-render every 15s so elapsed timers and the urgency highlight stay honest.
  useTicker(15000);

  const loadOrders = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (opts.silent) setRefreshing(true);
      try {
        const res = await api.get<Order[]>(`/orders/kitchen/${kitchen}`);
        const list = Array.isArray(res.data) ? res.data : [];
        setTickets(
          list
            .filter((order) => isOpenForKitchen(order, kitchen))
            .map((order) => toTicket(order, kitchen)),
        );
        setError(null);
        setOffline(false);
      } catch (err) {
        if (isOffline(err)) {
          // No server: fall back to the local demo queue and say so.
          setOffline(true);
          setError(null);
          setTickets(
            getDemoOrders()
              .filter((order) => isOpenForKitchen(order, kitchen))
              .map((order) => toTicket(order, kitchen)),
          );
        } else {
          setOffline(false);
          setError(apiErrorMessage(err, 'Could not load the kitchen queue'));
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [kitchen],
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const upsertTicket = useCallback(
    (order: Order, opts: { chime?: boolean } = {}) => {
      if (!isOpenForKitchen(order, kitchen)) {
        setTickets((prev) => prev.filter((t) => t.id !== order.id));
        return;
      }

      const ticket = toTicket(order, kitchen);
      if (ticket.orderItems.length === 0) return; // nothing for this station

      setTickets((prev) => {
        const existing = prev.findIndex((t) => t.id === ticket.id);
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = ticket;
          return next;
        }
        if (opts.chime && soundOn) playNewOrderChime();
        // Oldest first, matching the API ordering.
        return [...prev, ticket].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
    },
    [kitchen, soundOn],
  );

  const live = useOrderEvents({
    onNewOrder: (order) => upsertTicket(order, { chime: true }),
    onStatusUpdate: (order) => upsertTicket(order),
    onReconnect: () => loadOrders({ silent: true }),
  });

  const updateStatus = async (orderId: string, status: KitchenStatus) => {
    setUpdatingId(orderId);
    const snapshot = tickets;

    // Optimistic: READY leaves this station's queue, PREPARING just changes state.
    setTickets((prev) =>
      status === 'READY'
        ? prev.filter((t) => t.id !== orderId)
        : prev.map((t) => (t.id === orderId ? { ...t, kitchenStatus: status } : t)),
    );

    try {
      await api.put(`/orders/${orderId}/kitchen/${kitchen}/status`, { status });
      setError(null);
    } catch (err) {
      if (isOffline(err)) {
        // Offline demo mode: persist locally so the flow can still be walked through.
        const demo = getDemoOrders().map((order) => {
          if (order.id !== orderId) return order;
          const kitchenOrders = (order.kitchenOrders || []).map((ko) =>
            ko.kitchen === kitchen ? { ...ko, status } : ko,
          );
          const orderItems = (order.orderItems || []).map((item) =>
            item.kitchen === kitchen ? { ...item, kitchenStatus: status } : item,
          );
          const allReady = kitchenOrders.every((ko) => ko.status === 'READY');
          return {
            ...order,
            kitchenOrders,
            orderItems,
            status: allReady ? ('READY' as const) : ('PREPARING' as const),
            updatedAt: new Date().toISOString(),
          };
        });
        saveDemoOrders(demo);
        setOffline(true);
      } else {
        setTickets(snapshot); // roll back — the server rejected it
        setError(apiErrorMessage(err, 'Could not update this ticket'));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const newCount = tickets.filter((t) => t.kitchenStatus === 'NEW').length;
  const preparingCount = tickets.filter((t) => t.kitchenStatus === 'PREPARING').length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center ${theme.iconWrap}`}
          >
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-100">{label}</h1>
            <p className="text-sm text-surface-400">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              {newCount} New
            </span>
            <span
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${theme.chip}`}
            >
              <span className={`w-2 h-2 rounded-full ${theme.chipDot}`} />
              {preparingCount} Preparing
            </span>
          </div>

          <span
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border ${
              live
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-surface-800/50 border-surface-700/50 text-surface-500'
            }`}
            title={live ? 'Receiving live updates' : 'Not connected — reconnecting'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                live ? 'bg-emerald-400 animate-pulse' : 'bg-surface-500'
              }`}
            />
            {live ? 'Live' : 'Offline'}
          </span>

          <button
            onClick={() => setSoundOn((s) => !s)}
            className="p-2 rounded-lg bg-surface-800/50 border border-surface-700/50 text-surface-400 hover:text-surface-200"
            title={soundOn ? 'Mute new order chime' : 'Unmute new order chime'}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => loadOrders({ silent: true })}
            className="p-2 rounded-lg bg-surface-800/50 border border-surface-700/50 text-surface-400 hover:text-surface-200"
            title="Refresh queue"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {offline && (
        <div className="glass-card p-3 flex items-center gap-2 border border-amber-500/30 text-amber-400 text-sm">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          Server unreachable — showing the offline demo queue. Changes stay on this
          device until the API is back.
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
          <Loader2 className={`w-8 h-8 animate-spin ${theme.spinner}`} />
        </div>
      ) : tickets.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <ChefHat className="w-16 h-16 text-surface-700 mx-auto mb-4" />
          <p className="text-lg font-medium text-surface-400">No active orders</p>
          <p className="text-sm text-surface-500 mt-1">
            New orders appear here automatically
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tickets.map((ticket) => {
            const isNew = ticket.kitchenStatus === 'NEW';
            const waited = minutesSince(ticket.createdAt);
            const isUrgent = waited >= URGENT_AFTER_MINUTES;
            const busy = updatingId === ticket.id;

            return (
              <div
                key={ticket.id}
                className={`kitchen-card glass-card p-4 border ${
                  isUrgent
                    ? 'border-red-500/40'
                    : isNew
                      ? 'border-blue-500/40 pulse-new'
                      : 'border-surface-700/40'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xl font-bold text-surface-100">
                      #{ticket.orderNumber}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                      <Clock
                        className={`w-3 h-3 ${isUrgent ? 'text-red-400' : 'text-surface-500'}`}
                      />
                      <span
                        className={
                          isUrgent ? 'text-red-400 font-semibold' : 'text-surface-500'
                        }
                      >
                        {formatElapsed(ticket.createdAt)}
                        {isUrgent ? ' ⚠️' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`status-badge ${
                        isNew
                          ? 'text-blue-400 bg-blue-500/10 border-blue-500/30'
                          : theme.badge
                      }`}
                    >
                      {isNew ? 'NEW' : 'PREPARING'}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-surface-500">
                      {ticket.type === 'DINE_IN' ? (
                        <>
                          <TableProperties className="w-3 h-3" />
                          Table {ticket.table?.number ?? '—'}
                        </>
                      ) : (
                        <>
                          <Truck className="w-3 h-3" /> Delivery
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items for this station */}
                <div className="space-y-2 mb-4">
                  {ticket.orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-2 rounded-xl bg-surface-800/50"
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${theme.qty}`}
                      >
                        <span className="text-sm font-bold">{item.quantity}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-surface-200">
                          {item.menuItem?.name || 'Item'}
                        </p>
                        {item.notes && (
                          <p className={`text-xs italic mt-0.5 ${theme.note}`}>
                            📝 {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {ticket.notes && (
                  <div className="mb-3 p-2 rounded-lg bg-surface-800/50 text-xs text-surface-400 italic">
                    Note: {ticket.notes}
                  </div>
                )}

                <button
                  onClick={() => updateStatus(ticket.id, isNew ? 'PREPARING' : 'READY')}
                  disabled={busy}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 ${
                    isNew
                      ? theme.startBtn
                      : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                  }`}
                >
                  {busy ? (
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
