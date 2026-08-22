import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
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
