import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayOrders,
      todayRevenue,
      totalCustomers,
      pendingOrders,
      kitchen1Active,
      kitchen2Active,
      readyOrders,
      kitchen1Done,
      kitchen2Done,
      tables,
      unpaidOrders,
    ] = await Promise.all([
      this.prisma.order.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),
      this.prisma.payment.aggregate({
        where: {
          createdAt: { gte: today, lt: tomorrow },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      this.prisma.customer.count({ where: { isActive: true } }),
      this.prisma.order.count({
        where: { status: { in: ['NEW', 'PREPARING'] } },
      }),
      this.prisma.kitchenOrder.count({
        where: { kitchen: 'KITCHEN_1', status: { in: ['NEW', 'PREPARING'] } },
      }),
      this.prisma.kitchenOrder.count({
        where: { kitchen: 'KITCHEN_2', status: { in: ['NEW', 'PREPARING'] } },
      }),
      this.prisma.order.count({ where: { status: 'READY' } }),
      this.prisma.kitchenOrder.count({
        where: {
          kitchen: 'KITCHEN_1',
          status: 'READY',
          order: { createdAt: { gte: today, lt: tomorrow } },
        },
      }),
      this.prisma.kitchenOrder.count({
        where: {
          kitchen: 'KITCHEN_2',
          status: 'READY',
          order: { createdAt: { gte: today, lt: tomorrow } },
        },
      }),
      this.prisma.table.groupBy({ by: ['status'], _count: { id: true } }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: today, lt: tomorrow },
          payment: null,
          status: { notIn: ['CANCELLED'] },
        },
      }),
    ]);

    const tableCount = (status: string) =>
      tables.find((t) => t.status === status)?._count.id || 0;

    return {
      todayOrders,
      todayRevenue: Number(todayRevenue._sum.amount) || 0,
      totalCustomers,
      pendingOrders,
      kitchen1Active,
      kitchen2Active,
      kitchen1CompletedToday: kitchen1Done,
      kitchen2CompletedToday: kitchen2Done,
      readyOrders,
      unpaidOrders,
      tablesAvailable: tableCount('AVAILABLE'),
      tablesOccupied: tableCount('OCCUPIED'),
      tablesReserved: tableCount('RESERVED'),
    };
  }

  async getDailySales(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { notIn: ['CANCELLED'] },
      },
      include: {
        payment: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const byDate = new Map<string, {
      date: string;
      totalOrders: number;
      totalRevenue: number;
      cashSales: number;
      onlineSales: number;
      creditSales: number;
      dineInOrders: number;
      deliveryOrders: number;
    }>();

    for (const order of orders) {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, {
          date: dateKey,
          totalOrders: 0,
          totalRevenue: 0,
          cashSales: 0,
          onlineSales: 0,
          creditSales: 0,
          dineInOrders: 0,
          deliveryOrders: 0,
        });
      }
      const entry = byDate.get(dateKey)!;
      entry.totalOrders++;
      if (order.type === 'DINE_IN') entry.dineInOrders++;
      else entry.deliveryOrders++;
      if (order.payment) {
        const amount = Number(order.payment.amount);
        entry.totalRevenue += amount;
        if (order.payment.method === 'CASH') entry.cashSales += amount;
        else if (order.payment.method === 'ONLINE') entry.onlineSales += amount;
        else if (order.payment.method === 'CREDIT') entry.creditSales += amount;
      }
    }

    return Array.from(byDate.values());
  }

  async getSalesAnalytics(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const [payments, orderItems, orderTypes, paymentMethods, kitchenItems] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          createdAt: { gte: start, lte: end },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.orderItem.groupBy({
        by: ['menuItemId'],
        where: {
          order: {
            createdAt: { gte: start, lte: end },
            status: { notIn: ['CANCELLED'] },
          },
        },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: 'desc' } },
      }),
      this.prisma.order.groupBy({
        by: ['type'],
        where: {
          createdAt: { gte: start, lte: end },
          status: { notIn: ['CANCELLED'] },
        },
        _count: { id: true },
      }),
      this.prisma.payment.groupBy({
        by: ['method'],
        where: {
          createdAt: { gte: start, lte: end },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      this.prisma.orderItem.groupBy({
        by: ['kitchen'],
        where: {
          order: {
            createdAt: { gte: start, lte: end },
            status: { notIn: ['CANCELLED'] },
          },
        },
        _sum: { quantity: true },
      }),
    ]);

    // Get menu item names for top sellers
    const topItemIds = orderItems.slice(0, 10).map((i) => i.menuItemId);
    const bottomItemIds = orderItems
      .slice(-5)
      .map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: [...topItemIds, ...bottomItemIds] } },
      select: { id: true, name: true },
    });
    const menuItemMap = new Map(menuItems.map((m) => [m.id, m.name]));

    const totalSales = Number(payments._sum.amount) || 0;
    const totalOrders = payments._count.id || 0;

    return {
      totalSales,
      totalOrders,
      avgOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
      bestSellers: orderItems.slice(0, 5).map((i) => ({
        name: menuItemMap.get(i.menuItemId) || 'Unknown',
        quantity: i._sum.quantity || 0,
        revenue: Number(i._sum.totalPrice) || 0,
      })),
      leastSellers: orderItems.slice(-5).reverse().map((i) => ({
        name: menuItemMap.get(i.menuItemId) || 'Unknown',
        quantity: i._sum.quantity || 0,
        revenue: Number(i._sum.totalPrice) || 0,
      })),
      dineInVsDelivery: {
        dineIn: orderTypes.find((t) => t.type === 'DINE_IN')?._count.id || 0,
        delivery: orderTypes.find((t) => t.type === 'DELIVERY')?._count.id || 0,
      },
      paymentBreakdown: {
        cash: Number(paymentMethods.find((p) => p.method === 'CASH')?._sum.amount) || 0,
        online: Number(paymentMethods.find((p) => p.method === 'ONLINE')?._sum.amount) || 0,
        credit: Number(paymentMethods.find((p) => p.method === 'CREDIT')?._sum.amount) || 0,
      },
      kitchenVolume: {
        kitchen1: kitchenItems.find((k) => k.kitchen === 'KITCHEN_1')?._sum.quantity || 0,
        kitchen2: kitchenItems.find((k) => k.kitchen === 'KITCHEN_2')?._sum.quantity || 0,
      },
    };
  }

  async getExpenseReport(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const [expenses, byCategory] = await Promise.all([
      this.prisma.expense.aggregate({
        where: { date: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.expense.groupBy({
        by: ['categoryId'],
        where: { date: { gte: start, lte: end } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ]);

    const categories = await this.prisma.expenseCategory.findMany();
    const catMap = new Map(categories.map((c) => [c.id, c.name]));

    return {
      totalExpenses: Number(expenses._sum.amount) || 0,
      expenseCount: expenses._count.id,
      byCategory: byCategory.map((e) => ({
        categoryId: e.categoryId,
        categoryName: catMap.get(e.categoryId) || 'Unknown',
        total: Number(e._sum.amount) || 0,
      })),
    };
  }
}
