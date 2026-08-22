import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
} from './dto/menu.dto.js';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  // ─── Categories ─────────────────────────────────────────────

  async getCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        menuItems: {
          where: { isAvailable: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getAllCategories() {
    return this.prisma.category.findMany({
      include: { _count: { select: { menuItems: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException('Category name already exists');

    return this.prisma.category.create({
      data: { name: dto.name, sortOrder: dto.sortOrder ?? 0 },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    await this.findCategory(id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: string) {
    await this.findCategory(id);
    return this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async findCategory(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  // ─── Menu Items ──────────────────────────────────────────────

  async getMenuItems() {
    return this.prisma.menuItem.findMany({
      where: { isAvailable: true },
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });
  }

  async getAllMenuItems() {
    return this.prisma.menuItem.findMany({
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });
  }

  async createMenuItem(dto: CreateMenuItemDto) {
    await this.findCategory(dto.categoryId);
    return this.prisma.menuItem.create({
      data: {
        name: dto.name,
        price: dto.price,
        description: dto.description,
        kitchen: dto.kitchen,
        categoryId: dto.categoryId,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: { category: true },
    });
  }

  async updateMenuItem(id: string, dto: UpdateMenuItemDto) {
    await this.findMenuItem(id);
    if (dto.categoryId) await this.findCategory(dto.categoryId);
    return this.prisma.menuItem.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async deleteMenuItem(id: string) {
    await this.findMenuItem(id);
    return this.prisma.menuItem.update({
      where: { id },
      data: { isAvailable: false },
    });
  }

  private async findMenuItem(id: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }
}
