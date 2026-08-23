import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateTableDto,
  UpdateTableDto,
  UpdateTableStatusDto,
} from './dto/table.dto.js';
import { EventsGateway } from '../gateway/events.gateway.js';

@Injectable()
export class TablesService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

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

    const table = await this.prisma.table.create({
      data: { number: dto.number, capacity: dto.capacity ?? 4 },
    });
    this.eventsGateway.emitTableUpdate(table);
    return table;
  }

  /** Rename/resize a table. The UI's edit dialog posts here. */
  async update(id: string, dto: UpdateTableDto) {
    await this.findOne(id);

    if (dto.number !== undefined) {
      const clash = await this.prisma.table.findUnique({
        where: { number: dto.number },
      });
      if (clash && clash.id !== id) {
        throw new ConflictException(`Table ${dto.number} already exists`);
      }
    }

    const table = await this.prisma.table.update({
      where: { id },
      data: {
        number: dto.number,
        capacity: dto.capacity,
        status: dto.status,
      },
    });
    this.eventsGateway.emitTableUpdate(table);
    return table;
  }

  async updateStatus(id: string, dto: UpdateTableStatusDto) {
    await this.findOne(id);
    const table = await this.prisma.table.update({
      where: { id },
      data: { status: dto.status },
    });
    this.eventsGateway.emitTableUpdate(table);
    return table;
  }

  async delete(id: string) {
    await this.findOne(id);

    const orderCount = await this.prisma.order.count({ where: { tableId: id } });
    if (orderCount > 0) {
      throw new BadRequestException(
        `This table has ${orderCount} order(s) in its history and cannot be deleted. Mark it RESERVED instead.`,
      );
    }

    const table = await this.prisma.table.delete({ where: { id } });
    this.eventsGateway.emitTableUpdate({ ...table, deleted: true });
    return table;
  }

  private async findOne(id: string) {
    const table = await this.prisma.table.findUnique({ where: { id } });
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }
}
