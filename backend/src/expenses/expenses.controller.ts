import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service.js';
import {
  CreateExpenseCategoryDto,
  CreateExpenseDto,
  UpdateExpenseDto,
} from './dto/expense.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get('categories')
  getCategories() {
    return this.expensesService.getCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateExpenseCategoryDto) {
    return this.expensesService.createCategory(dto);
  }

  @Get('summary')
  getSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.expensesService.getSummary(startDate, endDate);
  }

  @Get()
  findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.expensesService.findAll({ startDate, endDate, categoryId });
  }

  @Post()
  create(
    @Body() dto: CreateExpenseDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.expensesService.create(dto, req.user.id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.expensesService.delete(id);
  }
}
