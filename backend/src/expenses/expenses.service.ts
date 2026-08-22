import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateExpenseCategoryDto,
  CreateExpenseDto,
  UpdateExpenseDto,
} from './dto/expense.dto.js';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  // ─── Categories ─────────────────────────────────────────────

  async getCategories() {
    return this.prisma.expenseCategory.findMany({
      include: { _count: { select: { expenses: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(dto: CreateExpenseCategoryDto) {
    const existing = await this.prisma.expenseCategory.findUnique({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException('Category already exists');
    return this.prisma.expenseCategory.create({ data: { name: dto.name } });
  }

  // ─── Expenses ────────────────────────────────────────────────

  async findAll(filters?: { startDate?: string; endDate?: string; categoryId?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.startDate || filters?.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (filters.startDate) dateFilter.gte = new Date(filters.startDate);
      if (filters.endDate) dateFilter.lte = new Date(filters.endDate);
      where.date = dateFilter;
    }

    return this.prisma.expense.findMany({
      where,
      include: {
        category: true,
        createdByUser: { select: { id: true, displayName: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async create(dto: CreateExpenseDto, userId: string) {
    const category = await this.prisma.expenseCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');

    return this.prisma.expense.create({
      data: {
        categoryId: dto.categoryId,
        description: dto.description,
        amount: dto.amount,
        date: new Date(dto.date),
        paymentMethod: dto.paymentMethod,
        createdBy: userId,
      },
      include: {
        category: true,
        createdByUser: { select: { id: true, displayName: true } },
      },
    });
  }

  async update(id: string, dto: UpdateExpenseDto) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');

    const updateData: Record<string, unknown> = { ...dto };
    if (dto.date) updateData.date = new Date(dto.date);

    return this.prisma.expense.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });
  }

  async delete(id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    return this.prisma.expense.delete({ where: { id } });
  }

  async getSummary(startDate: string, endDate: string) {
    const expenses = await this.prisma.expense.groupBy({
      by: ['categoryId'],
      where: {
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const categories = await this.prisma.expenseCategory.findMany();
    const catMap = new Map(categories.map((c) => [c.id, c.name]));

    return expenses.map((e) => ({
      categoryId: e.categoryId,
      categoryName: catMap.get(e.categoryId) || 'Unknown',
      total: e._sum.amount,
      count: e._count.id,
    }));
  }
}
