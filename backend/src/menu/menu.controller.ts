import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MenuService } from './menu.service.js';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
} from './dto/menu.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('menu')
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // ─── Categories ─────────────────────────────────────────────

  @Get('categories')
  getCategories() {
    return this.menuService.getCategories();
  }

  @Get('categories/all')
  getAllCategories() {
    return this.menuService.getAllCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.menuService.createCategory(dto);
  }

  @Put('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.menuService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.menuService.deleteCategory(id);
  }

  // ─── Menu Items ──────────────────────────────────────────────

  @Get('items')
  getMenuItems() {
    return this.menuService.getMenuItems();
  }

  @Get('items/all')
  getAllMenuItems() {
    return this.menuService.getAllMenuItems();
  }

  @Post('items')
  createMenuItem(@Body() dto: CreateMenuItemDto) {
    return this.menuService.createMenuItem(dto);
  }

  @Put('items/:id')
  updateMenuItem(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuService.updateMenuItem(id, dto);
  }

  @Delete('items/:id')
  deleteMenuItem(@Param('id') id: string) {
    return this.menuService.deleteMenuItem(id);
  }
}
