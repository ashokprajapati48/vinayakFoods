import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.reportsService.getDashboardStats();
  }

  @Get('sales/daily')
  getDailySales(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getDailySales(startDate, endDate);
  }

  @Get('sales/analytics')
  getAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getSalesAnalytics(startDate, endDate);
  }

  @Get('expenses')
  getExpenseReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getExpenseReport(startDate, endDate);
  }
}
