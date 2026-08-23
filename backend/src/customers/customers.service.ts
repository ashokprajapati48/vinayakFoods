import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto.js';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, includeInactive = false) {
    const where: Record<string, unknown> = {};
    // The admin screen needs inactive records too, so it can reactivate them.
    if (!includeInactive) where.isActive = true;

    if (search?.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { mobile: { contains: search.trim() } },
      ];
    }

    return this.prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { payment: true },
        },
        creditLedger: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(dto: CreateCustomerDto) {
    await this.assertMobileFree(dto.mobile);
    return this.prisma.customer.create({ data: dto });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);
    await this.assertMobileFree(dto.mobile, id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /** Mobile numbers are unique in the schema; fail with 409 instead of a 500. */
  private async assertMobileFree(mobile?: string, exceptId?: string) {
    if (!mobile?.trim()) return;
    const existing = await this.prisma.customer.findUnique({
      where: { mobile: mobile.trim() },
    });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(
        `${existing.name} is already saved with the number ${mobile}`,
      );
    }
  }
}
