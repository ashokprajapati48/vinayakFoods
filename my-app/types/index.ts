// ──────────────────────────────────────────────
// Shared TypeScript Types
// ──────────────────────────────────────────────

export type Role = 'ADMIN' | 'CASHIER' | 'KITCHEN1' | 'KITCHEN2' | 'WAITER';

export type OrderType = 'DINE_IN' | 'DELIVERY';
export type OrderStatus = 'NEW' | 'PREPARING' | 'READY' | 'COLLECTED' | 'DELIVERED' | 'CANCELLED';
export type KitchenStatus = 'NEW' | 'PREPARING' | 'READY';
export type Kitchen = 'KITCHEN_1' | 'KITCHEN_2';
export type PaymentMethod = 'CASH' | 'ONLINE' | 'CREDIT';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
export type CreditType = 'DEBIT' | 'CREDIT';
export type StaffStatus = 'ACTIVE' | 'INACTIVE';
export type DeliveryStatus = 'PENDING' | 'HANDED_TO_DELIVERY' | 'DELIVERED';

// ──────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: Role;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ──────────────────────────────────────────────
// Menu
// ──────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  menuItems?: MenuItem[];
  /** Present on `GET /menu/categories/all`, which returns counts instead of items. */
  _count?: { menuItems: number };
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  kitchen: Kitchen;
  categoryId: string;
  category?: Category;
  isAvailable: boolean;
  sortOrder: number;
}

// ──────────────────────────────────────────────
// Tables
// ──────────────────────────────────────────────

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
}

// ──────────────────────────────────────────────
// Customers
// ──────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  mobile?: string;
  address?: string;
  customerType?: string;
  creditBalance: number;
  isActive: boolean;
  createdAt: string;
}

// ──────────────────────────────────────────────
// Orders
// ──────────────────────────────────────────────

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem?: MenuItem;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  kitchen: Kitchen;
  kitchenStatus: KitchenStatus;
  notes?: string;
}

export interface KitchenOrder {
  id: string;
  orderId: string;
  kitchen: Kitchen;
  status: KitchenStatus;
}

export interface Order {
  id: string;
  orderNumber: number;
  type: OrderType;
  status: OrderStatus;
  tableId?: string;
  table?: Table;
  customerId?: string;
  customer?: Customer;
  subtotal: number;
  total: number;
  notes?: string;
  createdBy: string;
  createdByUser?: User;
  orderItems: OrderItem[];
  kitchenOrders: KitchenOrder[];
  payment?: Payment;
  deliveryInfo?: DeliveryInfo;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────
// Payments
// ──────────────────────────────────────────────

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  recordedBy: string;
  createdAt: string;
  /** Included by the payments endpoints so lists can show the order/table. */
  order?: Order;
}

// ──────────────────────────────────────────────
// Delivery
// ──────────────────────────────────────────────

export interface DeliveryInfo {
  id: string;
  orderId: string;
  customerId: string;
  address: string;
  deliveryBoy?: string;
  phone?: string;
  status: DeliveryStatus;
  notes?: string;
}

// ──────────────────────────────────────────────
// Credit
// ──────────────────────────────────────────────

export interface CreditLedgerEntry {
  id: string;
  customerId: string;
  orderId?: string;
  type: CreditType;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

// ──────────────────────────────────────────────
// Expenses
// ──────────────────────────────────────────────

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  categoryId: string;
  category?: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  createdBy: string;
  createdAt: string;
}

// ──────────────────────────────────────────────
// Staff
// ──────────────────────────────────────────────

export interface Staff {
  id: string;
  name: string;
  role: string;
  contact?: string;
  salary: number;
  joiningDate: string;
  status: StaffStatus;
}

export interface SalaryPayment {
  id: string;
  staffId: string;
  staff?: Staff;
  amount: number;
  month: number;
  year: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

// ──────────────────────────────────────────────
// Create Order DTOs
// ──────────────────────────────────────────────

export interface CreateOrderItemDto {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export interface CreateOrderDto {
  type: OrderType;
  tableId?: string;
  customerId?: string;
  items: CreateOrderItemDto[];
  notes?: string;
  // Delivery-specific
  deliveryAddress?: string;
  deliveryPhone?: string;
  deliveryNotes?: string;
}

// ──────────────────────────────────────────────
// Analytics
// ──────────────────────────────────────────────

export interface DailySales {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  cashSales: number;
  onlineSales: number;
  creditSales: number;
  dineInOrders: number;
  deliveryOrders: number;
}

export interface SalesAnalytics {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  bestSellers: { name: string; quantity: number; revenue: number }[];
  leastSellers: { name: string; quantity: number; revenue: number }[];
  dineInVsDelivery: { dineIn: number; delivery: number };
  paymentBreakdown: { cash: number; online: number; credit: number };
  kitchenVolume: { kitchen1: number; kitchen2: number };
}
