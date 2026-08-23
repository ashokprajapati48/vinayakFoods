import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto.js';
import { EventsGateway } from '../gateway/events.gateway.js';

const VALID_ORDER_STATUSES = [
  'NEW',
  'PREPARING',
  'READY',
  'COLLECTED',
  'DELIVERED',
  'CANCELLED',
];

const VALID_KITCHENS = ['KITCHEN_1', 'KITCHEN_2'];
const VALID_KITCHEN_STATUSES = ['NEW', 'PREPARING', 'READY'];

/** Local-time day window for a `YYYY-MM-DD` string. */
function dayRange(date: string) {
  const start = new Date(`${date}T00:00:00`);
  if (Number.isNaN(start.getTime())) {
    throw new BadRequestException('date must be a valid YYYY-MM-DD value');
  }
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { gte: start, lt: end };
}

/** Everything the clients need to render an order card without a second request. */
const ORDER_INCLUDE = {
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
} as const;

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async findAll(filters?: { status?: string; date?: string; type?: string }) {
    const where: Record<string, unknown> = {};

    // Accepts a single status or a comma-separated list ("NEW,PREPARING,READY").
    if (filters?.status) {
      const statuses = filters.status
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter((s) => VALID_ORDER_STATUSES.includes(s));

      if (statuses.length === 0) {
        throw new BadRequestException(
          `status must be one of: ${VALID_ORDER_STATUSES.join(', ')}`,
        );
      }
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    if (filters?.type) {
      const type = filters.type.trim().toUpperCase();
      if (!['DINE_IN', 'DELIVERY'].includes(type)) {
        throw new BadRequestException('type must be DINE_IN or DELIVERY');
      }
      where.type = type;
    }

    if (filters?.date) {
      where.createdAt = dayRange(filters.date);
    }

    return this.prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(dto: CreateOrderDto, userId: string) {
    if (!dto.items?.length) {
      throw new BadRequestException('An order needs at least one item');
    }
    if (dto.type === 'DINE_IN' && !dto.tableId) {
      throw new BadRequestException('Dine-in orders require a table');
    }

    // Validate menu items and compute prices
    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: [...new Set(menuItemIds)] }, isAvailable: true },
    });

    const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));
    const missing = [...new Set(menuItemIds)].filter(
      (id) => !menuItemMap.has(id),
    );
    if (missing.length > 0) {
      throw new BadRequestException(
        `${missing.length} item(s) are unavailable or no longer on the menu`,
      );
    }

    if (dto.tableId) {
      const table = await this.prisma.table.findUnique({
        where: { id: dto.tableId },
      });
      if (!table) throw new NotFoundException('Table not found');
    }

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
        include: ORDER_INCLUDE,
      });

      // Mark table as occupied for dine-in
      if (dto.type === 'DINE_IN' && dto.tableId) {
        await tx.table.update({
          where: { id: dto.tableId },
          data: { status: 'OCCUPIED' },
        });
      }

      // Create delivery info if delivery order
      if (dto.type === 'DELIVERY' && dto.deliveryAddress) {
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
    if (order.table) {
      this.eventsGateway.emitTableUpdate({ ...order.table, status: 'OCCUPIED' });
    }

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);

    if (order.status === 'CANCELLED' && dto.status !== 'CANCELLED') {
      throw new BadRequestException('A cancelled order cannot be reopened');
    }

    // Serving a dine-in order that is already paid closes it out.
    const closesOut =
      dto.status === 'COLLECTED' &&
      order.type === 'DINE_IN' &&
      Boolean(order.payment);
    const status = closesOut ? 'DELIVERED' : dto.status;

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: ORDER_INCLUDE,
    });

    // Free the table once the order is closed out or cancelled.
    const freesTable =
      status === 'DELIVERED' || status === 'CANCELLED';
    if (freesTable && order.tableId) {
      const table = await this.prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' },
      });
      this.eventsGateway.emitTableUpdate(table);
    }

    this.eventsGateway.emitOrderStatusUpdate(updatedOrder);
    return updatedOrder;
  }

  /**
   * Called after a payment lands: a dine-in order that has already been served
   * is finished business, so close it and release the table.
   */
  async settleAfterPayment(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });
    if (!order) return null;

    const shouldClose =
      order.type === 'DINE_IN' &&
      Boolean(order.payment) &&
      order.status === 'COLLECTED';

    if (!shouldClose) {
      this.eventsGateway.emitOrderStatusUpdate(order);
      return order;
    }

    const closed = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'DELIVERED' },
      include: ORDER_INCLUDE,
    });

    if (order.tableId) {
      const table = await this.prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' },
      });
      this.eventsGateway.emitTableUpdate(table);
    }

    this.eventsGateway.emitOrderStatusUpdate(closed);
    return closed;
  }

  async cancel(id: string) {
    return this.updateStatus(id, { status: 'CANCELLED' as any });
  }

  // ─── Kitchen-specific ─────────────────────────────────────────

  async getKitchenOrders(kitchen: string) {
    const station = this.assertKitchen(kitchen);

    return this.prisma.order.findMany({
      where: {
        status: { in: ['NEW', 'PREPARING'] },
        // Only this station's outstanding work — hide tickets it already finished.
        kitchenOrders: {
          some: {
            kitchen: station,
            status: { in: ['NEW', 'PREPARING'] },
          },
        },
      },
      include: {
        table: true,
        customer: true,
        orderItems: {
          where: { kitchen: station },
          include: { menuItem: { include: { category: true } } },
        },
        kitchenOrders: { where: { kitchen: station } },
        deliveryInfo: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private assertKitchen(kitchen: string) {
    const station = kitchen?.trim().toUpperCase();
    if (!VALID_KITCHENS.includes(station)) {
      throw new BadRequestException(
        `kitchen must be one of: ${VALID_KITCHENS.join(', ')}`,
      );
    }
    return station as 'KITCHEN_1' | 'KITCHEN_2';
  }

  async updateKitchenOrderStatus(
    orderId: string,
    kitchen: string,
    status: string,
  ) {
    const station = this.assertKitchen(kitchen);
    const nextStatus = status?.trim().toUpperCase();
    if (!VALID_KITCHEN_STATUSES.includes(nextStatus)) {
      throw new BadRequestException(
        `status must be one of: ${VALID_KITCHEN_STATUSES.join(', ')}`,
      );
    }

    const kitchenOrder = await this.prisma.kitchenOrder.findFirst({
      where: { orderId, kitchen: station },
      include: { order: { select: { status: true } } },
    });
    if (!kitchenOrder) throw new NotFoundException('Kitchen order not found');
    if (kitchenOrder.order.status === 'CANCELLED') {
      throw new BadRequestException('This order was cancelled');
    }

    await this.prisma.kitchenOrder.update({
      where: { id: kitchenOrder.id },
      data: { status: nextStatus as any },
    });

    // Also update order items for this kitchen
    await this.prisma.orderItem.updateMany({
      where: { orderId, kitchen: station },
      data: { kitchenStatus: nextStatus as any },
    });

    // All stations done → the whole order is ready for the waiter.
    const allKitchenOrders = await this.prisma.kitchenOrder.findMany({
      where: { orderId },
    });
    const allReady = allKitchenOrders.every((ko) =>
      ko.id === kitchenOrder.id ? nextStatus === 'READY' : ko.status === 'READY',
    );

    // Only advance the order; never drag a served order back to PREPARING.
    const currentStatus = kitchenOrder.order.status;
    let orderStatus: string | null = null;
    if (allReady && nextStatus === 'READY') {
      if (['NEW', 'PREPARING'].includes(currentStatus)) orderStatus = 'READY';
    } else if (nextStatus === 'PREPARING' && currentStatus === 'NEW') {
      orderStatus = 'PREPARING';
    }

    const updatedOrder = orderStatus
      ? await this.prisma.order.update({
          where: { id: orderId },
          data: { status: orderStatus as any },
          include: ORDER_INCLUDE,
        })
      : await this.prisma.order.findUnique({
          where: { id: orderId },
          include: ORDER_INCLUDE,
        });

    this.eventsGateway.emitOrderStatusUpdate(updatedOrder);
    return updatedOrder;
  }

  // ─── Waiter-specific ─────────────────────────────────────────

  async getReadyOrders() {
    return this.prisma.order.findMany({
      where: { status: 'READY' },
      include: ORDER_INCLUDE,
      orderBy: { updatedAt: 'asc' },
    });
  }
}
