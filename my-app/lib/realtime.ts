'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Order, Payment, Table } from '@/types';
import { connectSocket, isSocketConnected } from './socket';

export interface OrderEventHandlers {
  onNewOrder?: (order: Order) => void;
  onStatusUpdate?: (order: Order) => void;
  onPayment?: (payment: Payment) => void;
  onTableUpdate?: (table: Table) => void;
  /** Fired after a dropped connection comes back — reload, the screen is stale. */
  onReconnect?: () => void;
}

/** Live connection flag, read straight from the socket rather than mirrored in state. */
function useSocketConnected(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const socket = connectSocket();
      socket.on('connect', onChange);
      socket.on('disconnect', onChange);
      return () => {
        socket.off('connect', onChange);
        socket.off('disconnect', onChange);
      };
    },
    () => isSocketConnected(),
    () => false,
  );
}

/**
 * Subscribes to the shared Socket.IO connection for the lifetime of a screen.
 *
 * Handlers are kept in a ref so callers can pass inline closures without
 * re-subscribing on every render, and the returned flag lets a screen show
 * whether it is really receiving live updates.
 */
export function useOrderEvents(handlers: OrderEventHandlers): boolean {
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  const connected = useSocketConnected();

  useEffect(() => {
    const socket = connectSocket();

    const handleNewOrder = (order: Order) => latest.current.onNewOrder?.(order);
    const handleStatusUpdate = (order: Order) =>
      latest.current.onStatusUpdate?.(order);
    const handlePayment = (payment: Payment) => latest.current.onPayment?.(payment);
    const handleTable = (table: Table) => latest.current.onTableUpdate?.(table);
    const handleConnect = () => latest.current.onReconnect?.();

    socket.on('order:new', handleNewOrder);
    socket.on('order:statusUpdate', handleStatusUpdate);
    socket.on('payment:recorded', handlePayment);
    socket.on('table:statusUpdate', handleTable);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:statusUpdate', handleStatusUpdate);
      socket.off('payment:recorded', handlePayment);
      socket.off('table:statusUpdate', handleTable);
      socket.off('connect', handleConnect);
    };
  }, []);

  return connected;
}

/**
 * Re-renders on an interval so "12m ago" labels keep counting without a refetch.
 */
export function useTicker(everyMs = 30000): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return tick;
}

/** Short chime for new kitchen tickets — no audio asset required. */
export function playNewOrderChime() {
  if (typeof window === 'undefined') return;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    const now = ctx.currentTime;
    // Two short notes, quiet enough for a busy kitchen but audible.
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.18);
    });

    setTimeout(() => void ctx.close(), 800);
  } catch {
    // Autoplay policy or unsupported browser — the visual cue still works.
  }
}
