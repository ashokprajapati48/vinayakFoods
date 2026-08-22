import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTableDto, UpdateTableStatusDto } from './dto/table.dto.js';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.table.findMany({
      include: {
        orders: {
          where: { status: { in: ['NEW', 'PREPARING', 'READY', 'COLLECTED'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { number: 'asc' },
    });
  }

  async create(dto: CreateTableDto) {
    const existing = await this.prisma.table.findUnique({
      where: { number: dto.number },
    });
    if (existing) throw new ConflictException(`Table ${dto.number} already exists`);

    return this.prisma.table.create({
      data: { number: dto.number, capacity: dto.capacity ?? 4 },
    });
  }

  async updateStatus(id: string, dto: UpdateTableStatusDto) {
    const table = await this.prisma.table.findUnique({ where: { id } });
    if (!table) throw new NotFoundException('Table not found');
    return this.prisma.table.update({ where: { id }, data: { status: dto.status } });
  }

  async delete(id: string) {
    const table = await this.prisma.table.findUnique({ where: { id } });
    if (!table) throw new NotFoundException('Table not found');
    return this.prisma.table.delete({ where: { id } });
  }
}
