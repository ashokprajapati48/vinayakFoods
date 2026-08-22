import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CreditService {
  constructor(private prisma: PrismaService) {}

  async getCustomerCredit(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        creditLedger: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async recordCreditPayment(customerId: string, amount: number, description: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const currentBalance = Number(customer.creditBalance);
    if (amount > currentBalance) {
      throw new BadRequestException(
        `Payment amount (${amount}) exceeds outstanding balance (${currentBalance})`,
      );
    }

    const newBalance = currentBalance - amount;

    return this.prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id: customerId },
        data: { creditBalance: newBalance },
      });

      return tx.creditLedger.create({
        data: {
          customerId,
          type: 'CREDIT',
          amount,
          balanceAfter: newBalance,
          description: description || 'Credit payment',
        },
      });
    });
  }

  async getAllCreditLedger(customerId?: string) {
    return this.prisma.creditLedger.findMany({
      where: customerId ? { customerId } : undefined,
      include: {
        customer: { select: { id: true, name: true, mobile: true } },
        order: { select: { id: true, orderNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOutstandingCredits() {
    return this.prisma.customer.findMany({
      where: { creditBalance: { gt: 0 }, isActive: true },
      orderBy: { creditBalance: 'desc' },
    });
  }
}
