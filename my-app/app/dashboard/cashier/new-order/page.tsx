'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import type { Category, MenuItem, Table, Customer, CreateOrderDto, Order } from '@/types';
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Search,
  ChefHat,
  MapPin,
  Truck,
  Users,
  CreditCard,
  Loader2,
  CheckCircle,
  TableProperties,
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
  getDemoOrders,
  saveDemoOrders,
} from '@/lib/mockData';

export default function NewOrderPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Data
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [tables, setTables] = useState<Table[]>(MOCK_TABLES);
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Order config
  const [orderType, setOrderType] = useState<'DINE_IN' | 'DELIVERY'>('DINE_IN');
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');

  // Menu
  const [activeCategory, setActiveCategory] = useState(MOCK_CATEGORIES[0]?.id || '');
  const [menuSearch, setMenuSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catRes, tableRes] = await Promise.all([
        api.get('/menu/categories'),
        api.get('/tables'),
      ]);
      if (catRes.data?.length > 0) setCategories(catRes.data);
      if (tableRes.data?.length > 0) setTables(tableRes.data);
      if (catRes.data?.length > 0) {
        setActiveCategory(catRes.data[0].id);
      }
    } catch {
      // Fallback to official offline mock menu and tables
      setCategories(MOCK_CATEGORIES);
      setTables(MOCK_TABLES);
      setCustomers(MOCK_CUSTOMERS);
      if (MOCK_CATEGORIES.length > 0) {
        setActiveCategory(MOCK_CATEGORIES[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const searchCustomers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setCustomerResults([]);
      return;
    }
    try {
      const res = await api.get(`/customers?search=${query}`);
      setCustomerResults(res.data.slice(0, 5));
    } catch {
      setCustomerResults([]);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchCustomers(customerSearch), 300);
    return () => clearTimeout(t);
  }, [customerSearch, searchCustomers]);

  const selectedCustomerData = customers.find((c) => c.id === selectedCustomer) ||
    customerResults.find((c) => c.id === selectedCustomer);

  const allMenuItems = categories.flatMap((c) => c.menuItems || []);
  const displayItems = (() => {
    let items = activeCategory === 'all'
      ? allMenuItems
      : (categories.find((c) => c.id === activeCategory)?.menuItems || []);
    if (menuSearch) {
      items = allMenuItems.filter((item) =>
        item.name.toLowerCase().includes(menuSearch.toLowerCase()),
      );
    }
    return items;
  })();

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

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.menuItem.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    if (orderType === 'DINE_IN' && !selectedTable) {
      alert('Please select a table for dine-in orders');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateOrderDto = {
        type: orderType,
        tableId: orderType === 'DINE_IN' ? selectedTable : undefined,
        customerId: selectedCustomer || undefined,
        items: cart.map((c) => ({
          menuItemId: c.menuItem.id,
          quantity: c.quantity,
          notes: c.notes || undefined,
        })),
        notes: orderNotes || undefined,
        deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : undefined,
        deliveryPhone: orderType === 'DELIVERY' ? deliveryPhone : undefined,
      };

      await api.post('/orders', payload);
      setSuccess(true);
      setTimeout(() => router.push('/dashboard/cashier/orders'), 1500);
    } catch {
      // In demo mode without backend, create local order
      const existing = getDemoOrders();
      const newOrderNum = 100 + existing.length + 1;
      const subtotal = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0);
      const newDemoOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: newOrderNum,
        type: orderType,
        status: 'PREPARING',
        tableId: selectedTable || undefined,
        table: tables.find((t) => t.id === selectedTable),
        subtotal,
        total: subtotal,
        notes: orderNotes || undefined,
        createdBy: user?.id || 'demo-cashier-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        orderItems: cart.map((c, idx) => ({
          id: `oi-${Date.now()}-${idx}`,
          orderId: `ord-${Date.now()}`,
          menuItemId: c.menuItem.id,
          menuItem: c.menuItem,
          quantity: c.quantity,
          unitPrice: c.menuItem.price,
          totalPrice: c.menuItem.price * c.quantity,
          kitchen: c.menuItem.kitchen,
          kitchenStatus: 'PREPARING',
          notes: c.notes || undefined,
        })),
        kitchenOrders: [
          { id: `ko-${Date.now()}-1`, orderId: `ord-${Date.now()}`, kitchen: 'KITCHEN_1', status: 'PREPARING' },
          { id: `ko-${Date.now()}-2`, orderId: `ord-${Date.now()}`, kitchen: 'KITCHEN_2', status: 'PREPARING' },
        ],
      };
      saveDemoOrders([newDemoOrder, ...existing]);
      setSuccess(true);
      setTimeout(() => router.push('/dashboard/cashier/orders'), 1500);
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <p className="text-xl font-bold text-surface-100">Order Created!</p>
          <p className="text-surface-400 text-sm mt-1">Redirecting to orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">New Order</h1>
        <p className="text-sm text-surface-400 mt-1">Select items and configure the order.</p>
      </div>

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
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {tables
                    .filter((t) => t.status === 'AVAILABLE' || t.id === selectedTable)
                    .map((table) => (
                      <button
                        key={table.id}
                        onClick={() => setSelectedTable(table.id)}
                        className={`py-3 rounded-xl text-sm font-bold transition-all ${
                          selectedTable === table.id
                            ? 'bg-brand-500 text-white'
                            : table.status === 'OCCUPIED'
                            ? 'bg-red-500/10 border border-red-500/30 text-red-400 cursor-not-allowed'
                            : 'bg-surface-800/50 border border-surface-700/50 text-surface-300 hover:border-brand-500/40'
                        }`}
                        disabled={table.status === 'OCCUPIED' && selectedTable !== table.id}
                      >
                        T{table.number}
                      </button>
                    ))}
                </div>
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
                  selectedCustomerData
                    ? `${selectedCustomerData.name}${selectedCustomerData.mobile ? ` (${selectedCustomerData.mobile})` : ''}`
                    : customerSearch
                }
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setSelectedCustomer('');
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
              />
              {selectedCustomer && (
                <button
                  onClick={() => { setSelectedCustomer(''); setCustomerSearch(''); }}
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
                        setShowCustomerDropdown(false);
                      }}
                    >
                      <p className="font-medium text-surface-200">{c.name}</p>
                      {c.mobile && <p className="text-surface-500 text-xs">{c.mobile}</p>}
                      {c.creditBalance > 0 && (
                        <p className="text-amber-400 text-xs">
                          Credit Balance: ₹{c.creditBalance}
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
                      <p className="text-xs text-brand-400 font-bold mt-1">₹{item.price}</p>
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
                    <div key={item.menuItem.id} className="flex items-center gap-3 p-2 rounded-xl bg-surface-800/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-200 truncate">
                          {item.menuItem.name}
                        </p>
                        <p className="text-xs text-brand-400">
                          ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQty(item.menuItem.id, -1)}
                          className="w-6 h-6 rounded-lg bg-surface-700 flex items-center justify-center hover:bg-surface-600 transition-colors"
                        >
                          <Minus className="w-3 h-3 text-surface-300" />
                        </button>
                        <span className="text-sm font-bold text-surface-200 w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.menuItem.id, 1)}
                          className="w-6 h-6 rounded-lg bg-surface-700 flex items-center justify-center hover:bg-surface-600 transition-colors"
                        >
                          <Plus className="w-3 h-3 text-surface-300" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.menuItem.id)}
                          className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors ml-1"
                        >
                          <X className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
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
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-surface-400">Subtotal</span>
                    <span className="font-semibold text-surface-100">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold mb-4">
                    <span className="text-surface-200">Total</span>
                    <span className="text-brand-400 text-lg">₹{cartTotal.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting || cart.length === 0}
                    className="btn-primary w-full flex items-center justify-center gap-2"
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
