import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StaffService } from './staff.service.js';
import { CreateStaffDto, UpdateStaffDto, RecordSalaryDto } from './dto/staff.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  findAll() {
    return this.staffService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateStaffDto) {
    return this.staffService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.staffService.update(id, dto);
  }

  @Post(':id/salary')
  recordSalary(@Param('id') id: string, @Body() dto: RecordSalaryDto) {
    return this.staffService.recordSalary(id, dto);
  }

  @Get('salary/history')
  getSalaryHistory(
    @Query('staffId') staffId?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.staffService.getSalaryHistory(
      staffId,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
    );
  }
}
