'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api, { apiErrorMessage, isOffline } from '@/lib/api';
import { formatMoney, toNum } from '@/lib/utils';
import type { Category, MenuItem, Table, Customer, CreateOrderDto, Order } from '@/types';
import ThermalReceiptModal from '@/components/receipts/ThermalReceiptModal';
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Search,
  ChefHat,
  Truck,
  Users,
  Loader2,
  CheckCircle,
  TableProperties,
  AlertTriangle,
  WifiOff,
  StickyNote,
  Printer,
} from 'lucide-react';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

import {
  MOCK_CATEGORIES,
  MOCK_TABLES,
  MOCK_CUSTOMERS,
  buildDemoOrder,
  getDemoOrders,
  saveDemoOrders,
  searchDemoCustomers,
} from '@/lib/mockData';

export default function NewOrderPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Order config
  const [orderType, setOrderType] = useState<'DINE_IN' | 'DELIVERY'>('DINE_IN');
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');

  // Menu
  const [activeCategory, setActiveCategory] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notesFor, setNotesFor] = useState<string | null>(null);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [pickedCustomer, setPickedCustomer] = useState<Customer | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [catRes, tableRes] = await Promise.all([
        api.get<Category[]>('/menu/categories'),
        api.get<Table[]>('/tables'),
      ]);
      const cats = (catRes.data || []).filter((c) => (c.menuItems?.length || 0) > 0);
      setCategories(cats);
      setTables(tableRes.data || []);
      setActiveCategory((current) =>
        cats.some((c) => c.id === current) ? current : cats[0]?.id || '',
      );
      setOffline(false);
      setError(null);
    } catch (err) {
      if (isOffline(err)) {
        // No server: let the counter keep taking orders on local data.
        setOffline(true);
        setError(null);
        setCategories(MOCK_CATEGORIES);
        setTables(MOCK_TABLES);
        setActiveCategory((current) => current || MOCK_CATEGORIES[0]?.id || '');
      } else {
        setError(apiErrorMessage(err, 'Could not load the menu'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const searchCustomers = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setCustomerResults([]);
        return;
      }
      try {
        const res = await api.get<Customer[]>(
          `/customers?search=${encodeURIComponent(query.trim())}`,
        );
        setCustomerResults((res.data || []).slice(0, 5));
      } catch (err) {
        setCustomerResults(isOffline(err) ? searchDemoCustomers(query) : []);
      }
    },
    [],
  );

  useEffect(() => {
    const t = setTimeout(() => searchCustomers(customerSearch), 300);
    return () => clearTimeout(t);
  }, [customerSearch, searchCustomers]);

  const allMenuItems = useMemo(
    () => categories.flatMap((c) => c.menuItems || []),
    [categories],
  );

  const displayItems = useMemo(() => {
    if (menuSearch.trim()) {
      const term = menuSearch.trim().toLowerCase();
      return allMenuItems.filter((item) => item.name.toLowerCase().includes(term));
    }
    return categories.find((c) => c.id === activeCategory)?.menuItems || [];
  }, [menuSearch, allMenuItems, categories, activeCategory]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { menuItem: item, quantity: 1, notes: '' }];
    });
  };

  const updateQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menuItem.id === itemId ? { ...c, quantity: c.quantity + delta } : c,
        )
        .filter((c) => c.quantity > 0),
    );
  };

  const setItemNotes = (itemId: string, notes: string) => {
    setCart((prev) =>
      prev.map((c) => (c.menuItem.id === itemId ? { ...c, notes } : c)),
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.menuItem.id !== itemId));
  };

  const cartTotal = cart.reduce(
    (sum, c) => sum + toNum(c.menuItem.price) * c.quantity,
    0,
  );
  const kitchenSplit = cart.reduce(
    (acc, c) => {
      if (c.menuItem.kitchen === 'KITCHEN_1') acc.k1 += c.quantity;
      else acc.k2 += c.quantity;
      return acc;
    },
    { k1: 0, k2: 0 },
  );

  const validationError = (): string | null => {
    if (cart.length === 0) return 'Add at least one item.';
    if (orderType === 'DINE_IN' && !selectedTable)
      return 'Select a table for dine-in orders.';
    if (orderType === 'DELIVERY' && !deliveryAddress.trim())
      return 'Enter a delivery address.';
    return null;
  };

  const resetForm = () => {
    setCart([]);
    setOrderNotes('');
    setSelectedTable('');
    setSelectedCustomer('');
    setPickedCustomer(null);
    setCustomerSearch('');
    setDeliveryAddress('');
    setDeliveryPhone('');
  };

  const handleSubmit = async () => {
    const invalid = validationError();
    if (invalid) {
      setError(invalid);
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: CreateOrderDto = {
      type: orderType,
      tableId: orderType === 'DINE_IN' ? selectedTable : undefined,
      customerId: selectedCustomer || undefined,
      items: cart.map((c) => ({
        menuItemId: c.menuItem.id,
        quantity: c.quantity,
        notes: c.notes.trim() || undefined,
      })),
      notes: orderNotes.trim() || undefined,
      deliveryAddress:
        orderType === 'DELIVERY' ? deliveryAddress.trim() : undefined,
      deliveryPhone:
        orderType === 'DELIVERY' && deliveryPhone.trim()
          ? deliveryPhone.trim()
          : undefined,
    };

    try {
      const res = await api.post<Order>('/orders', payload);
      setLastOrder(res.data ?? null);
      setSuccess(true);
      resetForm();
    } catch (err) {
      if (isOffline(err)) {
        // Offline: keep the ticket on this device so service is not blocked.
        const demoOrder = buildDemoOrder({
          type: orderType,
          items: cart.map((c) => ({
            menuItem: c.menuItem,
            quantity: c.quantity,
            notes: c.notes.trim() || undefined,
          })),
          table: tables.find((t) => t.id === selectedTable),
          customer:
            pickedCustomer ||
            MOCK_CUSTOMERS.find((c) => c.id === selectedCustomer) ||
            undefined,
          notes: orderNotes.trim() || undefined,
          deliveryAddress: deliveryAddress.trim() || undefined,
          deliveryPhone: deliveryPhone.trim() || undefined,
          createdBy: user?.id,
        });
        saveDemoOrders([demoOrder, ...getDemoOrders()]);
        setOffline(true);
        setLastOrder(demoOrder as unknown as Order);
        setSuccess(true);
        resetForm();
      } else {
        // Server rejected it — show why instead of pretending it worked.
        setError(apiErrorMessage(err, 'Could not place the order'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (success) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <p className="text-xl font-bold text-surface-100">Order placed! 🎉</p>
            <p className="text-surface-400 text-sm mt-1 mb-6">What would you like to do next?</p>
            <div className="flex flex-wrap justify-center gap-3">
              {lastOrder && (
                <button
                  onClick={() => setShowReceipt(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: 'rgba(249,115,22,0.15)',
                    border: '1px solid rgba(249,115,22,0.4)',
                    color: '#fb923c',
                  }}
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt / KOT
                </button>
              )}
              <button
                onClick={() => router.push('/dashboard/cashier/orders')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm btn-primary"
              >
                View Orders
              </button>
              <button
                onClick={() => setSuccess(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm btn-secondary"
              >
                New Order
              </button>
            </div>
          </div>
        </div>
        {showReceipt && lastOrder && (
          <ThermalReceiptModal
            order={lastOrder}
            cashierName={user?.displayName}
            onClose={() => setShowReceipt(false)}
          />
        )}
      </>
    );
  }

  const availableTables = tables.filter(
    (t) => t.status === 'AVAILABLE' || t.id === selectedTable,
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">New Order</h1>
        <p className="text-sm text-surface-400 mt-1">Select items and configure the order.</p>
      </div>

      {offline && (
        <div className="glass-card p-3 flex items-center gap-2 border border-amber-500/30 text-amber-400 text-sm">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          Server unreachable — running on the offline menu. Orders placed now stay on
          this device only.
        </div>
      )}

      {error && (
        <div className="glass-card p-3 flex items-center gap-2 border border-red-500/30 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left: Order Config + Menu */}
        <div className="xl:col-span-2 space-y-4">
          {/* Order Type */}
          <div className="glass-card p-4">
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setOrderType('DINE_IN')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                  orderType === 'DINE_IN'
                    ? 'bg-brand-500/20 border border-brand-500/40 text-brand-400'
                    : 'bg-surface-800/50 border border-surface-700/50 text-surface-400 hover:text-surface-300'
                }`}
              >
                <TableProperties className="w-4 h-4" /> Dine-In
              </button>
              <button
                onClick={() => setOrderType('DELIVERY')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                  orderType === 'DELIVERY'
                    ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
                    : 'bg-surface-800/50 border border-surface-700/50 text-surface-400 hover:text-surface-300'
                }`}
              >
                <Truck className="w-4 h-4" /> Delivery
              </button>
            </div>

            {/* Table selection for dine-in */}
            {orderType === 'DINE_IN' && (
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-2 uppercase tracking-wider">
                  Select Table *
                </label>
                {availableTables.length === 0 ? (
                  <p className="text-sm text-amber-400">
                    Every table is occupied. Close a settled order (Orders → Close) or
                    free a table from Admin → Tables.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {availableTables.map((table) => (
                      <button
                        key={table.id}
                        onClick={() => setSelectedTable(table.id)}
                        className={`py-3 rounded-xl text-sm font-bold transition-all ${
                          selectedTable === table.id
                            ? 'bg-brand-500 text-white'
                            : 'bg-surface-800/50 border border-surface-700/50 text-surface-300 hover:border-brand-500/40'
                        }`}
                      >
                        T{table.number}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Delivery info */}
            {orderType === 'DELIVERY' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">
                    Delivery Address *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter delivery address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">
                    Phone
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Customer phone"
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Customer (optional) */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-surface-400" />
              <span className="text-sm font-medium text-surface-300">
                Customer (Optional)
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                className="input-field"
                placeholder="Search customer by name or phone..."
                value={
                  pickedCustomer
                    ? `${pickedCustomer.name}${pickedCustomer.mobile ? ` (${pickedCustomer.mobile})` : ''}`
                    : customerSearch
                }
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setSelectedCustomer('');
                  setPickedCustomer(null);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
              />
              {selectedCustomer && (
                <button
                  onClick={() => {
                    setSelectedCustomer('');
                    setPickedCustomer(null);
                    setCustomerSearch('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {showCustomerDropdown && customerResults.length > 0 && !selectedCustomer && (
                <div className="absolute z-10 w-full mt-1 glass-card border border-surface-700/50 rounded-xl overflow-hidden">
                  {customerResults.map((c) => (
                    <button
                      key={c.id}
                      className="w-full px-4 py-3 text-left hover:bg-surface-800/50 transition-colors text-sm"
                      onClick={() => {
                        setSelectedCustomer(c.id);
                        setPickedCustomer(c);
                        setShowCustomerDropdown(false);
                      }}
                    >
                      <p className="font-medium text-surface-200">{c.name}</p>
                      {c.mobile && <p className="text-surface-500 text-xs">{c.mobile}</p>}
                      {toNum(c.creditBalance) > 0 && (
                        <p className="text-amber-400 text-xs">
                          Outstanding credit: {formatMoney(c.creditBalance)}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Menu */}
          <div className="glass-card p-4">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
              <input
                type="text"
                className="input-field pl-10"
                placeholder="Search menu items..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
              />
            </div>

            {/* Category tabs */}
            {!menuSearch && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      activeCategory === cat.id
                        ? 'bg-brand-500/20 border border-brand-500/30 text-brand-400'
                        : 'bg-surface-800/50 border border-surface-700/50 text-surface-400 hover:text-surface-300'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Items grid */}
            {displayItems.length === 0 ? (
              <div className="text-center py-8">
                <ChefHat className="w-10 h-10 text-surface-700 mx-auto mb-2" />
                <p className="text-surface-500 text-sm">No items found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {displayItems.map((item) => {
                  const inCart = cart.find((c) => c.menuItem.id === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className={`relative p-3 rounded-xl text-left transition-all ${
                        inCart
                          ? 'bg-brand-500/10 border border-brand-500/30'
                          : 'bg-surface-800/50 border border-surface-700/50 hover:border-surface-600'
                      }`}
                    >
                      {inCart && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-[10px] font-bold text-white">
                          {inCart.quantity}
                        </div>
                      )}
                      <p className="text-sm font-semibold text-surface-200 leading-tight">{item.name}</p>
                      <p className="text-xs text-brand-400 font-bold mt-1">{formatMoney(item.price)}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block ${
                        item.kitchen === 'KITCHEN_1'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-orange-500/10 text-orange-400'
                      }`}>
                        {item.kitchen === 'KITCHEN_1' ? 'K1' : 'K2'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="xl:col-span-1">
          <div className="glass-card p-4 sticky top-20">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-brand-400" />
              <h2 className="text-lg font-semibold text-surface-100">Order Summary</h2>
              {cart.length > 0 && (
                <span className="ml-auto text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full font-bold">
                  {cart.reduce((s, c) => s + c.quantity, 0)} items
                </span>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-10 h-10 text-surface-700 mx-auto mb-2" />
                <p className="text-surface-500 text-sm">Add items to order</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.menuItem.id}
                      className="p-2 rounded-xl bg-surface-800/50 space-y-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-surface-200 truncate">
                            {item.menuItem.name}
                          </p>
                          <p className="text-xs text-brand-400">
                            {formatMoney(toNum(item.menuItem.price) * item.quantity, 2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQty(item.menuItem.id, -1)}
                            className="w-6 h-6 rounded-lg bg-surface-700 flex items-center justify-center hover:bg-surface-600 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3 text-surface-300" />
                          </button>
                          <span className="text-sm font-bold text-surface-200 w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(item.menuItem.id, 1)}
                            className="w-6 h-6 rounded-lg bg-surface-700 flex items-center justify-center hover:bg-surface-600 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3 text-surface-300" />
                          </button>
                          <button
                            onClick={() =>
                              setNotesFor(
                                notesFor === item.menuItem.id ? null : item.menuItem.id,
                              )
                            }
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ml-1 ${
                              item.notes
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
                            }`}
                            title="Add a note for the kitchen"
                          >
                            <StickyNote className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.menuItem.id)}
                            className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                            aria-label="Remove item"
                          >
                            <X className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      </div>

                      {(notesFor === item.menuItem.id || item.notes) && (
                        <input
                          type="text"
                          className="input-field text-xs py-1.5"
                          placeholder="e.g. less spicy, no onion"
                          value={item.notes}
                          onChange={(e) => setItemNotes(item.menuItem.id, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-3">
                  <textarea
                    className="input-field text-sm"
                    rows={2}
                    placeholder="Order notes (optional)..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                  />
                </div>

                <div className="mt-3 pt-3 border-t border-surface-700/50">
                  <div className="flex justify-between text-xs text-surface-500 mb-2">
                    <span>Kitchen split</span>
                    <span>
                      K1: {kitchenSplit.k1} · K2: {kitchenSplit.k2}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-surface-400">Subtotal</span>
                    <span className="font-semibold text-surface-100">
                      {formatMoney(cartTotal, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold mb-4">
                    <span className="text-surface-200">Total</span>
                    <span className="text-brand-400 text-lg">
                      {formatMoney(cartTotal, 2)}
                    </span>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting || cart.length === 0}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {submitting ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
