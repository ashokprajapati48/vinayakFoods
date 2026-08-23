import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePaymentDto } from './dto/payment.dto.js';
import { OrdersService } from '../orders/orders.service.js';
import { EventsGateway } from '../gateway/events.gateway.js';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
    private eventsGateway: EventsGateway,
  ) {}

  async findAll(filters?: { date?: string; method?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.method) where.method = filters.method;
    if (filters?.date) {
      const day = new Date(filters.date);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      where.createdAt = { gte: day, lt: nextDay };
    }
    return this.prisma.payment.findMany({
      where,
      include: {
        order: {
          include: { table: true, customer: true },
        },
        recordedByUser: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByOrder(orderId: string) {
    return this.prisma.payment.findUnique({
      where: { orderId },
      include: { recordedByUser: { select: { id: true, displayName: true } } },
    });
  }

  async create(dto: CreatePaymentDto, userId: string) {
    // Validate order exists
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { payment: true, customer: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.payment) throw new BadRequestException('Order already has a payment');
    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Cannot take payment for a cancelled order');
    }
    if (dto.method === 'CREDIT' && !order.customerId) {
      throw new BadRequestException(
        'Credit payments need a customer on the order',
      );
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          orderId: dto.orderId,
          amount: dto.amount,
          method: dto.method,
          status: 'COMPLETED',
          transactionId: dto.transactionId,
          recordedBy: userId,
        },
        include: {
          order: { include: { table: true, customer: true } },
          recordedByUser: { select: { id: true, displayName: true } },
        },
      });

      // Handle credit payment: add to customer credit ledger
      if (dto.method === 'CREDIT' && order.customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: order.customerId },
        });
        if (!customer) throw new NotFoundException('Customer not found');

        const newBalance = Number(customer.creditBalance) + dto.amount;
        await tx.customer.update({
          where: { id: order.customerId },
          data: { creditBalance: newBalance },
        });

        await tx.creditLedger.create({
          data: {
            customerId: order.customerId,
            orderId: dto.orderId,
            type: 'DEBIT',
            amount: dto.amount,
            balanceAfter: newBalance,
            description: `Order #${order.orderNumber} credit`,
          },
        });
      }

      return newPayment;
    });

    this.eventsGateway.emitPaymentRecorded(payment);

    // A served dine-in order is finished once it is paid: close it and free the table.
    await this.ordersService.settleAfterPayment(dto.orderId);

    return payment;
  }

  async getTodaySummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const payments = await this.prisma.payment.groupBy({
      by: ['method'],
      where: {
        createdAt: { gte: today, lt: tomorrow },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    return payments;
  }
}
