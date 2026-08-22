'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleLabel } from '@/lib/utils';
import {
  UtensilsCrossed,
  LayoutDashboard,
  ShoppingCart,
  Users,
  CreditCard,
  ChefHat,
  HandPlatter,
  Receipt,
  BarChart3,
  UserCog,
  Wallet,
  ClipboardList,
  LogOut,
  Menu,
  X,
  DollarSign,
  FileText,
  Settings,
  LayoutGrid,
} from 'lucide-react';
import { useState } from 'react';
import type { Role } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const roleNavItems: Record<Role, NavItem[]> = {
  ADMIN: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Orders', href: '/dashboard/admin/orders', icon: <ShoppingCart className="w-4 h-4" /> },
    { label: 'Menu', href: '/dashboard/admin/menu', icon: <ClipboardList className="w-4 h-4" /> },
    { label: 'Tables', href: '/dashboard/admin/tables', icon: <LayoutGrid className="w-4 h-4" /> },
    { label: 'Customers', href: '/dashboard/admin/customers', icon: <Users className="w-4 h-4" /> },
    { label: 'Payments', href: '/dashboard/admin/payments', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Credit', href: '/dashboard/admin/credit', icon: <Wallet className="w-4 h-4" /> },
    { label: 'Expenses', href: '/dashboard/admin/expenses', icon: <Receipt className="w-4 h-4" /> },
    { label: 'Staff', href: '/dashboard/admin/staff', icon: <UserCog className="w-4 h-4" /> },
    { label: 'Salaries', href: '/dashboard/admin/salaries', icon: <DollarSign className="w-4 h-4" /> },
    { label: 'Reports', href: '/dashboard/admin/reports', icon: <FileText className="w-4 h-4" /> },
    { label: 'Analytics', href: '/dashboard/admin/analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Settings', href: '/dashboard/admin/settings', icon: <Settings className="w-4 h-4" /> },
  ],
  CASHIER: [
    { label: 'Dashboard', href: '/dashboard/cashier', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'New Order', href: '/dashboard/cashier/new-order', icon: <ShoppingCart className="w-4 h-4" /> },
    { label: 'Orders', href: '/dashboard/cashier/orders', icon: <ClipboardList className="w-4 h-4" /> },
    { label: 'Customers', href: '/dashboard/cashier/customers', icon: <Users className="w-4 h-4" /> },
    { label: 'Payments', href: '/dashboard/cashier/payments', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Credit', href: '/dashboard/cashier/credit', icon: <Wallet className="w-4 h-4" /> },
  ],
  KITCHEN1: [
    { label: 'Kitchen 1', href: '/dashboard/kitchen-1', icon: <ChefHat className="w-4 h-4" /> },
  ],
  KITCHEN2: [
    { label: 'Kitchen 2', href: '/dashboard/kitchen-2', icon: <ChefHat className="w-4 h-4" /> },
  ],
  WAITER: [
    { label: 'Orders', href: '/dashboard/waiter', icon: <HandPlatter className="w-4 h-4" /> },
  ],
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-surface-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const navItems = roleNavItems[user.role] || [];
  const isKitchenOrWaiter = ['KITCHEN1', 'KITCHEN2', 'WAITER'].includes(user.role);

  return (
    <div className="min-h-screen flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {!isKitchenOrWaiter && (
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface-900/95 border-r border-surface-800 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 p-5 border-b border-surface-800">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold gradient-text">RestaurantOS</h1>
              <p className="text-[10px] text-surface-500">Management System</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-surface-400 hover:text-surface-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-surface-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center border border-surface-700">
                <span className="text-sm font-bold text-brand-400">
                  {user.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-200 truncate">
                  {user.displayName}
                </p>
                <p className="text-xs text-surface-500">
                  {getRoleLabel(user.role)}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center gap-4 px-6 py-3 border-b border-surface-800 bg-surface-950/80 backdrop-blur-lg sticky top-0 z-30">
          {!isKitchenOrWaiter && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-surface-400 hover:text-surface-200"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {isKitchenOrWaiter && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold gradient-text">
                RestaurantOS
              </span>
            </div>
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800/50 border border-surface-700/50">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-surface-400">
                {getRoleLabel(user.role)}
              </span>
            </div>

            {isKitchenOrWaiter && (
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
