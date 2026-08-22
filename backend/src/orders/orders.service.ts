import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto.js';
import { EventsGateway } from '../gateway/events.gateway.js';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async findAll(filters?: { status?: string; date?: string }) {
    const where: Record<string, unknown> = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.date) {
      const day = new Date(filters.date);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      where.createdAt = { gte: day, lt: nextDay };
    }

    return this.prisma.order.findMany({
      where,
      include: {
        table: true,
        customer: true,
        orderItems: {
          include: { menuItem: { include: { category: true } } },
        },
        kitchenOrders: true,
        payment: true,
        deliveryInfo: true,
        createdByUser: {
          select: { id: true, displayName: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        customer: true,
        orderItems: {
          include: { menuItem: { include: { category: true } } },
        },
        kitchenOrders: true,
        payment: true,
        deliveryInfo: true,
        createdByUser: {
          select: { id: true, displayName: true, role: true },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(dto: CreateOrderDto, userId: string) {
    // Validate menu items and compute prices
    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, isAvailable: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException('One or more menu items are unavailable');
    }

    const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

    // Build order items and compute totals
    const orderItemsData = dto.items.map((item) => {
      const menuItem = menuItemMap.get(item.menuItemId)!;
      const unitPrice = Number(menuItem.price);
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
        kitchen: menuItem.kitchen,
        notes: item.notes,
      };
    });

    const subtotal = orderItemsData.reduce((sum, i) => sum + i.totalPrice, 0);

    // Determine which kitchens are needed
    const kitchensNeeded = [...new Set(orderItemsData.map((i) => i.kitchen))];

    // Create order in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          type: dto.type,
          tableId: dto.tableId,
          customerId: dto.customerId,
          subtotal,
          total: subtotal,
          notes: dto.notes,
          createdBy: userId,
          orderItems: { create: orderItemsData },
          kitchenOrders: {
            create: kitchensNeeded.map((kitchen) => ({ kitchen })),
          },
        },
        include: {
          table: true,
          customer: true,
          orderItems: { include: { menuItem: { include: { category: true } } } },
          kitchenOrders: true,
          createdByUser: { select: { id: true, displayName: true, role: true } },
        },
      });

      // Mark table as occupied for dine-in
      if (dto.type === 'DINE_IN' && dto.tableId) {
        await tx.table.update({
          where: { id: dto.tableId },
          data: { status: 'OCCUPIED' },
        });
      }

      // Create delivery info if delivery order
      if (dto.type === 'DELIVERY' && dto.deliveryAddress && dto.customerId) {
        await tx.deliveryInfo.create({
          data: {
            orderId: newOrder.id,
            customerId: dto.customerId,
            address: dto.deliveryAddress,
            phone: dto.deliveryPhone,
            notes: dto.deliveryNotes,
          },
        });
      }

      return newOrder;
    });

    // Emit to kitchens via WebSocket
    this.eventsGateway.emitNewOrder(order);

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: {
        table: true,
        customer: true,
        orderItems: { include: { menuItem: { include: { category: true } } } },
        kitchenOrders: true,
        payment: true,
        deliveryInfo: true,
        createdByUser: { select: { id: true, displayName: true, role: true } },
      },
    });

    // Free table on completed orders
    if (
      dto.status === 'DELIVERED' || dto.status === 'CANCELLED'
    ) {
      if (order.tableId) {
        await this.prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    this.eventsGateway.emitOrderStatusUpdate(updatedOrder);
    return updatedOrder;
  }

  async cancel(id: string) {
    return this.updateStatus(id, { status: 'CANCELLED' as any });
  }

  // ─── Kitchen-specific ─────────────────────────────────────────

  async getKitchenOrders(kitchen: string) {
    return this.prisma.order.findMany({
      where: {
        status: { in: ['NEW', 'PREPARING'] },
        kitchenOrders: { some: { kitchen: kitchen as any } },
      },
      include: {
        table: true,
        customer: true,
        orderItems: {
          where: { kitchen: kitchen as any },
          include: { menuItem: { include: { category: true } } },
        },
        kitchenOrders: { where: { kitchen: kitchen as any } },
        deliveryInfo: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateKitchenOrderStatus(
    orderId: string,
    kitchen: string,
    status: string,
  ) {
    const kitchenOrder = await this.prisma.kitchenOrder.findFirst({
      where: { orderId, kitchen: kitchen as any },
    });
    if (!kitchenOrder) throw new NotFoundException('Kitchen order not found');

    await this.prisma.kitchenOrder.update({
      where: { id: kitchenOrder.id },
      data: { status: status as any },
    });

    // Also update order items for this kitchen
    await this.prisma.orderItem.updateMany({
      where: { orderId, kitchen: kitchen as any },
      data: { kitchenStatus: status as any },
    });

    // Check if all kitchen orders are READY → update parent order to READY
    const allKitchenOrders = await this.prisma.kitchenOrder.findMany({
      where: { orderId },
    });
    const allReady = allKitchenOrders.every((ko) =>
      ko.id === kitchenOrder.id ? status === 'READY' : ko.status === 'READY',
    );

    let updatedOrder;
    if (allReady && status === 'READY') {
      updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'READY' },
        include: {
          table: true,
          customer: true,
          orderItems: { include: { menuItem: { include: { category: true } } } },
          kitchenOrders: true,
          deliveryInfo: true,
        },
      });
    } else if (status === 'PREPARING') {
      updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'PREPARING' },
        include: {
          table: true,
          customer: true,
          orderItems: { include: { menuItem: { include: { category: true } } } },
          kitchenOrders: true,
          deliveryInfo: true,
        },
      });
    } else {
      updatedOrder = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          table: true,
          customer: true,
          orderItems: { include: { menuItem: { include: { category: true } } } },
          kitchenOrders: true,
          deliveryInfo: true,
        },
      });
    }

    this.eventsGateway.emitOrderStatusUpdate(updatedOrder);
    return updatedOrder;
  }

  // ─── Waiter-specific ─────────────────────────────────────────

  async getReadyOrders() {
    return this.prisma.order.findMany({
      where: { status: 'READY' },
      include: {
        table: true,
        customer: true,
        orderItems: { include: { menuItem: { include: { category: true } } } },
        deliveryInfo: true,
      },
      orderBy: { updatedAt: 'asc' },
    });
  }
}
