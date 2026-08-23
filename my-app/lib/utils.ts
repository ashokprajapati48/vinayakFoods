import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Money fields come back as numbers from the API, but the offline demo data and
 * older responses can carry strings. Coerce before any arithmetic so totals add
 * up instead of concatenating.
 */
export function toNum(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function sumBy<T>(items: T[], pick: (item: T) => unknown): number {
  return items.reduce((total, item) => total + toNum(pick(item)), 0);
}

export function formatCurrency(amount: unknown): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(toNum(amount));
}

/** ₹1,250 — same grouping as formatCurrency without the currency symbol styling. */
export function formatMoney(amount: unknown, decimals = 0): string {
  return `₹${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(toNum(amount))}`;
}

/** "Just now" / "12m" / "1h 05m" since the given timestamp. */
export function formatElapsed(since: string | Date): string {
  const ms = Date.now() - new Date(since).getTime();
  const mins = Math.floor(ms / 60000);
  if (!Number.isFinite(mins) || mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${String(mins % 60).padStart(2, '0')}m`;
}

export function minutesSince(since: string | Date): number {
  const mins = Math.floor((Date.now() - new Date(since).getTime()) / 60000);
  return Number.isFinite(mins) && mins > 0 ? mins : 0;
}


export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getKitchenLabel(kitchen: string): string {
  return kitchen === 'KITCHEN_1'
    ? 'Kitchen 1 (Non-Veg, Chinese, Gravies, Biryani)'
    : 'Kitchen 2 (Breakfast, Paratha, Veg Thali, Drinks)';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    NEW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    PREPARING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    READY: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    COLLECTED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    DELIVERED: 'bg-green-500/20 text-green-400 border-green-500/30',
    CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
    PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    COMPLETED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    AVAILABLE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    OCCUPIED: 'bg-red-500/20 text-red-400 border-red-500/30',
    RESERVED: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

/**
 * The schema calls a finished order DELIVERED; for a dine-in ticket that reads
 * oddly, so label it by what actually happened.
 */
export function getOrderStatusLabel(status: string, type?: string): string {
  if (status === 'DELIVERED') return type === 'DINE_IN' ? 'Completed' : 'Delivered';
  if (status === 'COLLECTED') return type === 'DINE_IN' ? 'Served' : 'Picked up';
  const labels: Record<string, string> = {
    NEW: 'New',
    PREPARING: 'Preparing',
    READY: 'Ready',
    CANCELLED: 'Cancelled',
  };
  return labels[status] || status;
}

/** Orders that are still moving through the kitchen/service flow. */
export const ACTIVE_ORDER_STATUSES = ['NEW', 'PREPARING', 'READY', 'COLLECTED'];

export function getRolePath(role: string): string {
  const paths: Record<string, string> = {
    ADMIN: '/dashboard/admin',
    CASHIER: '/dashboard/cashier',
    KITCHEN1: '/dashboard/kitchen-1',
    KITCHEN2: '/dashboard/kitchen-2',
    WAITER: '/dashboard/waiter',
  };
  return paths[role] || '/';
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: 'Administrator',
    CASHIER: 'Cashier',
    KITCHEN1: 'Kitchen 1',
    KITCHEN2: 'Kitchen 2',
    WAITER: 'Waiter',
  };
  return labels[role] || role;
}
