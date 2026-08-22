import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateStaffDto, UpdateStaffDto, RecordSalaryDto } from './dto/staff.dto.js';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.staff.findMany({
      include: {
        salaryPayments: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        salaryPayments: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
        },
      },
    });
    if (!staff) throw new NotFoundException('Staff member not found');
    return staff;
  }

  async create(dto: CreateStaffDto) {
    return this.prisma.staff.create({
      data: {
        name: dto.name,
        role: dto.role,
        contact: dto.contact,
        salary: dto.salary,
        joiningDate: new Date(dto.joiningDate),
      },
    });
  }

  async update(id: string, dto: UpdateStaffDto) {
    await this.findOne(id);
    return this.prisma.staff.update({
      where: { id },
      data: dto,
    });
  }

  async recordSalary(staffId: string, dto: RecordSalaryDto) {
    await this.findOne(staffId);

    const existing = await this.prisma.salaryPayment.findUnique({
      where: { staffId_month_year: { staffId, month: dto.month, year: dto.year } },
    });
    if (existing) {
      throw new ConflictException(
        `Salary already recorded for month ${dto.month}/${dto.year}`,
      );
    }

    return this.prisma.salaryPayment.create({
      data: {
        staffId,
        amount: dto.amount,
        month: dto.month,
        year: dto.year,
        paymentDate: new Date(dto.paymentDate),
        paymentMethod: dto.paymentMethod,
        notes: dto.notes,
      },
      include: { staff: true },
    });
  }

  async getSalaryHistory(staffId?: string, month?: number, year?: number) {
    const where: Record<string, unknown> = {};
    if (staffId) where.staffId = staffId;
    if (month) where.month = month;
    if (year) where.year = year;

    return this.prisma.salaryPayment.findMany({
      where,
      include: { staff: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }
}
